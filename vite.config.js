import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

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
        admin: path.resolve(__dirname, 'frontend/admin/index.html'),
        invites: path.resolve(__dirname, 'frontend/invites/index.html'),
        profile: path.resolve(__dirname, 'frontend/profile/index.html'),
        employees: path.resolve(__dirname, 'frontend/employees/index.html'),
        students: path.resolve(__dirname, 'frontend/students/index.html'),
        graduates: path.resolve(__dirname, 'frontend/graduates/index.html'),
        reports: path.resolve(__dirname, 'frontend/reports/index.html'),
        register: path.resolve(__dirname, 'frontend/register/index.html')
      }
    }
  },
  
  server: {
    port: 3000,
    host: true,
    open: '/admin/index.html'
  }
});