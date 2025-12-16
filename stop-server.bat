@echo off
REM TaskScoreTracker - Stop Server
REM This script stops all server processes

echo Stopping TaskScoreTracker Server...

REM Kill any process on port 3007
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3007 2^>nul') do (
    echo Stopping process PID: %%a
    taskkill /F /PID %%a 2>nul
)

REM Also kill any node processes running npm
taskkill /F /IM node.exe 2>nul

echo ========================================
echo Server stopped successfully!
echo ========================================
