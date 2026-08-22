import { supabase } from '../config/supabase.js';

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

function getFloorByBlock(blockNumber) {
    const floorStructure = {
        '2': [1, 2, 3, 4, 5, 6, 7, 8, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
        '3': [32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 44, 45, 49]
    };
    for (const [floor, blocks] of Object.entries(floorStructure)) {
        if (blocks.includes(blockNumber)) return parseInt(floor);
    }
    return null;
}

/**
 * Получить ID студентов, проживавших в общежитии
 */
async function getDormStudentIds() {
    try {
        const { data, error } = await supabase
            .from('students')
            .select('id')
            .eq('lives_in_dorm', true);
        
        if (error) throw error;
        return data.map(s => s.id);
    } catch (error) {
        console.error('❌ Ошибка получения ID студентов общежития:', error.message);
        return [];
    }
}

// ============================================================
// ПОЛУЧЕНИЕ ВЫПУСКНИКОВ (с учётом прав доступа)
// ============================================================

/**
 * Получить список выпускников с учётом роли пользователя
 * @param {string} userId - ID пользователя
 * @param {object} filters - фильтры (type, graduation_year, search)
 */
export async function getGraduates(userId, filters = {}) {
    try {
        // Получаем информацию о сотруднике
        const { data: employee, error: empError } = await supabase
            .from('employees')
            .select('dorm_role')
            .eq('id', userId)
            .single();

        const dormRole = employee?.dorm_role || null;

        // Проверяем, является ли пользователь админом
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

        const isAdmin = user && ['super_admin', 'admin'].includes(user.role);

        // Заведующая и вахтер НЕ могут видеть выпускников
        if (dormRole === 'head' || dormRole === 'guard') {
            return {
                success: false,
                error: 'Доступ запрещён. Заведующая и вахтер не могут просматривать выпускников'
            };
        }

        // Строим запрос
        let query = supabase
            .from('graduates')
            .select('*');

        // Применяем фильтры
        if (filters.type) {
            query = query.eq('type', filters.type);
        }

        if (filters.graduation_year) {
            query = query.eq('graduation_year', filters.graduation_year);
        }

        if (filters.group_id) {
            query = query.eq('group_id', filters.group_id);
        }

        if (filters.search) {
            query = query.ilike('full_name', `%${filters.search}%`);
        }

        // Сортировка
        query = query.order('graduation_year', { ascending: false })
            .order('full_name', { ascending: true });

        const { data: graduates, error } = await query;

        if (error) throw error;

        // Если воспитатель - показываем только выпускников, которые жили в общежитии
        let filteredGraduates = graduates;
        if (dormRole === 'educator') {
            const dormStudentIds = await getDormStudentIds();
            filteredGraduates = graduates.filter(g => 
                dormStudentIds.includes(g.student_id)
            );
        }

        return {
            success: true,
            data: filteredGraduates,
            meta: {
                total: filteredGraduates.length,
                dormRole,
                isAdmin,
                canView: dormRole !== 'head' && dormRole !== 'guard'
            }
        };
    } catch (error) {
        console.error('❌ Ошибка получения выпускников:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================================
// ПОЛУЧЕНИЕ ОДНОГО ВЫПУСКНИКА
// ============================================================

/**
 * Получить данные выпускника по ID с учётом прав доступа
 */
export async function getGraduateById(userId, graduateId) {
    try {
        // Получаем информацию о сотруднике
        const { data: employee, error: empError } = await supabase
            .from('employees')
            .select('dorm_role')
            .eq('id', userId)
            .single();

        const dormRole = employee?.dorm_role || null;

        // Проверяем, является ли пользователь админом
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

        const isAdmin = user && ['super_admin', 'admin'].includes(user.role);

        // Заведующая и вахтер НЕ могут видеть выпускников
        if (dormRole === 'head' || dormRole === 'guard') {
            return {
                success: false,
                error: 'Доступ запрещён. Заведующая и вахтер не могут просматривать выпускников'
            };
        }

        const { data: graduate, error } = await supabase
            .from('graduates')
            .select('*')
            .eq('id', graduateId)
            .single();

        if (error) throw error;

        // Если воспитатель - проверяем, что выпускник жил в общежитии
        if (dormRole === 'educator') {
            const dormStudentIds = await getDormStudentIds();
            if (!dormStudentIds.includes(graduate.student_id)) {
                return {
                    success: false,
                    error: 'Доступ запрещён. Выпускник не проживал в общежитии'
                };
            }
        }

        return {
            success: true,
            data: graduate,
            meta: {
                dormRole,
                isAdmin,
                canView: dormRole !== 'head' && dormRole !== 'guard'
            }
        };
    } catch (error) {
        console.error('❌ Ошибка получения выпускника:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================================
// ПОЛУЧЕНИЕ ВЫПУСКНИКОВ ПО ГРУППЕ
// ============================================================

/**
 * Получить выпускников по группе с учётом прав доступа
 */
export async function getGraduatesByGroup(userId, groupId) {
    try {
        // Получаем информацию о сотруднике
        const { data: employee, error: empError } = await supabase
            .from('employees')
            .select('dorm_role')
            .eq('id', userId)
            .single();

        const dormRole = employee?.dorm_role || null;

        // Проверяем, является ли пользователь админом
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

        const isAdmin = user && ['super_admin', 'admin'].includes(user.role);

        // Заведующая и вахтер НЕ могут видеть выпускников
        if (dormRole === 'head' || dormRole === 'guard') {
            return {
                success: false,
                error: 'Доступ запрещён. Заведующая и вахтер не могут просматривать выпускников'
            };
        }

        let query = supabase
            .from('graduates')
            .select('*')
            .eq('group_id', groupId);

        const { data: graduates, error } = await query;

        if (error) throw error;

        // Если воспитатель - показываем только выпускников, которые жили в общежитии
        let filteredGraduates = graduates;
        if (dormRole === 'educator') {
            const dormStudentIds = await getDormStudentIds();
            filteredGraduates = graduates.filter(g => 
                dormStudentIds.includes(g.student_id)
            );
        }

        return {
            success: true,
            data: filteredGraduates,
            meta: {
                total: filteredGraduates.length,
                dormRole,
                isAdmin
            }
        };
    } catch (error) {
        console.error('❌ Ошибка получения выпускников по группе:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================================
// ПОЛУЧЕНИЕ СТАТИСТИКИ ПО ВЫПУСКНИКАМ
// ============================================================

/**
 * Получить статистику по выпускникам с учётом прав доступа
 */
export async function getGraduatesStatistics(userId) {
    try {
        // Получаем информацию о сотруднике
        const { data: employee, error: empError } = await supabase
            .from('employees')
            .select('dorm_role')
            .eq('id', userId)
            .single();

        const dormRole = employee?.dorm_role || null;

        // Проверяем, является ли пользователь админом
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

        const isAdmin = user && ['super_admin', 'admin'].includes(user.role);

        // Заведующая и вахтер НЕ могут видеть статистику выпускников
        if (dormRole === 'head' || dormRole === 'guard') {
            return {
                success: false,
                error: 'Доступ запрещён. Заведующая и вахтер не могут просматривать статистику выпускников'
            };
        }

        // Получаем всех выпускников
        let query = supabase
            .from('graduates')
            .select('*');

        const { data: graduates, error } = await query;

        if (error) throw error;

        // Если воспитатель - фильтруем по проживанию в общежитии
        let filteredGraduates = graduates;
        if (dormRole === 'educator') {
            const dormStudentIds = await getDormStudentIds();
            filteredGraduates = graduates.filter(g => 
                dormStudentIds.includes(g.student_id)
            );
        }

        // Статистика по годам
        const byYear = {};
        filteredGraduates.forEach(g => {
            if (g.graduation_year) {
                byYear[g.graduation_year] = (byYear[g.graduation_year] || 0) + 1;
            }
        });

        // Статистика по типам
        const byType = { sso: 0, pto: 0 };
        filteredGraduates.forEach(g => {
            if (g.type === 'sso') byType.sso++;
            if (g.type === 'pto') byType.pto++;
        });

        // Статистика по группам
        const byGroup = {};
        filteredGraduates.forEach(g => {
            const groupName = g.group_name || 'Без группы';
            byGroup[groupName] = (byGroup[groupName] || 0) + 1;
        });

        // Статистика по полу
        const byGender = { male: 0, female: 0 };
        filteredGraduates.forEach(g => {
            if (g.gender === 'Мужской') byGender.male++;
            if (g.gender === 'Женский') byGender.female++;
        });

        // Статистика по проживанию в общежитии
        let dormStats = { lived_in_dorm: 0, not_lived: 0 };
        if (dormRole === 'educator') {
            // Для воспитателя все уже отфильтрованы
            dormStats.lived_in_dorm = filteredGraduates.length;
        } else {
            // Для остальных вычисляем
            const dormStudentIds = await getDormStudentIds();
            filteredGraduates.forEach(g => {
                if (dormStudentIds.includes(g.student_id)) {
                    dormStats.lived_in_dorm++;
                } else {
                    dormStats.not_lived++;
                }
            });
        }

        return {
            success: true,
            data: {
                total: filteredGraduates.length,
                byYear,
                byType,
                byGroup,
                byGender,
                dormStats
            },
            meta: {
                dormRole,
                isAdmin,
                canView: dormRole !== 'head' && dormRole !== 'guard'
            }
        };
    } catch (error) {
        console.error('❌ Ошибка получения статистики выпускников:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================================
// ПОЛУЧЕНИЕ ВЫПУСКНИКОВ ПО ГОДУ
// ============================================================

/**
 * Получить выпускников по году выпуска
 */
export async function getGraduatesByYear(userId, year) {
    try {
        // Получаем информацию о сотруднике
        const { data: employee, error: empError } = await supabase
            .from('employees')
            .select('dorm_role')
            .eq('id', userId)
            .single();

        const dormRole = employee?.dorm_role || null;

        // Заведующая и вахтер НЕ могут видеть выпускников
        if (dormRole === 'head' || dormRole === 'guard') {
            return {
                success: false,
                error: 'Доступ запрещён. Заведующая и вахтер не могут просматривать выпускников'
            };
        }

        let query = supabase
            .from('graduates')
            .select('*')
            .eq('graduation_year', year);

        const { data: graduates, error } = await query;

        if (error) throw error;

        // Если воспитатель - показываем только выпускников, которые жили в общежитии
        let filteredGraduates = graduates;
        if (dormRole === 'educator') {
            const dormStudentIds = await getDormStudentIds();
            filteredGraduates = graduates.filter(g => 
                dormStudentIds.includes(g.student_id)
            );
        }

        return {
            success: true,
            data: filteredGraduates,
            meta: {
                total: filteredGraduates.length,
                dormRole
            }
        };
    } catch (error) {
        console.error('❌ Ошибка получения выпускников по году:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================================
// ПОЛУЧЕНИЕ ДОСТУПНЫХ ГОДОВ ВЫПУСКА
// ============================================================

/**
 * Получить список доступных годов выпуска
 */
export async function getAvailableGraduationYears(userId) {
    try {
        // Получаем информацию о сотруднике
        const { data: employee, error: empError } = await supabase
            .from('employees')
            .select('dorm_role')
            .eq('id', userId)
            .single();

        const dormRole = employee?.dorm_role || null;

        // Заведующая и вахтер НЕ могут видеть выпускников
        if (dormRole === 'head' || dormRole === 'guard') {
            return {
                success: false,
                error: 'Доступ запрещён. Заведующая и вахтер не могут просматривать выпускников'
            };
        }

        let query = supabase
            .from('graduates')
            .select('graduation_year')
            .not('graduation_year', 'is', null);

        const { data, error } = await query
            .order('graduation_year', { ascending: false });

        if (error) throw error;

        // Уникальные годы
        const years = [...new Set(data.map(g => g.graduation_year))];

        return {
            success: true,
            data: years,
            meta: {
                total: years.length,
                dormRole
            }
        };
    } catch (error) {
        console.error('❌ Ошибка получения годов выпуска:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================================
// ЭКСПОРТ
// ============================================================

export default {
    getGraduates,
    getGraduateById,
    getGraduatesByGroup,
    getGraduatesStatistics,
    getGraduatesByYear,
    getAvailableGraduationYears
};