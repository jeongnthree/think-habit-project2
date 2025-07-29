@echo off
echo Creating Think-Habit Group Widget package...

REM Create temporary directory
set TEMP_DIR=temp-widget-package
set OUTPUT_FILE=public\downloads\think-habit-group-widget.zip

REM Clean up if exists
if exist %TEMP_DIR% rmdir /s /q %TEMP_DIR%
if exist %OUTPUT_FILE% del %OUTPUT_FILE%

REM Copy widget files
echo Copying widget files...
xcopy /s /e /i think-habit-group-widget %TEMP_DIR%\think-habit-group-widget /exclude:scripts\exclude-list.txt

REM Create zip using PowerShell
echo Creating ZIP package...
powershell -Command "Compress-Archive -Path '%TEMP_DIR%\*' -DestinationPath '%OUTPUT_FILE%' -Force"

REM Clean up
rmdir /s /q %TEMP_DIR%

echo ✅ Package created successfully!
echo 📦 Location: %OUTPUT_FILE%