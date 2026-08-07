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

// Проверяем, что dist существует
if (!fs.existsSync(distPath)) {
    console.error('❌ Папка dist не найдена!');
    fs.mkdirSync(distPath, { recursive: true });
}

// Раздаем статику
app.use(express.static(distPath));

// Обработчик для всех запросов
app.get('*', (req, res) => {
    const requestPath = req.path;
    
    // Ищем файл в разных местах
    const possiblePaths = [
        path.join(distPath, requestPath),
        path.join(distPath, 'frontend', 'pages', requestPath),
        path.join(distPath, 'frontend', requestPath),
        path.join(distPath, 'frontend', 'pages', requestPath.replace(/^\//, '')),
        path.join(distPath, requestPath.replace(/^\//, ''))
    ];
    
    // Если запрос к папке, ищем index.html
    if (!requestPath.includes('.') || requestPath.endsWith('/')) {
        const indexPaths = [
            path.join(distPath, requestPath, 'index.html'),
            path.join(distPath, 'frontend', 'pages', requestPath, 'index.html'),
            path.join(distPath, 'frontend', 'pages', requestPath.replace(/^\//, ''), 'index.html')
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
    
    // Если ничего не найдено - SPA маршрутизация
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
});