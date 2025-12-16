@echo off
title TaskScoreTracker Server
cd /d "D:\Sachin Garg Profile\New folder\ppll11\TaskScoreTracker"

:start
echo ========================================
echo Starting TaskScoreTracker Server...
echo Time: %date% %time%
echo ========================================

REM Kill any existing process on port 3007
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3007 2^>nul') do (
    taskkill /F /PID %%a 2>nul
)

timeout /t 2 /nobreak >nul

REM Run the server
call npm run dev

echo.
echo ========================================
echo Server stopped or crashed!
echo Restarting in 5 seconds...
echo ========================================
timeout /t 5 /nobreak >nul
goto start
