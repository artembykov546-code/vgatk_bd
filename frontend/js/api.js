// ============================================================
// API ДЛЯ РАБОТЫ С ОБЩЕЖИТИЕМ
// ============================================================

/**
 * Получить данные о сотруднике и его роли
 */
export async function getEmployeeInfo() {
    try {
        const { data, error } = await window.supabaseClient
            .from('employees')
            .select('id, full_name, position, dorm_role')
            .eq('id', window.Session?.getUser()?.id || localStorage.getItem('userId'))
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('❌ Ошибка получения информации о сотруднике:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Проверить, является ли сотрудник работником общежития
 */
export async function isDormEmployee() {
    const result = await getEmployeeInfo();
    if (!result.success) return { success: false, isDorm: false };
    return { 
        success: true, 
        isDorm: !!result.data.dorm_role,
        dormRole: result.data.dorm_role,
        employee: result.data
    };
}

// ============================================================
// СТУДЕНТЫ
// ============================================================

/**
 * Получить список студентов (с учётом прав доступа)
 */
export async function getStudents(filters = {}) {
    try {
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key]) params.append(key, filters[key]);
        });

        const response = await fetch(`/api/students?${params.toString()}`);
        const result = await response.json();

        if (!result.success) throw new Error(result.error);
        return result;
    } catch (error) {
        console.error('❌ Ошибка получения студентов:', error.message);
        return { success: false, error: error.message, data: [] };
    }
}

/**
 * Получить данные студента по ID
 */
export async function getStudentById(studentId) {
    try {
        const response = await fetch(`/api/students/${studentId}`);
        const result = await response.json();

        if (!result.success) throw new Error(result.error);
        return result;
    } catch (error) {
        console.error('❌ Ошибка получения студента:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Обновить данные о проживании студента
 */
export async function updateStudentDormData(studentId, dormData) {
    try {
        const response = await fetch(`/api/students/${studentId}/dorm`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dormData)
        });
        const result = await response.json();

        if (!result.success) throw new Error(result.error);
        return result;
    } catch (error) {
        console.error('❌ Ошибка обновления данных проживания:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Получить студентов, проживающих в общежитии
 */
export async function getDormStudents() {
    try {
        const response = await fetch('/api/students/dorm');
        const result = await response.json();

        if (!result.success) throw new Error(result.error);
        return result;
    } catch (error) {
        console.error('❌ Ошибка получения студентов общежития:', error.message);
        return { success: false, error: error.message, data: [] };
    }
}

/**
 * Получить студентов по блоку
 */
export async function getStudentsByBlock(blockNumber) {
    try {
        const response = await fetch(`/api/students/dorm/block/${blockNumber}`);
        const result = await response.json();

        if (!result.success) throw new Error(result.error);
        return result;
    } catch (error) {
        console.error('❌ Ошибка получения студентов по блоку:', error.message);
        return { success: false, error: error.message, data: [] };
    }
}

/**
 * Получить студентов по этажу
 */
export async function getStudentsByFloor(floor) {
    try {
        const response = await fetch(`/api/students/dorm/floor/${floor}`);
        const result = await response.json();

        if (!result.success) throw new Error(result.error);
        return result;
    } catch (error) {
        console.error('❌ Ошибка получения студентов по этажу:', error.message);
        return { success: false, error: error.message, data: [] };
    }
}

// ============================================================
// ВЫПУСКНИКИ
// ============================================================

/**
 * Получить список выпускников (с учётом прав доступа)
 */
export async function getGraduates(filters = {}) {
    try {
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key]) params.append(key, filters[key]);
        });

        const response = await fetch(`/api/graduates?${params.toString()}`);
        const result = await response.json();

        if (!result.success) throw new Error(result.error);
        return result;
    } catch (error) {
        console.error('❌ Ошибка получения выпускников:', error.message);
        return { success: false, error: error.message, data: [] };
    }
}

/**
 * Получить данные выпускника по ID
 */
