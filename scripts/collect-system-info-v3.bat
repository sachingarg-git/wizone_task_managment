@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ========================================
:: WIZONE Customer Portal - System Info Collector
:: Version: 3.0 (Direct Authentication)
:: ========================================

title WIZONE System Information Collector

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║     WIZONE Customer Portal - System Information Collector     ║
echo ║                      Version 3.0                              ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

:: ========================================
:: CONFIGURATION - Server URL
:: ========================================
set "SERVER_URL=http://103.122.85.61:3007"

:: ========================================
:: USER INPUT SECTION
:: ========================================
echo ═══════════════════════════════════════════════════════════════
echo                      ENTER YOUR DETAILS
echo ═══════════════════════════════════════════════════════════════
echo.

set /p "USERNAME=Enter Portal Username: "
set /p "PASSWORD=Enter Portal Password: "
echo.
set /p "CUSTOMER_NAME=Enter Customer Name: "
echo.
set /p "SYSTEM_USER_NAME=Enter System User Name (who uses this PC): "

echo.
echo ───────────────────────────────────────────────────────────────
echo Username:    %USERNAME%
echo Customer:    %CUSTOMER_NAME%
echo System User: %SYSTEM_USER_NAME%
echo ───────────────────────────────────────────────────────────────
echo.

:: Create temp directory
if not exist "%TEMP%\wizone" mkdir "%TEMP%\wizone"

:: ========================================
:: COLLECT SYSTEM INFORMATION
:: ========================================
echo.
echo ═══════════════════════════════════════════════════════════════
echo              COLLECTING SYSTEM INFORMATION...
echo ═══════════════════════════════════════════════════════════════
echo.

:: Get Computer Name
for /f "tokens=2 delims==" %%a in ('wmic computersystem get name /value 2^>nul ^| find "="') do set "COMPUTER_NAME=%%a"
echo [OK] Computer Name: %COMPUTER_NAME%

:: Get System Type (Desktop/Laptop)
for /f "tokens=2 delims==" %%a in ('wmic computersystem get PCSystemType /value 2^>nul ^| find "="') do set "SYS_TYPE_NUM=%%a"
if "%SYS_TYPE_NUM%"=="2" (set "SYSTEM_TYPE=Laptop") else (set "SYSTEM_TYPE=Desktop")
echo [OK] System Type: %SYSTEM_TYPE%

:: Get Processor Information
for /f "tokens=2 delims==" %%a in ('wmic cpu get name /value 2^>nul ^| find "="') do set "PROCESSOR=%%a"
echo [OK] Processor: %PROCESSOR%

:: Get Processor Cores
for /f "tokens=2 delims==" %%a in ('wmic cpu get NumberOfCores /value 2^>nul ^| find "="') do set "PROCESSOR_CORES=%%a"
echo [OK] Processor Cores: %PROCESSOR_CORES%

:: Get Processor Speed (MHz)
for /f "tokens=2 delims==" %%a in ('wmic cpu get MaxClockSpeed /value 2^>nul ^| find "="') do set "PROCESSOR_SPEED=%%a MHz"
echo [OK] Processor Speed: %PROCESSOR_SPEED%

:: Get Total RAM
for /f "tokens=2 delims==" %%a in ('wmic computersystem get TotalPhysicalMemory /value 2^>nul ^| find "="') do set /a "RAM_BYTES=%%a"
set /a "RAM_GB=!RAM_BYTES! / 1073741824"
set "RAM=%RAM_GB% GB"
echo [OK] Total RAM: %RAM%

:: Get RAM Type and Frequency
set "RAM_TYPE=Unknown"
set "RAM_SPEED=Unknown"
for /f "skip=1 tokens=1,2" %%a in ('wmic memorychip get MemoryType^,Speed 2^>nul') do (
    if "%%a" NEQ "" (
        if "%%b" NEQ "" set "RAM_SPEED=%%b MHz"
        if "%%a"=="24" set "RAM_TYPE=DDR3"
        if "%%a"=="26" set "RAM_TYPE=DDR4"
        if "%%a"=="30" set "RAM_TYPE=DDR5"
    )
)
echo [OK] RAM Type: %RAM_TYPE%
echo [OK] RAM Frequency: %RAM_SPEED%

