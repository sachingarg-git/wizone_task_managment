# Stop the background application
Write-Host "Stopping all background npm jobs..."

# Get all running jobs
$jobs = Get-Job | Where-Object { $_.State -eq "Running" }

if ($jobs) {
    foreach ($job in $jobs) {
        Write-Host "Stopping Job ID: $($job.Id)..."
        Stop-Job -Id $job.Id
        Remove-Job -Id $job.Id
    }
    Write-Host "All jobs stopped successfully!"
} else {
    Write-Host "No running jobs found."
}

# Also kill any process on port 3007
$processOnPort = netstat -ano | Select-String ":3007" | ForEach-Object { 
    $_ -match "\s+(\d+)$" | Out-Null; $matches[1] 
} | Select-Object -First 1

if ($processOnPort) {
    Write-Host "Stopping process on port 3007 (PID: $processOnPort)..."
    Stop-Process -Id $processOnPort -Force -ErrorAction SilentlyContinue
    Write-Host "Process stopped successfully!"
}
