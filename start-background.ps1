# Start the application in background permanently
$projectPath = "D:\Sachin Garg Profile\New folder\ppll11\TaskScoreTracker"

# Kill any existing process on port 3007
$processOnPort = netstat -ano | Select-String ":3007" | ForEach-Object { 
    $_ -match "\s+(\d+)$" | Out-Null; $matches[1] 
} | Select-Object -First 1

if ($processOnPort) {
    Write-Host "Stopping existing process on port 3007 (PID: $processOnPort)..."
    Stop-Process -Id $processOnPort -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Start the application in background
Write-Host "Starting application in background..."
$job = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    npm run dev
} -ArgumentList $projectPath

Write-Host "Application started successfully!"
Write-Host "Job ID: $($job.Id)"
Write-Host "To check status: Get-Job $($job.Id)"
Write-Host "To view output: Receive-Job $($job.Id) -Keep"
Write-Host "To stop: Stop-Job $($job.Id); Remove-Job $($job.Id)"
Write-Host ""
Write-Host "Application is running on http://localhost:3007"
Write-Host "This PowerShell window can be closed. The app will continue running."
