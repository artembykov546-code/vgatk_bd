// ============================================================
// components.js — Единая логика для всех страниц
// ============================================================

// ============================================================
// КОНФИГУРАЦИЯ SUPABASE (ЖЁСТКО ЗАШИТА ДЛЯ ТЕСТА)
// ============================================================

// ⚠️ ВАЖНО: Для продакшена используйте .env через Vite
// Сейчас используем жёстко зашитые ключи для теста
const SUPABASE_URL = 'https://selbolepupendprhixas.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlbGJvbGVwdXBlbmRwcmhpeGFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NjQzODgsImV4cCI6MjA5ODE0MDM4OH0.UpWEr6hEs9ytnDxnaQ7Uf3d_xDQLHO-eejkIw53o7EE';

// Создаём клиент Supabase
let supabaseClient = null;

function initSupabase() {
    if (typeof window.supabase === 'undefined') {
        console.error('❌ Ошибка: Supabase JS не загружен');
        return null;
    }

    if (!supabaseClient) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase инициализирован');
    }
    return supabaseClient;
}

// ============================================================
// ЛОГОТИП: если logo.png не загрузился, показываем эмодзи
// ============================================================

function initLogos() {
    const logos = document.querySelectorAll('.logo-img');
    logos.forEach(logo => {
        logo.onerror = function() {
            this.style.display = 'none';
            const fallback = document.createElement('span');
            fallback.textContent = '🏛️';
            fallback.style.fontSize = '28px';
            fallback.style.display = 'block';
            fallback.style.width = '40px';
            fallback.style.height = '40px';
            fallback.style.textAlign = 'center';
            fallback.style.lineHeight = '40px';
            fallback.style.borderRadius = '50%';
            fallback.style.background = 'rgba(255,255,255,0.2)';
            this.parentNode.insertBefore(fallback, this);
        };
    });
}

// ============================================================
// МОБИЛЬНОЕ МЕНЮ
// ============================================================

function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('open');
        });
    }

    if (window.innerWidth <= 768 && menuToggle) {
        menuToggle.style.display = 'inline-block';
    }

    window.addEventListener('resize', function() {
        if (window.innerWidth <= 768) {
            if (menuToggle) menuToggle.style.display = 'inline-block';
        } else {
            if (menuToggle) menuToggle.style.display = 'none';
            if (sidebar) sidebar.classList.remove('open');
        }
    });
}

// ============================================================
// ЗАГРУЗКА ПОЛЬЗОВАТЕЛЯ (для всех страниц)
// ============================================================

function loadUser() {
    const savedUser = localStorage.getItem('currentUser');
    if (!savedUser) {
        window.location.href = '/index.html';
        return null;
    }

    try {
        const user = JSON.parse(savedUser);
        const nameEl = document.getElementById('userNameDisplay');
        const roleEl = document.getElementById('userRoleDisplay');
        
        if (nameEl) nameEl.textContent = user.name || user.login;
        if (roleEl) {
            const roleMap = {
                'super_admin': 'Супер-Админ',
                'admin': 'Администратор',
                'teacher': 'Преподаватель',
                'viewer': 'Наблюдатель'
            };
            roleEl.textContent = roleMap[user.role] || user.role;
        }
        
        return user;
    } catch (e) {
        localStorage.removeItem('currentUser');
        window.location.href = '/index.html';
        return null;
    }
}

// ============================================================
// ВЫХОД
// ============================================================

function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('currentUser');
            window.location.href = '/index.html';
        });
    }
}

// ============================================================
// ФОРМАТИРОВАНИЕ ДАТ
// ============================================================

function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('ru-RU', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });
    } catch {
        return dateStr;
    }
}

function calculateAge(birthDate) {
    if (!birthDate) return '—';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
}

// ============================================================
// СТРУКТУРА ОБЩЕЖИТИЯ
// ============================================================

/**
 * Структура этажей и блоков общежития
 */
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

/**
 * Получить этаж по номеру блока
 */
function getFloorByBlock(blockNumber) {
    for (const [floor, data] of Object.entries(FLOOR_STRUCTURE)) {
        if (data.blocks.includes(blockNumber)) {
            return floor;
        }
    }
    return null;
}

/**
 * Получить название этажа по номеру блока
 */
function getFloorLabel(blockNumber) {
    const floor = getFloorByBlock(blockNumber);
    return floor ? FLOOR_STRUCTURE[floor].label : '—';
}

/**
 * Получить список блоков для этажа
 */
function getBlocksByFloor(floor) {
    return FLOOR_STRUCTURE[floor]?.blocks || [];
}

/**
 * Получить все блоки
 */
function getAllBlocks() {
    const all = [];
    for (const data of Object.values(FLOOR_STRUCTURE)) {
        all.push(...data.blocks);
    }
    return all.sort((a, b) => a - b);
}

/**
 * Проверить, существует ли блок
 */
function isValidBlock(blockNumber) {
    return getAllBlocks().includes(blockNumber);
}

// ============================================================
// ПРОВЕРКА ПРАВ ДОСТУПА К ОБЩЕЖИТИЮ
// ============================================================

