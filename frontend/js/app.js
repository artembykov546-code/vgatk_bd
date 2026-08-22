// ============================================================
// ОСНОВНАЯ ЛОГИКА ПРИЛОЖЕНИЯ
// ============================================================

/**
 * Глобальное состояние приложения
 */
const App = {
    currentUser: null,
    currentEmployee: null,
    dormRole: null,
    isDormEmployee: false,
    isEducator: false,
    isHead: false,
    isGuard: false,
    canEditDormData: false,
    canViewRestrictedData: false,
    isAdmin: false
};

// ============================================================
// СТРУКТУРА ОБЩЕЖИТИЯ
// ============================================================

const FLOOR_STRUCTURE = {
    '2': {
        label: '2-й этаж',
        blocks: [1, 2, 3, 4, 5, 6, 7, 8, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]
    },
    '3': {
        label: '3-й этаж',
        blocks: [32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 44, 45, 49]
    }
};

const ROOM_TYPES = [
    { value: 'M', label: 'Маленькая (M)' },
    { value: 'B', label: 'Большая (B)' }
];

const DEFAULT_SECTORS = [
    'Председатель',
    'Заместитель председателя',
    'Учебный сектор',
    'Сектор дисциплины и порядка',
    'Санитарно-бытовой сектор',
    'Спортивный сектор',
    'Культурно-массовый сектор',
    'Информационный сектор',
    'Секретарь',
    'Организационный сектор',
    'Редакционный сектор'
];

const FLOOR_SECTORS = [
    'Староста этажа',
    'Заместитель старосты'
];

const FLOOR_LABELS = {
    'council': '🏛️ Совет общежития',
    '2': '📌 2-й этаж',
    '3': '📌 3-й этаж'
};

// ============================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================

/**
 * Инициализация приложения
 */
