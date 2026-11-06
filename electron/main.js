const { app, BrowserWindow, Menu, shell, protocol, net, dialog, Notification, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const { pathToFileURL } = require('url');

const isDev = !app.isPackaged;
const DEV_URL = 'http://localhost:3000';

// Регистрируем схему app:// (ОБЯЗАТЕЛЬНО до app.whenReady)
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      bypassCSP: false,
    },
  },
]);

let mainWindow = null;

// ============================================================
// АВТООБНОВЛЕНИЕ
// ============================================================
function setupAutoUpdater() {
  if (!app.isPackaged) {
    console.log('⚠️ Режим разработки: проверка обновлений отключена.');
    return;
  }

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'artembykov546-code',
    repo: 'vgatk_bd'
  });

  autoUpdater.on('checking-for-update', () => {
    console.log('[updater] Проверка обновлений...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[updater] Доступно обновление:', info.version);
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Доступно обновление',
      message: `Вышла новая версия ${info.version}.`,
      detail: `У вас установлена версия ${app.getVersion()}.\n\nСкачать и установить обновление сейчас?`,
      buttons: ['Обновить', 'Позже'],
      defaultId: 0,
      cancelId: 1,
      noLink: true
    }).then((result) => {
      if (result.response === 0) {
        console.log('[updater] Пользователь согласился — начинаю скачивание...');
        autoUpdater.downloadUpdate();
      } else {
        console.log('[updater] Пользователь отложил обновление.');
      }
    });
  });

  autoUpdater.on('update-not-available', () => {
    console.log('[updater] Обновлений нет — версия актуальна.');
  });

  autoUpdater.on('download-progress', (progress) => {
    const pct = progress.percent.toFixed(1);
    console.log(`[updater] Скачано ${pct}% (${progress.transferred}/${progress.total} байт)`);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[updater] Обновление скачано:', info.version);
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Обновление готово',
      message: `Версия ${info.version} скачана.`,
      detail: 'Перезапустить приложение сейчас, чтобы применить обновление?',
      buttons: ['Перезапустить', 'Позже'],
      defaultId: 0,
      cancelId: 1,
      noLink: true
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  autoUpdater.on('error', (err) => {
    console.error('[updater] Ошибка:', err);
  });

  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('[updater] checkForUpdates error:', err);
    });
  }, 3000);
}

// ============================================================
// ОКНО
// ============================================================
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    icon: path.join(__dirname, '..', 'build', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    title: 'vgatk_bd — База данных колледжа',
    autoHideMenuBar: true,
  });

  Menu.setApplicationMenu(null);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.loadURL(DEV_URL);
  } else {
    mainWindow.loadURL('app://./index.html');
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Перехват навигации: любые внешние http(s)-ссылки открываем в системном браузере
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('[did-fail-load]', errorCode, errorDescription, validatedURL);
  });
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.log(`[renderer:${level}]`, message, `(${sourceId}:${line})`);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ============================================================
// ЗАПУСК
// ============================================================
app.whenReady().then(() => {
  // ------------------------------------------------------------
  // НАТИВНЫЕ УВЕДОМЛЕНИЯ (Windows)
  // ------------------------------------------------------------
  ipcMain.handle('notification:show', (_event, payload) => {
    try {
      const { title, body } = payload || {};
      if (!title) return false;
      if (!Notification.isSupported()) {
        console.warn('[notify] Notification API не поддерживается');
        return false;
      }
      const n = new Notification({
        title: String(title),
        body: String(body || ''),
        icon: path.join(__dirname, '..', 'build', 'icon.ico'),
        silent: false,
      });
      n.on('click', () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.focus();
        }
      });
      n.show();
      return true;
    } catch (err) {
      console.error('[notify] error:', err);
      return false;
    }
  });

  setupAutoUpdater();

  // ------------------------------------------------------------
  // Протокол app:// для продакшена
  // ------------------------------------------------------------
  if (!isDev) {
    const fs = require('fs');
    const distPath = path.join(__dirname, '..', 'dist');
    const unpackedDist = distPath.replace('app.asar', 'app.asar.unpacked');

    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf'
    };

    protocol.handle('app', async (request) => {
      try {
        const url = new URL(request.url);
        let filePath = decodeURIComponent(url.pathname);
        if (filePath === '/' || filePath === '' || filePath === '.') {
          filePath = '/index.html';
        }
        const relativePath = filePath.replace(/^\/+/, '');

        // Сначала пробуем распакованную папку, потом asar
        let fullPath = path.join(unpackedDist, relativePath);
        if (!fs.existsSync(fullPath)) {
          fullPath = path.join(distPath, relativePath);
        }
        
        // 1. Если это файл - читаем
        // 2. Если папка - ищем index.html
        // 3. Если нет - ищем с .html
        if (fs.existsSync(fullPath)) {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            const asIndex = path.join(fullPath, 'index.html');
            if (fs.existsSync(asIndex)) {
              fullPath = asIndex;
            }
          }
        } else {
          const withHtml = fullPath + '.html';
          if (fs.existsSync(withHtml)) {
            fullPath = withHtml;
          } else {
            const withIndex = path.join(fullPath, 'index.html');
            if (fs.existsSync(withIndex)) fullPath = withIndex;
          }
        }

        if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
          console.error('[app://] not found:', fullPath);
          return new Response('Not Found', { status: 404 });
        }

        const data = fs.readFileSync(fullPath);
        const ext = path.extname(fullPath).toLowerCase();
        const mime = mimeTypes[ext] || 'application/octet-stream';

        return new Response(data, {
          status: 200,
          headers: { 'Content-Type': mime }
        });
      } catch (err) {
        console.error('[app://] handle error:', err);
        return new Response('Not Found', { status: 404 });
      }
    });
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// ============================================================
// Единственный экземпляр
// ============================================================
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
