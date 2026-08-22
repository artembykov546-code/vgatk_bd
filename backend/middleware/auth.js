import { supabase } from '../config/supabase.js';

// ============================================================
// ПРОВЕРКА АВТОРИЗАЦИИ (для Express/серверных маршрутов)
// ============================================================

/**
 * Middleware для проверки авторизации
 * Проверяет наличие токена в заголовке Authorization
 */
export async function requireAuth(req, res, next) {
    try {
        // Получаем токен из заголовка
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Токен авторизации не предоставлен'
            });
        }

        const token = authHeader.split(' ')[1];

        // Проверяем токен через Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({
                success: false,
                error: 'Недействительный токен'
            });
        }

        // Добавляем пользователя в request
        req.user = user;
        next();
    } catch (err) {
        console.error('❌ Ошибка проверки авторизации:', err.message);
        return res.status(500).json({
            success: false,
            error: 'Ошибка сервера при проверке авторизации'
        });
    }
}

// ============================================================
// ПРОВЕРКА РОЛИ (общая)
// ============================================================

/**
 * Middleware для проверки роли пользователя
 * @param {string|string[]} requiredRole - требуемая роль или массив ролей
 */
export function requireRole(requiredRole) {
    const roleHierarchy = {
        'viewer': 1,
        'teacher': 2,
        'admin': 3,
        'super_admin': 4
    };

    return async (req, res, next) => {
        try {
            // Получаем ID пользователя из request (устанавливается requireAuth)
            const userId = req.user?.id;
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: 'Пользователь не авторизован'
                });
            }

            // Получаем роль пользователя из базы
            const { data: user, error } = await supabase
                .from('users')
                .select('role')
                .eq('id', userId)
                .single();

            if (error || !user) {
                return res.status(404).json({
                    success: false,
                    error: 'Пользователь не найден'
                });
            }

            // Если requiredRole - массив, проверяем вхождение
            if (Array.isArray(requiredRole)) {
                if (!requiredRole.includes(user.role)) {
                    return res.status(403).json({
                        success: false,
                        error: 'Недостаточно прав для выполнения операции'
                    });
                }
            } else {
                // Проверяем иерархию ролей
                if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
                    return res.status(403).json({
                        success: false,
                        error: 'Недостаточно прав для выполнения операции'
                    });
                }
            }

            next();
        } catch (err) {
            console.error('❌ Ошибка проверки роли:', err.message);
            return res.status(500).json({
                success: false,
                error: 'Ошибка сервера при проверке роли'
            });
        }
    };
}

// ============================================================
// МЯГКАЯ ПРОВЕРКА (не блокирует, просто добавляет user в req)
// ============================================================

/**
 * Middleware для мягкой проверки авторизации
 * Если пользователь не авторизован - просто пропускает дальше
 */
export async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const { data: { user } } = await supabase.auth.getUser(token);
            
            if (user) {
                req.user = user;
            }
        }
        
        next();
    } catch (err) {
        // Игнорируем ошибки, просто пропускаем
        next();
    }
}

// ============================================================
// ПРОВЕРКА ПРАВ ДОСТУПА К СТУДЕНТАМ (с учётом роли общежития)
// ============================================================

/**
 * Middleware для получения текущего сотрудника и его роли
 * Добавляет в req: employee, dormRole, isDormEmployee
 */
export async function getEmployeeInfo(req, res, next) {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Пользователь не авторизован'
            });
        }

        // Проверяем, является ли пользователь админом
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

        const isAdmin = user && ['super_admin', 'admin'].includes(user.role);

        const { data: employee, error } = await supabase
            .from('employees')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !employee) {
            // Если сотрудник не найден, но пользователь - админ
            if (isAdmin) {
                req.employee = null;
                req.dormRole = null;
                req.isDormEmployee = false;
                req.isAdmin = true;
                next();
                return;
            }
            
            // Если не админ и не сотрудник - доступ запрещён
            return res.status(403).json({
                success: false,
                error: 'Доступ запрещён. Только для сотрудников колледжа'
            });
        }

        req.employee = employee;
        req.dormRole = employee.dorm_role || null;
        req.isDormEmployee = !!employee.dorm_role;
        req.isAdmin = isAdmin || false;

        next();
    } catch (err) {
        console.error('❌ Ошибка получения информации о сотруднике:', err.message);
        return res.status(500).json({
            success: false,
            error: 'Ошибка сервера при получении информации о сотруднике'
        });
    }
}

/**
 * Middleware для проверки: может ли пользователь просматривать студента
 * Учитывает роль общежития
 */
