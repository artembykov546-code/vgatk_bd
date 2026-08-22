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

function getAllBlocks() {
    const floorStructure = {
        '2': [1, 2, 3, 4, 5, 6, 7, 8, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
        '3': [32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 44, 45, 49]
    };
    const all = [];
    for (const blocks of Object.values(floorStructure)) {
        all.push(...blocks);
    }
    return all.sort((a, b) => a - b);
}

// ============================================================
// ПОЛУЧЕНИЕ СПИСКА СТУДЕНТОВ (с учётом прав доступа)
// ============================================================

/**
 * Получить список студентов с учётом роли пользователя
 * @param {string} userId - ID пользователя
 * @param {object} filters - фильтры (group_id, status, type, search)
 */
export async function getStudents(userId, filters = {}) {
    try {
        // Получаем информацию о сотруднике
        const { data: employee, error: empError } = await supabase
            .from('employees')
            .select('dorm_role')
            .eq('id', userId)
            .single();

        const isDormEmployee = employee && employee.dorm_role;
        const dormRole = employee?.dorm_role || null;

        // Проверяем, является ли пользователь админом
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

        const isAdmin = user && ['super_admin', 'admin'].includes(user.role);

        // Строим запрос
        let query = supabase
            .from('students')
            .select(`
                *,
                groups:group_id (
                    id,
                    name,
                    type
                )
            `);

        // Применяем фильтры
        if (filters.group_id) {
            query = query.eq('group_id', filters.group_id);
        }

        if (filters.status) {
            query = query.eq('status', filters.status);
        } else {
            // По умолчанию не показываем выпускников
            query = query.neq('status', 'graduated');
        }

        if (filters.type) {
            query = query.eq('groups.type', filters.type);
        }

        // ПОИСК по ФИО
        if (filters.search) {
            query = query.ilike('full_name', `%${filters.search}%`);
        }

        // ЕСЛИ РАБОТНИК ОБЩЕЖИТИЯ - показываем только проживающих
        if (isDormEmployee) {
            query = query.eq('lives_in_dorm', true);
        }

        // Сортировка
        query = query.order('full_name', { ascending: true });

        const { data: students, error } = await query;

        if (error) throw error;

        // Если заведующая или вахтер - скрываем чувствительные данные
        let filteredStudents = students;
        if (dormRole === 'head' || dormRole === 'guard') {
            filteredStudents = students.map(student => ({
                ...student,
                // Скрываем чувствительные данные
                accounting_type: undefined,
                accounting_data: undefined,
                sop: undefined,
                kdn: undefined,
                idn: undefined,
                is_orphan: undefined,
                // Скрываем родителей
                parents: undefined,
                // Скрываем школы и оценки
                school: undefined,
                school_year: undefined,
                school_class: undefined,
                avg_grade: undefined,
                // Скрываем адреса (кроме общежития)
                address_reg: undefined,
                address_live: undefined,
                address_region: undefined,
                address_district: undefined,
                address_locality: undefined,
                addresses: undefined
            }));
        }

        return {
            success: true,
            data: filteredStudents,
            meta: {
                total: filteredStudents.length,
                isDormEmployee,
                dormRole,
                isAdmin
            }
        };
    } catch (error) {
        console.error('❌ Ошибка получения студентов:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================================
// ПОЛУЧЕНИЕ ОДНОГО СТУДЕНТА
// ============================================================

/**
 * Получить данные студента по ID с учётом прав доступа
 */
export async function getStudentById(userId, studentId) {
    try {
        // Получаем информацию о сотруднике
        const { data: employee, error: empError } = await supabase
            .from('employees')
            .select('dorm_role')
            .eq('id', userId)
            .single();

        const isDormEmployee = employee && employee.dorm_role;
        const dormRole = employee?.dorm_role || null;

        // Проверяем, является ли пользователь админом
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

        const isAdmin = user && ['super_admin', 'admin'].includes(user.role);

        // Получаем студента
        const { data: student, error } = await supabase
            .from('students')
            .select(`
                *,
                groups:group_id (
                    id,
                    name,
                    type
                )
            `)
            .eq('id', studentId)
            .single();

        if (error) throw error;

        // Если работник общежития - проверяем, что студент проживает
        if (isDormEmployee && !student.lives_in_dorm) {
            return {
                success: false,
                error: 'Доступ запрещён. Студент не проживает в общежитии'
            };
        }

        // Если заведующая или вахтер - скрываем чувствительные данные
        let filteredStudent = { ...student };
        if (dormRole === 'head' || dormRole === 'guard') {
            // Скрываем чувствительные данные
            delete filteredStudent.accounting_type;
            delete filteredStudent.accounting_data;
            delete filteredStudent.sop;
            delete filteredStudent.kdn;
            delete filteredStudent.idn;
            delete filteredStudent.is_orphan;
            // Скрываем родителей
            delete filteredStudent.parents;
            // Скрываем школы и оценки
            delete filteredStudent.school;
            delete filteredStudent.school_year;
            delete filteredStudent.school_class;
            delete filteredStudent.avg_grade;
            // Скрываем адреса (кроме общежития)
            delete filteredStudent.address_reg;
            delete filteredStudent.address_live;
            delete filteredStudent.address_region;
            delete filteredStudent.address_district;
            delete filteredStudent.address_locality;
            delete filteredStudent.addresses;
        }

        return {
            success: true,
            data: filteredStudent,
            meta: {
                isDormEmployee,
                dormRole,
                canEdit: isAdmin || ['educator', 'head'].includes(dormRole)
            }
        };
    } catch (error) {
        console.error('❌ Ошибка получения студента:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================================
// ОБНОВЛЕНИЕ ДАННЫХ ПРОЖИВАНИЯ
// ============================================================

/**
 * Обновить данные о проживании студента в общежитии
 * (только для воспитателя и заведующей)
 */
export async function updateDormData(userId, studentId, dormData) {
    try {
        // Проверяем права
        const { data: employee, error: empError } = await supabase
            .from('employees')
            .select('dorm_role')
            .eq('id', userId)
            .single();

        if (empError || !employee) {
            return {
                success: false,
                error: 'Сотрудник не найден'
            };
        }

        // Проверяем, является ли пользователь админом
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

        const isAdmin = user && ['super_admin', 'admin'].includes(user.role);

        if (!isAdmin && !['educator', 'head'].includes(employee.dorm_role || '')) {
            return {
                success: false,
                error: 'Доступ запрещён. Только для воспитателя или заведующей'
            };
        }

        // Проверяем, что студент существует
        const { data: student, error: studentError } = await supabase
            .from('students')
            .select('id')
            .eq('id', studentId)
            .single();

        if (studentError || !student) {
            return {
                success: false,
                error: 'Студент не найден'
            };
        }

        // Валидируем блок
        let dormBlock = dormData.dorm_block;
        if (dormData.lives_in_dorm && dormBlock) {
            const allBlocks = getAllBlocks();
            if (!allBlocks.includes(parseInt(dormBlock))) {
                return {
                    success: false,
                    error: `Блок ${dormBlock} не существует. Допустимые блоки: ${allBlocks.join(', ')}`
                };
            }
        }

        // Обновляем данные
        const updateData = {
            lives_in_dorm: dormData.lives_in_dorm || false,
            dorm_block: dormData.lives_in_dorm ? dormData.dorm_block : null,
            dorm_room_type: dormData.lives_in_dorm ? dormData.dorm_room_type : null,
            dorm_room_number: dormData.lives_in_dorm ? dormData.dorm_room_number : null,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('students')
            .update(updateData)
            .eq('id', studentId)
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            data,
            message: 'Данные о проживании обновлены'
        };
    } catch (error) {
        console.error('❌ Ошибка обновления данных проживания:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================================
// ПОЛУЧЕНИЕ СТУДЕНТОВ ДЛЯ СОВЕТА ОБЩЕЖИТИЯ
// ============================================================

/**
 * Получить студентов, проживающих в общежитии (для выбора в совете)
 */
export async function getDormStudentsForCouncil() {
    try {
        const { data, error } = await supabase
            .from('students')
            .select(`
                id,
                full_name,
                group_id,
                groups:group_id (
                    name
                ),
                lives_in_dorm,
                dorm_block,
                dorm_room_type,
                dorm_room_number
            `)
            .eq('lives_in_dorm', true)
            .eq('status', 'active')
            .order('full_name', { ascending: true });

        if (error) throw error;

        const formatted = data.map(student => ({
            id: student.id,
            full_name: student.full_name,
            group_name: student.groups?.name || '—',
            dorm_block: student.dorm_block,
            dorm_room_type: student.dorm_room_type,
            dorm_room_number: student.dorm_room_number,
            floor: student.dorm_block ? getFloorByBlock(student.dorm_block) : null
        }));

        return { success: true, data: formatted };
    } catch (error) {
        console.error('❌ Ошибка получения студентов общежития:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================================
// ПОЛУЧЕНИЕ СТУДЕНТОВ ПО БЛОКУ
// ============================================================

/**
 * Получить студентов, проживающих в указанном блоке
 */
export async function getStudentsByBlock(blockNumber) {
    try {
        const { data, error } = await supabase
            .from('students')
            .select(`
                *,
                groups:group_id (
                    id,
                    name,
                    type
                )
            `)
            .eq('lives_in_dorm', true)
            .eq('dorm_block', blockNumber)
            .eq('status', 'active')
            .order('full_name', { ascending: true });

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('❌ Ошибка получения студентов по блоку:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================================
// ПОЛУЧЕНИЕ СТУДЕНТОВ ПО ЭТАЖУ
// ============================================================

/**
 * Получить студентов, проживающих на указанном этаже
 */
export async function getStudentsByFloor(floor) {
    try {
        // Определяем блоки для этажа
        const floorStructure = {
            '2': [1, 2, 3, 4, 5, 6, 7, 8, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
            '3': [32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 44, 45, 49]
        };

        const blocks = floorStructure[floor] || [];
        if (blocks.length === 0) {
            return {
                success: false,
                error: 'Некорректный номер этажа'
            };
        }

        const { data, error } = await supabase
            .from('students')
            .select(`
                *,
                groups:group_id (
                    id,
                    name,
                    type
                )
            `)
            .eq('lives_in_dorm', true)
            .in('dorm_block', blocks)
            .eq('status', 'active')
            .order('dorm_block', { ascending: true })
            .order('full_name', { ascending: true });

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('❌ Ошибка получения студентов по этажу:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================================
// ПОЛУЧЕНИЕ СТУДЕНТОВ ПО КОМНАТЕ
// ============================================================

/**
 * Получить студентов, проживающих в указанной комнате
 */
export async function getStudentsByRoom(roomType, roomNumber = null) {
    try {
        let query = supabase
            .from('students')
            .select(`
                *,
                groups:group_id (
                    id,
                    name,
                    type
                )
            `)
            .eq('lives_in_dorm', true)
            .eq('dorm_room_type', roomType)
            .eq('status', 'active');

        if (roomNumber !== null) {
            query = query.eq('dorm_room_number', roomNumber);
        }

        const { data, error } = await query
            .order('full_name', { ascending: true });

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('❌ Ошибка получения студентов по комнате:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================================
// ПОЛУЧЕНИЕ СТРУКТУРЫ ОБЩЕЖИТИЯ
// ============================================================

/**
 * Получить структуру общежития (этажи, блоки, комнаты)
 */
export async function getDormStructure() {
    try {
        const { data, error } = await supabase
            .from('dorm_blocks')
            .select('*')
            .order('floor', { ascending: true })
            .order('block_number', { ascending: true });

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('❌ Ошибка получения структуры общежития:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================================
// ПОЛУЧЕНИЕ СТАТИСТИКИ ПО ПРОЖИВАНИЮ
// ============================================================

/**
 * Получить статистику по проживанию в общежитии
 */
export async function getDormStatistics() {
    try {
        // Общее количество проживающих
        const { count: total, error: totalError } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('lives_in_dorm', true)
            .eq('status', 'active');

        if (totalError) throw totalError;

        // По полу
        const { data: genderData, error: genderError } = await supabase
            .from('students')
            .select('gender')
            .eq('lives_in_dorm', true)
            .eq('status', 'active');

        if (genderError) throw genderError;

        const male = genderData?.filter(s => s.gender === 'Мужской').length || 0;
        const female = genderData?.filter(s => s.gender === 'Женский').length || 0;

        // По блокам
        const { data: blockData, error: blockError } = await supabase
            .from('students')
            .select('dorm_block')
            .eq('lives_in_dorm', true)
            .eq('status', 'active');

        if (blockError) throw blockError;

        const blockStats = {};
        blockData.forEach(s => {
            if (s.dorm_block) {
                blockStats[s.dorm_block] = (blockStats[s.dorm_block] || 0) + 1;
            }
        });

        // По типам комнат
        const { data: roomData, error: roomError } = await supabase
            .from('students')
            .select('dorm_room_type')
            .eq('lives_in_dorm', true)
            .eq('status', 'active');

        if (roomError) throw roomError;

        const roomStats = { M: 0, B: 0 };
        roomData.forEach(s => {
            if (s.dorm_room_type === 'M') roomStats.M++;
            if (s.dorm_room_type === 'B') roomStats.B++;
        });

        // По этажам
        const floorStructure = {
            '2': [1, 2, 3, 4, 5, 6, 7, 8, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
            '3': [32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 44, 45, 49]
        };

        const floorStats = { '2': 0, '3': 0 };
        blockData.forEach(s => {
            if (s.dorm_block) {
                if (floorStructure['2'].includes(s.dorm_block)) floorStats['2']++;
                if (floorStructure['3'].includes(s.dorm_block)) floorStats['3']++;
            }
        });

        return {
            success: true,
            data: {
                total: total || 0,
                byGender: { male, female },
                byBlock: blockStats,
                byRoom: roomStats,
                byFloor: floorStats
            }
        };
    } catch (error) {
        console.error('❌ Ошибка получения статистики проживания:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================================
// ПОЛУЧЕНИЕ ЭКСПОРТНЫХ ДАННЫХ ПО ОБЩЕЖИТИЮ
// ============================================================

/**
 * Получить данные для экспорта (Excel/PDF) по проживающим
 */
export async function getDormExportData(filters = {}) {
    try {
        let query = supabase
            .from('students')
            .select(`
                *,
                groups:group_id (
                    id,
                    name,
                    type
                )
            `)
            .eq('lives_in_dorm', true)
            .eq('status', 'active');

        if (filters.floor) {
            const floorStructure = {
                '2': [1, 2, 3, 4, 5, 6, 7, 8, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
                '3': [32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 44, 45, 49]
            };
            const blocks = floorStructure[filters.floor] || [];
            if (blocks.length > 0) {
                query = query.in('dorm_block', blocks);
            }
        }

        if (filters.block) {
            query = query.eq('dorm_block', parseInt(filters.block));
        }

        const { data, error } = await query
            .order('dorm_block', { ascending: true })
            .order('full_name', { ascending: true });

        if (error) throw error;

        // Форматируем для экспорта
        const exportData = data.map(s => ({
            'ФИО': s.full_name,
            'Группа': s.groups?.name || '—',
            'Тип': s.groups?.type === 'sso' ? 'ССО' : 'ПТО',
            'Блок': s.dorm_block || '—',
            'Этаж': s.dorm_block ? getFloorByBlock(s.dorm_block) : '—',
            'Комната': s.dorm_room_type === 'M' ? 'Маленькая (M)' : 
                       s.dorm_room_type === 'B' ? 'Большая (B)' : '—',
            'Номер комнаты': s.dorm_room_number || '—',
            'Телефон': s.phone || '—',
            'Пол': s.gender || '—'
        }));

        return {
            success: true,
            data: exportData,
            meta: {
                total: exportData.length,
                columns: Object.keys(exportData[0] || {})
            }
        };
    } catch (error) {
        console.error('❌ Ошибка получения данных для экспорта:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================================
// ЭКСПОРТ
// ============================================================

export default {
    getStudents,
    getStudentById,
    updateDormData,
    getDormStudentsForCouncil,
    getStudentsByBlock,
    getStudentsByFloor,
    getStudentsByRoom,
    getDormStructure,
    getDormStatistics,
    getDormExportData,
    // Вспомогательные
    getFloorByBlock,
    getAllBlocks
};