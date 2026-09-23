'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: function(options) {
    return ipcRenderer.invoke('save-file', options);
  },
  openFile: function(options) {
    return ipcRenderer.invoke('open-file', options);
  },
  getVersion: function() {
    return ipcRenderer.invoke('get-version');
  },
  showInFolder: function(filePath) {
    return ipcRenderer.invoke('show-in-folder', filePath);
  },
  aiRequest: function(options) {
    return ipcRenderer.invoke('ai-request', options);
  },
  proxyStatus: function() {
    return ipcRenderer.invoke('proxy-status');
  },
  proxyRestart: function() {
    return ipcRenderer.invoke('proxy-restart');
  },  directScan: function(opts) {
    return ipcRenderer.invoke('direct-scan', opts);
  },
  onScanProgress: function(callback) {
    ipcRenderer.on('scan-progress', function(event, data) { callback(data); });
  },

  isElectron: true,

  /* ── Прямий REST до роутера (без proxy.py) ── */
  routerRest: function(opts) {
    return ipcRenderer.invoke('router-rest', opts);
  },

  /* ── Прямий SSH до роутера (без proxy.py) ── */
  routerSsh: function(opts) {
    return ipcRenderer.invoke('router-ssh', opts);
  },

  /* ── SSH keep-alive сесія ── */
  routerSshStream: function(opts, onData) {
    ipcRenderer.on('ssh-stream-data', function(e, data) { onData(data); });
    return ipcRenderer.invoke('router-ssh-stream', opts);
  },
});

console.log('[preload] electronAPI ready — direct IPC mode');