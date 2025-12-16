@echo off
:: WIZONE Customer Portal - System Info Collector Launcher
:: This batch file launches the PowerShell script

title WIZONE System Information Collector

:: Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"

:: Run the PowerShell script
powershell -ExecutionPolicy Bypass -File "%SCRIPT_DIR%collect-system-info.ps1"

pause