/**
 * Получить информацию о сотруднике и его роли в общежитии
 */
async function getEmployeeDormInfo(userId) {
    if (!userId) return null;
    
    try {
        const supabase = initSupabase();
        if (!supabase) return null;
        
        const { data, error } = await supabase
            .from('employees')
            .select('dorm_role, position, full_name')
            .eq('id', userId)
            .single();
            
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('❌ Ошибка получения информации о сотруднике:', error);
        return null;
    }
}

/**
 * Проверить, является ли пользователь работником общежития
 */
function isDormEmployee(dormRole) {
    return ['head', 'educator', 'guard'].includes(dormRole);
}

/**
 * Проверить, является ли пользователь воспитателем
 */
function isEducator(dormRole) {
    return dormRole === 'educator';
}

/**
 * Проверить, является ли пользователь заведующей
 */
function isHead(dormRole) {
    return dormRole === 'head';
}

/**
 * Проверить, является ли пользователь вахтером
 */
function isGuard(dormRole) {
    return dormRole === 'guard';
}

/**
 * Проверить, может ли пользователь редактировать данные общежития
 */
function canEditDormData(dormRole) {
    return ['educator', 'head'].includes(dormRole);
}

/**
 * Проверить, может ли пользователь видеть скрытые данные
 */
function canViewRestrictedData(dormRole) {
    return dormRole === 'educator';
}

// ============================================================
// ФИЛЬТРАЦИЯ СТУДЕНТОВ ДЛЯ ОБЩЕЖИТИЯ
// ============================================================

/**
 * Фильтровать список студентов для работников общежития
 * Показывает только проживающих
 */
function filterStudentsForDorm(students, dormRole) {
    if (!isDormEmployee(dormRole)) return students;
    return students.filter(s => s.lives_in_dorm === true);
}

/**
 * Фильтровать данные студента для заведующей и вахтера
 * Скрывает чувствительные данные
 */
function filterStudentDataForDorm(student, dormRole) {
    if (!isDormEmployee(dormRole)) return student;
    
    // Если воспитатель - показывает все данные
    if (isEducator(dormRole)) return student;
    
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

// ============================================================
// РЕНДЕРИНГ БЛОКА ПРОЖИВАНИЯ
// ============================================================

/**
 * Создать HTML для блока проживания в общежитии
 */
function renderDormInfo(student, dormRole) {
    if (!student) return '';
    
    const livesInDorm = student.lives_in_dorm || false;
    const dormBlock = student.dorm_block || null;
    const dormRoomType = student.dorm_room_type || null;
    
    if (livesInDorm) {
        const floorLabel = dormBlock ? getFloorLabel(dormBlock) : '—';
        const roomLabel = dormRoomType ? (dormRoomType === 'M' ? 'Маленькая (M)' : 'Большая (B)') : '—';
        
        return `
            <div class="dorm-section">
                <div class="dorm-title">🏠 Проживание в общежитии</div>
                <div class="dorm-row">
                    <span class="dorm-label">Статус:</span>
                    <span class="dorm-badge dorm-badge-yes">✅ Проживает</span>
                </div>
                ${dormBlock ? `
                <div class="dorm-row">
                    <span class="dorm-label">Блок:</span>
                    <span class="dorm-value"><span class="dorm-badge-block">№ ${dormBlock}</span> (${floorLabel})</span>
                </div>
                ` : ''}
                ${dormRoomType ? `
                <div class="dorm-row">
                    <span class="dorm-label">Комната:</span>
                    <span class="dorm-value"><span class="dorm-badge-room">${roomLabel}</span></span>
                </div>
                ` : ''}
            </div>
        `;
    } else {
        return `
            <div class="dorm-section">
                <div class="dorm-title">🏠 Проживание в общежитии</div>
                <div class="dorm-row">
                    <span class="dorm-label">Статус:</span>
                    <span class="dorm-badge dorm-badge-no">❌ Не проживает</span>
                </div>
            </div>
        `;
    }
}

/**
 * Создать HTML для формы редактирования проживания
 */
function renderDormEditForm(student, dormRole) {
    if (!canEditDormData(dormRole) || !student || student.status !== 'active') {
        return '';
    }
    
    const livesInDorm = student.lives_in_dorm || false;
    const dormBlock = student.dorm_block || null;
    const dormRoomType = student.dorm_room_type || null;
    
    const allBlocks = getAllBlocks();
    const blockOptions = allBlocks.map(b =>
        `<option value="${b}" ${dormBlock === b ? 'selected' : ''}>${b} (${getFloorLabel(b)})</option>`
    ).join('');
    
    const roomOptions = ROOM_TYPES.map(r =>
        `<option value="${r.value}" ${dormRoomType === r.value ? 'selected' : ''}>${r.label}</option>`
    ).join('');
    
    return `
        <div class="dorm-edit-section">
            <div class="dorm-title">✏️ Редактировать проживание</div>
            <div class="dorm-form-row">
                <label>
                    <input type="checkbox" id="dormCheckbox" ${livesInDorm ? 'checked' : ''}>
                    Проживает в общежитии
                </label>
                <select id="dormBlockSelect" ${!livesInDorm ? 'disabled' : ''}>
                    <option value="">— Выберите блок —</option>
                    ${blockOptions}
                </select>
                <select id="dormRoomSelect" ${!livesInDorm ? 'disabled' : ''}>
                    <option value="">— Выберите комнату —</option>
                    ${roomOptions}
                </select>
                <button class="btn btn-primary btn-sm dorm-save-btn" id="dormSaveBtn">
                    💾 Сохранить
                </button>
            </div>
        </div>
    `;
}

// ============================================================
// УПРАВЛЕНИЕ ЭЛЕМЕНТАМИ В ЗАВИСИМОСТИ ОТ РОЛИ
// ============================================================

/**
 * Скрыть/показать элементы в зависимости от роли
 */
function toggleElementsByRole(selector, role, dormRole) {
    const elements = document.querySelectorAll(selector);
    const shouldShow = dormRole === role || (role === 'dorm' && isDormEmployee(dormRole));
    
    elements.forEach(el => {
        el.style.display = shouldShow ? '' : 'none';
    });
}

/**
 * Скрыть элементы для работников общежития
 */
function hideForDormEmployees(selector, dormRole) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
        el.style.display = isDormEmployee(dormRole) ? 'none' : '';
    });
}

