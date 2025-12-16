# Stop WIZONE Task Manager Server
$scriptPath = "d:\Sachin Garg Profile\New folder\ppll11\TaskScoreTracker"
$pidFile = Join-Path $scriptPath "server.pid"

if (Test-Path $pidFile) {
    $serverPid = Get-Content $pidFile
    Write-Host "Stopping server (PID: $serverPid)..."
    
    try {
        Stop-Process -Id $serverPid -Force -ErrorAction Stop
        Remove-Item $pidFile
        Write-Host "[SUCCESS] Server stopped successfully!" -ForegroundColor Green
    } catch {
        Write-Host "[WARNING] Process not found or already stopped." -ForegroundColor Yellow
        Remove-Item $pidFile -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "[INFO] No PID file found. Checking port 3007..." -ForegroundColor Yellow
    
    $existingProcess = Get-NetTCPConnection -LocalPort 3007 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($existingProcess) {
        Write-Host "Found process on port 3007 (PID: $existingProcess). Stopping..."
        Stop-Process -Id $existingProcess -Force
        Write-Host "[SUCCESS] Server stopped successfully!" -ForegroundColor Green
    } else {
        Write-Host "[INFO] No server running on port 3007." -ForegroundColor Cyan
    }
}
