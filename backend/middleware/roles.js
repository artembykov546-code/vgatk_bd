import { supabase } from '../config/supabase.js';

// ============================================================
// ОБЩИЕ ПРОВЕРКИ ДЛЯ ВСЕХ СОТРУДНИКОВ
// ============================================================

/**
 * Проверяет, является ли пользователь сотрудником колледжа
 * (имеет запись в таблице employees)
 */
export function isEmployee() {
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
                req.employee = null;
                req.dormRole = null;
                req.isAdmin = true;
                next();
                return;
            }

            const { data: employee, error } = await supabase
                .from('employees')
                .select('id, dorm_role, position, permissions')
                .eq('id', userId)
                .single();

            if (error || !employee) {
                return res.status(403).json({
                    success: false,
                    error: 'Доступ запрещён. Только для сотрудников колледжа'
                });
            }

            req.employee = employee;
            req.dormRole = employee.dorm_role || null;
            req.isAdmin = false;
            next();
        } catch (err) {
            console.error('❌ Ошибка проверки сотрудника:', err.message);
            return res.status(500).json({
                success: false,
                error: 'Ошибка сервера при проверке прав'
            });
        }
    };
}

// ============================================================
// ПРОВЕРКИ РОЛЕЙ ОБЩЕЖИТИЯ
// ============================================================

/**
 * Проверяет, является ли сотрудник работником общежития
 * (имеет dorm_role: head, educator, guard)
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
                req.dormRole = null;
                req.isAdmin = true;
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
            req.isAdmin = false;
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

/**
 * Проверяет, является ли сотрудник воспитателем
 */
export function isEducator() {
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
                req.dormRole = 'educator';
                req.isAdmin = true;
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

            if (employee.dorm_role !== 'educator') {
                return res.status(403).json({
                    success: false,
                    error: 'Доступ запрещён. Только для воспитателя'
                });
            }

            req.dormRole = employee.dorm_role;
            req.isAdmin = false;
            next();
        } catch (err) {
            console.error('❌ Ошибка проверки роли воспитателя:', err.message);
            return res.status(500).json({
                success: false,
                error: 'Ошибка сервера при проверке роли'
            });
        }
    };
}

/**
 * Проверяет, является ли сотрудник заведующей
 */
export function isHead() {
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
                req.dormRole = 'head';
                req.isAdmin = true;
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

            if (employee.dorm_role !== 'head') {
                return res.status(403).json({
                    success: false,
                    error: 'Доступ запрещён. Только для заведующей'
                });
            }

            req.dormRole = employee.dorm_role;
            req.isAdmin = false;
            next();
        } catch (err) {
            console.error('❌ Ошибка проверки роли заведующей:', err.message);
            return res.status(500).json({
                success: false,
                error: 'Ошибка сервера при проверке роли'
            });
        }
    };
}

/**
 * Проверяет, является ли сотрудник вахтером
 */
export function isGuard() {
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
                req.dormRole = 'guard';
                req.isAdmin = true;
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

            if (employee.dorm_role !== 'guard') {
                return res.status(403).json({
                    success: false,
                    error: 'Доступ запрещён. Только для вахтера'
                });
            }

            req.dormRole = employee.dorm_role;
            req.isAdmin = false;
            next();
        } catch (err) {
            console.error('❌ Ошибка проверки роли вахтера:', err.message);
            return res.status(500).json({
                success: false,
                error: 'Ошибка сервера при проверке роли'
            });
        }
    };
}

// ============================================================
// ПРОВЕРКИ ПРАВ РЕДАКТИРОВАНИЯ
// ============================================================

