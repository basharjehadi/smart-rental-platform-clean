@echo off
echo Starting Lease Lifecycle Test...
echo ================================

cd /d "%~dp0"
node test-lease-simple.mjs

if %errorlevel% neq 0 (
    echo.
    echo Test failed with error code %errorlevel%
    pause
    exit /b %errorlevel%
)

echo.
echo Test completed successfully!
pause


