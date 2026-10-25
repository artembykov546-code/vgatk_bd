// ============================================================
// sidebar.js — Загрузка и управление боковым меню
// Подключение: <script src="/js/sidebar.js"></script>
// В HTML должен быть: <aside class="sidebar" id="sidebar"></aside>
// ============================================================

(function() {
    'use strict';

    // ============================================================
    // HTML САЙДБАРА (единый для всех страниц)
    // ============================================================
    function getSidebarHTML(activePage) {
        const items = [
            { label: 'Главное', type: 'label' },
            { href: '/dashboard.html', icon: '🏠', text: 'Главная', key: 'dashboard' },
            { href: '/employees/index.html', icon: '👨‍🏫', text: 'Сотрудники', key: 'employees' },
            { href: '/students/index.html', icon: '👨‍🎓', text: 'Учащиеся', key: 'students' },
            { href: '/graduates/index.html', icon: '🎓', text: 'Выпускники', key: 'graduates' },
            { href: '/reports/index.html', icon: '📊', text: 'Отчёты', key: 'reports' },
            
            { label: 'Система', type: 'label', style: 'margin-top:12px;' },
            { href: '/invites/index.html', icon: '📨', text: 'Пригласительные<br>коды', key: 'invites' },
            { href: '/support/index.html', icon: '✉️', text: 'Обратная<br>связь', key: 'support' },
            { href: '/profile/index.html', icon: '⚙️', text: 'Профиль', key: 'profile' }
        ];

        let html = '<ul class="sidebar-nav">';
        items.forEach(item => {
            if (item.type === 'label') {
                html += `<li class="nav-label" ${item.style ? `style="${item.style}"` : ''}>${item.label}</li>`;
            } else {
                const active = item.key === activePage ? 'active' : '';
                html += `<li><a href="${item.href}" class="${active}"><span class="icon">${item.icon}</span> ${item.text}</a></li>`;
            }
        });
        html += '</ul>';
        return html;
    }

    // ============================================================
    // ОПРЕДЕЛЕНИЕ АКТИВНОЙ СТРАНИЦЫ ПО URL
    // ============================================================
    function detectActivePage() {
        const path = window.location.pathname;
        if (path.includes('/dashboard')) return 'dashboard';
        if (path.includes('/employees')) return 'employees';
        if (path.includes('/students')) return 'students';
        if (path.includes('/graduates')) return 'graduates';
        if (path.includes('/reports')) return 'reports';
        if (path.includes('/invites')) return 'invites';
        if (path.includes('/support')) return 'support'; 
        if (path.includes('/profile')) return 'profile';
        return '';
    }

    // ============================================================
    // ИНИЦИАЛИЗАЦИЯ САЙДБАРА
    // ============================================================
    function initSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) {
            console.warn('⚠️ sidebar.js: элемент #sidebar не найден на странице');
            return;
        }

        // Если в HTML уже есть захардкоженное меню (на всякий случай очищаем)
        sidebar.innerHTML = '';

        const activePage = (window.LAYOUT_ACTIVE_PAGE) || detectActivePage();
        sidebar.innerHTML = getSidebarHTML(activePage);

        // Мобильная кнопка-гамбургер (создаём, если её нет)
        let toggleButton = document.getElementById('menuToggle');
        if (!toggleButton) {
            toggleButton = document.createElement('button');
            toggleButton.id = 'menuToggle';
            toggleButton.className = 'btn btn-secondary btn-sm';
            toggleButton.style.cssText = 'margin-bottom:16px;display:none;';
            toggleButton.innerHTML = '☰ Меню';
            
            // Вставляем перед main или в начало main
            const main = document.querySelector('.main-content');
            if (main) {
                main.insertBefore(toggleButton, main.firstChild);
            } else {
                document.body.insertBefore(toggleButton, document.body.firstChild);
            }
        }

        // Показываем кнопку только на мобильных
        function handleResize() {
            if (window.innerWidth <= 768) {
                toggleButton.style.display = 'inline-block';
            } else {
                toggleButton.style.display = 'none';
                sidebar.classList.remove('open');
            }
        }

        // Убираем старый обработчик, чтобы не дублировался
        toggleButton.onclick = null; 
        toggleButton.onclick = function() {
            sidebar.classList.toggle('open');
        };

        window.removeEventListener('resize', handleResize); // очистка на всякий случай
        window.addEventListener('resize', handleResize);
        handleResize();
    }

    // ============================================================
    // ЗАПУСК
    // ============================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSidebar);
    } else {
        initSidebar();
    }

    // Экспорт
    window.Sidebar = {
        init: initSidebar,
        html: getSidebarHTML,
        detectActivePage: detectActivePage
    };

    console.log('✅ sidebar.js загружен (с поддержкой Обратной связи)');
})();