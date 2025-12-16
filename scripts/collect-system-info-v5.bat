@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ========================================
:: WIZONE Customer Portal - System Info Collector
:: Version: 5.0 (Fixed PowerShell Escaping)
:: ========================================

title WIZONE System Information Collector

echo.
echo ========================================================
echo    WIZONE Customer Portal - System Information Collector
echo                      Version 5.0
echo ========================================================
echo.

:: ========================================
:: CONFIGURATION - Server URL
:: ========================================
set "SERVER_URL=http://103.122.85.61:3007"

:: Create temp directory
if not exist "%TEMP%\wizone" mkdir "%TEMP%\wizone"

:: ========================================
:: STEP 1: CUSTOMER PORTAL LOGIN
:: ========================================
echo ========================================================
echo                 STEP 1: CUSTOMER PORTAL LOGIN
echo ========================================================
echo.
echo Enter your Customer Portal login credentials:
echo.

set /p "PORTAL_USER=Portal Username: "
set /p "PORTAL_PASS=Portal Password: "

echo.
echo Authenticating with Customer Portal...

:: Create login request using PowerShell
for /f "delims=" %%i in ('powershell -Command "$body = @{username='%PORTAL_USER%';password='%PORTAL_PASS%'} | ConvertTo-Json; try { $r = Invoke-RestMethod -Uri '%SERVER_URL%/api/system-info/login' -Method POST -Body $body -ContentType 'application/json' -TimeoutSec 30; if($r.success){'SUCCESS|'+$r.customerName+'|'+$r.customerId}else{'FAILED|'+$r.message} } catch { 'ERROR|'+$_.Exception.Message }"') do set "LOGIN_RESULT=%%i"

:: Parse login result
for /f "tokens=1,2,3 delims=|" %%a in ("!LOGIN_RESULT!") do (
    set "AUTH_STATUS=%%a"
    set "CUSTOMER_NAME=%%b"
    set "CUSTOMER_ID=%%c"
)

if "!AUTH_STATUS!"=="SUCCESS" (
    echo.
    echo ========================================================
    echo                  LOGIN SUCCESSFUL!
    echo ========================================================
    echo.
    echo Welcome - !CUSTOMER_NAME!
    echo.
) else (
    echo.
    echo ========================================================
    echo                  LOGIN FAILED!
    echo ========================================================
    echo.
    echo !CUSTOMER_NAME!
    echo.
    echo Please check your Customer Portal username and password.
    echo.
    pause
    exit /b 1
)

:: ========================================
:: STEP 2: ENTER ADDITIONAL DETAILS
:: ========================================
echo ========================================================
echo                 STEP 2: ENTER DETAILS
echo ========================================================
echo.
echo Customer: !CUSTOMER_NAME!
echo.

set /p "ENGINEER_NAME=Enter Engineer Name (your name): "
set /p "SYSTEM_USER_NAME=Enter System User Name (who uses this PC): "

echo.
echo --------------------------------------------------------
echo Customer:    !CUSTOMER_NAME!
echo Engineer:    !ENGINEER_NAME!
echo System User: !SYSTEM_USER_NAME!
echo --------------------------------------------------------

:: ========================================
:: STEP 3: COLLECT SYSTEM INFORMATION
:: ========================================
echo.
echo ========================================================
echo              STEP 3: COLLECTING SYSTEM INFORMATION...
echo ========================================================
echo.

:: Use PowerShell to collect all system info and create JSON directly
set "JSON_FILE=%TEMP%\wizone\system_info.json"
set "RESULT_FILE=%TEMP%\wizone\upload_result.txt"

echo Collecting system information via PowerShell...

