# Start WIZONE Task Manager Server as background process
$scriptPath = "d:\Sachin Garg Profile\New folder\ppll11\TaskScoreTracker"
$logFile = Join-Path $scriptPath "logs\server.log"
$errorLogFile = Join-Path $scriptPath "logs\server-error.log"
$pidFile = Join-Path $scriptPath "server.pid"

# Create logs directory if it doesn't exist
$logsDir = Join-Path $scriptPath "logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Force -Path $logsDir | Out-Null
}

# Kill any existing node process on port 3007
Write-Host "Checking for existing server on port 3007..."
$existingProcess = Get-NetTCPConnection -LocalPort 3007 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($existingProcess) {
    Write-Host "Stopping existing process (PID: $existingProcess)..."
    Stop-Process -Id $existingProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Start server in background
Write-Host "Starting WIZONE Task Manager Server..."
Write-Host "Logs will be written to: $logFile"

$process = Start-Process -FilePath "node" `
    -ArgumentList "dist/index.js" `
    -WorkingDirectory $scriptPath `
    -WindowStyle Hidden `
    -PassThru `
    -RedirectStandardOutput $logFile `
    -RedirectStandardError $errorLogFile

Write-Host ""
Write-Host "[SUCCESS] Server started successfully!" -ForegroundColor Green
Write-Host "   Process ID: $($process.Id)" -ForegroundColor Cyan
Write-Host "   Port: 3007" -ForegroundColor Cyan
Write-Host "   Logs: $logFile" -ForegroundColor Cyan
Write-Host ""
Write-Host "[WEB] Access the application at: http://103.122.85.61:3007" -ForegroundColor Yellow
Write-Host "[MOBILE] Mobile APK: Use http://103.122.85.61:3007" -ForegroundColor Yellow
Write-Host ""
Write-Host "To stop the server, run: .\stop-server.ps1" -ForegroundColor Gray
Write-Host ""

# Save PID to file for later stopping
$process.Id | Out-File -FilePath $pidFile