export function canViewStudent() {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            const studentId = req.params.id || req.query.id || req.body.student_id;
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: 'Пользователь не авторизован'
                });
            }

            // Проверяем, является ли пользователь админом
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('role')
                .eq('id', userId)
                .single();

            const isAdmin = user && ['super_admin', 'admin'].includes(user.role);

            // Администраторы имеют полный доступ
            if (isAdmin) {
                next();
                return;
            }

            // Получаем информацию о сотруднике
            const { data: employee, error: empError } = await supabase
                .from('employees')
                .select('dorm_role')
                .eq('id', userId)
                .single();

            // Если сотрудник не найден - доступ запрещён
            if (empError || !employee) {
                return res.status(403).json({
                    success: false,
                    error: 'Доступ запрещён. Только для сотрудников колледжа'
                });
            }

            // Если сотрудник НЕ работник общежития - имеет доступ ко всем студентам
            if (!employee.dorm_role) {
                next();
                return;
            }

            // Если работник общежития - проверяем, что студент проживает в общежитии
            if (studentId) {
                const { data: student, error: studentError } = await supabase
                    .from('students')
                    .select('lives_in_dorm')
                    .eq('id', studentId)
                    .single();

                if (studentError) {
                    return res.status(404).json({
                        success: false,
                        error: 'Студент не найден'
                    });
                }

                if (!student.lives_in_dorm) {
                    return res.status(403).json({
                        success: false,
                        error: 'Доступ запрещён. Студент не проживает в общежитии'
                    });
                }
            }

            req.dormRole = employee.dorm_role;
            next();
        } catch (err) {
            console.error('❌ Ошибка проверки доступа к студенту:', err.message);
            return res.status(500).json({
                success: false,
                error: 'Ошибка сервера при проверке доступа'
            });
        }
    };
}

// ============================================================
// ПРОВЕРКА ПРАВ ДОСТУПА К ВЫПУСКНИКАМ
// ============================================================

/**
 * Middleware для проверки доступа к выпускникам
 * Заведующая и вахтер не могут видеть выпускников
 */
export function canViewGraduates() {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: 'Пользователь не авторизован'
                });
            }

            // Проверяем, является ли пользователь админом
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('role')
                .eq('id', userId)
                .single();

            const isAdmin = user && ['super_admin', 'admin'].includes(user.role);

            // Администраторы имеют полный доступ
            if (isAdmin) {
                next();
                return;
            }

            // Получаем информацию о сотруднике
            const { data: employee, error: empError } = await supabase
                .from('employees')
                .select('dorm_role')
                .eq('id', userId)
                .single();

            // Если сотрудник не найден - доступ запрещён
            if (empError || !employee) {
                return res.status(403).json({
                    success: false,
                    error: 'Доступ запрещён. Только для сотрудников колледжа'
                });
            }

            // Заведующая и вахтер не могут видеть выпускников
            if (employee.dorm_role === 'head' || employee.dorm_role === 'guard') {
                return res.status(403).json({
                    success: false,
                    error: 'Доступ запрещён. Заведующая и вахтер не могут просматривать выпускников'
                });
            }

            next();
        } catch (err) {
            console.error('❌ Ошибка проверки доступа к выпускникам:', err.message);
            return res.status(500).json({
                success: false,
                error: 'Ошибка сервера при проверке доступа'
            });
        }
    };
}

// ============================================================
// ПРОВЕРКА ПРАВ ДОСТУПА К ОТЧЁТАМ
// ============================================================

/**
 * Middleware для проверки доступа к отчётам
 * Заведующая и вахтер могут видеть только отчёты общежития
 */
export function canViewReports() {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: 'Пользователь не авторизован'
                });
            }

            // Проверяем, является ли пользователь админом
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('role')
                .eq('id', userId)
                .single();

            const isAdmin = user && ['super_admin', 'admin'].includes(user.role);

            // Администраторы имеют полный доступ
            if (isAdmin) {
                next();
                return;
            }

            // Получаем информацию о сотруднике
            const { data: employee, error: empError } = await supabase
                .from('employees')
                .select('dorm_role')
                .eq('id', userId)
                .single();

            // Если сотрудник не найден - доступ запрещён
            if (empError || !employee) {
                return res.status(403).json({
                    success: false,
                    error: 'Доступ запрещён. Только для сотрудников колледжа'
                });
            }

            // Для работников общежития проверяем, что запрашиваемый отчёт - из общежития
            if (employee.dorm_role) {
                const reportId = req.params.reportId || req.body.reportId;
                if (reportId) {
                    const dormReports = [
                        'dorm_residents', 'dorm_by_floor', 'dorm_by_block', 
                        'dorm_by_room', 'dorm_statistics', 'dorm_council', 'dorm_activists'
                    ];
                    
                    // Если запрашиваемый отчёт не из общежития - доступ запрещён
                    if (!dormReports.includes(reportId) && employee.dorm_role !== 'educator') {
                        return res.status(403).json({
                            success: false,
                            error: 'Доступ запрещён. Заведующая и вахтер могут видеть только отчёты общежития'
                        });
                    }
                }
            }

            next();
        } catch (err) {
            console.error('❌ Ошибка проверки доступа к отчётам:', err.message);
            return res.status(500).json({
                success: false,
                error: 'Ошибка сервера при проверке доступа'
            });
        }
    };
}

