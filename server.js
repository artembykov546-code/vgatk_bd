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
    // Создаем dist если нет
    fs.mkdirSync(distPath, { recursive: true });
}

// Раздаем все статические файлы из dist
app.use(express.static(distPath));

// Для SPA: если запрашивают страницу, которая не найдена как файл
// и это не запрос к API, отдаем index.html
app.get('*', (req, res) => {
    // Проверяем, существует ли запрошенный файл
    const requestedPath = path.join(distPath, req.path);
    
    // Если запрос заканчивается на .html, пробуем найти файл
    if (req.path.endsWith('.html')) {
        // Ищем файл в dist
        const possiblePaths = [
            path.join(distPath, req.path),
            path.join(distPath, 'frontend', 'pages', req.path),
            path.join(distPath, 'frontend', req.path),
            path.join(distPath, req.path.replace(/^\//, ''))
        ];
        
        for (const filePath of possiblePaths) {
            if (fs.existsSync(filePath)) {
                console.log(`📄 Отдаю файл: ${filePath}`);
                return res.sendFile(filePath);
            }
        }
    }
    
    // Если это не HTML файл или файл не найден, отдаем index.html
    console.log(`🔄 SPA маршрут: ${req.path} -> index.html`);
    const indexPath = path.join(distPath, 'index.html');
    
    // Пробуем найти index.html в разных местах
    const possibleIndexPaths = [
        path.join(distPath, 'index.html'),
        path.join(distPath, 'frontend', 'pages', 'index.html'),
        path.join(distPath, 'frontend', 'index.html')
    ];
    
    for (const indexFile of possibleIndexPaths) {
        if (fs.existsSync(indexFile)) {
            return res.sendFile(indexFile);
        }
    }
    
    res.status(404).send('Страница не найдена');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 Open: https://vgatk-bd.onrender.com`);
});