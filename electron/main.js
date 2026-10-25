const { app, BrowserWindow, Menu, shell, protocol, net, dialog } = require('electron');
const { autoUpdater } = require('electron-updater'); // ✅ ДОБАВЛЕН ИМПОРТ
const path = require('path');
const { pathToFileURL } = require('url');

const isDev = !app.isPackaged;
const DEV_URL = 'http://localhost:3000';

// Регистрируем схему app:// как привилегированную (ОБЯЗАТЕЛЬНО до app.whenReady)
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
// ЛОГИКА АВТООБНОВЛЕНИЯ
// ============================================================
function setupAutoUpdater() {
  if (!app.isPackaged) {
    console.log('⚠️ Режим разработки: проверка обновлений отключена.');
    return;
  }

  // ⚠️ ОТКЛЮЧАЕМ автоматическое скачивание — сначала спрашиваем пользователя
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  // Провайдер — GitHub Releases
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'artembykov546-code',
    repo: 'vgatk_bd'
  });

  // --- СОБЫТИЯ ---
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
        // Пользователь согласился — скачиваем
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
    // Прогресс в консоль (пользователю не показываем)
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
    // Не показываем ошибку пользователю — сеть может быть временно недоступна.
    // Показываем только если это фатально при скачивании (не в начале проверки).
  });

  // --- ЗАПУСК ПРОВЕРКИ ---
  // Небольшая задержка, чтобы окно успело открыться
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('[updater] checkForUpdates error:', err);
    });
  }, 3000);
}

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

  // Открывать внешние ссылки в системном браузере
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Отладка: показываем ошибки загрузки страницы в консоль
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

app.whenReady().then(() => {
  setupAutoUpdater(); // ✅ ВЫЗЫВАЕМ ФУНКЦИЮ

  if (!isDev) {
    const distPath = path.join(__dirname, '..', 'dist');

    protocol.handle('app', (request) => {
      try {
        const url = new URL(request.url);

        // Декодируем %20 и прочее
        let filePath = decodeURIComponent(url.pathname);

        // Корень -> index.html
        if (filePath === '/' || filePath === '' || filePath === '.') {
          filePath = '/index.html';
        }

        // Убираем ведущий слэш, чтобы path.join не ломался на Windows
        const relativePath = filePath.replace(/^\/+/, '');

        // Склеиваем безопасно
        const fullPath = path.join(distPath, relativePath);

        // Превращаем C:\...\dist\index.html в file:///C:/.../dist/index.html
        const fileUrl = pathToFileURL(fullPath).toString();

        return net.fetch(fileUrl);
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