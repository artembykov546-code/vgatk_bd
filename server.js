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

// Проверяем dist
if (!fs.existsSync(distPath)) {
    console.error('❌ Папка dist не найдена!');
    process.exit(1);
}

// Раздаем статику
app.use(express.static(distPath));

// Обработчик для всех запросов
app.get('*', (req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('index.html не найден');
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
});