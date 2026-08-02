// frontend/assets/js/auth.js

/**
 * Модуль аутентификации и прав доступа
 * Работает с глобальным window.supabaseClient и localStorage
 */

const STORAGE_KEY = 'currentUser';

// ============================================================
// ОСНОВНЫЕ ФУНКЦИИ АВТОРИЗАЦИИ
// ============================================================

export function getCurrentUser() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    try {
        return JSON.parse(saved);
    } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
    }
}

export function requireAuth() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = '/index.html';
        return null;
    }
    return user;
}

export function logout() {
    localStorage.removeItem(STORAGE_KEY);
    window.location.href = '/index.html';
}

export function hasRole(requiredRole) {
    const user = getCurrentUser();
    if (!user) return false;
    
    const roleHierarchy = {
        'viewer': 1,
        'teacher': 2,
        'admin': 3,
        'super_admin': 4
    };
    
    // Если у пользователя нет роли в иерархии, считаем его зрителем
    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    
    return userLevel >= requiredLevel;
}

export function renderUserInfo() {
    const user = getCurrentUser();
    if (!user) return;

    const nameEl = document.getElementById('userNameDisplay');
    const roleEl = document.getElementById('userRoleDisplay');
    const logoutBtn = document.getElementById('logoutBtn');

    if (nameEl) nameEl.textContent = user.full_name || user.login;
    
    if (roleEl) {
        const roleMap = {
            'super_admin': 'Супер-Админ',
            'admin': 'Администратор',
            'teacher': 'Преподаватель',
            'viewer': 'Наблюдатель'
        };
        roleEl.textContent = roleMap[user.role] || user.role;
    }

    if (logoutBtn) {
        logoutBtn.onclick = () => logout();
    }
}

// ============================================================
// ПРОВЕРКА ПРАВ ДОСТУПА (PERMISSIONS)
// ============================================================

export function getUserPermissions() {
    const user = getCurrentUser();
    const role = user?.role;

    return {
        isSuperAdmin: role === 'super_admin',
        isAdmin: role === 'admin',
        isTeacher: role === 'teacher',
        
        // Управление сотрудниками только у админов
        canManageEmployees: role === 'super_admin' || role === 'admin',
        
        // Просмотр кодов только у админов
        canSeeInviteCodes: role === 'super_admin' || role === 'admin',
        
        // Создание групп доступно всем авторизованным
        canCreateGroups: !!user?.id,
        
        // Проверка прав на конкретную группу (асинхронная)
        canEditGroup: async (groupId) => await checkGroupEditPermission(groupId, user),
        canAssignMasters: async (groupId) => await checkGroupEditPermission(groupId, user),
        canAddStudents: async (groupId) => await checkStudentAddPermission(groupId, user)
    };
}

// Применяет права к элементам с атрибутом data-permission
export function applyPermissions() {
    const perms = getUserPermissions();
    
    // Скрываем элементы управления сотрудниками
    if (!perms.canManageEmployees) {
        document.querySelectorAll('[data-permission="manage-employees"]').forEach(el => el.style.display = 'none');
    }
    
    // Скрываем пригласительные коды
    if (!perms.canSeeInviteCodes) {
        document.querySelectorAll('[data-permission="see-invite-codes"]').forEach(el => el.style.display = 'none');
    }
    
    // Скрываем создание групп для неавторизованных
    if (!perms.canCreateGroups) {
        document.querySelectorAll('[data-permission="create-groups"]').forEach(el => el.style.display = 'none');
    }
}

// ============================================================
// АСИНХРОННЫЕ ПРОВЕРКИ ПРАВ (ТРЕБУЮТ ЗАПРОСОВ К БД)
// ============================================================

async function checkGroupEditPermission(groupId, currentUser) {
    if (!currentUser?.id || !window.supabaseClient) return false;
    if (currentUser.role === 'super_admin' || currentUser.role === 'admin') return true;
    
    try {
        // Получаем ID сотрудника текущего пользователя
        const { data: userData } = await window.supabaseClient
            .from('users')
            .select('employee_id')
            .eq('id', currentUser.id)
            .single();
            
        if (!userData?.employee_id) return false;

        // Проверяем, является ли он куратором группы
        const { data: group } = await window.supabaseClient
            .from('groups')
            .select('curator_id')
            .eq('id', groupId)
            .single();
            
        return group?.curator_id === userData.employee_id;
    } catch (err) {
        console.error('Ошибка проверки прав на группу:', err);
        return false;
    }
}

async function checkStudentAddPermission(groupId, currentUser) {
    if (!currentUser?.id || !window.supabaseClient) return false;
    if (currentUser.role === 'super_admin' || currentUser.role === 'admin') return true;
    
    try {
        const { data: userData } = await window.supabaseClient
            .from('users')
            .select('employee_id')
            .eq('id', currentUser.id)
            .single();
            
        if (!userData?.employee_id) return false;
        const userEmpId = userData.employee_id;

        const { data: group } = await window.supabaseClient
            .from('groups')
            .select('type, curator_id')
            .eq('id', groupId)
            .single();
            
        if (!group) return false;
        
        // Куратор всегда может добавлять
        if (group.curator_id === userEmpId) return true;
        
        // Для ПТО проверяем мастеров
        if (group.type === 'pto') {
            const { data: isMaster } = await window.supabaseClient
                .from('group_masters')
                .select('id')
                .eq('group_id', groupId)
                .eq('employee_id', userEmpId)
                .maybeSingle(); // Используем maybeSingle чтобы избежать ошибки если ничего не найдено
                
            return !!isMaster;
        }
        
        return false;
    } catch (err) {
        console.error('Ошибка проверки прав на студентов:', err);
        return false;
    }
}