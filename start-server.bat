@echo off
title Wizone IT Support Portal Server
echo ============================================
echo    WIZONE IT SUPPORT PORTAL SERVER
echo ============================================
echo Starting server on port 8080...
echo.

cd /d "d:\Sachin Garg Profile\New folder\ppll11\TaskScoreTracker\dist\public"

echo Files in directory:
dir /b

echo.
echo Starting Python HTTP server...
echo Server will be available at: http://localhost:8080
echo Press Ctrl+C to stop the server
echo ============================================
echo.

python -m http.server 8080

pause