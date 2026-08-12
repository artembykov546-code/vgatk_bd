// ============================================================
// ЕДИНЫЙ МОДУЛЬ УПРАВЛЕНИЯ СЕССИЕЙ
// Подключается во все HTML страницы
// ============================================================

(function() {
    'use strict';

    // ============================================================
    // КОНСТАНТЫ
    // ============================================================
    const SUPABASE_URL = 'https://selbolepupendprhixas.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlbGJvbGVwdXBlbmRwcmhpeGFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NjQzODgsImV4cCI6MjA5ODE0MDM4OH0.UpWEr6hEs9ytnDxnaQ7Uf3d_xDQLHO-eejkIw53o7EE';
    const SESSION_CHECK_INTERVAL = 5000; // 5 секунд

    // ============================================================
    // ПЕРЕМЕННЫЕ
    // ============================================================
    let currentUser = null;
    let refreshInterval = null;
    let sessionCheckInterval = null;
    let isCheckingSession = false;
    let isSessionEnded = false;
    let deviceSessionId = null;
    let supabaseClient = null;

    // ============================================================
    // ИНИЦИАЛИЗАЦИЯ SUPABASE
    // ============================================================
    function initSupabase() {
        // Проверяем, есть ли уже клиент
        if (typeof window.supabaseClient !== 'undefined') {
            supabaseClient = window.supabaseClient;
            console.log('✅ Используем существующий Supabase клиент');
            return;
        }

        // Проверяем, что supabase загружен
        if (typeof window.supabase === 'undefined') {
            console.error('❌ Supabase не загружен!');
            return;
        }

        try {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            window.supabaseClient = supabaseClient;
            console.log('✅ Supabase клиент создан');
        } catch (error) {
            console.error('❌ Ошибка создания Supabase клиента:', error);
        }
    }

    // ============================================================
    // ID УСТРОЙСТВА
    // ============================================================
    function getDeviceSessionId() {
        if (deviceSessionId) return deviceSessionId;
        
        let sessionId = localStorage.getItem('deviceSessionId');
        if (!sessionId) {
            const ua = navigator.userAgent || '';
            const screen = window.screen.width + 'x' + window.screen.height;
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 8);
            const base = btoa(ua.substring(0, 50) + screen).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
            sessionId = 'device_' + base + '_' + timestamp + '_' + random;
            localStorage.setItem('deviceSessionId', sessionId);
        }
        deviceSessionId = sessionId;
        return deviceSessionId;
    }

    // ============================================================
    // ПОКАЗ МОДАЛЬНОГО ОКНА ЗАВЕРШЕНИЯ СЕССИИ
    // ============================================================
    function showSessionEndedModal(reason = 'Ваша сессия была завершена.') {
        if (isSessionEnded) return;
        isSessionEnded = true;
        
        localStorage.removeItem('currentUser');
        stopAutoRefresh();

        // Удаляем существующее модальное окно
        const existingModal = document.getElementById('sessionModal');
        if (existingModal) existingModal.remove();

        // Создаём модальное окно
        const modalHTML = `
            <div class="session-modal-overlay" id="sessionModal" style="display:flex;">
                <div class="session-modal">
                    <span class="modal-icon">🔒</span>
                    <h2 class="modal-title">Сессия завершена</h2>
                    <p class="modal-desc">${reason}</p>
                    <button class="btn-login" onclick="window.location.href='/index.html'">🔑 Войти заново</button>
                </div>
            </div>
        `;

        // Добавляем стили, если их нет
        if (!document.getElementById('sessionModalStyles')) {
            const styles = document.createElement('style');
            styles.id = 'sessionModalStyles';
            styles.textContent = `
                .session-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.6);
                    backdrop-filter: blur(8px);
                    z-index: 10000;
                    justify-content: center;
                    align-items: center;
                    display: none;
                }
                .session-modal-overlay.active {
                    display: flex;
                }
                .session-modal {
                    background: white;
                    border-radius: 20px;
                    padding: 40px 48px;
                    max-width: 440px;
                    width: 90%;
                    text-align: center;
                    box-shadow: 0 24px 64px rgba(0,0,0,0.3);
                    animation: slideUp 0.4s ease;
                }
                .session-modal .modal-icon {
                    font-size: 64px;
                    display: block;
                    margin-bottom: 12px;
                }
                .session-modal .modal-title {
                    font-size: 24px;
                    font-weight: 700;
                    color: #EF4444;
                    margin-bottom: 8px;
                }
                .session-modal .modal-desc {
                    color: #475569;
                    font-size: 15px;
                    margin-bottom: 24px;
                    line-height: 1.6;
                }
                .session-modal .btn-login {
                    background: linear-gradient(135deg, #3B82F6, #2563EB);
                    color: white;
                    padding: 12px 40px;
                    border: none;
                    border-radius: 6px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .session-modal .btn-login:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
                }
                @media (max-width: 768px) {
                    .session-modal {
                        padding: 28px 20px;
                    }
                    .session-modal .modal-icon {
                        font-size: 48px;
                    }
                    .session-modal .modal-title {
                        font-size: 20px;
                    }
                }
                @media (max-width: 480px) {
                    .session-modal {
                        padding: 24px 16px;
                    }
                    .session-modal .modal-icon {
                        font-size: 40px;
                    }
                    .session-modal .modal-title {
                        font-size: 18px;
                    }
                    .session-modal .modal-desc {
                        font-size: 14px;
                    }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(24px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(styles);
        }

        // Вставляем модальное окно
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // ============================================================
    // ПРОВЕРКА СЕССИИ
    // ============================================================
    async function checkSession() {
        if (isSessionEnded) return false;
        if (isCheckingSession) return true;
        if (!supabaseClient) {
            console.warn('⚠️ Supabase клиент не инициализирован');
            return true;
        }

        isCheckingSession = true;

        const savedUser = localStorage.getItem('currentUser');
        if (!savedUser) {
            isCheckingSession = false;
            showSessionEndedModal('Пожалуйста, войдите в систему.');
            return false;
        }

        try {
            const user = JSON.parse(savedUser);
            
            const { data, error } = await supabaseClient
                .from('users')
                .select('id, session_version, active_session_id, is_active')
                .eq('id', user.id)
                .single();

            if (error || !data) {
                console.warn('⚠️ Ошибка проверки сессии:', error?.message || 'Нет данных');
                isCheckingSession = false;
                return true;
            }

            // 1. Проверяем активность пользователя (удалён или заблокирован)
            if (data.is_active === false) {
                console.log('🔒 Пользователь удалён или заблокирован!');
                isCheckingSession = false;
                showSessionEndedModal('Ваш аккаунт был удалён или заблокирован администратором.');
                return false;
            }

            // 2. Проверяем активную сессию
            if (data.active_session_id && data.active_session_id !== deviceSessionId) {
                console.log('🔒 Сессия активна на другом устройстве!');
                isCheckingSession = false;
                showSessionEndedModal('Вы вошли на другом устройстве. Текущая сессия завершена.');
                return false;
            }

            // 3. Проверяем версию сессии (смена пароля/логина)
            if (user.session_version !== undefined && data.session_version !== undefined) {
                if (data.session_version !== user.session_version) {
                    console.log('🔒 Сессия устарела (смена пароля)!');
                    isCheckingSession = false;
                    showSessionEndedModal('Пароль или логин были изменены. Войдите заново.');
                    return false;
                }
            }

            // Обновляем данные пользователя в localStorage
            if (user.session_version !== data.session_version) {
                user.session_version = data.session_version;
                localStorage.setItem('currentUser', JSON.stringify(user));
                currentUser = user;
            }

            isCheckingSession = false;
            return true;
        } catch (e) {
            console.warn('⚠️ Ошибка при проверке сессии:', e.message);
            isCheckingSession = false;
            return true;
        }
    }

    // ============================================================
    // ЗАГРУЗКА ПОЛЬЗОВАТЕЛЯ
    // ============================================================
    function loadUser() {
        const savedUser = localStorage.getItem('currentUser');
        if (!savedUser) {
            return null;
        }
        try {
            currentUser = JSON.parse(savedUser);
            return currentUser;
        } catch (e) {
            console.error('Ошибка загрузки пользователя:', e);
            localStorage.removeItem('currentUser');
            return null;
        }
    }

    // ============================================================
    // ВЫХОД ИЗ СИСТЕМЫ
    // ============================================================
    function logout() {
        localStorage.removeItem('currentUser');
        stopAutoRefresh();
        window.location.href = '/index.html';
    }

    // ============================================================
    // АВТООБНОВЛЕНИЕ
    // ============================================================
    function startAutoRefresh() {
        if (sessionCheckInterval) clearInterval(sessionCheckInterval);
        sessionCheckInterval = setInterval(checkSession, SESSION_CHECK_INTERVAL);
    }

    function stopAutoRefresh() {
        if (sessionCheckInterval) {
            clearInterval(sessionCheckInterval);
            sessionCheckInterval = null;
        }
    }

    // ============================================================
    // ИНИЦИАЛИЗАЦИЯ
    // ============================================================
    async function initSession() {
        console.log('🔐 Инициализация сессии...');
        
        // Инициализируем Supabase
        initSupabase();
        
        // Получаем ID устройства
        getDeviceSessionId();
        console.log('🆔 ID устройства:', deviceSessionId);
        
        // Проверяем сессию
        const isValid = await checkSession();
        if (!isValid) return false;
        
        // Загружаем пользователя
        const user = loadUser();
        if (!user) {
            window.location.href = '/index.html';
            return false;
        }
        
        // Запускаем автоматическую проверку
        startAutoRefresh();
        
        console.log('✅ Сессия успешно инициализирована, пользователь:', user.name || user.login);
        return true;
    }

    // ============================================================
    // ПЕРЕХВАТ СОБЫТИЙ
    // ============================================================
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible' && !isSessionEnded) {
            checkSession();
        }
    });

    window.addEventListener('online', function() {
        if (!isSessionEnded) {
            checkSession();
        }
    });

    window.addEventListener('beforeunload', stopAutoRefresh);

    // ============================================================
    // ЭКСПОРТ ГЛОБАЛЬНЫХ ФУНКЦИЙ
    // ============================================================
    window.Session = {
        init: initSession,
        check: checkSession,
        logout: logout,
        getUser: () => currentUser || loadUser(),
        isSessionEnded: () => isSessionEnded,
        getDeviceId: () => deviceSessionId,
        showModal: showSessionEndedModal
    };

    console.log('✅ Модуль сессии загружен');
})();