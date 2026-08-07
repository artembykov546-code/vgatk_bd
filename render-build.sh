#!/bin/bash

echo "🚀 Установка зависимостей..."
npm install

echo "🚀 Принудительная переустановка Express и зависимостей..."
npm install express@4.21.2
npm install debug@4.3.4
npm install finalhandler@1.2.1

echo "🚀 Сборка проекта..."
npx vite build

echo "✅ Сборка завершена!"
echo "📁 Содержимое папки dist:"
ls -la dist/