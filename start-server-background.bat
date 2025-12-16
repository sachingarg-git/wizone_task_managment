@echo off
REM TaskScoreTracker - Start Server in Background
REM This script starts the server hidden in the background

cd /d "D:\Sachin Garg Profile\New folder\ppll11\TaskScoreTracker"

REM Kill any existing process on port 3007
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3007 2^>nul') do (
    echo Stopping existing process on port 3007...
    taskkill /F /PID %%a 2>nul
)

timeout /t 2 /nobreak >nul

REM Start the server in a hidden window using VBS
echo Set WshShell = CreateObject("WScript.Shell") > "%temp%\start_hidden.vbs"
echo WshShell.Run chr(34) ^& "D:\Sachin Garg Profile\New folder\ppll11\TaskScoreTracker\run-server.bat" ^& chr(34), 0 >> "%temp%\start_hidden.vbs"
echo Set WshShell = Nothing >> "%temp%\start_hidden.vbs"

cscript //nologo "%temp%\start_hidden.vbs"
del "%temp%\start_hidden.vbs"

echo ========================================
echo TaskScoreTracker Server Started!
echo Running in background on port 3007
echo URL: http://103.122.85.61:3007
echo ========================================
echo.
echo To stop the server, run: stop-server.bat
