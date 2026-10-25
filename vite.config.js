import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  root: path.resolve(__dirname, 'frontend'),
  base: '/',

  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'frontend/index.html'),
        dashboard: path.resolve(__dirname, 'frontend/dashboard.html'),

        // Админ
        admin: path.resolve(__dirname, 'frontend/admin/index.html'),
        adminLogs: path.resolve(__dirname, 'frontend/admin/logs.html'),
        adminPositions: path.resolve(__dirname, 'frontend/admin/positions.html'),
        adminSettings: path.resolve(__dirname, 'frontend/admin/settings.html'),

        // Студенты
        students: path.resolve(__dirname, 'frontend/students/index.html'),
        studentsCreateGroup: path.resolve(__dirname, 'frontend/students/create-group.html'),
        studentsAddStudent: path.resolve(__dirname, 'frontend/students/add-student.html'),
        studentsEditStudent: path.resolve(__dirname, 'frontend/students/edit-student.html'),
        studentsGroup: path.resolve(__dirname, 'frontend/students/group.html'),
        studentsProfile: path.resolve(__dirname, 'frontend/students/profile.html'),
        studentsAddParent: path.resolve(__dirname, 'frontend/students/add-parent.html'),
        studentsAddSibling: path.resolve(__dirname, 'frontend/students/add-sibling.html'),
        studentsGraduateDistribution: path.resolve(__dirname, 'frontend/students/graduate-distribution.html'),

        // Выпускники
        graduates: path.resolve(__dirname, 'frontend/graduates/index.html'),
        graduatesGroup: path.resolve(__dirname, 'frontend/graduates/group.html'),
        graduatesDistribution: path.resolve(__dirname, 'frontend/graduates/distribution.html'),
        graduatesExpelled: path.resolve(__dirname, 'frontend/graduates/expelled.html'),
        graduatesAcademic: path.resolve(__dirname, 'frontend/graduates/academic.html'),

        // Остальные
        employees: path.resolve(__dirname, 'frontend/employees/index.html'),
        reports: path.resolve(__dirname, 'frontend/reports/index.html'),
        profile: path.resolve(__dirname, 'frontend/profile/index.html'),
        invites: path.resolve(__dirname, 'frontend/invites/index.html'),
        register: path.resolve(__dirname, 'frontend/register/index.html'),
        support: path.resolve(__dirname, 'frontend/support/index.html')
      }
    }
  },

  plugins: [
    {
      // Копируем реальный frontend/_redirects в dist после сборки
      name: 'copy-redirects-file',
      closeBundle() {
        const src = path.resolve(__dirname, 'frontend/_redirects');
        const dest = path.resolve(__dirname, 'dist/_redirects');
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
          console.log('✅ _redirects скопирован в dist/');
        } else {
          console.warn('⚠️ frontend/_redirects не найден!');
        }
      }
    }
  ],

  server: {
    port: 3000,
    host: true,
    open: '/index.html'
  }
});
