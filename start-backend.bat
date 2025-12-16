@echo off
title TaskScoreTracker Backend Server - Port 3001
color 0A
echo ========================================
echo    TaskScoreTracker Backend Starting
echo ========================================
echo.
cd /d "d:\Sachin Garg Profile\New folder\ppll11\TaskScoreTracker\server"
echo Starting backend server on http://localhost:3001
echo Login: admin / admin123
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.
:start
node backend-server.cjs
echo.
echo Server stopped. Restarting in 5 seconds...
echo Press Ctrl+C to exit permanently
timeout /t 5 /nobreak >nul
goto start