import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    root: 'frontend/pages',  // Корень - pages
    publicDir: path.resolve(__dirname, 'frontend/assets'),  // Папка со статикой
    server: {
        port: 3000,
        open: '/index.html'  // Открываем страницу входа
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './frontend'),
            '@assets': path.resolve(__dirname, './frontend/assets'),
            '@pages': path.resolve(__dirname, './frontend/pages'),
            '@shared': path.resolve(__dirname, './frontend/shared'),
            '@backend': path.resolve(__dirname, './backend')
        }
    },
    build: {
        outDir: '../../dist',  // Собираем в корень проекта/dist
        emptyOutDir: true
    },
    base: '/'  // Абсолютные пути
});