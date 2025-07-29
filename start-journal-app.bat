@echo off
echo Think-Habit Journal App을 시작합니다...
echo.

echo 1. 웹 서버 확인 중...
curl -s http://localhost:3002 > nul 2>&1
if %errorlevel% neq 0 (
    echo 웹 서버가 실행되지 않았습니다. 먼저 웹 서버를 시작해주세요:
    echo npm run dev
    echo.
    pause
    exit /b 1
)

echo 2. 저널 앱 디렉토리로 이동...
cd think-habit-journal-app

echo 3. 저널 앱 빌드 중...
call npm run build:main

if %errorlevel% neq 0 (
    echo 빌드 실패! 오류를 확인해주세요.
    pause
    exit /b 1
)

echo 4. Electron 앱 시작...
npx electron dist/main/main.js

pause