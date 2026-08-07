import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Путь к папке dist
const distPath = path.join(__dirname, 'dist');

console.log(`📁 Путь к dist: ${distPath}`);

// Проверяем и создаем dist
if (!fs.existsSync(distPath)) {
    console.error('❌ Папка dist не найдена! Создаю...');
    fs.mkdirSync(distPath, { recursive: true });
}

// Раздаем статику
app.use(express.static(distPath));

// Обработчик для всех запросов
app.get('*', (req, res) => {
    // Ищем файл в разных местах
    const possiblePaths = [
        path.join(distPath, req.path),
        path.join(distPath, 'frontend', 'pages', req.path),
        path.join(distPath, 'frontend', req.path),
        path.join(distPath, 'frontend', 'pages', req.path.replace(/^\//, '')),
        path.join(distPath, req.path.replace(/^\//, ''))
    ];
    
    // Если запрос к папке, ищем index.html
    if (!req.path.includes('.') || req.path.endsWith('/')) {
        const indexPaths = [
            path.join(distPath, req.path, 'index.html'),
            path.join(distPath, 'frontend', 'pages', req.path, 'index.html'),
            path.join(distPath, 'frontend', 'pages', req.path.replace(/^\//, ''), 'index.html')
        ];
        possiblePaths.push(...indexPaths);
    }
    
    // Ищем файл
    for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
            console.log(`📄 Отдаю: ${filePath}`);
            return res.sendFile(filePath);
        }
    }
    
    // SPA маршрутизация - отдаем index.html
    const mainIndex = path.join(distPath, 'frontend', 'pages', 'index.html');
    if (fs.existsSync(mainIndex)) {
        console.log(`🔄 SPA маршрут: ${req.path} -> index.html`);
        return res.sendFile(mainIndex);
    }
    
    const fallbackIndex = path.join(distPath, 'index.html');
    if (fs.existsSync(fallbackIndex)) {
        return res.sendFile(fallbackIndex);
    }
    
    res.status(404).send('Страница не найдена');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 Open: https://vgatk-bd.onrender.com`);
});