export async function getGraduateById(graduateId) {
    try {
        const response = await fetch(`/api/graduates/${graduateId}`);
        const result = await response.json();

        if (!result.success) throw new Error(result.error);
        return result;
    } catch (error) {
        console.error('❌ Ошибка получения выпускника:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================================
// СОВЕТ ОБЩЕЖИТИЯ
// ============================================================

/**
 * Получить список совета общежития
 */
export async function getDormCouncil(floor = 'all') {
    try {
        const response = await fetch(`/api/dorm/council?floor=${floor}`);
        const result = await response.json();

        if (!result.success) throw new Error(result.error);
        return result;
    } catch (error) {
        console.error('❌ Ошибка получения совета общежития:', error.message);
        return { success: false, error: error.message, data: [] };
    }
}

/**
 * Получить запись совета по ID
 */
export async function getDormCouncilById(id) {
    try {
        const response = await fetch(`/api/dorm/council/${id}`);
        const result = await response.json();

        if (!result.success) throw new Error(result.error);
        return result;
    } catch (error) {
        console.error('❌ Ошибка получения записи:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Создать запись в совете общежития
 */
export async function createDormCouncilEntry(data) {
    try {
        const response = await fetch('/api/dorm/council', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();

        if (!result.success) throw new Error(result.error);
        return result;
    } catch (error) {
        console.error('❌ Ошибка создания записи:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Обновить запись в совете общежития
 */
export async function updateDormCouncilEntry(id, data) {
    try {
        const response = await fetch(`/api/dorm/council/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();

        if (!result.success) throw new Error(result.error);
        return result;
    } catch (error) {
        console.error('❌ Ошибка обновления записи:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Удалить запись из совета общежития
 */
export async function deleteDormCouncilEntry(id) {
    try {
        const response = await fetch(`/api/dorm/council/${id}`, {
            method: 'DELETE'
        });
        const result = await response.json();

        if (!result.success) throw new Error(result.error);
        return result;
    } catch (error) {
        console.error('❌ Ошибка удаления записи:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Получить все уникальные сектора
 */
export async function getUniqueSectors() {
    try {
        const response = await fetch('/api/dorm/sectors');
        const result = await response.json();

        if (!result.success) throw new Error(result.error);
        return result;
    } catch (error) {
        console.error('❌ Ошибка получения секторов:', error.message);
        return { success: false, error: error.message, data: [] };
    }
}

/**
 * Получить структуру этажей и блоков
 */
export async function getFloorStructure() {
    try {
        const response = await fetch('/api/dorm/structure');
        const result = await response.json();

        if (!result.success) throw new Error(result.error);
        return result;
    } catch (error) {
        console.error('❌ Ошибка получения структуры:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================================
// ОТЧЁТЫ
// ============================================================

/**
 * Получить список доступных отчётов
 */
export async function getAvailableReports() {
    try {
        const response = await fetch('/api/reports/available');
        const result = await response.json();

        if (!result.success) throw new Error(result.error);
        return result;
    } catch (error) {
        console.error('❌ Ошибка получения списка отчётов:', error.message);
        return { success: false, error: error.message, data: [] };
    }
}

/**
 * Сгенерировать отчёт
 */
export async function generateReport(reportId, filters = {}) {
    try {
        const response = await fetch(`/api/reports/generate/${reportId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(filters)
        });
        const result = await response.json();

        if (!result.success) throw new Error(result.error);
        return result;
    } catch (error) {
        console.error('❌ Ошибка генерации отчёта:', error.message);
        return { success: false, error: error.message, data: [] };
    }
}

// ============================================================
// СТАТИСТИКА
// ============================================================

/**
 * Получить статистику по проживанию в общежитии
 */
export async function getDormStatistics() {
    try {
        const response = await fetch('/api/dorm/statistics');
        const result = await response.json();

        if (!result.success) throw new Error(result.error);
        return result;
    } catch (error) {
        console.error('❌ Ошибка получения статистики:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================================
// ЭКСПОРТ
// ============================================================

export default {
    // Сотрудники
    getEmployeeInfo,
    isDormEmployee,
    
    // Студенты
    getStudents,
    getStudentById,
    updateStudentDormData,
    getDormStudents,
    getStudentsByBlock,
    getStudentsByFloor,
    
    // Выпускники
    getGraduates,
    getGraduateById,
    
    // Совет общежития
    getDormCouncil,
    getDormCouncilById,
    createDormCouncilEntry,
    updateDormCouncilEntry,
    deleteDormCouncilEntry,
    getUniqueSectors,
    getFloorStructure,
    
    // Отчёты
    getAvailableReports,
    generateReport,
    
    // Статистика
    getDormStatistics
};