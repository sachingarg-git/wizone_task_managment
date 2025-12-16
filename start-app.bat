@echo off
title TaskScoreTracker Server
cd /d "d:\Sachin Garg Profile\New folder\ppll11\TaskScoreTracker\server"
echo Starting TaskScoreTracker Server on port 7777...
echo.
node static-only-server.cjs
echo.
echo Server stopped. Press any key to restart or close this window.
pause
goto :start