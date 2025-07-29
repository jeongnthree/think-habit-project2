@echo off
echo 🚀 Think-Habit Journal App 시작
echo ================================

echo 📁 Journal App 폴더로 이동 중...
cd think-habit-journal-app

echo 📦 의존성 확인 중...
if not exist node_modules (
    echo ⚠️  node_modules가 없습니다. 설치 중...
    npm install
)

echo 🌐 웹 서버 시작 중...
echo.
echo 💡 서버가 시작되면 다음 URL에서 확인하세요:
echo    http://localhost:9002
echo.
echo ⚠️  서버를 중지하려면 Ctrl+C를 누르세요
echo.

npm run simple-web