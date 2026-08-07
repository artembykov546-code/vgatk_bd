// Этот файл нужен для Render, если вы используете "node index.js"
import { exec } from 'child_process';

console.log('🚀 Запуск Vite preview...');
exec('npx vite preview --port 3000 --host', (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Ошибка: ${error}`);
    return;
  }
  console.log(stdout);
  console.error(stderr);
});