#!/bin/bash

echo "🚀 Установка зависимостей..."
npm install

echo "🚀 Переустановка проблемных модулей..."
npm install debug@4.3.4

echo "🚀 Сборка проекта..."
npx vite build

echo "✅ Сборка завершена!"
echo "📁 Содержимое папки dist:"
ls -la dist/