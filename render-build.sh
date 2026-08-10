#!/bin/bash

echo "🚀 Установка зависимостей..."
npm install

echo "🚀 Сборка через npx..."
npx vite build

echo "✅ Сборка завершена!"