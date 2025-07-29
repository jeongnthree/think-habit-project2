@echo off
echo ========================================
echo   Think-Habit Journal App (Supabase)
echo ========================================
echo.

cd /d "D:\사용자\think-habit-project2\think-habit-journal-app"

echo [1] 웹 서버 시작 확인 (포트 3003)...
start "Web Server" cmd /k "cd /d D:\사용자\think-habit-project2 && npm run dev -- --port 3003"

echo [2] 웹 서버 준비 대기 (10초)...
timeout /t 10 /nobreak >nul

echo [3] 데스크톱 앱 시작...
npm run dev

pause