export async function initApp() {
    try {
        // Получаем пользователя из сессии
        const user = window.Session?.getUser() || JSON.parse(localStorage.getItem('currentUser') || 'null');
        
        if (!user) {
            console.warn('⚠️ Пользователь не авторизован');
            return { success: false, error: 'Пользователь не авторизован' };
        }

        App.currentUser = user;
        App.isAdmin = ['super_admin', 'admin'].includes(user.role);

        // Получаем информацию о сотруднике
        const { data: employee, error } = await window.supabaseClient
            .from('employees')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) {
            console.warn('⚠️ Сотрудник не найден в таблице employees:', error.message);
            App.currentEmployee = null;
            App.dormRole = null;
            App.isDormEmployee = false;
            App.isEducator = false;
            App.isHead = false;
            App.isGuard = false;
            App.canEditDormData = App.isAdmin;
            App.canViewRestrictedData = App.isAdmin;
        } else {
            App.currentEmployee = employee;
            App.dormRole = employee.dorm_role || null;
            App.isDormEmployee = !!employee.dorm_role;
            App.isEducator = employee.dorm_role === 'educator';
            App.isHead = employee.dorm_role === 'head';
            App.isGuard = employee.dorm_role === 'guard';
            App.canEditDormData = App.isAdmin || ['educator', 'head'].includes(employee.dorm_role || '');
            App.canViewRestrictedData = App.isAdmin || employee.dorm_role === 'educator';
        }

        console.log('✅ Приложение инициализировано:', {
            user: App.currentUser?.full_name || App.currentUser?.login,
            role: App.currentUser?.role,
            dormRole: App.dormRole,
            isDormEmployee: App.isDormEmployee,
            isAdmin: App.isAdmin
        });

        return { success: true };
    } catch (error) {
        console.error('❌ Ошибка инициализации:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================================
// ПРОВЕРКИ ПРАВ ДОСТУПА
// ============================================================

/**
 * Проверить, является ли пользователь администратором
 */
export function isAdmin() {
    return App.isAdmin;
}

/**
 * Проверить, является ли пользователь работником общежития
 */
export function isDormEmployee() {
    return App.isDormEmployee;
}

/**
 * Проверить, является ли пользователь воспитателем
 */
export function isEducator() {
    return App.isEducator;
}

/**
 * Проверить, является ли пользователь заведующей
 */
export function isHead() {
    return App.isHead;
}

/**
 * Проверить, является ли пользователь вахтером
 */
export function isGuard() {
    return App.isGuard;
}

/**
 * Проверить, может ли пользователь редактировать данные общежития
 */
export function canEditDormData() {
    return App.canEditDormData;
}

/**
 * Проверить, может ли пользователь видеть скрытые данные
 */
export function canViewRestrictedData() {
    return App.canViewRestrictedData;
}

/**
 * Проверить, может ли пользователь видеть выпускников
 */
export function canViewGraduates() {
    return App.isAdmin || (!App.isHead && !App.isGuard);
}

/**
 * Проверить, может ли пользователь видеть отчёты (полные)
 */
export function canViewFullReports() {
    return App.isAdmin || (!App.isHead && !App.isGuard);
}

/**
 * Проверить, может ли пользователь редактировать совет общежития
 */
export function canEditCouncil() {
    return App.isAdmin || App.isEducator;
}

// ============================================================
// ФИЛЬТРАЦИЯ ДАННЫХ (клиентская)
// ============================================================

/**
 * Фильтровать список студентов для работников общежития
 * Показывает только проживающих
 */
export function filterStudentsForDorm(students) {
    if (!App.isDormEmployee) return students;
    return students.filter(s => s.lives_in_dorm === true);
}

/**
 * Фильтровать данные студента для заведующей и вахтера
 * Скрывает чувствительные данные
 */
export function filterStudentDataForDorm(student) {
    if (!App.isDormEmployee) return student;
    
    // Если воспитатель или админ - показывает все данные
    if (App.isEducator || App.isAdmin) return student;
    
    // Для заведующей и вахтера скрываем чувствительные данные
    const filtered = { ...student };
    
    // Скрываем учёты
    delete filtered.accounting_type;
    delete filtered.accounting_data;
    delete filtered.sop;
    delete filtered.kdn;
    delete filtered.idn;
    delete filtered.is_orphan;
    
    // Скрываем родителей
    delete filtered.parents;
    
    // Скрываем школы и оценки
    delete filtered.school;
    delete filtered.school_year;
    delete filtered.school_class;
    delete filtered.avg_grade;
    
    // Скрываем адреса (кроме общежития)
    delete filtered.address_reg;
    delete filtered.address_live;
    delete filtered.address_region;
    delete filtered.address_district;
    delete filtered.address_locality;
    delete filtered.addresses;
    
    return filtered;
}

/**
 * Проверить, может ли пользователь видеть студента
 * (для работников общежития — только проживающих)
 */
export function canViewStudent(student) {
    if (!App.isDormEmployee) return true;
    if (App.isAdmin) return true;
    return student?.lives_in_dorm === true;
}

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ОБЩЕЖИТИЯ
// ============================================================

/**
 * Получить структуру этажей и блоков
 */
export function getFloorStructure() {
    return { floors: FLOOR_STRUCTURE, roomTypes: ROOM_TYPES };
}

/**
 * Получить этаж по номеру блока
 */
export function getFloorByBlock(blockNumber) {
    for (const [floor, data] of Object.entries(FLOOR_STRUCTURE)) {
        if (data.blocks.includes(parseInt(blockNumber))) {
            return { floor: parseInt(floor), label: data.label };
        }
    }
    return null;
}

/**
 * Получить список блоков для этажа
 */
export function getBlocksByFloor(floor) {
    return FLOOR_STRUCTURE[floor]?.blocks || [];
}

/**
 * Проверить, существует ли блок
 */
export function isValidBlock(blockNumber) {
    for (const data of Object.values(FLOOR_STRUCTURE)) {
        if (data.blocks.includes(parseInt(blockNumber))) {
            return true;
        }
    }
    return false;
}

/**
 * Получить список всех доступных блоков
 */
export function getAllBlocks() {
    const allBlocks = [];
    for (const data of Object.values(FLOOR_STRUCTURE)) {
        allBlocks.push(...data.blocks);
    }
    return allBlocks.sort((a, b) => a - b);
}

/**
 * Получить название этажа по блоку
 */
export function getFloorLabel(blockNumber) {
    const result = getFloorByBlock(blockNumber);
    return result ? result.label : '—';
}

/**
 * Получить метку этажа для отображения
 */
export function getFloorDisplay(floor) {
    return FLOOR_LABELS[floor] || floor || '—';
}

// ============================================================
// СЕКТОРА ДЛЯ СОВЕТА ОБЩЕЖИТИЯ
// ============================================================

/**
 * Получить стандартные сектора
 */
export function getDefaultSectors() {
    return DEFAULT_SECTORS;
}

/**
 * Получить сектора для актива этажа
 */
export function getFloorSectors() {
    return FLOOR_SECTORS;
}

/**
 * Получить все сектора (стандартные + кастомные)
 */
export async function getAllSectors() {
    try {
        const { data, error } = await window.supabaseClient
            .from('dorm_sectors')
            .select('name')
            .order('name');
        
        if (error) throw error;
        
        const customSectors = data.map(s => s.name);
        const all = [...new Set([...DEFAULT_SECTORS, ...customSectors])];
        return all;
    } catch (error) {
        console.error('❌ Ошибка получения секторов:', error);
        return DEFAULT_SECTORS;
    }
}

// ============================================================
// ОБНОВЛЕНИЕ UI В ЗАВИСИМОСТИ ОТ РОЛИ
// ============================================================

/**
 * Скрыть/показать элементы в зависимости от роли
 * @param {string} selector - CSS селектор элементов
 * @param {string} role - роль, для которой показывать ('educator', 'head', 'guard', 'dorm', 'admin')
 */
export function toggleElementsByRole(selector, role) {
    const elements = document.querySelectorAll(selector);
    let shouldShow = false;
    
    if (role === 'admin') {
        shouldShow = App.isAdmin;
    } else if (role === 'dorm') {
        shouldShow = App.isDormEmployee;
    } else if (role === 'educator') {
        shouldShow = App.isEducator;
    } else if (role === 'head') {
        shouldShow = App.isHead;
    } else if (role === 'guard') {
        shouldShow = App.isGuard;
    } else {
        shouldShow = App.dormRole === role;
    }
    
    elements.forEach(el => {
        el.style.display = shouldShow ? '' : 'none';
    });
}

/**
 * Скрыть элементы для работников общежития
 */
export function hideForDormEmployees(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
        el.style.display = App.isDormEmployee ? 'none' : '';
    });
}

