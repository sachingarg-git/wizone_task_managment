@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

:: ========================================
:: WIZONE Customer Portal - System Info Collector
:: Version: 6.0 PURE BATCH (No PowerShell Required)
:: Uses: WMIC, systeminfo, curl.exe (Windows 10+)
:: ========================================

title WIZONE System Information Collector

echo.
echo ========================================================
echo    WIZONE Customer Portal - System Information Collector
echo               Version 6.0 - Pure Batch Script
echo ========================================================
echo.

:: ========================================
:: CONFIGURATION
:: ========================================
set "SERVER_URL=http://103.122.85.61:3007"
set "TEMP_DIR=%TEMP%\wizone_collector"

:: Create temp directory
if not exist "%TEMP_DIR%" mkdir "%TEMP_DIR%" 2>nul

:: Clean old files
del /q "%TEMP_DIR%\*.txt" 2>nul
del /q "%TEMP_DIR%\*.json" 2>nul

:: ========================================
:: CHECK FOR CURL
:: ========================================
where curl.exe >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] curl.exe not found!
    echo This script requires Windows 10 version 1803 or later.
    echo.
    pause
    exit /b 1
)

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

:: Create login JSON file
(
echo {"username":"%PORTAL_USER%","password":"%PORTAL_PASS%"}
) > "%TEMP_DIR%\login.json"

:: Send login request using curl
curl.exe -s -X POST "%SERVER_URL%/api/system-info/login" ^
    -H "Content-Type: application/json" ^
    -d @"%TEMP_DIR%\login.json" ^
    -o "%TEMP_DIR%\login_response.txt" 2>nul

:: Read response
set "LOGIN_SUCCESS=false"
set "CUSTOMER_NAME=Unknown"
set "CUSTOMER_ID=0"

for /f "tokens=*" %%a in ('type "%TEMP_DIR%\login_response.txt" 2^>nul') do set "LOGIN_RESPONSE=%%a"

:: Check for success in response
echo !LOGIN_RESPONSE! | findstr /i "\"success\":true" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "LOGIN_SUCCESS=true"
    
    :: Extract customerName (simple extraction)
    for /f "tokens=2 delims=:," %%a in ('echo !LOGIN_RESPONSE! ^| findstr /i "customerName"') do (
        set "TEMP_NAME=%%a"
        set "TEMP_NAME=!TEMP_NAME:"=!"
        set "CUSTOMER_NAME=!TEMP_NAME!"
    )
    
    :: Extract customerId
    for /f "tokens=2 delims=:," %%a in ('echo !LOGIN_RESPONSE! ^| findstr /i "customerId"') do (
        set "TEMP_ID=%%a"
        set "TEMP_ID=!TEMP_ID:"=!"
        set "TEMP_ID=!TEMP_ID:}=!"
        set "CUSTOMER_ID=!TEMP_ID!"
    )
)

