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

// Раздаем все статические файлы из dist
app.use(express.static(distPath));

// Обработчик для всех запросов
app.get('*', (req, res) => {
    // Убираем ведущий слэш для поиска
    let requestPath = req.path;
    if (requestPath.startsWith('/')) {
        requestPath = requestPath.substring(1);
    }
    
    // Если запрос пустой или корневой
    if (!requestPath || requestPath === '') {
        requestPath = 'index.html';
    }
    
    // Возможные пути для поиска файла
    const possiblePaths = [
        // Прямой путь в dist
        path.join(distPath, requestPath),
        // Через frontend/pages
        path.join(distPath, 'frontend', 'pages', requestPath),
        // Через frontend
        path.join(distPath, 'frontend', requestPath),
        // Если запрос заканчивается на .html, ищем в подпапках
        path.join(distPath, 'frontend', 'pages', requestPath),
        // Для корневого index.html
        path.join(distPath, 'index.html')
    ];
    
    // Ищем файл
    for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
            console.log(`📄 Отдаю файл: ${filePath}`);
            return res.sendFile(filePath);
        }
    }
    
    // Если это запрос к папке (например /students/)
    if (req.path.endsWith('/') || !req.path.includes('.')) {
        // Пробуем найти index.html в этой папке
        const indexPath = path.join(distPath, req.path, 'index.html');
        if (fs.existsSync(indexPath)) {
            console.log(`📄 Отдаю index.html из папки: ${indexPath}`);
            return res.sendFile(indexPath);
        }
        
        // Пробуем через frontend/pages
        const altIndexPath = path.join(distPath, 'frontend', 'pages', req.path, 'index.html');
        if (fs.existsSync(altIndexPath)) {
            console.log(`📄 Отдаю index.html из папки: ${altIndexPath}`);
            return res.sendFile(altIndexPath);
        }
    }
    
    // Если ничего не найдено - SPA маршрутизация, отдаём index.html
    console.log(`🔄 SPA маршрут: ${req.path} -> index.html`);
    const mainIndex = path.join(distPath, 'frontend', 'pages', 'index.html');
    if (fs.existsSync(mainIndex)) {
        return res.sendFile(mainIndex);
    }
    
    // Последняя попытка - любой index.html в dist
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