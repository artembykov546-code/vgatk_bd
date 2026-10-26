// ============================================================
// frontend/js/notifications-bind.js
// Подписка на INSERT в public.support_notifications
// Показываем только уведомления, где user_id = текущий пользователь
// Зависит от: notifications.js (window.vgatkNotify), session.js (window.Session)
// ============================================================

(function () {
  'use strict';

  function waitForSession(timeoutMs) {
    return new Promise((resolve) => {
      const started = Date.now();
      (function check() {
        if (
          window.Session &&
          typeof window.Session.supabase === 'function' &&
          window.Session.supabase()
        ) {
          resolve(window.Session.supabase());
          return;
        }
        if (Date.now() - started > (timeoutMs || 8000)) {
          resolve(null);
          return;
        }
        setTimeout(check, 200);
      })();
    });
  }

  let sb = null;
  let myId = null;
  let channel = null;
  let started = false;

  function getMe() {
    try {
      if (window.Session && typeof window.Session.getUser === 'function') {
        return window.Session.getUser();
      }
    } catch (e) {}
    try {
      const raw = localStorage.getItem('currentUser');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  function truncate(str, n) {
    str = String(str || '').replace(/\s+/g, ' ').trim();
    return str.length > n ? str.slice(0, n - 1) + '\u2026' : str;
  }

  function navigateFor(kind) {
    // Куда вести при клике
    if (kind === 'reply' || kind === 'new_message') {
      window.location.href = '/support';
    } else {
      window.location.href = '/support';
    }
  }

  function handleNotification(row) {
    if (!row || row.user_id !== myId) return;

    const title = row.title || 'Уведомление';
    const body = truncate(row.body || '', 200);

    window.vgatkNotify.notify(title, body, {
      onClick: () => navigateFor(row.kind),
    });

    // Обновим счётчик непрочитанных, если он есть на странице
    try {
      window.dispatchEvent(
        new CustomEvent('vgatk:notification-received', { detail: row })
      );
    } catch (e) {}
  }

  function subscribe() {
    if (started || !sb) return;
    started = true;

    channel = sb
      .channel('vgatk-notify-support')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_notifications',
          filter: `user_id=eq.${myId}`, // серверная фильтрация по RLS-safe полю
        },
        (payload) => handleNotification(payload.new)
      )
      .subscribe((status) => {
        console.log('[notify-bind] channel status:', status);
      });
  }

  async function start() {
    const me = getMe();
    if (!me || !me.id) {
      console.log('[notify-bind] не авторизован — уведомления отключены');
      return;
    }
    myId = me.id;

    sb = await waitForSession(8000);
    if (!sb) {
      console.warn('[notify-bind] supabase-клиент не появился');
      return;
    }
    console.log('[notify-bind] start for', myId);
    subscribe();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(start, 300));
  } else {
    setTimeout(start, 300);
  }
})();
