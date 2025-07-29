@echo off
echo ====================================
echo Think-Habit Journal 데스크톱 앱 시작
echo ====================================
echo.
echo 메인 웹 서버: http://localhost:3000 (실행 중이어야 함)
echo 데스크톱 앱: http://localhost:8080
echo.
echo 만약 포트 충돌이 발생하면 Ctrl+C로 중단하세요.
echo ====================================
echo.

cd /d "D:\사용자\think-habit-project2\think-habit-journal-app"

echo 간단한 웹 서버로 데스크톱 앱 실행 중...
npm run simple-web