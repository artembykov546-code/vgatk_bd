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

// Проверяем структуру и находим index.html
function findIndexPath() {
  // Проверяем стандартный путь
  const standardPath = path.join(distPath, 'index.html');
  if (fs.existsSync(standardPath)) {
    return standardPath;
  }
  
  // Проверяем путь через frontend/pages
  const nestedPath = path.join(distPath, 'frontend', 'pages', 'index.html');
  if (fs.existsSync(nestedPath)) {
    return nestedPath;
  }
  
  // Ищем рекурсивно index.html в dist
  function findFile(dir, filename) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        const result = findFile(fullPath, filename);
        if (result) return result;
      } else if (file === filename) {
        return fullPath;
      }
    }
    return null;
  }
  
  return findFile(distPath, 'index.html');
}

const indexPath = findIndexPath();
console.log(`📁 Путь к dist: ${distPath}`);
console.log(`📄 index.html найден: ${indexPath}`);

if (indexPath) {
  // Раздаем статику из папки dist
  app.use(express.static(distPath));
  
  // SPA маршрутизация
  app.get('*', (req, res) => {
    res.sendFile(indexPath);
  });
} else {
  console.error('❌ index.html не найден!');
  app.get('*', (req, res) => {
    res.status(404).send('Файл index.html не найден. Проверьте структуру проекта.');
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Open: https://vgatk-bd.onrender.com`);
});