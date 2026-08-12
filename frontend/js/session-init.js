// ============================================================
// ИНИЦИАЛИЗАЦИЯ СЕССИИ ДЛЯ СТРАНИЦ
// ============================================================

(function() {
    'use strict';

    async function init() {
        try {
            const success = await window.Session.init();
            if (!success) return;
            
            const user = window.Session.getUser();
            if (!user) {
                window.location.href = '/index.html';
                return;
            }
            
            // Обновляем UI
            const nameDisplay = document.getElementById('userNameDisplay');
            const roleDisplay = document.getElementById('userRoleDisplay');
            
            if (nameDisplay) {
                nameDisplay.textContent = user.name || user.full_name || user.login;
            }
            
            if (roleDisplay) {
                const roleMap = {
                    'super_admin': 'Супер-Админ',
                    'admin': 'Администратор',
                    'teacher': 'Преподаватель',
                    'viewer': 'Наблюдатель'
                };
                roleDisplay.textContent = roleMap[user.role] || user.role;
            }
            
            console.log('✅ Пользователь загружен:', user.name || user.login);
            
        } catch (error) {
            console.error('❌ Ошибка инициализации сессии:', error);
            window.location.href = '/index.html';
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();