:: Get RAM Slots
set "RAM_SLOTS=1"
for /f %%a in ('wmic memorychip get BankLabel 2^>nul ^| find /c "BANK"') do set "RAM_SLOTS=%%a"
echo [OK] RAM Slots Used: %RAM_SLOTS%

:: Get Motherboard Information
for /f "tokens=2 delims==" %%a in ('wmic baseboard get product /value 2^>nul ^| find "="') do set "MOTHERBOARD=%%a"
echo [OK] Motherboard: %MOTHERBOARD%

for /f "tokens=2 delims==" %%a in ('wmic baseboard get manufacturer /value 2^>nul ^| find "="') do set "MOTHERBOARD_MFR=%%a"
echo [OK] Motherboard Manufacturer: %MOTHERBOARD_MFR%

:: Get HDD Information
set "HDD_INFO=Not Found"
set "HDD_CAPACITY=0 GB"
for /f "tokens=2 delims==" %%a in ('wmic diskdrive get Model /value 2^>nul ^| find "="') do set "HDD_INFO=%%a"
for /f "tokens=2 delims==" %%a in ('wmic diskdrive get Size /value 2^>nul ^| find "="') do (
    set /a "HDD_SIZE_GB=%%a / 1073741824"
    set "HDD_CAPACITY=!HDD_SIZE_GB! GB"
)
echo [OK] HDD: %HDD_INFO%
echo [OK] HDD Capacity: %HDD_CAPACITY%

:: Get SSD Information
set "SSD_INFO=Not Detected"
set "SSD_CAPACITY="
for /f "tokens=*" %%a in ('wmic diskdrive get Model 2^>nul ^| findstr /i "SSD NVMe"') do (
    set "SSD_INFO=%%a"
)
echo [OK] SSD: %SSD_INFO%

:: Get Graphics Card
for /f "tokens=2 delims==" %%a in ('wmic path win32_VideoController get name /value 2^>nul ^| find "="') do set "GRAPHICS_CARD=%%a"
echo [OK] Graphics Card: %GRAPHICS_CARD%

:: Get Graphics Memory
set "GRAPHICS_MEMORY=Unknown"
for /f "tokens=2 delims==" %%a in ('wmic path win32_VideoController get AdapterRAM /value 2^>nul ^| find "="') do (
    set /a "GRAPHICS_MB=%%a / 1048576"
    set "GRAPHICS_MEMORY=!GRAPHICS_MB! MB"
)
echo [OK] Graphics Memory: %GRAPHICS_MEMORY%

:: Get Operating System
for /f "tokens=2 delims==" %%a in ('wmic os get Caption /value 2^>nul ^| find "="') do set "OS_NAME=%%a"
echo [OK] Operating System: %OS_NAME%

:: Get OS Version
for /f "tokens=2 delims==" %%a in ('wmic os get Version /value 2^>nul ^| find "="') do set "OS_VERSION=%%a"
echo [OK] OS Version: %OS_VERSION%

:: Get OS Architecture
for /f "tokens=2 delims==" %%a in ('wmic os get OSArchitecture /value 2^>nul ^| find "="') do set "OS_ARCH=%%a"
echo [OK] OS Architecture: %OS_ARCH%

:: Get MAC Address
for /f "tokens=2 delims==" %%a in ('wmic nic where "NetConnectionStatus=2" get MACAddress /value 2^>nul ^| find "="') do set "MAC_ADDRESS=%%a"
echo [OK] MAC Address: %MAC_ADDRESS%

:: Get IP Address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do set "IP_ADDRESS=%%a"
set "IP_ADDRESS=%IP_ADDRESS: =%"
echo [OK] IP Address: %IP_ADDRESS%

:: Get Serial Number
for /f "tokens=2 delims==" %%a in ('wmic bios get serialnumber /value 2^>nul ^| find "="') do set "SERIAL_NUMBER=%%a"
echo [OK] Serial Number: %SERIAL_NUMBER%

:: Get BIOS Version
for /f "tokens=2 delims==" %%a in ('wmic bios get SMBIOSBIOSVersion /value 2^>nul ^| find "="') do set "BIOS_VERSION=%%a"
echo [OK] BIOS Version: %BIOS_VERSION%

