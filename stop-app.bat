@echo off
echo Stopping TaskScoreTracker...

REM Kill any process on port 3007
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3007') do (
    echo Stopping process %%a
    taskkill /F /PID %%a
)

echo Application stopped successfully!
