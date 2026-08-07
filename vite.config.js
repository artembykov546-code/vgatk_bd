import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  root: path.resolve(__dirname, 'frontend/pages'),
  base: '/',
  publicDir: path.resolve(__dirname, 'frontend/assets'),
  
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
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
        addParent: path.resolve(__dirname, 'frontend/pages/students/add-parent.html'),
        addSibling: path.resolve(__dirname, 'frontend/pages/students/add-sibling.html'),
        graduates: path.resolve(__dirname, 'frontend/pages/graduates/index.html'),
        graduatesGroup: path.resolve(__dirname, 'frontend/pages/graduates/group.html'),
        graduatesExpelled: path.resolve(__dirname, 'frontend/pages/graduates/expelled.html'),
        graduatesAcademic: path.resolve(__dirname, 'frontend/pages/graduates/academic.html'),
        graduatesDistribution: path.resolve(__dirname, 'frontend/pages/graduates/distribution.html'),
        employees: path.resolve(__dirname, 'frontend/pages/employees/index.html'),
        reports: path.resolve(__dirname, 'frontend/pages/reports/index.html'),
        register: path.resolve(__dirname, 'frontend/pages/register/index.html'),
        profilePage: path.resolve(__dirname, 'frontend/pages/profile/index.html'),
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