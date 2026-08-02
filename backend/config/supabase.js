import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Получаем переменные окружения
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Проверяем наличие переменных
if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Ошибка: Не указаны SUPABASE_URL или SUPABASE_ANON_KEY');
    console.error('📝 Создайте файл .env и добавьте туда:');
    console.error('SUPABASE_URL=your_supabase_url');
    console.error('SUPABASE_ANON_KEY=your_supabase_anon_key');
    process.exit(1);
}

// Создаём клиент Supabase
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: false
    }
});

// Функция для проверки подключения
export async function testConnection() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error('❌ Ошибка подключения к базе данных:', error.message);
            return false;
        }
        
        console.log('✅ Успешное подключение к Supabase');
        return true;
    } catch (err) {
        console.error('❌ Ошибка при тестировании подключения:', err.message);
        return false;
    }
}

export default supabase;