:: Get Installed Antivirus
set "ANTIVIRUS=Not Detected"
for /f "tokens=2 delims==" %%a in ('wmic /namespace:\\root\SecurityCenter2 path AntiVirusProduct get displayName /value 2^>nul ^| find "="') do set "ANTIVIRUS=%%a"
echo [OK] Antivirus: %ANTIVIRUS%

:: Check for MS Office
set "MS_OFFICE=Not Installed"
reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Office" >nul 2>&1
if %ERRORLEVEL% EQU 0 set "MS_OFFICE=Microsoft Office Installed"
echo [OK] MS Office: %MS_OFFICE%

echo.
echo ═══════════════════════════════════════════════════════════════
echo                 SYSTEM INFORMATION COLLECTED
echo ═══════════════════════════════════════════════════════════════

:: ========================================
:: CREATE JSON PAYLOAD
:: ========================================
echo.
echo Creating data payload...

:: Create JSON file using PowerShell for proper escaping
set "JSON_FILE=%TEMP%\wizone\system_info.json"

powershell -Command "$json = @{ username = '%USERNAME%'; password = '%PASSWORD%'; customerName = '%CUSTOMER_NAME%'; systemUserName = '%SYSTEM_USER_NAME%'; systemInfo = @{ systemName = '%COMPUTER_NAME%'; systemType = '%SYSTEM_TYPE%'; processor = '%PROCESSOR%'; processorCores = '%PROCESSOR_CORES%'; processorSpeed = '%PROCESSOR_SPEED%'; ram = '%RAM%'; ramType = '%RAM_TYPE%'; ramFrequency = '%RAM_SPEED%'; ramSlots = '%RAM_SLOTS%'; motherboard = '%MOTHERBOARD%'; motherboardManufacturer = '%MOTHERBOARD_MFR%'; hardDisk = '%HDD_INFO%'; hddCapacity = '%HDD_CAPACITY%'; ssd = '%SSD_INFO%'; ssdCapacity = '%SSD_CAPACITY%'; graphicsCard = '%GRAPHICS_CARD%'; graphicsMemory = '%GRAPHICS_MEMORY%'; operatingSystem = '%OS_NAME%'; osVersion = '%OS_VERSION%'; osArchitecture = '%OS_ARCH%'; macAddress = '%MAC_ADDRESS%'; ipAddress = '%IP_ADDRESS%'; serialNumber = '%SERIAL_NUMBER%'; biosVersion = '%BIOS_VERSION%'; antivirus = '%ANTIVIRUS%'; msOffice = '%MS_OFFICE%' } }; $json | ConvertTo-Json -Depth 3 | Out-File -FilePath '%JSON_FILE%' -Encoding UTF8"

echo [OK] JSON payload created

:: ========================================
:: SEND DATA TO SERVER
:: ========================================
echo.
echo ═══════════════════════════════════════════════════════════════
echo              SENDING DATA TO SERVER...
echo ═══════════════════════════════════════════════════════════════
echo.
echo Server: %SERVER_URL%
echo Customer: %CUSTOMER_NAME%
echo Username: %USERNAME%
echo.

:: Use PowerShell to send HTTP request
powershell -Command "$ErrorActionPreference = 'Stop'; try { $json = Get-Content '%JSON_FILE%' -Raw -Encoding UTF8; Write-Host 'Uploading system information...'; $response = Invoke-RestMethod -Uri '%SERVER_URL%/api/system-info/collect' -Method POST -Body $json -ContentType 'application/json; charset=utf-8' -TimeoutSec 60; if ($response.success) { Write-Host ''; Write-Host '════════════════════════════════════════════════════════════' -ForegroundColor Green; Write-Host '                    SUCCESS!' -ForegroundColor Green; Write-Host '════════════════════════════════════════════════════════════' -ForegroundColor Green; Write-Host ''; Write-Host 'Record ID:' $response.recordId -ForegroundColor Cyan; Write-Host 'Customer:' $response.customer -ForegroundColor Cyan; Write-Host 'Engineer:' $response.engineer -ForegroundColor Cyan; Write-Host ''; Write-Host 'System information has been saved to the database!' -ForegroundColor Green; } else { Write-Host '[ERROR]' $response.message -ForegroundColor Red; } } catch { Write-Host ''; Write-Host '[ERROR] Failed to upload data:' -ForegroundColor Red; Write-Host $_.Exception.Message -ForegroundColor Red; Write-Host ''; Write-Host 'Please check:' -ForegroundColor Yellow; Write-Host '  1. Your internet connection' -ForegroundColor Yellow; Write-Host '  2. Server is running at %SERVER_URL%' -ForegroundColor Yellow; Write-Host '  3. Your username and password are correct' -ForegroundColor Yellow; }"

