@echo off
echo ========================================
echo   Think-Habit Desktop App Test
echo ========================================
echo.

echo [INFO] 웹 서버가 http://localhost:3003 에서 실행 중이어야 합니다.
echo [INFO] 데스크톱 앱이 Google OAuth를 위해 8888 포트를 사용합니다.
echo.

cd /d "D:\사용자\think-habit-project2\think-habit-journal-app"

echo [1] 데스크톱 앱 시작...
npm run dev

pause