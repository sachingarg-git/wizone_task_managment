@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ========================================
:: WIZONE Customer Portal - System Info Collector
:: Version: 4.0 (Customer Portal Login)
:: ========================================

title WIZONE System Information Collector

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║     WIZONE Customer Portal - System Information Collector     ║
echo ║                      Version 4.0                              ║
echo ╚═══════════════════════════════════════════════════════════════╝
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
echo ═══════════════════════════════════════════════════════════════
echo                 STEP 1: CUSTOMER PORTAL LOGIN
echo ═══════════════════════════════════════════════════════════════
echo.
echo Enter your Customer Portal login credentials:
echo.

set /p "PORTAL_USER=Portal Username: "
set /p "PORTAL_PASS=Portal Password: "

echo.
echo Authenticating with Customer Portal...

:: Create login JSON
set "LOGIN_JSON=%TEMP%\wizone\login.json"
(
echo {"username": "%PORTAL_USER%", "password": "%PORTAL_PASS%"}
) > "%LOGIN_JSON%"

:: Call login API
set "AUTH_RESULT=%TEMP%\wizone\auth_result.txt"

powershell -Command "$ErrorActionPreference = 'Stop'; try { $json = Get-Content '%LOGIN_JSON%' -Raw -Encoding UTF8; $response = Invoke-RestMethod -Uri '%SERVER_URL%/api/system-info/login' -Method POST -Body $json -ContentType 'application/json; charset=utf-8' -TimeoutSec 30; if ($response.success) { Write-Output 'SUCCESS'; Write-Output $response.customerName; Write-Output $response.customerId; } else { Write-Output 'FAILED'; Write-Output $response.message; } } catch { $err = $_.Exception.Response; if ($err) { $reader = New-Object System.IO.StreamReader($err.GetResponseStream()); $errBody = $reader.ReadToEnd() | ConvertFrom-Json; Write-Output 'FAILED'; Write-Output $errBody.message; } else { Write-Output 'ERROR'; Write-Output $_.Exception.Message; } }" > "%AUTH_RESULT%" 2>&1

:: Read auth result
set /p "AUTH_STATUS=" < "%AUTH_RESULT%"

if "%AUTH_STATUS%"=="SUCCESS" (
    :: Read customer name from result
    for /f "skip=1 tokens=*" %%a in (%AUTH_RESULT%) do (
        if not defined CUSTOMER_NAME (
            set "CUSTOMER_NAME=%%a"
        ) else if not defined CUSTOMER_ID (
            set "CUSTOMER_ID=%%a"
        )
    )
    
    echo.
    echo ════════════════════════════════════════════════════════════
    echo                  LOGIN SUCCESSFUL!
    echo ════════════════════════════════════════════════════════════
    echo.
    echo Welcome - !CUSTOMER_NAME!
    echo.
) else (
    echo.
    echo ════════════════════════════════════════════════════════════
    echo                  LOGIN FAILED!
    echo ════════════════════════════════════════════════════════════
    echo.
    type "%AUTH_RESULT%"
    echo.
    echo Please check your Customer Portal username and password.
    echo.
    pause
    exit /b 1
)

:: ========================================
:: STEP 2: ENTER ADDITIONAL DETAILS
:: ========================================
echo ═══════════════════════════════════════════════════════════════
echo                 STEP 2: ENTER DETAILS
echo ═══════════════════════════════════════════════════════════════
echo.
echo Customer: !CUSTOMER_NAME!
echo.

set /p "ENGINEER_NAME=Enter Engineer Name (your name): "
set /p "SYSTEM_USER_NAME=Enter System User Name (who uses this PC): "

echo.
echo ───────────────────────────────────────────────────────────────
echo Customer:    !CUSTOMER_NAME!
echo Engineer:    %ENGINEER_NAME%
echo System User: %SYSTEM_USER_NAME%
echo ───────────────────────────────────────────────────────────────

:: ========================================
:: STEP 3: COLLECT SYSTEM INFORMATION
:: ========================================
echo.
echo ═══════════════════════════════════════════════════════════════
echo              STEP 3: COLLECTING SYSTEM INFORMATION...
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
:: STEP 4: CREATE JSON AND SEND TO SERVER
:: ========================================
echo.
echo Creating data payload...

