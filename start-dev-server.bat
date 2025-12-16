@echo off
echo Starting Task Score Tracker Development Server...
cd /d "%~dp0"
start "Task Tracker Server" /MIN cmd /k "npm run dev"
echo.
echo ============================================
echo Server started in minimized window!
echo Server running at: http://localhost:5173
echo Backend API at: http://localhost:3007
echo ============================================
echo.
echo The server will continue running in the background.
echo To stop it, find "Task Tracker Server" window and close it.
echo.
pause
