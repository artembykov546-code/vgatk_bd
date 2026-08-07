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

// Проверка наличия папки dist
const distPath = path.join(__dirname, 'dist');
console.log(`📁 Путь к dist: ${distPath}`);

// Раздача статики
app.use(express.static(distPath));

// SPA маршрутизация
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  console.log(`📄 Запрос: ${req.url} -> ${indexPath}`);
  res.sendFile(indexPath);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});