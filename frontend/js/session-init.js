// ============================================================
// ИНИЦИАЛИЗАЦИЯ СЕССИИ ДЛЯ СТРАНИЦ С АВТОРИЗАЦИЕЙ
// Подключается после session.js
// ============================================================

(function() {
    'use strict';

    async function init() {
        try {
            const success = await window.Session.init();
            if (!success) {
                // Сессия невалидна, редирект уже выполнен
                return;
            }
            
            const user = window.Session.getUser();
            if (!user) {
                window.location.href = '/index.html';
                return;
            }
            
            // Обновляем UI с данными пользователя
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

    // Запускаем после загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();