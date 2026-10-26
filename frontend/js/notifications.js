// ============================================================
// frontend/js/notifications.js
// Универсальные уведомления (браузер / Electron) + тосты на странице
// ============================================================

(function () {
  'use strict';

  const isElectron =
    typeof window !== 'undefined' &&
    window.electronAPI &&
    window.electronAPI.isElectron === true;

  // ------------------------------------------------------------
  // 1. Запрос разрешения на браузерные уведомления (не в Electron)
  // ------------------------------------------------------------
  function ensureBrowserPermission() {
    if (isElectron) return Promise.resolve(true);
    if (typeof Notification === 'undefined') return Promise.resolve(false);
    if (Notification.permission === 'granted') return Promise.resolve(true);
    if (Notification.permission === 'denied') return Promise.resolve(false);
    return Notification.requestPermission().then((p) => p === 'granted');
  }

  // ------------------------------------------------------------
  // 2. Тост внутри страницы (на случай запрета системных)
  // ------------------------------------------------------------
  function ensureToastContainer() {
    let el = document.getElementById('vgatk-toast-container');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'vgatk-toast-container';
    el.style.cssText = [
      'position:fixed',
      'top:20px',
      'right:20px',
      'z-index:2147483647',
      'display:flex',
      'flex-direction:column',
      'gap:10px',
      'max-width:380px',
      'pointer-events:none',
    ].join(';');
    document.body.appendChild(el);
    return el;
  }

  function showToast(title, body, onClick) {
    if (typeof document === 'undefined' || !document.body) return;
    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.style.cssText = [
      'pointer-events:auto',
      'background:#1f2937',
      'color:#f9fafb',
      'border-left:4px solid #10b981',
      'border-radius:10px',
      'padding:14px 16px',
      'box-shadow:0 10px 30px rgba(0,0,0,0.35)',
      'font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
      'font-size:14px',
      'line-height:1.4',
      'cursor:pointer',
      'opacity:0',
      'transform:translateX(20px)',
      'transition:all .25s ease',
    ].join(';');

    const t = document.createElement('div');
    t.textContent = title || 'Уведомление';
    t.style.cssText = 'font-weight:600;margin-bottom:4px;';
    toast.appendChild(t);

    if (body) {
      const b = document.createElement('div');
      b.textContent = body;
      b.style.cssText = 'opacity:.9;';
      toast.appendChild(b);
    }

    toast.addEventListener('click', () => {
      if (typeof onClick === 'function') onClick();
      toast.remove();
    });

    container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      setTimeout(() => toast.remove(), 300);
    }, 8000);
  }

  // ------------------------------------------------------------
  // 3. Главная функция notify(title, body, options)
  // ------------------------------------------------------------
  async function notify(title, body, options) {
    options = options || {};
    const showToastAlways = options.showToast !== false;

    // Всегда дублируем тостом, если вкладка не активна (или явно просили)
    const pageHidden = typeof document !== 'undefined' && document.hidden;

    if (showToastAlways || pageHidden) {
      showToast(title, body, options.onClick);
    }

    try {
      if (isElectron) {
        // Нативное уведомление Windows
        await window.electronAPI.showNotification(title, body || '');
        return true;
      }

      const granted = await ensureBrowserPermission();
      if (!granted) return false;

      const n = new Notification(title, {
        body: body || '',
        icon: '/images/favicon.png',
        silent: false,
      });
      n.onclick = () => {
        if (typeof options.onClick === 'function') options.onClick();
        window.focus();
        n.close();
      };
      return true;
    } catch (err) {
      console.warn('[notify] error:', err);
      return false;
    }
  }

  // ------------------------------------------------------------
  // 4. Экспорт
  // ------------------------------------------------------------
  window.vgatkNotify = {
    notify,
    showToast,
    requestPermission: ensureBrowserPermission,
    isElectron,
  };
})();
