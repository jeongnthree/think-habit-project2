@echo off
echo ========================================
echo Think-Habit Group Widget 설치 테스트
echo ========================================
echo.

REM 임시 디렉토리 생성
set TEMP_DIR=temp-widget-test
if exist %TEMP_DIR% rmdir /s /q %TEMP_DIR%
mkdir %TEMP_DIR%

echo 1. ZIP 파일 압축 해제 중...
powershell -Command "Expand-Archive -Path 'public/downloads/think-habit-group-widget.zip' -DestinationPath '%TEMP_DIR%' -Force"

echo.
echo 2. 압축 해제된 파일 목록:
dir %TEMP_DIR% /s /b

echo.
echo 3. 위젯 디렉토리로 이동...
cd %TEMP_DIR%\think-habit-group-widget

echo.
echo 4. package.json 확인:
type package.json | findstr "name version"

echo.
echo ========================================
echo 테스트 완료!
echo.
echo 다음 단계:
echo 1. cd %TEMP_DIR%\think-habit-group-widget
echo 2. npm install
echo 3. npm run dev
echo ========================================
pause