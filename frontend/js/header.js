// ============================================================
// header.js — Загрузка и управление шапкой
// Подключение: <script src="/js/header.js"></script>
// В HTML должен быть: <header class="header"></header>
// ============================================================

(function() {
    'use strict';

    const COLLEGE_NAME = 'Учреждение образования<br><span class="sub">"Витебский государственный аграрно-технический колледж"</span>';

    // ============================================================
    // HTML ШАПКИ
    // ============================================================
    function getHeaderHTML() {
        return `
            <div class="header-logo">
                <span class="college-name">${COLLEGE_NAME}</span>
            </div>
            <div class="header-user">
                <div class="header-user-info">
                    <div class="header-user-name" id="userNameDisplay">Загрузка...</div>
                    <div class="header-user-role" id="userRoleDisplay">Загрузка...</div>
                </div>
                <button class="btn-notify" id="notifyBtn" title="Уведомления" style="position:relative;background:none;border:none;font-size:22px;cursor:pointer;padding:0 8px;color:inherit;">
    🔔<span id="notifyBadge" style="display:none;position:absolute;top:-4px;right:-2px;background:#ef4444;color:#fff;border-radius:10px;font-size:11px;line-height:1;padding:2px 5px;font-weight:600;"></span>
</button>
                <button class="btn-logout" id="logoutBtn">🚪 Выйти</button>
            </div>
        `;
    }

    // ============================================================
    // ЗАГРУЗКА ДАННЫХ ПОЛЬЗОВАТЕЛЯ В ШАПКУ
    // ============================================================
    function loadUserToHeader() {
        let user = null;

        if (window.Session && typeof window.Session.getUser === 'function') {
            user = window.Session.getUser();
        }

        if (!user) {
            try {
                const saved = localStorage.getItem('currentUser');
                if (saved) user = JSON.parse(saved);
            } catch (e) {}
        }

        const nameEl = document.getElementById('userNameDisplay');
        const roleEl = document.getElementById('userRoleDisplay');

        if (user && nameEl && roleEl) {
            nameEl.textContent = user.full_name || user.name || user.login || 'Пользователь';
            const roleMap = {
                'super_admin': 'Супер-Админ',
                'admin': 'Администратор',
                'teacher': 'Преподаватель',
                'master': 'Мастер ПО',
                'viewer': 'Наблюдатель'
            };
            roleEl.textContent = roleMap[user.role] || user.role || 'Пользователь';
        }
    }

    // ============================================================
    // УВЕДОМЛЕНИЯ (колокольчик)
    // ============================================================
    function getSupabaseClient() {
        try {
            if (window.Session && typeof window.Session.supabase === 'function') {
                return window.Session.supabase();
            }
        } catch (e) {}
        return window.supabaseClient || null;
    }

    function getCurrentUserId() {
        try {
            if (window.Session && typeof window.Session.getUser === 'function') {
                const u = window.Session.getUser();
                if (u && u.id) return u.id;
            }
        } catch (e) {}
        try {
            const raw = localStorage.getItem('currentUser');
            if (raw) {
                const u = JSON.parse(raw);
                if (u && u.id) return u.id;
            }
        } catch (e) {}
        return null;
    }

    function setBadge(count) {
        const badge = document.getElementById('notifyBadge');
        if (!badge) return;
        if (!count || count <= 0) {
            badge.style.display = 'none';
            badge.textContent = '';
        } else {
            badge.style.display = 'inline-block';
            badge.textContent = count > 99 ? '99+' : String(count);
        }
    }

    async function refreshUnreadCount() {
        const sb = getSupabaseClient();
        const uid = getCurrentUserId();
        if (!sb || !uid) { setBadge(0); return; }
        try {
            const { count, error } = await sb
                .from('support_notifications')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', uid)
                .eq('is_read', false);
            if (error) { console.warn('[header] unread count error:', error.message); return; }
            setBadge(count || 0);
        } catch (e) {
            console.warn('[header] unread count exception:', e);
        }
    }

    function bindNotifyButton() {
        const btn = document.getElementById('notifyBtn');
        if (!btn) return;
        btn.addEventListener('click', function() {
            window.location.href = '/support';
        });
        window.addEventListener('vgatk:notification-received', refreshUnreadCount);
        window.addEventListener('focus', refreshUnreadCount);
    }

    // ============================================================
    // ИНИЦИАЛИЗАЦИЯ ШАПКИ
    // ============================================================
    function initHeader() {
        const header = document.querySelector('header.header');
        if (!header) {
            console.warn('⚠️ header.js: элемент header.header не найден на странице');
            return;
        }

        header.innerHTML = getHeaderHTML();

        // Данные пользователя
        loadUserToHeader();

        // Уведомления
        bindNotifyButton();
        refreshUnreadCount();
        setInterval(refreshUnreadCount, 60000);

        // Кнопка выхода
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                if (window.Session && typeof window.Session.logout === 'function') {
                    window.Session.logout();
                } else {
                    localStorage.removeItem('currentUser');
                    window.location.href = '/';
                }
            });
        }
    }

    // ============================================================
    // ЗАПУСК
    // ============================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHeader);
    } else {
        initHeader();
    }

    // Экспорт
    window.Header = {
        init: initHeader,
        html: getHeaderHTML,
        loadUser: loadUserToHeader
    };

    console.log('✅ header.js загружен');
})();