:: Create JSON file using PowerShell to handle special characters properly
set "JSON_FILE=%TEMP%\wizone\system_info.json"
set "PS_CREATE=%TEMP%\wizone\create_json.ps1"

:: Write PowerShell script to create JSON (handles special chars)
> "%PS_CREATE%" echo $json = @{
>> "%PS_CREATE%" echo     username = '%PORTAL_USER%'
>> "%PS_CREATE%" echo     password = '%PORTAL_PASS%'
>> "%PS_CREATE%" echo     engineerName = '%ENGINEER_NAME%'
>> "%PS_CREATE%" echo     systemUserName = '%SYSTEM_USER_NAME%'
>> "%PS_CREATE%" echo     customerName = '!CUSTOMER_NAME!'
>> "%PS_CREATE%" echo     customerId = '!CUSTOMER_ID!'
>> "%PS_CREATE%" echo     systemInfo = @{
>> "%PS_CREATE%" echo         systemName = '%COMPUTER_NAME%'
>> "%PS_CREATE%" echo         systemType = '%SYSTEM_TYPE%'
>> "%PS_CREATE%" echo         processor = '%PROCESSOR%'
>> "%PS_CREATE%" echo         processorCores = '%PROCESSOR_CORES%'
>> "%PS_CREATE%" echo         processorSpeed = '%PROCESSOR_SPEED%'
>> "%PS_CREATE%" echo         ram = '%RAM%'
>> "%PS_CREATE%" echo         ramType = '%RAM_TYPE%'
>> "%PS_CREATE%" echo         ramFrequency = '%RAM_SPEED%'
>> "%PS_CREATE%" echo         ramSlots = '%RAM_SLOTS%'
>> "%PS_CREATE%" echo         motherboard = '%MOTHERBOARD%'
>> "%PS_CREATE%" echo         motherboardManufacturer = '%MOTHERBOARD_MFR%'
>> "%PS_CREATE%" echo         hardDisk = '%HDD_INFO%'
>> "%PS_CREATE%" echo         hddCapacity = '%HDD_CAPACITY%'
>> "%PS_CREATE%" echo         ssd = '%SSD_INFO%'
>> "%PS_CREATE%" echo         ssdCapacity = '%SSD_CAPACITY%'
>> "%PS_CREATE%" echo         graphicsCard = '%GRAPHICS_CARD%'
>> "%PS_CREATE%" echo         graphicsMemory = '%GRAPHICS_MEMORY%'
>> "%PS_CREATE%" echo         operatingSystem = '%OS_NAME%'
>> "%PS_CREATE%" echo         osVersion = '%OS_VERSION%'
>> "%PS_CREATE%" echo         osArchitecture = '%OS_ARCH%'
>> "%PS_CREATE%" echo         macAddress = '%MAC_ADDRESS%'
>> "%PS_CREATE%" echo         ipAddress = '%IP_ADDRESS%'
>> "%PS_CREATE%" echo         serialNumber = '%SERIAL_NUMBER%'
>> "%PS_CREATE%" echo         biosVersion = '%BIOS_VERSION%'
>> "%PS_CREATE%" echo         antivirus = '%ANTIVIRUS%'
>> "%PS_CREATE%" echo         msOffice = '%MS_OFFICE%'
>> "%PS_CREATE%" echo     }
>> "%PS_CREATE%" echo }
>> "%PS_CREATE%" echo $json ^| ConvertTo-Json -Depth 3 ^| Out-File -FilePath '%JSON_FILE%' -Encoding UTF8

:: Run the create JSON script
powershell -ExecutionPolicy Bypass -File "%PS_CREATE%"

echo [OK] JSON payload created

:: ========================================
:: STEP 5: SEND DATA TO SERVER
:: ========================================
echo.
echo ═══════════════════════════════════════════════════════════════
echo              STEP 5: SENDING DATA TO SERVER...
echo ═══════════════════════════════════════════════════════════════
echo.
echo Server: %SERVER_URL%
echo Customer: !CUSTOMER_NAME!
echo Engineer: %ENGINEER_NAME%
echo.