if "!LOGIN_SUCCESS!"=="true" (
    echo.
    echo ========================================================
    echo                  LOGIN SUCCESSFUL!
    echo ========================================================
    echo.
    echo Welcome - !CUSTOMER_NAME!
    echo Customer ID: !CUSTOMER_ID!
    echo.
) else (
    echo.
    echo ========================================================
    echo                  LOGIN FAILED!
    echo ========================================================
    echo.
    echo Please check your Customer Portal username and password.
    echo Response: !LOGIN_RESPONSE!
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

:: Collect using WMIC commands (compatible with Windows 7/8/10/11)
echo [1/15] Getting Computer Name...
for /f "skip=1 tokens=*" %%a in ('wmic computersystem get name 2^>nul') do (
    if not "%%a"=="" (
        set "SYSTEM_NAME=%%a"
        set "SYSTEM_NAME=!SYSTEM_NAME: =!"
        goto :got_name
    )
)
:got_name
echo        Computer Name: !SYSTEM_NAME!

echo [2/15] Getting System Type...
for /f "skip=1 tokens=*" %%a in ('wmic computersystem get PCSystemType 2^>nul') do (
    if not "%%a"=="" (
        set "PC_TYPE=%%a"
        set "PC_TYPE=!PC_TYPE: =!"
        goto :got_type
    )
)
:got_type
if "!PC_TYPE!"=="2" (
    set "SYSTEM_TYPE=Laptop"
) else (
    set "SYSTEM_TYPE=Desktop"
)
echo        System Type: !SYSTEM_TYPE!

echo [3/15] Getting Processor Info...
for /f "skip=1 tokens=*" %%a in ('wmic cpu get name 2^>nul') do (
    if not "%%a"=="" (
        set "PROCESSOR=%%a"
        goto :got_cpu
    )
)
:got_cpu
:: Trim trailing spaces
for /l %%i in (1,1,20) do set "PROCESSOR=!PROCESSOR:  = !"
echo        Processor: !PROCESSOR!

echo [4/15] Getting Processor Cores...
for /f "skip=1 tokens=*" %%a in ('wmic cpu get NumberOfCores 2^>nul') do (
    if not "%%a"=="" (
        set "CPU_CORES=%%a"
        set "CPU_CORES=!CPU_CORES: =!"
        goto :got_cores
    )
)
:got_cores
echo        Cores: !CPU_CORES!

echo [5/15] Getting Processor Speed...
for /f "skip=1 tokens=*" %%a in ('wmic cpu get MaxClockSpeed 2^>nul') do (
    if not "%%a"=="" (
        set "CPU_SPEED=%%a"
        set "CPU_SPEED=!CPU_SPEED: =!"
        goto :got_speed
    )
)
:got_speed
set "PROCESSOR_SPEED=!CPU_SPEED! MHz"
echo        Speed: !PROCESSOR_SPEED!

echo [6/15] Getting RAM Info...
for /f "skip=1 tokens=*" %%a in ('wmic computersystem get TotalPhysicalMemory 2^>nul') do (
    if not "%%a"=="" (
        set "RAM_BYTES=%%a"
        set "RAM_BYTES=!RAM_BYTES: =!"
        goto :got_ram
    )
)
:got_ram
:: Calculate RAM in GB (approximate)
set /a "RAM_GB=!RAM_BYTES:~0,-9!"
if !RAM_GB! lss 1 set "RAM_GB=1"
set "RAM=!RAM_GB! GB"
echo        RAM: !RAM!

echo [7/15] Getting RAM Type...
for /f "skip=1 tokens=*" %%a in ('wmic memorychip get MemoryType 2^>nul') do (
    if not "%%a"=="" (
        set "MEM_TYPE_NUM=%%a"
        set "MEM_TYPE_NUM=!MEM_TYPE_NUM: =!"
        goto :got_memtype
    )
)
:got_memtype
if "!MEM_TYPE_NUM!"=="24" (set "RAM_TYPE=DDR3") else if "!MEM_TYPE_NUM!"=="26" (set "RAM_TYPE=DDR4") else if "!MEM_TYPE_NUM!"=="34" (set "RAM_TYPE=DDR5") else (set "RAM_TYPE=Unknown")
echo        RAM Type: !RAM_TYPE!

echo [8/15] Getting RAM Speed...
for /f "skip=1 tokens=*" %%a in ('wmic memorychip get Speed 2^>nul') do (
    if not "%%a"=="" (
        set "RAM_SPEED=%%a"
        set "RAM_SPEED=!RAM_SPEED: =!"
        goto :got_ramspeed
    )
)
:got_ramspeed
set "RAM_FREQUENCY=!RAM_SPEED! MHz"
echo        RAM Speed: !RAM_FREQUENCY!

echo [9/15] Getting Motherboard Info...
for /f "skip=1 tokens=*" %%a in ('wmic baseboard get Product 2^>nul') do (
    if not "%%a"=="" (
        set "MOTHERBOARD=%%a"
        goto :got_mb
    )
)
:got_mb
for /f "skip=1 tokens=*" %%a in ('wmic baseboard get Manufacturer 2^>nul') do (
    if not "%%a"=="" (
        set "MB_MANUFACTURER=%%a"
        goto :got_mbmfg
    )
)
:got_mbmfg
echo        Motherboard: !MOTHERBOARD!

echo [10/15] Getting Hard Disk Info...
for /f "skip=1 tokens=*" %%a in ('wmic diskdrive get Model 2^>nul') do (
    if not "%%a"=="" (
        set "HARD_DISK=%%a"
        goto :got_disk
    )
)
:got_disk
for /f "skip=1 tokens=*" %%a in ('wmic diskdrive get Size 2^>nul') do (
    if not "%%a"=="" (
        set "DISK_BYTES=%%a"
        set "DISK_BYTES=!DISK_BYTES: =!"
        goto :got_disksize
    )
)
:got_disksize
:: Calculate disk in GB
set /a "DISK_GB=!DISK_BYTES:~0,-9!"
if !DISK_GB! lss 1 set "DISK_GB=0"
set "HDD_CAPACITY=!DISK_GB! GB"
echo        Hard Disk: !HARD_DISK!
echo        Capacity: !HDD_CAPACITY!

:: Check if SSD
echo !HARD_DISK! | findstr /i "SSD NVMe" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "SSD=!HARD_DISK!"
    set "SSD_CAPACITY=!HDD_CAPACITY!"
) else (
    set "SSD=Not Detected"
    set "SSD_CAPACITY="
)

