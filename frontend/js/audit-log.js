// ============================================================
// ЖУРНАЛ ДЕЙСТВИЙ (audit-log.js)
// Пишет в public.audit_logs, кроме действий создателя БД.
// ============================================================
(function () {
    'use strict';

    // ID создателя БД (его действия НЕ логируются)
    var OWNER_ID = 'a3868127-82d0-4277-9823-0bfa1f58dec0';

    function getClient() {
        if (window.Session && typeof window.Session.supabase === 'function') {
            return window.Session.supabase();
        }
        if (window.supabaseClient) return window.supabaseClient;
        return null;
    }

    function getCurrentUser() {
        if (window.Session && typeof window.Session.getUser === 'function') {
            return window.Session.getUser();
        }
        try { return JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch (e) { return null; }
    }

    /**
     * Записать действие в журнал.
     * @param {string} action   'create' | 'update' | 'delete' | 'login' | 'logout'
     * @param {string} type     'student' | 'employee' | 'group' | 'invite' | 'report' | 'other'
     * @param {string} name     Название объекта (ФИО, название группы и т.д.)
     * @param {object} details  Доп. данные (опционально)
     */
    async function logAction(action, type, name, details) {
        try {
            var user = getCurrentUser();
            if (!user || !user.id) return;              // не авторизован — не пишем
            // if (user.id === OWNER_ID) return; // ВРЕМЕННО ОТКЛЮЧЕНО           // создатель БД — не логируем

            var sb = getClient();
            if (!sb) return;

            var payload = {
                user_id: user.id,
                user_name: user.full_name || user.fio || user.name || user.login || user.email || 'Пользователь',
                action: action,
                target_type: type,
                target_name: name || null,
                details: details || null
            };

            var res = await sb.from('audit_logs').insert([payload]);
            if (res.error) {
                console.warn('[audit-log] insert error:', res.error.message);
            }
        } catch (err) {
            console.warn('[audit-log] error:', err);
        }
    }

    window.AuditLog = {
        log: logAction,
        OWNER_ID: OWNER_ID
    };

    console.log('✅ audit-log.js загружен');
})();