/**
 * Показать элементы только для работников общежития
 */
export function showOnlyForDormEmployees(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
        el.style.display = App.isDormEmployee ? '' : 'none';
    });
}

/**
 * Показать элементы только для воспитателя
 */
export function showOnlyForEducator(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
        el.style.display = App.isEducator ? '' : 'none';
    });
}

/**
 * Показать элементы только для заведующей
 */
export function showOnlyForHead(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
        el.style.display = App.isHead ? '' : 'none';
    });
}

/**
 * Показать элементы только для администраторов
 */
export function showOnlyForAdmin(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
        el.style.display = App.isAdmin ? '' : 'none';
    });
}

// ============================================================
// УПРАВЛЕНИЕ МЕНЮ (адаптация для общежития)
// ============================================================

/**
 * Настроить навигационное меню в зависимости от роли
 */
export function setupNavMenu() {
    const sidebar = document.querySelector('.sidebar-nav');
    if (!sidebar) return;

    // Проверяем, есть ли уже пункт "Общежитие"
    const existingDormItem = sidebar.querySelector('.nav-item-dorm');
    
    // Добавляем пункт "Общежитие" для работников общежития или админов
    if ((App.isDormEmployee || App.isAdmin) && !existingDormItem) {
        const dormItem = document.createElement('li');
        dormItem.className = 'nav-item-dorm';
        dormItem.innerHTML = `
            <a href="/dorm/index.html">
                <span class="icon">🏠</span> Общежитие
            </a>
        `;
        
        // Вставляем после "Учащиеся"
        const studentsItem = sidebar.querySelector('a[href="/students/index.html"]')?.closest('li');
        if (studentsItem && studentsItem.nextSibling) {
            sidebar.insertBefore(dormItem, studentsItem.nextSibling);
        } else {
            sidebar.appendChild(dormItem);
        }
    }

    // Скрываем выпускников для заведующей и вахтера
    if (App.isHead || App.isGuard) {
        const graduatesLink = sidebar.querySelector('a[href="/graduates/index.html"]');
        if (graduatesLink) {
            const li = graduatesLink.closest('li');
            if (li) li.style.display = 'none';
        }
    }

    // Скрываем отчёты для заведующей и вахтера (кроме отчётов общежития)
    if (App.isHead || App.isGuard) {
        const reportsLink = sidebar.querySelector('a[href="/reports/index.html"]');
        if (reportsLink) {
            const li = reportsLink.closest('li');
            if (li) li.style.display = 'none';
        }
    }
}

// ============================================================
// ЭКСПОРТ КОНСТАНТ
// ============================================================

export {
    FLOOR_STRUCTURE,
    ROOM_TYPES,
    DEFAULT_SECTORS,
    FLOOR_SECTORS,
    FLOOR_LABELS
};

// ============================================================
// ЭКСПОРТ
// ============================================================

export default {
    App,
    initApp,
    isAdmin,
    isDormEmployee,
    isEducator,
    isHead,
    isGuard,
    canEditDormData,
    canViewRestrictedData,
    canViewGraduates,
    canViewFullReports,
    canEditCouncil,
    filterStudentsForDorm,
    filterStudentDataForDorm,
    canViewStudent,
    getFloorStructure,
    getFloorByBlock,
    getBlocksByFloor,
    isValidBlock,
    getAllBlocks,
    getFloorLabel,
    getFloorDisplay,
    getDefaultSectors,
    getFloorSectors,
    getAllSectors,
    toggleElementsByRole,
    hideForDormEmployees,
    showOnlyForDormEmployees,
    showOnlyForEducator,
    showOnlyForHead,
    showOnlyForAdmin,
    setupNavMenu,
    FLOOR_STRUCTURE,
    ROOM_TYPES,
    DEFAULT_SECTORS,
    FLOOR_SECTORS,
    FLOOR_LABELS
};