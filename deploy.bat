@echo off
echo 🚀 Отправка изменений на GitHub...
git add .
git commit -m "Автообновление: %date% %time%"
git push origin main
echo ✅ Готово! Render пересоберет сайт через 1-2 минуты.
pause