@echo off
title TaskScoreTracker Server - Port 8000
color 0A
echo ========================================
echo    TaskScoreTracker Server Starting
echo ========================================
echo.
cd /d "d:\Sachin Garg Profile\New folder\ppll11\TaskScoreTracker\dist\public"
echo Starting server on http://127.0.0.1:8000
echo Press Ctrl+C to stop the server
echo.
:start
node robust-server.cjs
echo.
echo Server stopped. Restarting in 5 seconds...
echo Press Ctrl+C to exit permanently
timeout /t 5 /nobreak >nul
goto start