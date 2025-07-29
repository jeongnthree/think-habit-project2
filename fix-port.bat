@echo off
echo ====================================
echo 포트 충돌 해결 중...
echo ====================================
echo.

echo 포트 9001을 사용 중인 프로세스를 종료합니다...
taskkill /F /PID 13780 2>nul

echo.
echo 포트 3000을 사용 중인 프로세스 확인 중...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo 프로세스 %%a 종료 중...
    taskkill /F /PID %%a 2>nul
)

echo.
echo 포트가 정리되었습니다!
echo.
pause