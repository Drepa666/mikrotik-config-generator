'use strict';

const { app, BrowserWindow, ipcMain, dialog, shell, session } = require('electron');
const path   = require('path');
const fs     = require('fs');
const https  = require('https');
const http   = require('http');
const net    = require('net');
const { spawn, execSync } = require('child_process');

let mainWindow   = null;
let proxyProcess = null;

/* ══════════════════════════════════════════════════════
   Перевіряємо чи порт вільний
   ══════════════════════════════════════════════════════ */
function isPortFree(port, callback) {
  var server = net.createServer();
  server.once('error', function() { callback(false); });
  server.once('listening', function() { server.close(); callback(true); });
  server.listen(port, '127.0.0.1');
}

/* ══════════════════════════════════════════════════════
   Вбиваємо старий proxy якщо є
   ══════════════════════════════════════════════════════ */
function killExistingProxy(callback) {
  try {
    if (process.platform === 'win32') {
      execSync(
        'for /f "tokens=5" %a in (\'netstat -aon ^| findstr :8888\') do taskkill /F /PID %a',
        { shell: true, stdio: 'ignore' }
      );
      console.log('[Proxy] Старий proxy на 8888 зупинено');
    } else {
      execSync('pkill -f proxy.py', { stdio: 'ignore' });
    }
  } catch(e) {
    console.log('[Proxy] Старих процесів не знайдено');
  }
  /* Чекаємо 800ms щоб порт звільнився */
  setTimeout(callback, 800);
}

/* ══════════════════════════════════════════════════════
   Запуск proxy.py з --electron параметром
   ══════════════════════════════════════════════════════ */
function startProxy(callback) {
  var proxyPath = path.join(__dirname, 'proxy.py');

  if (!fs.existsSync(proxyPath)) {
    console.log('[Proxy] proxy.py не знайдено — пропускаємо');
    if (callback) callback();
    return;
  }

  killExistingProxy(function() {
    isPortFree(8888, function(free) {
      if (!free) {
        console.warn('[Proxy] Порт 8888 ще зайнятий — пробуємо через 1s...');
        setTimeout(function() { launchProxy(callback); }, 1000);
      } else {
        launchProxy(callback);
      }
    });
  });
}

function launchProxy(callback) {
  var proxyPath  = path.join(__dirname, 'proxy.py');
  var pythonCmd  = process.platform === 'win32' ? 'python' : 'python3';

  console.log('[Proxy] Запускаємо: ' + pythonCmd + ' ' + proxyPath + ' --electron');

  proxyProcess = spawn(pythonCmd, [proxyPath, '--electron'], {
    stdio:    ['ignore', 'pipe', 'pipe'],
    detached: false,
  });

  var callbackCalled = false;
  function done() {
    if (!callbackCalled) {
      callbackCalled = true;
      if (callback) callback();
    }
  }

  proxyProcess.stdout.on('data', function(data) {
    var msg = data.toString().trim();
    console.log('[Proxy] ' + msg);
    /* Коли proxy готовий — створюємо вікно */
    if (
      msg.indexOf('8888') !== -1 ||
      msg.indexOf('Proxy сервер') !== -1 ||
      msg.indexOf('Electron') !== -1
    ) {
      done();
    }
  });

  proxyProcess.stderr.on('data', function(data) {
    console.error('[Proxy ERR] ' + data.toString().trim());
  });

  proxyProcess.on('close', function(code) {
    console.log('[Proxy] Зупинено з кодом: ' + code);
    proxyProcess = null;
    done();
  });

  proxyProcess.on('error', function(err) {
    console.error('[Proxy] Помилка запуску:', err.message);
    proxyProcess = null;
    done();
  });

  /* Запасний таймер — 4 секунди максимум */
  setTimeout(done, 4000);

  console.log('[Proxy] PID: ' + (proxyProcess.pid || 'невідомо'));
}

/* ══════════════════════════════════════════════════════
   Зупинка proxy
   ══════════════════════════════════════════════════════ */
