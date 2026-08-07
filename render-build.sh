#!/bin/bash

echo "🚀 Установка зависимостей..."
npm install

echo "🚀 Сборка проекта..."
npx vite build

echo "✅ Сборка завершена!"