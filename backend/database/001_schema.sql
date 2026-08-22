-- ============================================================
-- ДОБАВЛЕНИЕ НОВЫХ КОЛОНОК В СУЩЕСТВУЮЩИЕ ТАБЛИЦЫ
-- ============================================================

-- ============================================================
-- 1. ТАБЛИЦА employees (сотрудники)
-- ============================================================

-- Добавляем колонки для общежития
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS position VARCHAR(100),
ADD COLUMN IF NOT EXISTS dorm_role VARCHAR(50) CHECK (dorm_role IN ('educator', 'head', 'guard', NULL)),
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN employees.position IS 'Должность сотрудника (воспитатель, заведующая общежитием, вахтер и т.д.)';
COMMENT ON COLUMN employees.dorm_role IS 'Роль в общежитии: educator - воспитатель, head - заведующая, guard - вахтер';
COMMENT ON COLUMN employees.permissions IS 'Дополнительные права доступа в формате JSON';


-- ============================================================
-- 2. ТАБЛИЦА students (студенты)
-- ============================================================

-- Добавляем колонки для проживания в общежитии
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS lives_in_dorm BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS dorm_block INTEGER,
ADD COLUMN IF NOT EXISTS dorm_room_type VARCHAR(10) CHECK (dorm_room_type IN ('M', 'B', NULL)),
ADD COLUMN IF NOT EXISTS dorm_room_number INTEGER;

COMMENT ON COLUMN students.lives_in_dorm IS 'Проживает ли в общежитии';
COMMENT ON COLUMN students.dorm_block IS 'Номер блока в общежитии';
COMMENT ON COLUMN students.dorm_room_type IS 'Тип комнаты: M - маленькая, B - большая';
COMMENT ON COLUMN students.dorm_room_number IS 'Номер комнаты (число)';


-- ============================================================
-- 3. ТАБЛИЦА dorm_blocks (структура блоков/этажей)
-- ============================================================

