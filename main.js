'use strict';

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path   = require('path');
const fs     = require('fs');
const https  = require('https');
const http   = require('http');

let mainWindow = null;

function getIndexPath() {
  var candidates = [
    path.join(__dirname, 'index.html'),
    path.join(process.resourcesPath, 'app', 'index.html'),
    path.join(process.resourcesPath, 'app.asar', 'index.html'),
    path.join(app.getAppPath(), 'index.html'),
  ];
  for (var i = 0; i < candidates.length; i++) {
    try {
      if (fs.existsSync(candidates[i])) {
        console.log('[Electron] index.html знайдено: ' + candidates[i]);
        return candidates[i];
      }
    } catch(e) {}
  }
  console.error('[Electron] index.html НЕ знайдено!');
  return candidates[0];
}

function createWindow() {
  var indexPath = getIndexPath();

  mainWindow = new BrowserWindow({
    width:     1280,
    height:    800,
    minWidth:  900,
    minHeight: 600,
    title:     'MikroTik Config Generator',
    icon:      path.join(__dirname, 'icon-512.png'),
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      preload:          path.join(__dirname, 'preload.js'),
    },
    backgroundColor: '#0d1821',
    show: false,
  });

  mainWindow.loadFile(indexPath).catch(function(err) {
    console.error('[Electron] loadFile error:', err);
    mainWindow.loadURL('file://' + indexPath);
  });

  mainWindow.once('ready-to-show', function() {
    mainWindow.show();
    console.log('[Electron] Window ready');
  });

  mainWindow.webContents.on('did-fail-load', function(e, code, desc, url) {
    console.error('[Electron] did-fail-load:', code, desc, url);
    mainWindow.webContents.loadURL(
      'data:text/html,<h1 style="color:red;font-family:sans-serif">Помилка ' + code + '</h1><p>' + url + '</p>'
    );
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(function(details) {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
}

app.whenReady().then(function() {
  createWindow();
  app.on('activate', function() {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') app.quit();
});

/* ══════════════════════════════════════════════════════
   IPC — файлові діалоги
   ══════════════════════════════════════════════════════ */

ipcMain.handle('save-file', async function(event, options) {
  var result = await dialog.showSaveDialog(mainWindow, {
    title:       options.title    || 'Зберегти файл',
    defaultPath: options.filename || 'config.rsc',
    filters: [
      { name: 'MikroTik Script', extensions: ['rsc'] },
      { name: 'Text',            extensions: ['txt'] },
      { name: 'All Files',       extensions: ['*']   },
    ],
  });
  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, options.content, 'utf8');
    return { success: true, path: result.filePath };
  }
  return { success: false };
});

ipcMain.handle('open-file', async function(event, options) {
  var result = await dialog.showOpenDialog(mainWindow, {
    title: options.title || 'Відкрити файл',
    filters: [
      { name: 'MikroTik Script', extensions: ['rsc'] },
      { name: 'Text',            extensions: ['txt'] },
      { name: 'All Files',       extensions: ['*']   },
    ],
    properties: ['openFile'],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    var content = fs.readFileSync(result.filePaths[0], 'utf8');
    return { success: true, content: content, path: result.filePaths[0] };
  }
  return { success: false };
});

ipcMain.handle('get-version', function() {
  return app.getVersion();
});

ipcMain.handle('show-in-folder', function(event, filePath) {
  shell.showItemInFolder(filePath);
});

/* ══════════════════════════════════════════════════════
   IPC — AI запити напряму з main process (без CORS!)
   ══════════════════════════════════════════════════════ */

ipcMain.handle('ai-request', async function(event, options) {

  var provider = options.provider || 'groq';
  var key      = options.key      || '';
  var model    = options.model    || '';
  var prompt   = options.prompt   || '';
  var maxTok   = options.maxTok   || 1024;

  var CONFIGS = {
    groq:      {
      url:   'https://api.groq.com/openai/v1/chat/completions',
      model: 'openai/gpt-oss-120b',
    },
    openai:    {
      url:   'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4o-mini',
    },
    grok:      {
      url:   'https://api.x.ai/v1/chat/completions',
      model: 'grok-2-latest',
    },
    deepseek:  {
      url:   'https://api.deepseek.com/chat/completions',
      model: 'deepseek-chat',
    },
    anthropic: {
      url:   'https://api.anthropic.com/v1/messages',
      model: 'claude-haiku-20240307',
    },
    gemini:    {
      url:   'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      model: '',
    },
  };

  var cfg = CONFIGS[provider];
  if (!cfg) return { ok: false, error: 'Невідомий провайдер: ' + provider };

  var finalModel = model || cfg.model;

  return new Promise(function(resolve) {
    try {
      var bodyObj  = {};
      var headers  = { 'Content-Type': 'application/json' };
      var urlStr   = cfg.url;

      if (provider === 'anthropic') {
        headers['x-api-key']         = key;
        headers['anthropic-version'] = '2023-06-01';
        bodyObj = {
          model:      finalModel,
          max_tokens: maxTok,
          messages:   [{ role: 'user', content: prompt }],
        };
      } else if (provider === 'gemini') {
        urlStr  = cfg.url + '?key=' + key;
        bodyObj = { contents: [{ parts: [{ text: prompt }] }] };
      } else {
        headers['Authorization'] = 'Bearer ' + key;
        bodyObj = {
          model:      finalModel,
          max_tokens: maxTok,
          messages:   [{ role: 'user', content: prompt }],
        };
      }

      var bodyStr = JSON.stringify(bodyObj);
      var urlObj  = new URL(urlStr);

      var reqOptions = {
        hostname: urlObj.hostname,
        path:     urlObj.pathname + urlObj.search,
        method:   'POST',
        headers:  Object.assign({}, headers, {
          'Content-Length': Buffer.byteLength(bodyStr),
        }),
      };

      var lib = urlObj.protocol === 'https:' ? https : http;

      var req = lib.request(reqOptions, function(res) {
        var data = '';
        res.on('data', function(chunk) { data += chunk; });
        res.on('end', function() {
          try {
            var json = JSON.parse(data);

            if (res.statusCode !== 200) {
              var errMsg = (json.error && json.error.message) || 'HTTP ' + res.statusCode;
              return resolve({ ok: false, error: errMsg });
            }

            var text = '';

            if (provider === 'anthropic') {
              text = (json.content || [])
                .map(function(b) { return b.text || ''; })
                .join('');
            } else if (provider === 'gemini') {
              var cand = (json.candidates || [])[0];
              text = ((cand && cand.content && cand.content.parts) || [])
                .map(function(p) { return p.text || ''; })
                .join('');
            } else {
              text = ((json.choices || [])[0] || {}).message
                ? json.choices[0].message.content
                : '';
            }

            resolve({ ok: true, text: text.trim() });

          } catch(e) {
            resolve({ ok: false, error: 'JSON parse: ' + e.message + ' | ' + data.slice(0, 200) });
          }
        });
      });

      req.on('error', function(e) {
        resolve({ ok: false, error: 'Network: ' + e.message });
      });

      req.setTimeout(30000, function() {
        req.destroy();
        resolve({ ok: false, error: 'Timeout 30s' });
      });

      req.write(bodyStr);
      req.end();

    } catch(e) {
      resolve({ ok: false, error: 'Exception: ' + e.message });
    }
  });
});