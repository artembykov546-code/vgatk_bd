import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

// Получаем абсолютный путь к корневой папке проекта (где лежит vite.config.js)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  // Указываем корневую папку с HTML-страницами
  root: path.resolve(__dirname, 'frontend/pages'), 
  
  // ВАЖНО: Используем './' для корректной работы на Netlify и в подпапках
  base: './', 
  
  // Папка со статикой (картинки, шрифты, css)
  publicDir: path.resolve(__dirname, 'frontend/assets'),
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'frontend'),
      '@assets': path.resolve(__dirname, 'frontend/assets'),
      '@pages': path.resolve(__dirname, 'frontend/pages'),
      '@shared': path.resolve(__dirname, 'frontend/shared'),
      '@backend': path.resolve(__dirname, 'backend')
    }
  },
  
  build: {
    // Собираем всё в папку dist в корне проекта
    outDir: path.resolve(__dirname, 'dist'), 
    emptyOutDir: true,
    
    // Явно перечисляем ВСЕ HTML-файлы, чтобы Vite их обработал
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'frontend/pages/index.html'),
        dashboard: path.resolve(__dirname, 'frontend/pages/dashboard.html'),
        students: path.resolve(__dirname, 'frontend/pages/students/index.html'),
        addStudent: path.resolve(__dirname, 'frontend/pages/students/add-student.html'),
        editStudent: path.resolve(__dirname, 'frontend/pages/students/edit-student.html'),
        createGroup: path.resolve(__dirname, 'frontend/pages/students/create-group.html'),
        graduateDistribution: path.resolve(__dirname, 'frontend/pages/students/graduate-distribution.html'),
        group: path.resolve(__dirname, 'frontend/pages/students/group.html'),
        profile: path.resolve(__dirname, 'frontend/pages/students/profile.html'),
        graduates: path.resolve(__dirname, 'frontend/pages/graduates/index.html'),
        employees: path.resolve(__dirname, 'frontend/pages/employees/index.html'),
        reports: path.resolve(__dirname, 'frontend/pages/reports/index.html'),
        admin: path.resolve(__dirname, 'frontend/pages/admin/index.html'),
        adminLogs: path.resolve(__dirname, 'frontend/pages/admin/logs.html'),
        adminPositions: path.resolve(__dirname, 'frontend/pages/admin/positions.html'),
        adminSettings: path.resolve(__dirname, 'frontend/pages/admin/settings.html')
      }
    }
  },
  
  server: {
    port: 3000,
    open: '/index.html'
  }
});