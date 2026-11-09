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

        admin: path.resolve(__dirname, 'frontend/admin/index.html'),
        adminLogs: path.resolve(__dirname, 'frontend/admin/logs.html'),
        adminPositions: path.resolve(__dirname, 'frontend/admin/positions.html'),
        adminSettings: path.resolve(__dirname, 'frontend/admin/settings.html'),

        students: path.resolve(__dirname, 'frontend/students/index.html'),
        studentsCreateGroup: path.resolve(__dirname, 'frontend/students/create-group.html'),
        studentsAddStudent: path.resolve(__dirname, 'frontend/students/add-student.html'),
        studentsEditStudent: path.resolve(__dirname, 'frontend/students/edit-student.html'),
        studentsGroup: path.resolve(__dirname, 'frontend/students/group.html'),
        studentsProfile: path.resolve(__dirname, 'frontend/students/profile.html'),
        studentsAddParent: path.resolve(__dirname, 'frontend/students/add-parent.html'),
        studentsAddSibling: path.resolve(__dirname, 'frontend/students/add-sibling.html'),
        studentsGraduateDistribution: path.resolve(__dirname, 'frontend/students/graduate-distribution.html'),

        graduates: path.resolve(__dirname, 'frontend/graduates/index.html'),
        graduatesGroup: path.resolve(__dirname, 'frontend/graduates/group.html'),
        graduatesDistribution: path.resolve(__dirname, 'frontend/graduates/distribution.html'),
        graduatesExpelled: path.resolve(__dirname, 'frontend/graduates/expelled.html'),
        graduatesAcademic: path.resolve(__dirname, 'frontend/graduates/academic.html'),

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
      name: 'serve-static-in-dev',
      configureServer(server) {
        const dirs = ['images', 'css', 'js'];
        server.middlewares.use((req, res, next) => {
          try {
            const url = decodeURIComponent((req.url || '').split('?')[0]);
            for (const d of dirs) {
              const prefix = '/' + d + '/';
              if (url.startsWith(prefix)) {
                const filePath = path.resolve(__dirname, 'frontend', url.slice(1));
                if (filePath.startsWith(path.resolve(__dirname, 'frontend', d)) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                  const ext = path.extname(filePath).toLowerCase();
                  const mime = {
                    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
                    '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
                    '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8'
                  }[ext] || 'application/octet-stream';
                  res.setHeader('Content-Type', mime);
                  fs.createReadStream(filePath).pipe(res);
                  return;
                }
              }
            }
          } catch (e) {}
          next();
        });
      }
    },
    {
      name: 'copy-static-assets',
      closeBundle() {
        const pairs = [
          { src: 'frontend/_redirects', dest: 'dist/_redirects', kind: 'file' },
          { src: 'frontend/js',         dest: 'dist/js',         kind: 'dir'  },
          { src: 'frontend/images',     dest: 'dist/images',     kind: 'dir'  },
          { src: 'frontend/css',        dest: 'dist/css',        kind: 'dir'  }
        ];

        for (const p of pairs) {
          const srcPath = path.resolve(__dirname, p.src);
          const destPath = path.resolve(__dirname, p.dest);

          if (!fs.existsSync(srcPath)) {
            console.warn(`WARN: ${p.src} not found - skip`);
            continue;
          }

          if (p.kind === 'file') {
            fs.copyFileSync(srcPath, destPath);
            console.log(`OK ${p.src} -> ${p.dest}`);
          } else {
            fs.cpSync(srcPath, destPath, { recursive: true });
            console.log(`OK ${p.src} -> ${p.dest}`);
          }
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