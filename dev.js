'use strict';

/* Запуск з автоперезавантаженням при зміні файлів */
const { spawn } = require('child_process');
const fs        = require('fs');
const path      = require('path');

var electronProcess = null;

function startElectron() {
  if (electronProcess) {
    electronProcess.kill();
    electronProcess = null;
  }
  console.log('[DEV] Запускаємо Electron...');
  electronProcess = spawn(
    path.join(__dirname, 'node_modules', '.bin', 'electron.cmd'),
    ['.'],
    { stdio: 'inherit' }
  );
  electronProcess.on('close', function(code) {
    if (code !== 0 && code !== null) {
      console.log('[DEV] Electron закрився з кодом: ' + code);
    }
  });
}

/* Слідкуємо за змінами файлів */
var watchFiles = [
  'main.js',
  'preload.js',
  'electron-bridge.js',
  'index.html',
];

var debounce = null;
watchFiles.forEach(function(file) {
  if (!fs.existsSync(file)) return;
  fs.watch(file, function(event) {
    clearTimeout(debounce);
    debounce = setTimeout(function() {
      console.log('[DEV] Змінено: ' + file + ' — перезапускаємо...');
      startElectron();
    }, 500);
  });
  console.log('[DEV] Слідкуємо за: ' + file);
});

startElectron();