CREATE TABLE IF NOT EXISTS dorm_blocks (
    id SERIAL PRIMARY KEY,
    block_number INTEGER UNIQUE NOT NULL,
    floor INTEGER NOT NULL CHECK (floor IN (2, 3)),
    room_type VARCHAR(10) CHECK (room_type IN ('M', 'B', 'both')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE dorm_blocks IS 'Структура блоков общежития по этажам';
COMMENT ON COLUMN dorm_blocks.block_number IS 'Номер блока';
COMMENT ON COLUMN dorm_blocks.floor IS 'Этаж (2 или 3)';
COMMENT ON COLUMN dorm_blocks.room_type IS 'Тип комнат в блоке: M - маленькие, B - большие, both - оба типа';

-- Заполняем структуру блоков
INSERT INTO dorm_blocks (block_number, floor, room_type) VALUES
-- 2-й этаж
(1, 2, 'M'), (2, 2, 'M'), (3, 2, 'M'), (4, 2, 'M'), (5, 2, 'M'), (6, 2, 'M'), (7, 2, 'M'), (8, 2, 'M'),
(16, 2, 'B'), (17, 2, 'B'), (18, 2, 'B'), (19, 2, 'B'), (20, 2, 'B'), (21, 2, 'B'), (22, 2, 'B'), (23, 2, 'B'),
(24, 2, 'B'), (25, 2, 'B'), (26, 2, 'B'), (27, 2, 'B'), (28, 2, 'B'), (29, 2, 'B'), (30, 2, 'B'),
-- 3-й этаж
(32, 3, 'M'), (33, 3, 'M'), (34, 3, 'M'), (35, 3, 'M'), (36, 3, 'M'), (37, 3, 'M'), (38, 3, 'M'), (39, 3, 'M'),
(40, 3, 'M'), (41, 3, 'M'), (42, 3, 'M'), (44, 3, 'B'), (45, 3, 'B'), (49, 3, 'B')
ON CONFLICT (block_number) DO NOTHING;


-- ============================================================
-- 4. ТАБЛИЦА dorm_sectors (сектора для совета общежития)
-- ============================================================

CREATE TABLE IF NOT EXISTS dorm_sectors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    floor INTEGER CHECK (floor IN (2, 3, NULL)),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE dorm_sectors IS 'Сектора для совета общежития и актива этажей';
COMMENT ON COLUMN dorm_sectors.name IS 'Название сектора (Председатель, Учебный сектор и т.д.)';
COMMENT ON COLUMN dorm_sectors.is_default IS 'Стандартный сектор (загружен по умолчанию)';
COMMENT ON COLUMN dorm_sectors.floor IS 'Этаж (для актива этажа)';

-- Заполняем стандартные сектора
INSERT INTO dorm_sectors (name, description, is_default) VALUES
('Председатель', 'Председатель совета общежития', TRUE),
('Заместитель председателя', 'Заместитель председателя совета общежития', TRUE),
('Учебный сектор', 'Ответственный за учебную работу', TRUE),
('Сектор дисциплины и порядка', 'Ответственный за дисциплину и порядок', TRUE),
('Санитарно-бытовой сектор', 'Ответственный за санитарное состояние и быт', TRUE),
('Спортивный сектор', 'Ответственный за спортивную работу', TRUE),
('Культурно-массовый сектор', 'Ответственный за культурно-массовые мероприятия', TRUE),
('Информационный сектор', 'Ответственный за информационную работу', TRUE),
('Секретарь', 'Секретарь совета общежития', TRUE),
('Организационный сектор', 'Ответственный за организационную работу', TRUE),
('Редакционный сектор', 'Ответственный за редакционную работу', TRUE),
('Староста этажа', 'Староста этажа', TRUE),
('Заместитель старосты', 'Заместитель старосты этажа', TRUE),
('Актив этажа', 'Актив этажа', TRUE)
ON CONFLICT (name) DO NOTHING;


-- ============================================================
-- 5. ТАБЛИЦА dorm_council (совет общежития)
-- ============================================================

CREATE TABLE IF NOT EXISTS dorm_council (
    id SERIAL PRIMARY KEY,
    sector_id INTEGER REFERENCES dorm_sectors(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    floor INTEGER CHECK (floor IN (2, 3, NULL)),
    is_active BOOLEAN DEFAULT TRUE,
    appointed_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    appointed_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sector_id, student_id, floor)
);

COMMENT ON TABLE dorm_council IS 'Совет общежития и актив этажей';
COMMENT ON COLUMN dorm_council.sector_id IS 'Сектор (из dorm_sectors)';
COMMENT ON COLUMN dorm_council.student_id IS 'Студент, занимающий должность';
COMMENT ON COLUMN dorm_council.floor IS 'Этаж (для актива этажа)';
COMMENT ON COLUMN dorm_council.appointed_by IS 'Кто назначил (сотрудник)';
COMMENT ON COLUMN dorm_council.appointed_date IS 'Дата назначения';
COMMENT ON COLUMN dorm_council.is_active IS 'Активен ли в данный момент';


-- ============================================================
-- 6. ТАБЛИЦА dorm_activists (актив этажей — упрощённая версия)
-- ============================================================

-- Можно использовать dorm_council с фильтром по floor, но для удобства сделаем отдельную таблицу

CREATE TABLE IF NOT EXISTS dorm_activists (
    id SERIAL PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    floor INTEGER NOT NULL CHECK (floor IN (2, 3)),
    role VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    appointed_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    appointed_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, floor)
);

COMMENT ON TABLE dorm_activists IS 'Актив этажей общежития';
COMMENT ON COLUMN dorm_activists.floor IS 'Этаж (2 или 3)';
COMMENT ON COLUMN dorm_activists.role IS 'Роль (староста, заместитель)';


-- ============================================================
-- 7. ТАБЛИЦА users (добавляем сотрудника artem)
-- ============================================================

-- Проверяем, есть ли пользователь artem
DO $$
DECLARE
    user_id UUID;
BEGIN
    -- Если пользователь artem уже существует, обновляем его
    SELECT id INTO user_id FROM users WHERE login = 'artem';
    
    IF user_id IS NULL THEN
        -- Создаём пользователя artem
        INSERT INTO users (login, password_hash, full_name, role, email, force_password_change)
        VALUES (
            'artem',
            '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',  -- пароль: admin123 (временно)
            'Артем Администратор',
            'super_admin',
            'artem@vgatk.by',
            FALSE
        );
        SELECT id INTO user_id FROM users WHERE login = 'artem';
    ELSE
        -- Обновляем роль до super_admin
        UPDATE users 
        SET role = 'super_admin', 
            full_name = 'Артем Администратор',
            updated_at = NOW()
        WHERE login = 'artem';
    END IF;

    -- Добавляем в employees, если нет
    IF NOT EXISTS (SELECT 1 FROM employees WHERE id = user_id) THEN
        INSERT INTO employees (id, full_name, position, dorm_role, permissions)
        VALUES (
            user_id,
            'Артем Администратор',
            'Главный администратор',
            NULL,
            '{"full_access": true}'::jsonb
        );
    END IF;
END $$;


-- ============================================================
-- 8. ТРИГГЕРЫ ДЛЯ АВТООБНОВЛЕНИЯ updated_at
-- ============================================================

DROP TRIGGER IF EXISTS update_dorm_blocks_updated_at ON dorm_blocks;
CREATE TRIGGER update_dorm_blocks_updated_at
    BEFORE UPDATE ON dorm_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dorm_sectors_updated_at ON dorm_sectors;
CREATE TRIGGER update_dorm_sectors_updated_at
    BEFORE UPDATE ON dorm_sectors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dorm_council_updated_at ON dorm_council;
CREATE TRIGGER update_dorm_council_updated_at
    BEFORE UPDATE ON dorm_council
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dorm_activists_updated_at ON dorm_activists;
CREATE TRIGGER update_dorm_activists_updated_at
    BEFORE UPDATE ON dorm_activists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- 9. КОММЕНТАРИИ К НОВЫМ ТАБЛИЦАМ
-- ============================================================

COMMENT ON TABLE dorm_blocks IS 'Структура блоков общежития по этажам';
COMMENT ON TABLE dorm_sectors IS 'Сектора для совета общежития и актива этажей';
COMMENT ON TABLE dorm_council IS 'Совет общежития и актив этажей';
COMMENT ON TABLE dorm_activists IS 'Актив этажей общежития';


-- ============================================================
-- 10. ИНДЕКСЫ ДЛЯ НОВЫХ ТАБЛИЦ
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_students_lives_in_dorm ON students(lives_in_dorm);
CREATE INDEX IF NOT EXISTS idx_students_dorm_block ON students(dorm_block);
CREATE INDEX IF NOT EXISTS idx_employees_dorm_role ON employees(dorm_role);
CREATE INDEX IF NOT EXISTS idx_dorm_council_sector ON dorm_council(sector_id);
CREATE INDEX IF NOT EXISTS idx_dorm_council_student ON dorm_council(student_id);
CREATE INDEX IF NOT EXISTS idx_dorm_council_floor ON dorm_council(floor);
CREATE INDEX IF NOT EXISTS idx_dorm_activists_student ON dorm_activists(student_id);
CREATE INDEX IF NOT EXISTS idx_dorm_activists_floor ON dorm_activists(floor);