echo [11/15] Getting Graphics Card Info...
for /f "skip=1 tokens=*" %%a in ('wmic path win32_videocontroller get name 2^>nul') do (
    if not "%%a"=="" (
        set "GRAPHICS_CARD=%%a"
        goto :got_gpu
    )
)
:got_gpu
for /f "skip=1 tokens=*" %%a in ('wmic path win32_videocontroller get AdapterRAM 2^>nul') do (
    if not "%%a"=="" (
        set "GPU_RAM=%%a"
        set "GPU_RAM=!GPU_RAM: =!"
        goto :got_gpuram
    )
)
:got_gpuram
:: Calculate GPU RAM in MB
if defined GPU_RAM (
    set /a "GPU_MB=!GPU_RAM:~0,-6!" 2>nul
    if !GPU_MB! lss 1 set "GPU_MB=0"
    set "GRAPHICS_MEMORY=!GPU_MB! MB"
) else (
    set "GRAPHICS_MEMORY=Unknown"
)
echo        Graphics: !GRAPHICS_CARD!

echo [12/15] Getting OS Info...
for /f "skip=1 tokens=*" %%a in ('wmic os get Caption 2^>nul') do (
    if not "%%a"=="" (
        set "OPERATING_SYSTEM=%%a"
        goto :got_os
    )
)
:got_os
for /f "skip=1 tokens=*" %%a in ('wmic os get Version 2^>nul') do (
    if not "%%a"=="" (
        set "OS_VERSION=%%a"
        set "OS_VERSION=!OS_VERSION: =!"
        goto :got_osver
    )
)
:got_osver
for /f "skip=1 tokens=*" %%a in ('wmic os get OSArchitecture 2^>nul') do (
    if not "%%a"=="" (
        set "OS_ARCH=%%a"
        set "OS_ARCH=!OS_ARCH: =!"
        goto :got_osarch
    )
)
:got_osarch
echo        OS: !OPERATING_SYSTEM!
echo        Version: !OS_VERSION!
echo        Architecture: !OS_ARCH!

echo [13/15] Getting Network Info...
for /f "skip=1 tokens=*" %%a in ('wmic nic where "NetEnabled=true" get MACAddress 2^>nul') do (
    if not "%%a"=="" (
        set "MAC_ADDRESS=%%a"
        set "MAC_ADDRESS=!MAC_ADDRESS: =!"
        goto :got_mac
    )
)
:got_mac
:: Get IP Address using ipconfig
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" 2^>nul') do (
    set "IP_ADDRESS=%%a"
    set "IP_ADDRESS=!IP_ADDRESS: =!"
    goto :got_ip
)
:got_ip
echo        MAC Address: !MAC_ADDRESS!
echo        IP Address: !IP_ADDRESS!

echo [14/15] Getting BIOS Info...
for /f "skip=1 tokens=*" %%a in ('wmic bios get SerialNumber 2^>nul') do (
    if not "%%a"=="" (
        set "SERIAL_NUMBER=%%a"
        goto :got_serial
    )
)
:got_serial
for /f "skip=1 tokens=*" %%a in ('wmic bios get SMBIOSBIOSVersion 2^>nul') do (
    if not "%%a"=="" (
        set "BIOS_VERSION=%%a"
        goto :got_bios
    )
)
:got_bios
echo        Serial: !SERIAL_NUMBER!
echo        BIOS: !BIOS_VERSION!

echo [15/15] Getting Antivirus Info...
set "ANTIVIRUS=Not Detected"
for /f "skip=1 tokens=*" %%a in ('wmic /namespace:\\root\SecurityCenter2 path AntiVirusProduct get displayName 2^>nul') do (
    if not "%%a"=="" (
        set "ANTIVIRUS=%%a"
        goto :got_av
    )
)
:got_av
echo        Antivirus: !ANTIVIRUS!