:: Save local copy
set "LOCAL_REPORT=%USERPROFILE%\Desktop\SystemInfo_%COMPUTER_NAME%_%DATE:~10,4%%DATE:~4,2%%DATE:~7,2%.txt"

(
echo ════════════════════════════════════════════════════════════════
echo            WIZONE SYSTEM INFORMATION REPORT
echo ════════════════════════════════════════════════════════════════
echo.
echo Generated: %DATE% %TIME%
echo Customer: %CUSTOMER_NAME%
echo Username: %USERNAME%
echo System User: %SYSTEM_USER_NAME%
echo.
echo ════════════════════════════════════════════════════════════════
echo SYSTEM DETAILS
echo ════════════════════════════════════════════════════════════════
echo.
echo Computer Name:         %COMPUTER_NAME%
echo System Type:           %SYSTEM_TYPE%
echo Serial Number:         %SERIAL_NUMBER%
echo.
echo ════════════════════════════════════════════════════════════════
echo PROCESSOR
echo ════════════════════════════════════════════════════════════════
echo.
echo Processor:             %PROCESSOR%
echo Cores:                 %PROCESSOR_CORES%
echo Speed:                 %PROCESSOR_SPEED%
echo.
echo ════════════════════════════════════════════════════════════════
echo MEMORY [RAM]
echo ════════════════════════════════════════════════════════════════
echo.
echo Total RAM:             %RAM%
echo RAM Type:              %RAM_TYPE%
echo RAM Frequency:         %RAM_SPEED%
echo RAM Slots Used:        %RAM_SLOTS%
echo.
echo ════════════════════════════════════════════════════════════════
echo MOTHERBOARD
echo ════════════════════════════════════════════════════════════════
echo.
echo Motherboard:           %MOTHERBOARD%
echo Manufacturer:          %MOTHERBOARD_MFR%
echo BIOS Version:          %BIOS_VERSION%
echo.
echo ════════════════════════════════════════════════════════════════
echo STORAGE
echo ════════════════════════════════════════════════════════════════
echo.
echo HDD:                   %HDD_INFO%
echo HDD Capacity:          %HDD_CAPACITY%
echo SSD:                   %SSD_INFO%
echo SSD Capacity:          %SSD_CAPACITY%
echo.
echo ════════════════════════════════════════════════════════════════
echo GRAPHICS
echo ════════════════════════════════════════════════════════════════
echo.
echo Graphics Card:         %GRAPHICS_CARD%
echo Graphics Memory:       %GRAPHICS_MEMORY%
echo.
echo ════════════════════════════════════════════════════════════════
echo OPERATING SYSTEM
echo ════════════════════════════════════════════════════════════════
echo.
echo OS:                    %OS_NAME%
echo Version:               %OS_VERSION%
echo Architecture:          %OS_ARCH%
echo.
echo ════════════════════════════════════════════════════════════════
echo NETWORK
echo ════════════════════════════════════════════════════════════════
echo.
echo MAC Address:           %MAC_ADDRESS%
echo IP Address:            %IP_ADDRESS%
echo.
echo ════════════════════════════════════════════════════════════════
echo SOFTWARE
echo ════════════════════════════════════════════════════════════════
echo.
echo Antivirus:             %ANTIVIRUS%
echo MS Office:             %MS_OFFICE%
echo.
echo ════════════════════════════════════════════════════════════════
) > "%LOCAL_REPORT%"

echo.
echo [OK] Local report saved to: %LOCAL_REPORT%
echo.

:: Cleanup
del "%JSON_FILE%" 2>nul

echo ═══════════════════════════════════════════════════════════════
echo                        COMPLETE!
echo ═══════════════════════════════════════════════════════════════
echo.
echo Press any key to exit...
pause >nul

endlocal
