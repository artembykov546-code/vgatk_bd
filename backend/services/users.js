import { supabase } from '../config/supabase.js';
import bcrypt from 'bcryptjs';

// ============================================================
// АВТОГЕНЕРАЦИЯ ЛОГИНА
// ============================================================

/**
 * Генерирует логин из ФИО
 * Пример: "Иванов Иван Иванович" → "ivanov"
 * Если такой логин уже есть, добавляет цифру: "ivanov2"
 */
export async function generateLogin(fullName) {
    // Берём фамилию, переводим в транслит
    const translitMap = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
        'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i',
        'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
        'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
        'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch',
        'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '',
        'э': 'e', 'ю': 'yu', 'я': 'ya'
    };

    const parts = fullName.trim().split(/\s+/);
    let login = '';

    if (parts.length > 0) {
        const surname = parts[0].toLowerCase();
        login = surname.split('').map(char => translitMap[char] || char).join('');
    }

    // Удаляем все не-латинские символы
    login = login.replace(/[^a-z0-9]/g, '');

    if (login.length === 0) {
        login = 'user';
    }

    // Проверяем, есть ли уже такой логин
    const { data: existing } = await supabase
        .from('users')
        .select('login')
        .eq('login', login);

    if (existing && existing.length > 0) {
        // Добавляем цифру
        login = login + (existing.length + 1);
    }

    return login;
}

// ============================================================
// АВТОГЕНЕРАЦИЯ ПАРОЛЯ
// ============================================================

/**
 * Генерирует случайный пароль длиной 8 символов
 * Содержит буквы и цифры
 */
export function generatePassword(length = 8) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

// ============================================================
// ХЕШИРОВАНИЕ ПАРОЛЯ
// ============================================================

/**
 * Хеширует пароль с помощью bcrypt
 */
export async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

/**
 * Проверяет пароль
 */
export async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}

// ============================================================
// ПОЛУЧИТЬ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ
// ============================================================

export async function getAllUsers() {
    const { data, error } = await supabase
        .from('users')
        .select('id, login, full_name, role, email, phone, is_active, force_password_change, created_at, last_login')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('❌ Ошибка получения пользователей:', error.message);
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

// ============================================================
// ПОЛУЧИТЬ ПОЛЬЗОВАТЕЛЯ ПО ID
// ============================================================

export async function getUserById(id) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error(' Ошибка получения пользователя:', error.message);
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

// ============================================================
// ПОЛУЧИТЬ ПОЛЬЗОВАТЕЛЯ ПО ЛОГИНУ (для входа)
// ============================================================

export async function getUserByLogin(login) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('login', login)
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

// ============================================================
// СОЗДАТЬ ПОЛЬЗОВАТЕЛЯ (с автогенерацией логина/пароля)
// ============================================================

export async function createUser({ full_name, role, email, phone, autoGenerate = true }) {
    let login, password, passwordHash;

    if (autoGenerate) {
        // Автогенерация логина и пароля
        login = await generateLogin(full_name);
        password = generatePassword(8);
        passwordHash = await hashPassword(password);
    } else {
        // Пользователь сам указал логин и пароль
        login = arguments[0].login;
        password = arguments[0].password;
        passwordHash = await hashPassword(password);
    }

    const { data, error } = await supabase
        .from('users')
        .insert([{
            login,
            password_hash: passwordHash,
            full_name,
            role: role || 'viewer',
            email: email || null,
            phone: phone || null,
            is_active: true,
            force_password_change: true // Требовать смену пароля при первом входе
        }])
        .select()
        .single();

    if (error) {
        console.error('❌ Ошибка создания пользователя:', error.message);
        return { success: false, error: error.message };
    }

    // Возвращаем данные БЕЗ хеша пароля, но с обычным паролем (показать один раз!)
    return {
        success: true,
        data: {
            id: data.id,
            login: data.login,
            password: password, // ⚠️ Показываем только один раз при создании!
            full_name: data.full_name,
            role: data.role
        }
    };
}

// ============================================================
// ОБНОВИТЬ ПОЛЬЗОВАТЕЛЯ
// ============================================================

export async function updateUser(id, updates) {
    // Удаляем password_hash из updates если он там есть
    const { password_hash, ...safeUpdates } = updates;

    const { data, error } = await supabase
        .from('users')
        .update(safeUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('❌ Ошибка обновления пользователя:', error.message);
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

// ============================================================
// СМЕНИТЬ ПАРОЛЬ ПОЛЬЗОВАТЕЛЯ
// ============================================================

export async function changePassword(userId, newPassword) {
    const passwordHash = await hashPassword(newPassword);

    const { error } = await supabase
        .from('users')
        .update({
            password_hash: passwordHash,
            force_password_change: false // После смены пароля не требовать повторной смены
        })
        .eq('id', userId);

    if (error) {
        console.error('❌ Ошибка смены пароля:', error.message);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// ============================================================
// ПРОВЕРКА ВХОДА (АУТЕНТИФИКАЦИЯ)
// ============================================================

export async function authenticateUser(login, password) {
    // 1. Находим пользователя по логину
    const { success, data: user, error } = await getUserByLogin(login);

    if (!success || !user) {
        return { success: false, error: 'Пользователь не найден' };
    }

    // 2. Проверяем активность
    if (!user.is_active) {
        return { success: false, error: 'Пользователь заблокирован' };
    }

    // 3. Проверяем пароль
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
        return { success: false, error: 'Неверный пароль' };
    }

    // 4. Обновляем время последнего входа
    await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

    // 5. Возвращаем данные пользователя (без пароля)
    return {
        success: true,
        data: {
            id: user.id,
            login: user.login,
            full_name: user.full_name,
            role: user.role,
            email: user.email,
            force_password_change: user.force_password_change
        }
    };
}

// ============================================================
// УДАЛИТЬ ПОЛЬЗОВАТЕЛЯ (мягкое удаление - деактивация)
// ============================================================

export async function deleteUser(id) {
    const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', id);

    if (error) {
        console.error('❌ Ошибка удаления пользователя:', error.message);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// ============================================================
// ЭКСПОРТ ВСЕХ ФУНКЦИЙ
// ============================================================

export default {
    generateLogin,
    generatePassword,
    hashPassword,
    comparePassword,
    getAllUsers,
    getUserById,
    getUserByLogin,
    createUser,
    updateUser,
    changePassword,
    authenticateUser,
    deleteUser
};