/**
 * Показать элементы только для работников общежития
 */
function showOnlyForDormEmployees(selector, dormRole) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
        el.style.display = isDormEmployee(dormRole) ? '' : 'none';
    });
}

/**
 * Показать элементы только для воспитателя
 */
function showOnlyForEducator(selector, dormRole) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
        el.style.display = isEducator(dormRole) ? '' : 'none';
    });
}

/**
 * Показать элементы только для заведующей
 */
function showOnlyForHead(selector, dormRole) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
        el.style.display = isHead(dormRole) ? '' : 'none';
    });
}

// ============================================================
// ФУНКЦИИ ДЛЯ СОВЕТА ОБЩЕЖИТИЯ
// ============================================================

/**
 * Получить список доступных секторов (из БД или стандартные)
 */
async function getSectors() {
    try {
        const supabase = initSupabase();
        if (!supabase) return getDefaultSectors();
        
        const { data, error } = await supabase
            .from('dorm_council')
            .select('sector')
            .order('sector', { ascending: true });
            
        if (error) throw error;
        
        const sectors = [...new Set(data.map(item => item.sector))];
        return sectors.length > 0 ? sectors : getDefaultSectors();
    } catch (error) {
        console.error('❌ Ошибка получения секторов:', error);
        return getDefaultSectors();
    }
}

/**
 * Получить стандартные сектора
 */
function getDefaultSectors() {
    return [
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
        'Редакционный сектор',
        'Староста этажа',
        'Заместитель старосты'
    ];
}

// ============================================================
// ТОСТ УВЕДОМЛЕНИЯ (ГЛОБАЛЬНЫЙ)
// ============================================================

function showGlobalToast(message, type = 'success', duration = 4000) {
    const existingContainer = document.querySelector('.toast-container');
    if (!existingContainer) {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const container = document.querySelector('.toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        <div class="toast-progress"></div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
            setTimeout(() => {
                if (toast.parentElement) toast.remove();
            }, 300);
        }
    }, duration);
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ (вызывать на каждой странице)
// ============================================================

function initComponents() {
    console.log('🔧 Инициализация компонентов...');
    
    initLogos();
    initMobileMenu();
    initLogout();
    const user = loadUser();
    const supabase = initSupabase();
    
    // Добавляем глобальные функции
    window.__dorm = {
        FLOOR_STRUCTURE,
        ROOM_TYPES,
        getFloorByBlock,
        getFloorLabel,
        getBlocksByFloor,
        getAllBlocks,
        isValidBlock,
        isDormEmployee,
        isEducator,
        isHead,
        isGuard,
        canEditDormData,
        canViewRestrictedData,
        filterStudentsForDorm,
        filterStudentDataForDorm,
        renderDormInfo,
        renderDormEditForm,
        getSectors,
        getDefaultSectors,
        showToast: showGlobalToast
    };
    
    return { user, supabase };
}

// ============================================================
// ЭКСПОРТ В ГЛОБАЛЬНУЮ ПЕРЕМЕННУЮ
// ============================================================

window.vgatk = {
    initComponents,
    loadUser,
    initLogout,
    initMobileMenu,
    initSupabase,
    formatDate,
    calculateAge,
    FLOOR_STRUCTURE,
    ROOM_TYPES,
    getFloorByBlock,
    getFloorLabel,
    getBlocksByFloor,
    getAllBlocks,
    isValidBlock,
    isDormEmployee,
    isEducator,
    isHead,
    isGuard,
    canEditDormData,
    canViewRestrictedData,
    filterStudentsForDorm,
    filterStudentDataForDorm,
    renderDormInfo,
    renderDormEditForm,
    getSectors,
    getDefaultSectors,
    showToast: showGlobalToast,
    get supabaseClient() { return supabaseClient; }
};

console.log('✅ components.js загружен');