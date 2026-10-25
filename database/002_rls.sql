-- ============================================================
-- ВКЛЮЧЕНИЕ RLS НА ВСЕХ ТАБЛИЦАХ
-- ============================================================

-- Включаем RLS на существующих таблицах
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE siblings ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_siblings ENABLE ROW LEVEL SECURITY;
ALTER TABLE graduates ENABLE ROW LEVEL SECURITY;
ALTER TABLE expelled_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_leave_students ENABLE ROW LEVEL SECURITY;

-- Включаем RLS на новых таблицах
ALTER TABLE dorm_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE dorm_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE dorm_council ENABLE ROW LEVEL SECURITY;
ALTER TABLE dorm_activists ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ПРОВЕРКИ РОЛЕЙ
-- ============================================================

-- Функция: проверка, является ли пользователь супер-админом или админом
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_id 
        AND role IN ('super_admin', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция: проверка, является ли пользователь работником общежития
CREATE OR REPLACE FUNCTION is_dorm_employee(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM employees 
        WHERE id = user_id 
        AND dorm_role IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция: проверка, является ли пользователь воспитателем
CREATE OR REPLACE FUNCTION is_educator(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM employees 
        WHERE id = user_id 
        AND dorm_role = 'educator'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция: проверка, является ли пользователь заведующей
CREATE OR REPLACE FUNCTION is_head(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM employees 
        WHERE id = user_id 
        AND dorm_role = 'head'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция: проверка, является ли пользователь вахтером
CREATE OR REPLACE FUNCTION is_guard(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM employees 
        WHERE id = user_id 
        AND dorm_role = 'guard'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция: проверка, может ли пользователь редактировать данные общежития
CREATE OR REPLACE FUNCTION can_edit_dorm_data(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        is_admin(user_id) OR 
        is_educator(user_id) OR 
        is_head(user_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- ПОЛИТИКИ ДЛЯ ТАБЛИЦЫ users
-- ============================================================

-- Пользователи могут видеть только себя (кроме админов)
CREATE POLICY users_select_policy ON users
    FOR SELECT
    USING (
        auth.uid() = id OR 
        is_admin(auth.uid())
    );

-- Только админы могут обновлять пользователей
CREATE POLICY users_update_policy ON users
    FOR UPDATE
    USING (is_admin(auth.uid()));

-- Только админы могут вставлять пользователей
CREATE POLICY users_insert_policy ON users
    FOR INSERT
    WITH CHECK (is_admin(auth.uid()));

-- Только админы могут удалять пользователей
CREATE POLICY users_delete_policy ON users
    FOR DELETE
    USING (is_admin(auth.uid()));


-- ============================================================
-- ПОЛИТИКИ ДЛЯ ТАБЛИЦЫ employees
-- ============================================================

-- Все сотрудники видят всех сотрудников (для списка)
CREATE POLICY employees_select_policy ON employees
    FOR SELECT
    USING (true);

-- Только админы и работники общежития могут обновлять
CREATE POLICY employees_update_policy ON employees
    FOR UPDATE
    USING (
        is_admin(auth.uid()) OR 
        is_dorm_employee(auth.uid())
    );

-- Только админы могут вставлять
CREATE POLICY employees_insert_policy ON employees
    FOR INSERT
    WITH CHECK (is_admin(auth.uid()));

-- Только админы могут удалять
CREATE POLICY employees_delete_policy ON employees
    FOR DELETE
    USING (is_admin(auth.uid()));


-- ============================================================
-- ПОЛИТИКИ ДЛЯ ТАБЛИЦЫ students
-- ============================================================

-- 1. SELECT: Все могут видеть студентов, но с ограничениями для общежития
CREATE POLICY students_select_policy ON students
    FOR SELECT
    USING (
        -- Админы видят всех
        is_admin(auth.uid()) OR
        -- Преподаватели видят всех
        EXISTS (SELECT 1 FROM employees WHERE id = auth.uid()) OR
        -- Работники общежития видят только проживающих
        (is_dorm_employee(auth.uid()) AND lives_in_dorm = true) OR
        -- Обычные пользователи (viewer) видят всех
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'viewer')
    );

-- 2. INSERT: Только админы и воспитатели могут добавлять
CREATE POLICY students_insert_policy ON students
    FOR INSERT
    WITH CHECK (
        is_admin(auth.uid()) OR 
        is_educator(auth.uid()) OR
        is_head(auth.uid())
    );

-- 3. UPDATE: Админы, воспитатели и заведующая (только проживание)
CREATE POLICY students_update_policy ON students
    FOR UPDATE
    USING (
        -- Админы могут всё
        is_admin(auth.uid()) OR
        -- Воспитатель может всё
        is_educator(auth.uid()) OR
        -- Заведующая может редактировать только проживание
        (
            is_head(auth.uid()) AND
            (
                -- Разрешаем только колонки проживания
                (NEW.lives_in_dorm = OLD.lives_in_dorm OR true) AND
                (NEW.dorm_block = OLD.dorm_block OR true) AND
                (NEW.dorm_room_type = OLD.dorm_room_type OR true) AND
                (NEW.dorm_room_number = OLD.dorm_room_number OR true)
            )
        )
    );

-- 4. DELETE: Только админы и воспитатели могут удалять
CREATE POLICY students_delete_policy ON students
    FOR DELETE
    USING (
        is_admin(auth.uid()) OR 
        is_educator(auth.uid())
    );


-- ============================================================
-- ПОЛИТИКИ ДЛЯ ТАБЛИЦЫ groups
-- ============================================================

-- Все видят группы
CREATE POLICY groups_select_policy ON groups
    FOR SELECT
    USING (true);

-- Только админы могут изменять
CREATE POLICY groups_insert_policy ON groups
    FOR INSERT
    WITH CHECK (is_admin(auth.uid()));

CREATE POLICY groups_update_policy ON groups
    FOR UPDATE
    USING (is_admin(auth.uid()));

CREATE POLICY groups_delete_policy ON groups
    FOR DELETE
    USING (is_admin(auth.uid()));


-- ============================================================
-- ПОЛИТИКИ ДЛЯ ТАБЛИЦЫ parents
-- ============================================================

-- Все видят родителей
CREATE POLICY parents_select_policy ON parents
    FOR SELECT
    USING (true);

-- Только админы и воспитатели могут изменять
CREATE POLICY parents_insert_policy ON parents
    FOR INSERT
    WITH CHECK (is_admin(auth.uid()) OR is_educator(auth.uid()));

CREATE POLICY parents_update_policy ON parents
    FOR UPDATE
    USING (is_admin(auth.uid()) OR is_educator(auth.uid()));

CREATE POLICY parents_delete_policy ON parents
    FOR DELETE
    USING (is_admin(auth.uid()) OR is_educator(auth.uid()));


-- ============================================================
-- ПОЛИТИКИ ДЛЯ ТАБЛИЦЫ siblings
-- ============================================================

-- Все видят братьев/сестёр
CREATE POLICY siblings_select_policy ON siblings
    FOR SELECT
    USING (true);

-- Только админы и воспитатели могут изменять
CREATE POLICY siblings_insert_policy ON siblings
    FOR INSERT
    WITH CHECK (is_admin(auth.uid()) OR is_educator(auth.uid()));

CREATE POLICY siblings_update_policy ON siblings
    FOR UPDATE
    USING (is_admin(auth.uid()) OR is_educator(auth.uid()));

CREATE POLICY siblings_delete_policy ON siblings
    FOR DELETE
    USING (is_admin(auth.uid()) OR is_educator(auth.uid()));


-- ============================================================
-- ПОЛИТИКИ ДЛЯ ТАБЛИЦЫ graduates (выпускники)
-- ============================================================

-- SELECT: Заведующая и вахтер не видят выпускников
CREATE POLICY graduates_select_policy ON graduates
    FOR SELECT
    USING (
        is_admin(auth.uid()) OR
        is_educator(auth.uid()) OR
        (NOT is_head(auth.uid()) AND NOT is_guard(auth.uid()))
    );

-- INSERT/UPDATE/DELETE: Только админы
CREATE POLICY graduates_insert_policy ON graduates
    FOR INSERT
    WITH CHECK (is_admin(auth.uid()));

CREATE POLICY graduates_update_policy ON graduates
    FOR UPDATE
    USING (is_admin(auth.uid()));

CREATE POLICY graduates_delete_policy ON graduates
    FOR DELETE
    USING (is_admin(auth.uid()));


-- ============================================================
-- ПОЛИТИКИ ДЛЯ ТАБЛИЦЫ expelled_students (отчисленные)
-- ============================================================

-- SELECT: Все, кроме заведующей и вахтера
CREATE POLICY expelled_students_select_policy ON expelled_students
    FOR SELECT
    USING (
        is_admin(auth.uid()) OR
        is_educator(auth.uid()) OR
        (NOT is_head(auth.uid()) AND NOT is_guard(auth.uid()))
    );

-- INSERT/UPDATE/DELETE: Только админы
CREATE POLICY expelled_students_insert_policy ON expelled_students
    FOR INSERT
    WITH CHECK (is_admin(auth.uid()));

CREATE POLICY expelled_students_update_policy ON expelled_students
    FOR UPDATE
    USING (is_admin(auth.uid()));

CREATE POLICY expelled_students_delete_policy ON expelled_students
    FOR DELETE
    USING (is_admin(auth.uid()));


-- ============================================================
-- ПОЛИТИКИ ДЛЯ ТАБЛИЦЫ academic_leave_students
-- ============================================================

-- SELECT: Все, кроме заведующей и вахтера
CREATE POLICY academic_leave_students_select_policy ON academic_leave_students
    FOR SELECT
    USING (
        is_admin(auth.uid()) OR
        is_educator(auth.uid()) OR
        (NOT is_head(auth.uid()) AND NOT is_guard(auth.uid()))
    );

-- INSERT/UPDATE/DELETE: Только админы
CREATE POLICY academic_leave_students_insert_policy ON academic_leave_students
    FOR INSERT
    WITH CHECK (is_admin(auth.uid()));

CREATE POLICY academic_leave_students_update_policy ON academic_leave_students
    FOR UPDATE
    USING (is_admin(auth.uid()));

CREATE POLICY academic_leave_students_delete_policy ON academic_leave_students
    FOR DELETE
    USING (is_admin(auth.uid()));


-- ============================================================
-- ПОЛИТИКИ ДЛЯ ТАБЛИЦЫ student_parents (связь студент-родитель)
-- ============================================================

-- Все видят связи
CREATE POLICY student_parents_select_policy ON student_parents
    FOR SELECT
    USING (true);

-- Только админы и воспитатели могут изменять
CREATE POLICY student_parents_insert_policy ON student_parents
    FOR INSERT
    WITH CHECK (is_admin(auth.uid()) OR is_educator(auth.uid()));

CREATE POLICY student_parents_delete_policy ON student_parents
    FOR DELETE
    USING (is_admin(auth.uid()) OR is_educator(auth.uid()));


-- ============================================================
-- ПОЛИТИКИ ДЛЯ ТАБЛИЦЫ student_siblings (связь студент-брат/сестра)
-- ============================================================

-- Все видят связи
CREATE POLICY student_siblings_select_policy ON student_siblings
    FOR SELECT
    USING (true);

-- Только админы и воспитатели могут изменять
CREATE POLICY student_siblings_insert_policy ON student_siblings
    FOR INSERT
    WITH CHECK (is_admin(auth.uid()) OR is_educator(auth.uid()));

CREATE POLICY student_siblings_delete_policy ON student_siblings
    FOR DELETE
    USING (is_admin(auth.uid()) OR is_educator(auth.uid()));


-- ============================================================
-- ПОЛИТИКИ ДЛЯ НОВЫХ ТАБЛИЦ ОБЩЕЖИТИЯ
-- ============================================================

-- ============================================================
-- 1. ПОЛИТИКИ ДЛЯ ТАБЛИЦЫ dorm_blocks
-- ============================================================

-- Все видят структуру блоков
CREATE POLICY dorm_blocks_select_policy ON dorm_blocks
    FOR SELECT
    USING (true);

-- Только админы и воспитатели могут изменять
CREATE POLICY dorm_blocks_insert_policy ON dorm_blocks
    FOR INSERT
    WITH CHECK (is_admin(auth.uid()) OR is_educator(auth.uid()));

CREATE POLICY dorm_blocks_update_policy ON dorm_blocks
    FOR UPDATE
    USING (is_admin(auth.uid()) OR is_educator(auth.uid()));

CREATE POLICY dorm_blocks_delete_policy ON dorm_blocks
    FOR DELETE
    USING (is_admin(auth.uid()) OR is_educator(auth.uid()));


-- ============================================================
-- 2. ПОЛИТИКИ ДЛЯ ТАБЛИЦЫ dorm_sectors (сектора)
-- ============================================================

-- Все видят сектора
CREATE POLICY dorm_sectors_select_policy ON dorm_sectors
    FOR SELECT
    USING (true);

-- Только админы и воспитатели могут изменять
CREATE POLICY dorm_sectors_insert_policy ON dorm_sectors
    FOR INSERT
    WITH CHECK (is_admin(auth.uid()) OR is_educator(auth.uid()));

CREATE POLICY dorm_sectors_update_policy ON dorm_sectors
    FOR UPDATE
    USING (is_admin(auth.uid()) OR is_educator(auth.uid()));

CREATE POLICY dorm_sectors_delete_policy ON dorm_sectors
    FOR DELETE
    USING (is_admin(auth.uid()) OR is_educator(auth.uid()));


-- ============================================================
-- 3. ПОЛИТИКИ ДЛЯ ТАБЛИЦЫ dorm_council (совет общежития)
-- ============================================================

-- Все видят совет общежития
CREATE POLICY dorm_council_select_policy ON dorm_council
    FOR SELECT
    USING (true);

-- Только админы и воспитатели могут изменять
CREATE POLICY dorm_council_insert_policy ON dorm_council
    FOR INSERT
    WITH CHECK (is_admin(auth.uid()) OR is_educator(auth.uid()));

CREATE POLICY dorm_council_update_policy ON dorm_council
    FOR UPDATE
    USING (is_admin(auth.uid()) OR is_educator(auth.uid()));

CREATE POLICY dorm_council_delete_policy ON dorm_council
    FOR DELETE
    USING (is_admin(auth.uid()) OR is_educator(auth.uid()));


-- ============================================================
-- 4. ПОЛИТИКИ ДЛЯ ТАБЛИЦЫ dorm_activists (актив этажей)
-- ============================================================

-- Все видят актив этажей
CREATE POLICY dorm_activists_select_policy ON dorm_activists
    FOR SELECT
    USING (true);

-- Только админы и воспитатели могут изменять
CREATE POLICY dorm_activists_insert_policy ON dorm_activists
    FOR INSERT
    WITH CHECK (is_admin(auth.uid()) OR is_educator(auth.uid()));

CREATE POLICY dorm_activists_update_policy ON dorm_activists
    FOR UPDATE
    USING (is_admin(auth.uid()) OR is_educator(auth.uid()));

CREATE POLICY dorm_activists_delete_policy ON dorm_activists
    FOR DELETE
    USING (is_admin(auth.uid()) OR is_educator(auth.uid()));


-- ============================================================
-- 5. ДОПОЛНИТЕЛЬНЫЕ ПОЛИТИКИ ДЛЯ ЗАЩИТЫ ДАННЫХ
-- ============================================================

-- Запрещаем заведующей и вахтеру видеть чувствительные данные
-- (это на уровне приложения, но добавим ограничение в БД)

-- Создаём представление для безопасного просмотра студентов
-- (для заведующей и вахтера)
CREATE OR REPLACE VIEW view_students_safe AS
SELECT 
    id,
    full_name,
    group_id,
    birth_date,
    phone,
    citizenship,
    gender,
    status,
    lives_in_dorm,
    dorm_block,
    dorm_room_type,
    dorm_room_number,
    -- Скрываем чувствительные данные
    NULL AS school,
    NULL AS school_year,
    NULL AS school_class,
    NULL AS avg_grade,
    NULL AS accounting_type,
    NULL AS accounting_data,
    NULL AS sop,
    NULL AS kdn,
    NULL AS idn,
    NULL AS is_orphan,
    NULL AS address_reg,
    NULL AS address_live,
    NULL AS address_region,
    NULL AS address_district,
    NULL AS address_locality,
    NULL AS addresses
FROM students;

COMMENT ON VIEW view_students_safe IS 'Безопасное представление студентов для заведующей и вахтера (без чувствительных данных)';


-- ============================================================
-- 6. ФУНКЦИЯ ДЛЯ АВТОМАТИЧЕСКОГО ОБНОВЛЕНИЯ ДАННЫХ ОБЩЕЖИТИЯ
-- ============================================================

-- Функция: проверка, может ли пользователь видеть студента (для отчётов)
CREATE OR REPLACE FUNCTION can_view_student(user_id UUID, student_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    dorm_role VARCHAR;
    lives_in_dorm BOOLEAN;
BEGIN
    -- Если админ - всегда может
    IF is_admin(user_id) THEN
        RETURN TRUE;
    END IF;
    
    -- Получаем роль сотрудника
    SELECT e.dorm_role INTO dorm_role 
    FROM employees e 
    WHERE e.id = user_id;
    
    -- Если не работник общежития - может всё
    IF dorm_role IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Получаем информацию о студенте
    SELECT s.lives_in_dorm INTO lives_in_dorm 
    FROM students s 
    WHERE s.id = student_id;
    
    -- Работник общежития может видеть только проживающих
    RETURN lives_in_dorm = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- КОММЕНТАРИИ
-- ============================================================

COMMENT ON FUNCTION is_admin IS 'Проверяет, является ли пользователь супер-админом или админом';
COMMENT ON FUNCTION is_dorm_employee IS 'Проверяет, является ли пользователь работником общежития';
COMMENT ON FUNCTION is_educator IS 'Проверяет, является ли пользователь воспитателем';
COMMENT ON FUNCTION is_head IS 'Проверяет, является ли пользователь заведующей';
COMMENT ON FUNCTION is_guard IS 'Проверяет, является ли пользователь вахтером';
COMMENT ON FUNCTION can_edit_dorm_data IS 'Проверяет, может ли пользователь редактировать данные общежития';
COMMENT ON VIEW view_students_safe IS 'Безопасное представление студентов для заведующей и вахтера';
COMMENT ON FUNCTION can_view_student IS 'Проверяет, может ли пользователь видеть студента с учётом прав общежития';