:: Check for Microsoft Office
set "MS_OFFICE=Not Installed"
if exist "C:\Program Files\Microsoft Office" set "MS_OFFICE=Microsoft Office Installed"
if exist "C:\Program Files (x86)\Microsoft Office" set "MS_OFFICE=Microsoft Office Installed"
reg query "HKLM\SOFTWARE\Microsoft\Office" >nul 2>&1
if %ERRORLEVEL% equ 0 set "MS_OFFICE=Microsoft Office Installed"

echo.
echo ========================================================
echo                 ALL DATA COLLECTED!
echo ========================================================

:: ========================================
:: STEP 4: CREATE JSON AND UPLOAD
:: ========================================
echo.
echo Preparing data for upload...

:: Clean up values - remove quotes and special characters
set "PROCESSOR=!PROCESSOR:"=!"
set "MOTHERBOARD=!MOTHERBOARD:"=!"
set "MB_MANUFACTURER=!MB_MANUFACTURER:"=!"
set "HARD_DISK=!HARD_DISK:"=!"
set "GRAPHICS_CARD=!GRAPHICS_CARD:"=!"
set "OPERATING_SYSTEM=!OPERATING_SYSTEM:"=!"
set "ANTIVIRUS=!ANTIVIRUS:"=!"
set "SERIAL_NUMBER=!SERIAL_NUMBER:"=!"
set "BIOS_VERSION=!BIOS_VERSION:"=!"

:: Create JSON file manually
set "JSON_FILE=%TEMP_DIR%\system_info.json"

(
echo {
echo   "username": "!PORTAL_USER!",
echo   "password": "!PORTAL_PASS!",
echo   "engineerName": "!ENGINEER_NAME!",
echo   "systemUserName": "!SYSTEM_USER_NAME!",
echo   "customerName": "!CUSTOMER_NAME!",
echo   "customerId": !CUSTOMER_ID!,
echo   "systemInfo": {
echo     "systemName": "!SYSTEM_NAME!",
echo     "systemType": "!SYSTEM_TYPE!",
echo     "processor": "!PROCESSOR!",
echo     "processorCores": "!CPU_CORES!",
echo     "processorSpeed": "!PROCESSOR_SPEED!",
echo     "ram": "!RAM!",
echo     "ramType": "!RAM_TYPE!",
echo     "ramFrequency": "!RAM_FREQUENCY!",
echo     "ramSlots": "1",
echo     "motherboard": "!MOTHERBOARD!",
echo     "motherboardManufacturer": "!MB_MANUFACTURER!",
echo     "hardDisk": "!HARD_DISK!",
echo     "hddCapacity": "!HDD_CAPACITY!",
echo     "ssd": "!SSD!",
echo     "ssdCapacity": "!SSD_CAPACITY!",
echo     "graphicsCard": "!GRAPHICS_CARD!",
echo     "graphicsMemory": "!GRAPHICS_MEMORY!",
echo     "operatingSystem": "!OPERATING_SYSTEM!",
echo     "osVersion": "!OS_VERSION!",
echo     "osArchitecture": "!OS_ARCH!",
echo     "macAddress": "!MAC_ADDRESS!",
echo     "ipAddress": "!IP_ADDRESS!",
echo     "serialNumber": "!SERIAL_NUMBER!",
echo     "biosVersion": "!BIOS_VERSION!",
echo     "antivirus": "!ANTIVIRUS!",
echo     "msOffice": "!MS_OFFICE!"
echo   }
echo }
) > "!JSON_FILE!"

echo.
echo Uploading to server...
echo.

:: Upload using curl
curl.exe -s -X POST "%SERVER_URL%/api/system-info/collect" ^
    -H "Content-Type: application/json; charset=utf-8" ^
    -d @"%JSON_FILE%" ^
    -o "%TEMP_DIR%\upload_response.txt" 2>nul

:: Check response
for /f "tokens=*" %%a in ('type "%TEMP_DIR%\upload_response.txt" 2^>nul') do set "UPLOAD_RESPONSE=%%a"

echo !UPLOAD_RESPONSE! | findstr /i "\"success\":true" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo                      SUCCESS!
    echo ========================================================
    echo.
    echo System information has been saved to the database!
    echo.
    echo Response: !UPLOAD_RESPONSE!
    echo.
) else (
    echo.
    echo ========================================================
    echo                      ERROR
    echo ========================================================
    echo.
    echo Failed to upload system information.
    echo Response: !UPLOAD_RESPONSE!
    echo.
)

:: Cleanup temp files
del /q "%TEMP_DIR%\*.json" 2>nul
del /q "%TEMP_DIR%\*.txt" 2>nul

echo.
echo Press any key to exit...
pause >nul

endlocal
exit /b 0