powershell -ExecutionPolicy Bypass -Command ^
"$ErrorActionPreference = 'SilentlyContinue'; ^
$cs = Get-CimInstance Win32_ComputerSystem; ^
$cpu = Get-CimInstance Win32_Processor; ^
$os = Get-CimInstance Win32_OperatingSystem; ^
$bios = Get-CimInstance Win32_BIOS; ^
$mb = Get-CimInstance Win32_BaseBoard; ^
$gpu = Get-CimInstance Win32_VideoController; ^
$disk = Get-CimInstance Win32_DiskDrive | Select-Object -First 1; ^
$mem = Get-CimInstance Win32_PhysicalMemory | Select-Object -First 1; ^
$net = Get-CimInstance Win32_NetworkAdapterConfiguration | Where-Object { $_.IPEnabled } | Select-Object -First 1; ^
$av = Get-CimInstance -Namespace 'root/SecurityCenter2' -ClassName AntiVirusProduct -ErrorAction SilentlyContinue | Select-Object -First 1; ^
$sysType = if($cs.PCSystemType -eq 2){'Laptop'}else{'Desktop'}; ^
$ramGB = [math]::Round($cs.TotalPhysicalMemory / 1GB); ^
$diskGB = if($disk.Size){[math]::Round($disk.Size / 1GB)}else{0}; ^
$gpuMB = if($gpu.AdapterRAM){[math]::Round($gpu.AdapterRAM / 1MB)}else{0}; ^
$memType = switch($mem.SMBIOSMemoryType){24{'DDR3'}26{'DDR4'}34{'DDR5'}default{'Unknown'}}; ^
$memSpeed = if($mem.Speed){\"$($mem.Speed) MHz\"}else{'Unknown'}; ^
$office = if(Test-Path 'HKLM:\SOFTWARE\Microsoft\Office'){'Microsoft Office Installed'}else{'Not Installed'}; ^
Write-Host '[OK] Computer Name:' $cs.Name; ^
Write-Host '[OK] System Type:' $sysType; ^
Write-Host '[OK] Processor:' $cpu.Name; ^
Write-Host '[OK] RAM:' $ramGB 'GB'; ^
Write-Host '[OK] OS:' $os.Caption; ^
Write-Host '[OK] Serial:' $bios.SerialNumber; ^
$json = @{ ^
    username = '%PORTAL_USER%'; ^
    password = '%PORTAL_PASS%'; ^
    engineerName = '%ENGINEER_NAME%'; ^
    systemUserName = '%SYSTEM_USER_NAME%'; ^
    customerName = '!CUSTOMER_NAME!'; ^
    customerId = '!CUSTOMER_ID!'; ^
    systemInfo = @{ ^
        systemName = $cs.Name; ^
        systemType = $sysType; ^
        processor = $cpu.Name; ^
        processorCores = [string]$cpu.NumberOfCores; ^
        processorSpeed = \"$($cpu.MaxClockSpeed) MHz\"; ^
        ram = \"$ramGB GB\"; ^
        ramType = $memType; ^
        ramFrequency = $memSpeed; ^
        ramSlots = [string]((Get-CimInstance Win32_PhysicalMemory).Count); ^
        motherboard = $mb.Product; ^
        motherboardManufacturer = $mb.Manufacturer; ^
        hardDisk = $disk.Model; ^
        hddCapacity = \"$diskGB GB\"; ^
        ssd = if($disk.Model -match 'SSD|NVMe'){$disk.Model}else{'Not Detected'}; ^
        ssdCapacity = ''; ^
        graphicsCard = $gpu.Name; ^
        graphicsMemory = \"$gpuMB MB\"; ^
        operatingSystem = $os.Caption; ^
        osVersion = $os.Version; ^
        osArchitecture = $os.OSArchitecture; ^
        macAddress = $net.MACAddress; ^
        ipAddress = ($net.IPAddress | Select-Object -First 1); ^
        serialNumber = $bios.SerialNumber; ^
        biosVersion = $bios.SMBIOSBIOSVersion; ^
        antivirus = if($av){$av.displayName}else{'Not Detected'}; ^
        msOffice = $office ^
    } ^
}; ^
$json | ConvertTo-Json -Depth 3 | Out-File -FilePath '%JSON_FILE%' -Encoding UTF8; ^
Write-Host ''; ^
Write-Host '[OK] JSON payload created'; ^
Write-Host ''; ^
Write-Host 'Uploading to server...'; ^
try { ^
    $jsonContent = Get-Content '%JSON_FILE%' -Raw -Encoding UTF8; ^
    $response = Invoke-RestMethod -Uri '%SERVER_URL%/api/system-info/collect' -Method POST -Body $jsonContent -ContentType 'application/json; charset=utf-8' -TimeoutSec 60; ^
    if ($response.success) { ^
        Write-Host ''; ^
        Write-Host '========================================' -ForegroundColor Green; ^
        Write-Host '              SUCCESS!' -ForegroundColor Green; ^
        Write-Host '========================================' -ForegroundColor Green; ^
        Write-Host ''; ^
        Write-Host 'Record ID:' $response.recordId -ForegroundColor Cyan; ^
        Write-Host 'Customer:' $response.customer -ForegroundColor Cyan; ^
        Write-Host 'Engineer:' $response.engineer -ForegroundColor Cyan; ^
        Write-Host ''; ^
        Write-Host 'System information saved to database!' -ForegroundColor Green; ^
        'SUCCESS' | Out-File '%RESULT_FILE%' ^
    } else { ^
        Write-Host '[ERROR]' $response.message -ForegroundColor Red; ^
        'FAILED' | Out-File '%RESULT_FILE%' ^
    } ^
} catch { ^
    Write-Host ''; ^
    Write-Host '[ERROR] Failed to upload:' -ForegroundColor Red; ^
    Write-Host $_.Exception.Message -ForegroundColor Red; ^
    'ERROR' | Out-File '%RESULT_FILE%' ^
}"

echo.
echo ========================================================
echo                        COMPLETE!
echo ========================================================
echo.
echo Press any key to exit...
pause >nul

endlocal
