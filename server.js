import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Путь к папке dist (на Render это /opt/render/project/src/dist)
const distPath = path.join(__dirname, 'dist');
console.log(`📁 Путь к dist: ${distPath}`);

// Проверяем существование папки
import fs from 'fs';
if (fs.existsSync(distPath)) {
  console.log('✅ Папка dist существует');
  console.log('📄 Файлы в dist:', fs.readdirSync(distPath));
} else {
  console.log('❌ Папка dist не найдена!');
}

// Раздача статики
app.use(express.static(distPath));

// SPA маршрутизация
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Файл index.html не найден');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});