'use strict';

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs   = require('fs');

let mainWindow = null;

function getIndexPath() {
  /* Шукаємо index.html в кількох місцях */
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
  console.error('[Electron] index.html НЕ знайдено! Шляхи:');
  candidates.forEach(function(p) { console.error('  ' + p); });
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
    /* Запасний варіант через URL */
    mainWindow.loadURL('file://' + indexPath);
  });

  mainWindow.once('ready-to-show', function() {
    mainWindow.show();
    console.log('[Electron] Window ready');
  });

  mainWindow.webContents.on('did-fail-load', function(e, code, desc, url) {
    console.error('[Electron] did-fail-load:', code, desc, url);
    mainWindow.webContents.loadURL('data:text/html,<h1 style="color:red;font-family:sans-serif">Помилка завантаження ' + code + '</h1><p>' + url + '</p>');
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

ipcMain.handle('save-file', async function(event, options) {
  var result = await dialog.showSaveDialog(mainWindow, {
    title:       options.title || 'Зберегти файл',
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