#!/bin/bash

echo "🚀 Полная переустановка зависимостей..."
rm -rf node_modules package-lock.json
npm install

echo "🚀 Принудительная установка всех зависимостей..."
npm install express@4.21.2
npm install body-parser@1.20.3
npm install raw-body@2.5.2
npm install iconv-lite@0.6.3
npm install debug@4.3.4
npm install finalhandler@1.2.1

echo "🚀 Сборка проекта..."
npx vite build

echo "✅ Сборка завершена!"
echo "📁 Содержимое папки dist:"
ls -la dist/
echo "📁 Проверка dist/frontend/pages:"
ls -la dist/frontend/pages/ 2>/dev/null || echo "Папка не найдена"