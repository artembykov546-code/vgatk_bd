// ============================================================
// electron/preload.js — безопасный мост между main и renderer
// ============================================================
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
});
