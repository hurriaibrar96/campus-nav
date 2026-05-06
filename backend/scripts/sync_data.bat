@echo off
echo ========================================
echo   Syncing Data Files for Deployment
echo ========================================
echo.

echo [1/2] Copying campus_map.json to backend...
copy data\campus_map.json backend\app\data\campus_map.json >nul
if %errorlevel% equ 0 (
    echo ✓ campus_map.json synced successfully
) else (
    echo ✗ Failed to sync campus_map.json
    exit /b 1
)

echo.
echo [2/2] Verifying files...
if exist backend\app\data\campus_map.json (
    echo ✓ backend\app\data\campus_map.json exists
) else (
    echo ✗ backend\app\data\campus_map.json missing
    exit /b 1
)

echo.
echo ========================================
echo   All data files synced successfully!
echo ========================================
echo.
echo You can now commit and push:
echo   git add .
echo   git commit -m "update: synced data files"
echo   git push
echo.
