// ============================================================
// electron/preload.js — безопасный мост между main и renderer
// ============================================================
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,

  // Показывает нативное уведомление Windows (через main-процесс)
  // Возвращает Promise<boolean>
  showNotification: (title, body) => {
    return ipcRenderer.invoke('notification:show', { title, body });
  },
});
