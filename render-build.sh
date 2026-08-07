#!/bin/bash

echo "🚀 Установка зависимостей..."
npm install

echo "🚀 Сборка проекта..."
npx vite build

echo "✅ Сборка завершена!"
echo "📁 Содержимое папки dist:"
ls -la dist/