#!/bin/bash

echo "🚀 Установка зависимостей..."
npm install

echo "🚀 Принудительная установка iconv-lite..."
npm install iconv-lite@0.4.24

echo "🚀 Сборка проекта..."
npx vite build

echo "✅ Сборка завершена!"
echo "📁 Содержимое папки dist:"
ls -la dist/