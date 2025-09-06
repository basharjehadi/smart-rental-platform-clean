@echo off
echo Resetting Lease Status to Working State...
echo ==========================================

cd /d "%~dp0"
node reset-lease-status.mjs

if %errorlevel% neq 0 (
    echo.
    echo Reset failed with error code %errorlevel%
    pause
    exit /b %errorlevel%
)

echo.
echo Reset completed successfully!
echo You can now test the lease lifecycle in the UI.
pause


