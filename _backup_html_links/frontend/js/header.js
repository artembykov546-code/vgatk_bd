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

        // Кнопка выхода
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                if (window.Session && typeof window.Session.logout === 'function') {
                    window.Session.logout();
                } else {
                    localStorage.removeItem('currentUser');
                    window.location.href = '/index.html';
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