:: Create PowerShell script file to avoid escaping issues
set "PS_SCRIPT=%TEMP%\wizone\upload.ps1"

> "%PS_SCRIPT%" echo $ErrorActionPreference = 'Stop'
>> "%PS_SCRIPT%" echo try {
>> "%PS_SCRIPT%" echo     $json = Get-Content '%JSON_FILE%' -Raw -Encoding UTF8
>> "%PS_SCRIPT%" echo     Write-Host 'Uploading system information...'
>> "%PS_SCRIPT%" echo     $response = Invoke-RestMethod -Uri '%SERVER_URL%/api/system-info/collect' -Method POST -Body $json -ContentType 'application/json; charset=utf-8' -TimeoutSec 60
>> "%PS_SCRIPT%" echo     if ($response.success) {
>> "%PS_SCRIPT%" echo         Write-Host ''
>> "%PS_SCRIPT%" echo         Write-Host '========================================' -ForegroundColor Green
>> "%PS_SCRIPT%" echo         Write-Host '              SUCCESS!' -ForegroundColor Green
>> "%PS_SCRIPT%" echo         Write-Host '========================================' -ForegroundColor Green
>> "%PS_SCRIPT%" echo         Write-Host ''
>> "%PS_SCRIPT%" echo         Write-Host "Record ID: $($response.recordId)" -ForegroundColor Cyan
>> "%PS_SCRIPT%" echo         Write-Host "Customer: $($response.customer)" -ForegroundColor Cyan
>> "%PS_SCRIPT%" echo         Write-Host "Engineer: $($response.engineer)" -ForegroundColor Cyan
>> "%PS_SCRIPT%" echo         Write-Host ''
>> "%PS_SCRIPT%" echo         Write-Host 'System information saved to database!' -ForegroundColor Green
>> "%PS_SCRIPT%" echo     } else {
>> "%PS_SCRIPT%" echo         Write-Host "[ERROR] $($response.message)" -ForegroundColor Red
>> "%PS_SCRIPT%" echo     }
>> "%PS_SCRIPT%" echo } catch {
>> "%PS_SCRIPT%" echo     Write-Host ''
>> "%PS_SCRIPT%" echo     Write-Host '[ERROR] Failed to upload data:' -ForegroundColor Red
>> "%PS_SCRIPT%" echo     Write-Host $_.Exception.Message -ForegroundColor Red
>> "%PS_SCRIPT%" echo     Write-Host ''
>> "%PS_SCRIPT%" echo     Write-Host 'Please check:' -ForegroundColor Yellow
>> "%PS_SCRIPT%" echo     Write-Host '  1. Your internet connection' -ForegroundColor Yellow
>> "%PS_SCRIPT%" echo     Write-Host '  2. Server is running' -ForegroundColor Yellow
>> "%PS_SCRIPT%" echo     Write-Host '  3. Your credentials are correct' -ForegroundColor Yellow
>> "%PS_SCRIPT%" echo }

:: Run the PowerShell script
powershell -ExecutionPolicy Bypass -File "%PS_SCRIPT%"

:: Save local copy
set "LOCAL_REPORT=%USERPROFILE%\Desktop\SystemInfo_%COMPUTER_NAME%_%DATE:~10,4%%DATE:~4,2%%DATE:~7,2%.txt"

(
echo ════════════════════════════════════════════════════════════════
echo            WIZONE SYSTEM INFORMATION REPORT
echo ════════════════════════════════════════════════════════════════
echo.
echo Generated: %DATE% %TIME%
echo Customer: !CUSTOMER_NAME!
echo Engineer: %ENGINEER_NAME%
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
del "%LOGIN_JSON%" 2>nul
del "%AUTH_RESULT%" 2>nul

echo ═══════════════════════════════════════════════════════════════
echo                        COMPLETE!
echo ═══════════════════════════════════════════════════════════════
echo.
echo Press any key to exit...
pause >nul

endlocal
