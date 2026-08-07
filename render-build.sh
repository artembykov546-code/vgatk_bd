#!/bin/bash

echo "🚀 Установка зависимостей..."
npm install

echo "🚀 Сборка проекта..."
npx vite build

echo "✅ Сборка завершена!"
echo "📁 Содержимое папки dist:"
ls -la dist/
echo "📁 Содержимое dist/frontend/pages:"
ls -la dist/frontend/pages/ 2>/dev/null || echo "Папка не найдена"