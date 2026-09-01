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

  isElectron: true,
});

console.log('[preload] electronAPI ready — AI через main process');