# WIZONE Customer Portal - System Info Collector
# Version: 5.0 (PowerShell Version)
# Run this script: powershell -ExecutionPolicy Bypass -File collect-system-info.ps1

$ErrorActionPreference = "Stop"

# Configuration
$SERVER_URL = "http://103.122.85.61:3007"

Write-Host ""
Write-Host "========================================================"
Write-Host "   WIZONE Customer Portal - System Information Collector"
Write-Host "                      Version 5.0"
Write-Host "========================================================"
Write-Host ""

# Step 1: Login
Write-Host "========================================================"
Write-Host "                STEP 1: CUSTOMER PORTAL LOGIN"
Write-Host "========================================================"
Write-Host ""

$PORTAL_USER = Read-Host "Portal Username"
$PORTAL_PASS = Read-Host "Portal Password"

Write-Host ""
Write-Host "Authenticating with Customer Portal..."

try {
    $loginBody = @{
        username = $PORTAL_USER
        password = $PORTAL_PASS
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$SERVER_URL/api/system-info/login" -Method POST -Body $loginBody -ContentType "application/json; charset=utf-8" -TimeoutSec 30
    
    if ($loginResponse.success) {
        $CUSTOMER_NAME = $loginResponse.customerName
        $CUSTOMER_ID = $loginResponse.customerId
        
        Write-Host ""
        Write-Host "========================================================"
        Write-Host "                  LOGIN SUCCESSFUL!" -ForegroundColor Green
        Write-Host "========================================================"
        Write-Host ""
        Write-Host "Welcome - $CUSTOMER_NAME" -ForegroundColor Cyan
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "LOGIN FAILED: $($loginResponse.message)" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "LOGIN ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 2: Enter Details
Write-Host "========================================================"
Write-Host "                 STEP 2: ENTER DETAILS"
Write-Host "========================================================"
Write-Host ""
Write-Host "Customer: $CUSTOMER_NAME"
Write-Host ""

$ENGINEER_NAME = Read-Host "Enter Engineer Name (your name)"
$SYSTEM_USER_NAME = Read-Host "Enter System User Name (who uses this PC)"

Write-Host ""
Write-Host "--------------------------------------------------------"
Write-Host "Customer:    $CUSTOMER_NAME"
Write-Host "Engineer:    $ENGINEER_NAME"
Write-Host "System User: $SYSTEM_USER_NAME"
Write-Host "--------------------------------------------------------"

# Step 3: Collect System Information
Write-Host ""
Write-Host "========================================================"
Write-Host "             STEP 3: COLLECTING SYSTEM INFORMATION..."
Write-Host "========================================================"
Write-Host ""

$cs = Get-CimInstance Win32_ComputerSystem
$cpu = Get-CimInstance Win32_Processor
$os = Get-CimInstance Win32_OperatingSystem
$bios = Get-CimInstance Win32_BIOS
$mb = Get-CimInstance Win32_BaseBoard
$gpu = Get-CimInstance Win32_VideoController | Select-Object -First 1
$disk = Get-CimInstance Win32_DiskDrive | Select-Object -First 1
$mem = Get-CimInstance Win32_PhysicalMemory | Select-Object -First 1
$net = Get-CimInstance Win32_NetworkAdapterConfiguration | Where-Object { $_.IPEnabled } | Select-Object -First 1

# Get antivirus
try {
    $av = Get-CimInstance -Namespace "root/SecurityCenter2" -ClassName AntiVirusProduct | Select-Object -First 1
    $antivirusName = if ($av) { $av.displayName } else { "Not Detected" }
} catch {
    $antivirusName = "Not Detected"
}

# Calculate values
$sysType = if ($cs.PCSystemType -eq 2) { "Laptop" } else { "Desktop" }
$ramGB = [math]::Round($cs.TotalPhysicalMemory / 1GB)
$diskGB = if ($disk.Size) { [math]::Round($disk.Size / 1GB) } else { 0 }
$gpuMB = if ($gpu.AdapterRAM) { [math]::Round($gpu.AdapterRAM / 1MB) } else { 0 }
$memType = switch ($mem.SMBIOSMemoryType) { 24 { "DDR3" } 26 { "DDR4" } 34 { "DDR5" } default { "Unknown" } }
$memSpeed = if ($mem.Speed) { "$($mem.Speed) MHz" } else { "Unknown" }
$memSlots = (Get-CimInstance Win32_PhysicalMemory).Count
$office = if (Test-Path "HKLM:\SOFTWARE\Microsoft\Office") { "Microsoft Office Installed" } else { "Not Installed" }
$ssdInfo = if ($disk.Model -match "SSD|NVMe") { $disk.Model } else { "Not Detected" }

Write-Host "[OK] Computer Name: $($cs.Name)"
Write-Host "[OK] System Type: $sysType"
Write-Host "[OK] Processor: $($cpu.Name)"
Write-Host "[OK] Processor Cores: $($cpu.NumberOfCores)"
Write-Host "[OK] RAM: $ramGB GB ($memType, $memSpeed)"
Write-Host "[OK] Motherboard: $($mb.Product)"
Write-Host "[OK] HDD: $($disk.Model) ($diskGB GB)"
Write-Host "[OK] Graphics: $($gpu.Name)"
Write-Host "[OK] OS: $($os.Caption)"
Write-Host "[OK] Serial: $($bios.SerialNumber)"
Write-Host "[OK] MAC: $($net.MACAddress)"
Write-Host "[OK] IP: $($net.IPAddress | Select-Object -First 1)"
Write-Host "[OK] Antivirus: $antivirusName"
Write-Host "[OK] MS Office: $office"
Write-Host ""

# Step 4: Create JSON and Send to Server
Write-Host "========================================================"
Write-Host "             STEP 4: SENDING DATA TO SERVER..."
Write-Host "========================================================"
Write-Host ""
Write-Host "Server: $SERVER_URL"
Write-Host "Customer: $CUSTOMER_NAME"
Write-Host "Engineer: $ENGINEER_NAME"
Write-Host ""

$systemInfo = @{
    username = $PORTAL_USER
    password = $PORTAL_PASS
    engineerName = $ENGINEER_NAME
    systemUserName = $SYSTEM_USER_NAME
    customerName = $CUSTOMER_NAME
    customerId = [string]$CUSTOMER_ID
    systemInfo = @{
        systemName = $cs.Name
        systemType = $sysType
        processor = $cpu.Name
        processorCores = [string]$cpu.NumberOfCores
        processorSpeed = "$($cpu.MaxClockSpeed) MHz"
        ram = "$ramGB GB"
        ramType = $memType
        ramFrequency = $memSpeed
        ramSlots = [string]$memSlots
        motherboard = $mb.Product
        motherboardManufacturer = $mb.Manufacturer
        hardDisk = $disk.Model
        hddCapacity = "$diskGB GB"
        ssd = $ssdInfo
        ssdCapacity = ""
        graphicsCard = $gpu.Name
        graphicsMemory = "$gpuMB MB"
        operatingSystem = $os.Caption
        osVersion = $os.Version
        osArchitecture = $os.OSArchitecture
        macAddress = $net.MACAddress
        ipAddress = ($net.IPAddress | Select-Object -First 1)
        serialNumber = $bios.SerialNumber
        biosVersion = $bios.SMBIOSBIOSVersion
        antivirus = $antivirusName
        msOffice = $office
    }
}

$jsonBody = $systemInfo | ConvertTo-Json -Depth 3

Write-Host "Uploading system information..."

try {
    $response = Invoke-RestMethod -Uri "$SERVER_URL/api/system-info/collect" -Method POST -Body $jsonBody -ContentType "application/json; charset=utf-8" -TimeoutSec 60
    
    if ($response.success) {
        Write-Host ""
        Write-Host "========================================================"
        Write-Host "                      SUCCESS!" -ForegroundColor Green
        Write-Host "========================================================"
        Write-Host ""
        Write-Host "Record ID: $($response.recordId)" -ForegroundColor Cyan
        Write-Host "Customer: $($response.customer)" -ForegroundColor Cyan
        Write-Host "Engineer: $($response.engineer)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "System information saved to database!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "[ERROR] $($response.message)" -ForegroundColor Red
    }
} catch {
    Write-Host ""
    Write-Host "[ERROR] Failed to upload data:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "  1. Your internet connection" -ForegroundColor Yellow
    Write-Host "  2. Server is running at $SERVER_URL" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================================"
Write-Host "                        COMPLETE!"
Write-Host "========================================================"
Write-Host ""
Read-Host "Press Enter to exit"
