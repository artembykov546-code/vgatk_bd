// ============================================================
// components-loader.js — Загрузка общих компонентов
// ============================================================

(function() {
    'use strict';

    // Функция загрузки HTML-компонента
    function loadComponent(elementId, filePath, callback) {
        const container = document.getElementById(elementId);
        if (!container) return;

        fetch(filePath)
            .then(response => {
                if (!response.ok) throw new Error(`Ошибка загрузки ${filePath}: ${response.status}`);
                return response.text();
            })
            .then(html => {
                container.innerHTML = html;
                if (callback) callback();
            })
            .catch(error => {
                console.error('❌ Ошибка загрузки компонента:', error);
                container.innerHTML = `<div style="color:red;padding:20px;">⚠️ Ошибка загрузки компонента</div>`;
            });
    }

    // Загружаем header
    loadComponent('header-container', '/shared/components/header.html', function() {
        console.log('✅ Header загружен');
        // Инициализируем пользователя после загрузки header
        if (window.initUser) window.initUser();
    });

    // Загружаем sidebar
    loadComponent('sidebar-container', '/shared/components/sidebar.html', function() {
        console.log('✅ Sidebar загружен');
        // Подсвечиваем активный пункт меню
        if (window.highlightNav) window.highlightNav();
    });

    // Функция для подсветки активного пункта меню
    window.highlightNav = function() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.sidebar-nav a');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && currentPath.includes(href.replace('/', ''))) {
                link.classList.add('active');
            }
        });
    };

    // Функция инициализации пользователя
    window.initUser = function() {
        const savedUser = localStorage.getItem('currentUser');
        if (!savedUser) {
            window.location.href = '/index.html';
            return;
        }

        try {
            const user = JSON.parse(savedUser);
            const nameEl = document.getElementById('userNameDisplay');
            const roleEl = document.getElementById('userRoleDisplay');
            
            if (nameEl) nameEl.textContent = user.name || user.login;
            if (roleEl) {
                const roleMap = {
                    'super_admin': '⭐ Супер-Админ',
                    'admin': '🛡️ Администратор',
                    'teacher': '👨‍🏫 Преподаватель',
                    'viewer': '👀 Наблюдатель'
                };
                roleEl.textContent = roleMap[user.role] || user.role;
            }
        } catch (e) {
            localStorage.removeItem('currentUser');
            window.location.href = '/index.html';
        }
    };

    // Обработчик выхода
    document.addEventListener('click', function(e) {
        if (e.target.id === 'logoutBtn') {
            localStorage.removeItem('currentUser');
            window.location.href = '/index.html';
        }
    });

    // Мобильное меню
    document.addEventListener('click', function(e) {
        if (e.target.id === 'menuToggle') {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.toggle('open');
        }
    });

    console.log('✅ components-loader.js загружен');
})();