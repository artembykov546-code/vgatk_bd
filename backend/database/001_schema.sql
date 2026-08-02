-- ============================================================
-- ТАБЛИЦА ПОЛЬЗОВАТЕЛЕЙ
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    login VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer',
    email VARCHAR(255),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    force_password_change BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- ИНДЕКСЫ
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_login ON users(login);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- ============================================================
-- ФУНКЦИЯ АВТОМАТИЧЕСКОГО ОБНОВЛЕНИЯ updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================
-- ТРИГГЕР ДЛЯ АВТОМАТИЧЕСКОГО ОБНОВЛЕНИЯ
-- ============================================================

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ТЕСТОВЫЕ ДАННЫЕ (пароль: admin123)
-- ============================================================

INSERT INTO users (login, password_hash, full_name, role, email, force_password_change)
VALUES (
    'admin',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Супер Администратор',
    'super_admin',
    'admin@vgatk.by',
    FALSE
) ON CONFLICT (login) DO NOTHING;

-- ============================================================
-- КОММЕНТАРИИ К ТАБЛИЦЕ
-- ============================================================

COMMENT ON TABLE users IS 'Таблица пользователей системы';
COMMENT ON COLUMN users.id IS 'Уникальный идентификатор (UUID)';
COMMENT ON COLUMN users.login IS 'Логин пользователя (уникальный)';
COMMENT ON COLUMN users.password_hash IS 'Хеш пароля (bcrypt)';
COMMENT ON COLUMN users.full_name IS 'Полное ФИО пользователя';
COMMENT ON COLUMN users.role IS 'Роль: super_admin, admin, teacher, viewer';
COMMENT ON COLUMN users.is_active IS 'Активен ли пользователь';
COMMENT ON COLUMN users.force_password_change IS 'Требовать смену пароля при следующем входе';