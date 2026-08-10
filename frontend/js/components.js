// ============================================================
// components.js — Единая логика для всех страниц
// ============================================================

// ============================================================
// КОНФИГУРАЦИЯ SUPABASE (ЖЁСТКО ЗАШИТА ДЛЯ ТЕСТА)
// ============================================================

// ⚠️ ВАЖНО: Для продакшена используйте .env через Vite
// Сейчас используем жёстко зашитые ключи для теста
const SUPABASE_URL = 'https://selbolepupendprhixas.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlbGJvbGVwdXBlbmRwcmhpeGFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NjQzODgsImV4cCI6MjA5ODE0MDM4OH0.UpWEr6hEs9ytnDxnaQ7Uf3d_xDQLHO-eejkIw53o7EE';

// Создаём клиент Supabase
let supabaseClient = null;

function initSupabase() {
    if (typeof window.supabase === 'undefined') {
        console.error('❌ Ошибка: Supabase JS не загружен');
        return null;
    }

    if (!supabaseClient) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase инициализирован');
    }
    return supabaseClient;
}

// ============================================================
// ЛОГОТИП: если logo.png не загрузился, показываем эмодзи
// ============================================================

function initLogos() {
    const logos = document.querySelectorAll('.logo-img');
    logos.forEach(logo => {
        logo.onerror = function() {
            this.style.display = 'none';
            const fallback = document.createElement('span');
            fallback.textContent = '🏛️';
            fallback.style.fontSize = '28px';
            fallback.style.display = 'block';
            fallback.style.width = '40px';
            fallback.style.height = '40px';
            fallback.style.textAlign = 'center';
            fallback.style.lineHeight = '40px';
            fallback.style.borderRadius = '50%';
            fallback.style.background = 'rgba(255,255,255,0.2)';
            this.parentNode.insertBefore(fallback, this);
        };
    });
}

// ============================================================
// МОБИЛЬНОЕ МЕНЮ
// ============================================================

function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('open');
        });
    }

    if (window.innerWidth <= 768 && menuToggle) {
        menuToggle.style.display = 'inline-block';
    }

    window.addEventListener('resize', function() {
        if (window.innerWidth <= 768) {
            if (menuToggle) menuToggle.style.display = 'inline-block';
        } else {
            if (menuToggle) menuToggle.style.display = 'none';
            if (sidebar) sidebar.classList.remove('open');
        }
    });
}

// ============================================================
// ЗАГРУЗКА ПОЛЬЗОВАТЕЛЯ (для всех страниц)
// ============================================================

function loadUser() {
    const savedUser = localStorage.getItem('currentUser');
    if (!savedUser) {
        window.location.href = '/index.html';
        return null;
    }

    try {
        const user = JSON.parse(savedUser);
        const nameEl = document.getElementById('userNameDisplay');
        const roleEl = document.getElementById('userRoleDisplay');
        
        if (nameEl) nameEl.textContent = user.name || user.login;
        if (roleEl) {
            const roleMap = {
                'super_admin': 'Супер-Админ',
                'admin': 'Администратор',
                'teacher': 'Преподаватель',
                'viewer': 'Наблюдатель'
            };
            roleEl.textContent = roleMap[user.role] || user.role;
        }
        
        return user;
    } catch (e) {
        localStorage.removeItem('currentUser');
        window.location.href = '/index.html';
        return null;
    }
}

// ============================================================
// ВЫХОД
// ============================================================

function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('currentUser');
            window.location.href = '/index.html';
        });
    }
}

// ============================================================
// ФОРМАТИРОВАНИЕ ДАТ
// ============================================================

function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('ru-RU', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });
    } catch {
        return dateStr;
    }
}

function calculateAge(birthDate) {
    if (!birthDate) return '—';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ (вызывать на каждой странице)
// ============================================================

function initComponents() {
    console.log('🔧 Инициализация компонентов...');
    
    initLogos();
    initMobileMenu();
    initLogout();
    const user = loadUser();
    const supabase = initSupabase();
    
    return { user, supabase };
}

// ============================================================
// ЭКСПОРТ В ГЛОБАЛЬНУЮ ПЕРЕМЕННУЮ
// ============================================================

window.vgatk = {
    initComponents,
    loadUser,
    initLogout,
    initMobileMenu,
    initSupabase,
    formatDate,
    calculateAge,
    get supabaseClient() { return supabaseClient; }
};

console.log('✅ components.js загружен');