function stopProxy() {
  if (proxyProcess) {
    console.log('[Proxy] Зупиняємо...');
    try {
      if (process.platform === 'win32') {
        execSync('taskkill /F /T /PID ' + proxyProcess.pid, { stdio: 'ignore' });
      } else {
        proxyProcess.kill('SIGTERM');
      }
    } catch(e) {
      console.error('[Proxy] Помилка зупинки:', e.message);
    }
    proxyProcess = null;
  }
}

/* ══════════════════════════════════════════════════════
   App Ready
   ══════════════════════════════════════════════════════ */
app.whenReady().then(function() {

  /* Очищаємо Service Worker кеш */
  session.defaultSession.clearStorageData({
    storages: ['serviceworkers', 'cachestorage'],
  }).then(function() {
    console.log('[Electron] SW кеш очищено!');
  }).catch(function(err) {
    console.error('[Electron] Помилка очищення:', err);
  });

  /* Запускаємо proxy і чекаємо готовності */
  startProxy(function() {
    console.log('[Electron] Proxy готовий — створюємо вікно');
    createWindow();
  });

  app.on('activate', function() {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

/* ══════════════════════════════════════════════════════
   Створення вікна
   ══════════════════════════════════════════════════════ */
function createWindow() {
  var appDir    = __dirname;
  var indexPath = path.join(appDir, 'index.html');

  console.log('[Electron] appDir:    ' + appDir);
  console.log('[Electron] indexPath: ' + indexPath);
  console.log('[Electron] exists:    ' + fs.existsSync(indexPath));

  mainWindow = new BrowserWindow({
    width:     1280,
    height:    800,
    minWidth:  900,
    minHeight: 600,
    title:     'MikroTik Config Generator',
    icon:      path.join(appDir, 'icon-512.png'),
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      preload:          path.join(appDir, 'preload.js'),
    },
    backgroundColor: '#0d1821',
    show: false,
  });

  /* Дозволяємо PrintScreen */
  mainWindow.setContentProtection(false);

  /* Блокуємо Service Worker */
  mainWindow.webContents.session.webRequest.onBeforeRequest(
    { urls: ['*://*/sw.js', 'file://*/sw.js'] },
    function(details, callback) {
      console.log('[Electron] Блокуємо SW:', details.url);
      callback({ cancel: true });
    }
  );

  mainWindow.loadFile(indexPath).then(function() {
    console.log('[Electron] loadFile OK!');
  }).catch(function(err) {
    console.error('[Electron] loadFile error:', err);
  });

  mainWindow.once('ready-to-show', function() {
    mainWindow.show();
    console.log('[Electron] Window ready!');
  });

  mainWindow.webContents.on('did-finish-load', function() {
    console.log('[Electron] did-finish-load OK!');
    /* Знімаємо реєстрацію Service Worker */
    mainWindow.webContents.executeJavaScript(
      'if (navigator.serviceWorker) {' +
      '  navigator.serviceWorker.getRegistrations().then(function(regs) {' +
      '    regs.forEach(function(r) {' +
      '      r.unregister();' +
      '      console.log("[SW] Unregistered:", r.scope);' +
      '    });' +
      '  });' +
      '}'
    );
  });

  mainWindow.webContents.on('did-fail-load', function(e, code, desc, failedURL) {
    console.error('[Electron] did-fail-load:', code, desc, failedURL);
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

app.on('window-all-closed', function() {
  stopProxy();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', function() {
  stopProxy();
});

/* ══════════════════════════════════════════════════════
   IPC — Файлові діалоги
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

ipcMain.handle('proxy-status', function() {
  return {
    running: proxyProcess !== null,
    pid:     proxyProcess ? proxyProcess.pid : null,
  };
});

ipcMain.handle('proxy-restart', function() {
  stopProxy();
  setTimeout(function() { startProxy(null); }, 500);
  return { ok: true };
});

/* ══════════════════════════════════════════════════════
   IPC — AI запити напряму (без CORS!)
   ══════════════════════════════════════════════════════ */

ipcMain.handle('ai-request', async function(event, options) {
  var provider = options.provider || 'groq';
  var key      = options.key      || '';
  var model    = options.model    || '';
  var prompt   = options.prompt   || '';
  var maxTok   = options.maxTok   || 1024;

  var CONFIGS = {
    groq:      { url: 'https://api.groq.com/openai/v1/chat/completions',                                          model: 'openai/gpt-oss-120b'   },
    openai:    { url: 'https://api.openai.com/v1/chat/completions',                                               model: 'gpt-4o-mini'           },
    grok:      { url: 'https://api.x.ai/v1/chat/completions',                                                     model: 'grok-2-latest'         },
    deepseek:  { url: 'https://api.deepseek.com/chat/completions',                                                model: 'deepseek-chat'         },
    anthropic: { url: 'https://api.anthropic.com/v1/messages',                                                    model: 'claude-haiku-20240307' },
    gemini:    { url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', model: ''                      },
  };

  var cfg = CONFIGS[provider];
  if (!cfg) return { ok: false, error: 'Невідомий провайдер: ' + provider };

  var finalModel = model || cfg.model;

  return new Promise(function(resolve) {
    try {
      var bodyObj = {};
      var headers = { 'Content-Type': 'application/json' };
      var urlStr  = cfg.url;

      if (provider === 'anthropic') {
        headers['x-api-key']         = key;
        headers['anthropic-version'] = '2023-06-01';
        var sysP = options.systemPrompt || '';
        var msgs = [];
        if (sysP) msgs.push({ role: 'system', content: sysP });
        msgs.push({ role: 'user', content: prompt });
        bodyObj = { model: finalModel, max_tokens: maxTok, messages: msgs };
      } else if (provider === 'gemini') {
        urlStr  = cfg.url + '?key=' + key;
        bodyObj = { contents: [{ parts: [{ text: prompt }] }] };
      } else {
        headers['Authorization'] = 'Bearer ' + key;
        var sysP = options.systemPrompt || '';
        var msgs = [];
        if (sysP) msgs.push({ role: 'system', content: sysP });
        msgs.push({ role: 'user', content: prompt });
        bodyObj = { model: finalModel, max_tokens: maxTok, messages: msgs };
      }

      var bodyStr = JSON.stringify(bodyObj);
      var urlObj  = new URL(urlStr);

      var reqOptions = {
        hostname: urlObj.hostname,
        path:     urlObj.pathname + urlObj.search,
        method:   'POST',
        headers:  Object.assign({}, headers, { 'Content-Length': Buffer.byteLength(bodyStr) }),
      };

      var lib = urlObj.protocol === 'https:' ? https : http;
      var req = lib.request(reqOptions, function(res) {
        var data = '';
        res.on('data', function(chunk) { data += chunk; });
        res.on('end', function() {
          try {
            var json = JSON.parse(data);
            if (res.statusCode !== 200) {
              return resolve({ ok: false, error: (json.error && json.error.message) || 'HTTP ' + res.statusCode });
            }
            var text = '';
            if (provider === 'anthropic') {
              text = (json.content || []).map(function(b) { return b.text || ''; }).join('');
            } else if (provider === 'gemini') {
              var cand = (json.candidates || [])[0];
              text = ((cand && cand.content && cand.content.parts) || []).map(function(p) { return p.text || ''; }).join('');
            } else {
              text = ((json.choices || [])[0] || {}).message ? json.choices[0].message.content : '';
            }
            resolve({ ok: true, text: text.trim() });
          } catch(e) {
            resolve({ ok: false, error: 'JSON parse: ' + e.message });
          }
        });
      });

      req.on('error', function(e) { resolve({ ok: false, error: 'Network: ' + e.message }); });
      req.setTimeout(30000, function() { req.destroy(); resolve({ ok: false, error: 'Timeout 30s' }); });
      req.write(bodyStr);
      req.end();

    } catch(e) {
      resolve({ ok: false, error: 'Exception: ' + e.message });
    }
  });
});

/* ══════════════════════════════════════════════════════
   Direct Network Scan — ARP + Ping без роутера
   ══════════════════════════════════════════════════════ */
ipcMain.handle('direct-scan', async function(event, opts) {
  var subnet  = (opts && opts.subnet)  || '192.168.1';
  var timeout = (opts && opts.timeout) || 1500;

  return new Promise(function(resolve) {
    var devices = {};

    /* ── Крок 1: системний ARP (-a) ── */
    try {
      var arpOut = execSync('arp -a', {timeout: 5000}).toString();
      /*
        Windows: Interface: 192.168.1.100 --- 0xe
          Internet Address  Physical Address  Type
          192.168.1.1       aa-bb-cc-dd-ee-ff dynamic
        Linux/Mac: ? (192.168.1.1) at aa:bb:cc:dd:ee:ff [ether] on eth0
      */
      var lines = arpOut.split('\n');
      lines.forEach(function(line) {
        /* Windows формат */
        var winMatch = line.match(
          /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\s+([0-9a-fA-F]{2}[-:][0-9a-fA-F]{2}[-:][0-9a-fA-F]{2}[-:][0-9a-fA-F]{2}[-:][0-9a-fA-F]{2}[-:][0-9a-fA-F]{2})\s+(\w+)/
        );
        if (winMatch) {
          var ip  = winMatch[1];
          var mac = winMatch[2].toUpperCase().replace(/-/g, ':');
          var typ = winMatch[3]; /* dynamic / static */
          if (ip && mac && mac !== 'FF:FF:FF:FF:FF:FF' && !ip.endsWith('.255')) {
            devices[ip] = {
              ip:      ip,
              mac:     mac,
              online:  true,
              source:  'ARP',
              dynamic: typ === 'dynamic',
            };
          }
        }
        /* Linux/Mac формат */
        var linMatch = line.match(
          /\((\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\)\s+at\s+([0-9a-fA-F:]+)/
        );
        if (linMatch) {
          var ip2  = linMatch[1];
          var mac2 = linMatch[2].toUpperCase();
          if (ip2 && mac2 && !ip2.endsWith('.255')) {
            devices[ip2] = { ip: ip2, mac: mac2, online: true, source: 'ARP', dynamic: true };
          }
        }
      });
      console.log('[DirectScan] ARP знайдено:', Object.keys(devices).length);
    } catch(e) {
      console.error('[DirectScan] ARP помилка:', e.message);
    }

    /* ── Крок 2: Ping sweep — перевіряємо весь /24 ── */
    var parts  = subnet.split('.');
    if (parts.length >= 3) {
      var base   = parts.slice(0, 3).join('.');
      var total  = 0;
      var done   = 0;
      var TARGET = 254; /* .1 — .254 */

      for (var i = 1; i <= TARGET; i++) {
        (function(host) {
          total++;
          var ip = base + '.' + host;
          var sock = new net.Socket();
          var responded = false;

          sock.setTimeout(timeout);
          sock.on('connect', function() {
            responded = true;
            if (!devices[ip]) {
              devices[ip] = { ip: ip, mac: '', online: true, source: 'Ping' };
            } else {
              devices[ip].online = true;
            }
            sock.destroy();
          });
          sock.on('error', function() {
            /* Порт закритий але хост може існувати */
            sock.destroy();
          });
          sock.on('timeout', function() { sock.destroy(); });
          sock.on('close', function() {
            done++;
            if (done >= total) finalize();
          });
          /* Перевіряємо порт 80 */
          sock.connect(80, ip);
        })(i);
      }

      /* Якщо ping sweep завис — фіналізуємо через timeout+2s */
      setTimeout(function() {
        if (done < total) {
          console.log('[DirectScan] Timeout, done:', done, '/', total);
          finalize();
        }
      }, timeout + 2000);

    } else {
      finalize();
    }

    function finalize() {
      var result = Object.values(devices).filter(function(d) {
        return d.ip && !d.ip.endsWith('.0') && !d.ip.endsWith('.255');
      });
      /* Сортуємо по IP */
      result.sort(function(a, b) {
        var ao = a.ip.split('.').map(Number);
        var bo = b.ip.split('.').map(Number);
        for (var i = 0; i < 4; i++) if (ao[i] !== bo[i]) return ao[i] - bo[i];
        return 0;
      });
      console.log('[DirectScan] Фінал:', result.length, 'пристроїв');
      resolve({ ok: true, devices: result });
    }
  });
});

/* ── Direct Topology — будуємо топологію зі scan результатів ── */
ipcMain.handle('direct-topology', async function(event, opts) {
  /* Просто проксі до direct-scan + topology build на frontend */
  return ipcMain.listeners && ipcMain._events['direct-scan']
    ? await ipcMain.emit('direct-scan', null, opts)
    : { ok: false, error: 'direct-scan not ready' };
});