/**
 * Проверяет, имеет ли сотрудник доступ к редактированию данных общежития
 * (воспитатель или заведующая)
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
                req.dormRole = 'admin';
                req.isAdmin = true;
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

            if (!['educator', 'head'].includes(employee.dorm_role || '')) {
                return res.status(403).json({
                    success: false,
                    error: 'Доступ запрещён. Только для воспитателя или заведующей'
                });
            }

            req.dormRole = employee.dorm_role;
            req.isAdmin = false;
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

/**
 * Проверяет, имеет ли сотрудник доступ к просмотру скрытой информации
 * (воспитатель может видеть всё, заведующая и вахтер - ограниченно)
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
                req.canViewRestricted = true;
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

            // Только воспитатель может видеть скрытую информацию
            if (employee.dorm_role !== 'educator') {
                return res.status(403).json({
                    success: false,
                    error: 'Доступ запрещён. Только для воспитателя'
                });
            }

            req.dormRole = employee.dorm_role;
            req.canViewRestricted = true;
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

/**
 * Проверяет, имеет ли сотрудник доступ к просмотру выпускников
 * (заведующая и вахтер не могут)
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

            // Заведующая и вахтер не могут видеть выпускников
            if (employee.dorm_role === 'head' || employee.dorm_role === 'guard') {
                return res.status(403).json({
                    success: false,
                    error: 'Доступ запрещён. Заведующая и вахтер не могут просматривать выпускников'
                });
            }

            next();
        } catch (err) {
            console.error('❌ Ошибка проверки прав на выпускников:', err.message);
            return res.status(500).json({
                success: false,
                error: 'Ошибка сервера при проверке прав'
            });
        }
    };
}

/**
 * Проверяет, может ли сотрудник редактировать совет общежития
 * (только воспитатель и администратор)
 */
export function canEditDormCouncil() {
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

            // Только воспитатель может редактировать совет общежития
            if (employee.dorm_role !== 'educator') {
                return res.status(403).json({
                    success: false,
                    error: 'Доступ запрещён. Только для воспитателя'
                });
            }

            next();
        } catch (err) {
            console.error('❌ Ошибка проверки прав на совет общежития:', err.message);
            return res.status(500).json({
                success: false,
                error: 'Ошибка сервера при проверке прав'
            });
        }
    };
}

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ КЛИЕНТСКОЙ ЧАСТИ
// ============================================================

/**
 * Получить роли пользователя (для клиентской части)
 */
export async function getUserRoles(userId) {
    try {
        const result = {
            isAdmin: false,
            isEmployee: false,
            isDormEmployee: false,
            dormRole: null,
            canEditDorm: false,
            canViewRestricted: false,
            canViewGraduates: true
        };

        // Проверяем пользователя
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            return result;
        }

        result.isAdmin = ['super_admin', 'admin'].includes(user.role);

        // Проверяем сотрудника
        const { data: employee, error: empError } = await supabase
            .from('employees')
            .select('dorm_role')
            .eq('id', userId)
            .single();

        if (empError || !employee) {
            // Если не сотрудник, но админ - всё равно даём доступ
            if (result.isAdmin) {
                result.isEmployee = true;
                result.canEditDorm = true;
                result.canViewRestricted = true;
            }
            return result;
        }

        result.isEmployee = true;
        result.isDormEmployee = !!employee.dorm_role;
        result.dormRole = employee.dorm_role;

        // Права
        result.canEditDorm = result.isAdmin || ['educator', 'head'].includes(employee.dorm_role || '');
        result.canViewRestricted = result.isAdmin || employee.dorm_role === 'educator';
        result.canViewGraduates = !(employee.dorm_role === 'head' || employee.dorm_role === 'guard');

        return result;
    } catch (error) {
        console.error('❌ Ошибка получения ролей пользователя:', error.message);
        return {
            isAdmin: false,
            isEmployee: false,
            isDormEmployee: false,
            dormRole: null,
            canEditDorm: false,
            canViewRestricted: false,
            canViewGraduates: true
        };
    }
}

// ============================================================
// ЭКСПОРТ
// ============================================================

export default {
    isEmployee,
    isDormEmployee,
    isEducator,
    isHead,
    isGuard,
    canEditDormData,
    canViewRestrictedData,
    canViewGraduates,
    canEditDormCouncil,
    getUserRoles
};