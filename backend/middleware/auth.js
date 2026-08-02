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
// ПРОВЕРКА РОЛИ
// ============================================================

/**
 * Middleware для проверки роли пользователя
 * @param {string} requiredRole - требуемая роль
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

            // Проверяем иерархию ролей
            if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
                return res.status(403).json({
                    success: false,
                    error: 'Недостаточно прав для выполнения операции'
                });
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
// ЭКСПОРТ
// ============================================================

export default {
    requireAuth,
    requireRole,
    optionalAuth
};