// ============================================================
// ПРОВЕРКА ПРАВ РЕДАКТИРОВАНИЯ ДАННЫХ ОБЩЕЖИТИЯ
// ============================================================

/**
 * Middleware для проверки прав редактирования данных общежития
 * Только воспитатель и заведующая могут редактировать
 */
export function canEditDormData() {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: 'Пользователь не авторизован'
                });
            }

            // Проверяем, является ли пользователь админом
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('role')
                .eq('id', userId)
                .single();

            const isAdmin = user && ['super_admin', 'admin'].includes(user.role);

            // Администраторы имеют полный доступ
            if (isAdmin) {
                next();
                return;
            }

            // Получаем информацию о сотруднике
            const { data: employee, error: empError } = await supabase
                .from('employees')
                .select('dorm_role')
                .eq('id', userId)
                .single();

            if (empError || !employee) {
                return res.status(404).json({
                    success: false,
                    error: 'Сотрудник не найден'
                });
            }

            // Только воспитатель и заведующая могут редактировать
            if (!['educator', 'head'].includes(employee.dorm_role || '')) {
                return res.status(403).json({
                    success: false,
                    error: 'Доступ запрещён. Только для воспитателя или заведующей'
                });
            }

            req.dormRole = employee.dorm_role;
            next();
        } catch (err) {
            console.error('❌ Ошибка проверки прав редактирования:', err.message);
            return res.status(500).json({
                success: false,
                error: 'Ошибка сервера при проверке прав'
            });
        }
    };
}

// ============================================================
// ПРОВЕРКА ПРАВ ПРОСМОТРА СКРЫТЫХ ДАННЫХ
// ============================================================

/**
 * Middleware для проверки прав просмотра скрытой информации
 * Только воспитатель может видеть скрытые данные (учёты, оценки и т.д.)
 */
export function canViewRestrictedData() {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: 'Пользователь не авторизован'
                });
            }

            // Проверяем, является ли пользователь админом
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('role')
                .eq('id', userId)
                .single();

            const isAdmin = user && ['super_admin', 'admin'].includes(user.role);

            // Администраторы имеют полный доступ
            if (isAdmin) {
                next();
                return;
            }

            // Получаем информацию о сотруднике
            const { data: employee, error: empError } = await supabase
                .from('employees')
                .select('dorm_role')
                .eq('id', userId)
                .single();

            if (empError || !employee) {
                return res.status(404).json({
                    success: false,
                    error: 'Сотрудник не найден'
                });
            }

            // Только воспитатель может видеть скрытые данные
            if (employee.dorm_role !== 'educator') {
                return res.status(403).json({
                    success: false,
                    error: 'Доступ запрещён. Только для воспитателя'
                });
            }

            next();
        } catch (err) {
            console.error('❌ Ошибка проверки прав на скрытые данные:', err.message);
            return res.status(500).json({
                success: false,
                error: 'Ошибка сервера при проверке прав'
            });
        }
    };
}

// ============================================================
// ПРОВЕРКА, ЯВЛЯЕТСЯ ЛИ ПОЛЬЗОВАТЕЛЬ РАБОТНИКОМ ОБЩЕЖИТИЯ
// ============================================================

/**
 * Middleware для проверки, является ли пользователь работником общежития
 */
export function isDormEmployee() {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: 'Пользователь не авторизован'
                });
            }

            // Проверяем, является ли пользователь админом
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('role')
                .eq('id', userId)
                .single();

            const isAdmin = user && ['super_admin', 'admin'].includes(user.role);

            // Администраторы имеют полный доступ
            if (isAdmin) {
                next();
                return;
            }

            const { data: employee, error } = await supabase
                .from('employees')
                .select('dorm_role')
                .eq('id', userId)
                .single();

            if (error || !employee) {
                return res.status(404).json({
                    success: false,
                    error: 'Сотрудник не найден'
                });
            }

            if (!employee.dorm_role) {
                return res.status(403).json({
                    success: false,
                    error: 'Доступ запрещён. Только для работников общежития'
                });
            }

            req.dormRole = employee.dorm_role;
            next();
        } catch (err) {
            console.error('❌ Ошибка проверки роли общежития:', err.message);
            return res.status(500).json({
                success: false,
                error: 'Ошибка сервера при проверке роли'
            });
        }
    };
}

// ============================================================
// ЭКСПОРТ
// ============================================================

export default {
    requireAuth,
    requireRole,
    optionalAuth,
    getEmployeeInfo,
    canViewStudent,
    canViewGraduates,
    canViewReports,
    canEditDormData,
    canViewRestrictedData,
    isDormEmployee
};