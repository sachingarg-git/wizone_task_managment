@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

:: ========================================
:: WIZONE Customer Portal - System Info Collector
:: Version: 7.0 UNIVERSAL (Works on Windows 7/8/10/11)
:: No PowerShell, No curl dependency
:: Uses VBScript for HTTP requests (built into all Windows)
:: ========================================

title WIZONE System Information Collector

echo.
echo ========================================================
echo    WIZONE Customer Portal - System Information Collector
echo        Version 7.0 - Universal Batch Script
echo           (Works on Windows 7/8/10/11)
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
del /q "%TEMP_DIR%\*.vbs" 2>nul

:: ========================================
:: CREATE HTTP HELPER SCRIPT
:: ========================================
set "HTTP_SCRIPT=%TEMP_DIR%\http_post.vbs"

(
echo On Error Resume Next
echo Dim http, responseFile, jsonFile, url
echo.
echo Set args = WScript.Arguments
echo url = args(0^)
echo jsonFile = args(1^)
echo responseFile = args(2^)
echo.
echo Set fso = CreateObject("Scripting.FileSystemObject"^)
echo Set jsonFileObj = fso.OpenTextFile(jsonFile, 1^)
echo jsonData = jsonFileObj.ReadAll
echo jsonFileObj.Close
echo.
echo Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0"^)
echo http.setOption 2, 13056
echo http.open "POST", url, False
echo http.setRequestHeader "Content-Type", "application/json; charset=utf-8"
echo http.send jsonData
echo.
echo Set responseFileObj = fso.CreateTextFile(responseFile, True^)
echo responseFileObj.Write http.responseText
echo responseFileObj.Close
echo.
echo Set http = Nothing
echo Set fso = Nothing
) > "%HTTP_SCRIPT%"

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

:: Create login JSON
set "LOGIN_JSON=%TEMP_DIR%\login.json"
set "LOGIN_RESP=%TEMP_DIR%\login_response.txt"

(
echo {"username":"%PORTAL_USER%","password":"%PORTAL_PASS%"}
) > "%LOGIN_JSON%"

:: Send login request
cscript //nologo "%HTTP_SCRIPT%" "%SERVER_URL%/api/system-info/login" "%LOGIN_JSON%" "%LOGIN_RESP%" 2>nul

:: Read response
set "LOGIN_SUCCESS=false"
set "CUSTOMER_NAME=Unknown"
set "CUSTOMER_ID=0"

if exist "%LOGIN_RESP%" (
    for /f "tokens=*" %%a in ('type "%LOGIN_RESP%" 2^>nul') do set "LOGIN_RESPONSE=%%a"
)

:: Check for success
echo !LOGIN_RESPONSE! | findstr /i "\"success\":true" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "LOGIN_SUCCESS=true"
    
    :: Extract customer name - look for pattern
    for /f "tokens=2 delims=:," %%a in ('echo !LOGIN_RESPONSE! ^| findstr /i "customerName"') do (
        set "TEMP_NAME=%%a"
        set "TEMP_NAME=!TEMP_NAME:"=!"
        set "CUSTOMER_NAME=!TEMP_NAME!"
    )
    
    :: Extract customer ID
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
    echo Make sure the server is running.
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

:: Initialize all variables with defaults
set "SYSTEM_NAME=Unknown"
set "SYSTEM_TYPE=Desktop"
set "PROCESSOR=Unknown"
set "CPU_CORES=1"
set "PROCESSOR_SPEED=0 MHz"
set "RAM=0 GB"
set "RAM_TYPE=Unknown"
set "RAM_FREQUENCY=0 MHz"
set "MOTHERBOARD=Unknown"
set "MB_MANUFACTURER=Unknown"
set "HARD_DISK=Unknown"
set "HDD_CAPACITY=0 GB"
set "SSD=Not Detected"
set "SSD_CAPACITY="
set "GRAPHICS_CARD=Unknown"
set "GRAPHICS_MEMORY=0 MB"
set "OPERATING_SYSTEM=Windows"
set "OS_VERSION=Unknown"
set "OS_ARCH=64-bit"
set "MAC_ADDRESS=00:00:00:00:00:00"
set "IP_ADDRESS=0.0.0.0"
set "SERIAL_NUMBER=Unknown"
set "BIOS_VERSION=Unknown"
set "ANTIVIRUS=Not Detected"
set "MS_OFFICE=Not Installed"

:: Collect using WMIC commands
echo [1/15] Getting Computer Name...
for /f "skip=1 tokens=*" %%a in ('wmic computersystem get name 2^>nul') do (
    set "TEMP_VAL=%%a"
    if not "!TEMP_VAL!"=="" if not "!TEMP_VAL!"=="  " (
        for /f "tokens=*" %%b in ("!TEMP_VAL!") do set "SYSTEM_NAME=%%b"
        goto :done_name
    )
)
:done_name
echo        !SYSTEM_NAME!

echo [2/15] Getting System Type...
for /f "skip=1 tokens=*" %%a in ('wmic computersystem get PCSystemType 2^>nul') do (
    set "TEMP_VAL=%%a"
    if not "!TEMP_VAL!"=="" if not "!TEMP_VAL!"=="  " (
        for /f "tokens=*" %%b in ("!TEMP_VAL!") do set "PC_TYPE=%%b"
        goto :done_type
    )
)
:done_type
set "PC_TYPE=!PC_TYPE: =!"
if "!PC_TYPE!"=="2" (set "SYSTEM_TYPE=Laptop") else (set "SYSTEM_TYPE=Desktop")
echo        !SYSTEM_TYPE!

echo [3/15] Getting Processor Info...
for /f "skip=1 tokens=*" %%a in ('wmic cpu get name 2^>nul') do (
    set "TEMP_VAL=%%a"
    if not "!TEMP_VAL!"=="" if not "!TEMP_VAL!"=="  " (
        for /f "tokens=*" %%b in ("!TEMP_VAL!") do set "PROCESSOR=%%b"
        goto :done_cpu
    )
)
:done_cpu
echo        !PROCESSOR!

echo [4/15] Getting Processor Cores...
for /f "skip=1 tokens=*" %%a in ('wmic cpu get NumberOfCores 2^>nul') do (
    set "TEMP_VAL=%%a"
    if not "!TEMP_VAL!"=="" if not "!TEMP_VAL!"=="  " (
        for /f "tokens=*" %%b in ("!TEMP_VAL!") do set "CPU_CORES=%%b"
        goto :done_cores
    )
)
:done_cores
set "CPU_CORES=!CPU_CORES: =!"
echo        !CPU_CORES! cores

echo [5/15] Getting Processor Speed...
for /f "skip=1 tokens=*" %%a in ('wmic cpu get MaxClockSpeed 2^>nul') do (
    set "TEMP_VAL=%%a"
    if not "!TEMP_VAL!"=="" if not "!TEMP_VAL!"=="  " (
        for /f "tokens=*" %%b in ("!TEMP_VAL!") do set "CPU_SPEED=%%b"
        goto :done_speed
    )
)
:done_speed
set "CPU_SPEED=!CPU_SPEED: =!"
set "PROCESSOR_SPEED=!CPU_SPEED! MHz"
echo        !PROCESSOR_SPEED!

echo [6/15] Getting RAM Info...
for /f "skip=1 tokens=*" %%a in ('wmic computersystem get TotalPhysicalMemory 2^>nul') do (
    set "TEMP_VAL=%%a"
    if not "!TEMP_VAL!"=="" if not "!TEMP_VAL!"=="  " (
        for /f "tokens=*" %%b in ("!TEMP_VAL!") do set "RAM_BYTES=%%b"
        goto :done_ram
    )
)
:done_ram
set "RAM_BYTES=!RAM_BYTES: =!"
:: Calculate RAM in GB (divide by 1073741824)
if defined RAM_BYTES (
    set /a "RAM_GB=!RAM_BYTES:~0,-9!" 2>nul
    if !RAM_GB! lss 1 set "RAM_GB=4"
)
set "RAM=!RAM_GB! GB"
echo        !RAM!

echo [7/15] Getting RAM Type...
for /f "skip=1 tokens=*" %%a in ('wmic memorychip get SMBIOSMemoryType 2^>nul') do (
    set "TEMP_VAL=%%a"
    if not "!TEMP_VAL!"=="" if not "!TEMP_VAL!"=="  " (
        for /f "tokens=*" %%b in ("!TEMP_VAL!") do set "MEM_TYPE=%%b"
        goto :done_memtype
    )
)
:done_memtype
set "MEM_TYPE=!MEM_TYPE: =!"
if "!MEM_TYPE!"=="24" (set "RAM_TYPE=DDR3") else if "!MEM_TYPE!"=="26" (set "RAM_TYPE=DDR4") else if "!MEM_TYPE!"=="34" (set "RAM_TYPE=DDR5") else (set "RAM_TYPE=DDR4")
echo        !RAM_TYPE!

echo [8/15] Getting RAM Speed...
for /f "skip=1 tokens=*" %%a in ('wmic memorychip get Speed 2^>nul') do (
    set "TEMP_VAL=%%a"
    if not "!TEMP_VAL!"=="" if not "!TEMP_VAL!"=="  " (
        for /f "tokens=*" %%b in ("!TEMP_VAL!") do set "RAM_SPD=%%b"
        goto :done_ramspeed
    )
)
:done_ramspeed
set "RAM_SPD=!RAM_SPD: =!"
set "RAM_FREQUENCY=!RAM_SPD! MHz"
echo        !RAM_FREQUENCY!

echo [9/15] Getting Motherboard Info...
for /f "skip=1 tokens=*" %%a in ('wmic baseboard get Product 2^>nul') do (
    set "TEMP_VAL=%%a"
    if not "!TEMP_VAL!"=="" if not "!TEMP_VAL!"=="  " (
        for /f "tokens=*" %%b in ("!TEMP_VAL!") do set "MOTHERBOARD=%%b"
        goto :done_mb
    )
)
:done_mb
for /f "skip=1 tokens=*" %%a in ('wmic baseboard get Manufacturer 2^>nul') do (
    set "TEMP_VAL=%%a"
    if not "!TEMP_VAL!"=="" if not "!TEMP_VAL!"=="  " (
        for /f "tokens=*" %%b in ("!TEMP_VAL!") do set "MB_MANUFACTURER=%%b"
        goto :done_mbmfg
    )
)
:done_mbmfg
echo        !MOTHERBOARD!

echo [10/15] Getting Hard Disk Info...
for /f "skip=1 tokens=*" %%a in ('wmic diskdrive get Model 2^>nul') do (
    set "TEMP_VAL=%%a"
    if not "!TEMP_VAL!"=="" if not "!TEMP_VAL!"=="  " (
        for /f "tokens=*" %%b in ("!TEMP_VAL!") do set "HARD_DISK=%%b"
        goto :done_disk
    )
)
:done_disk
for /f "skip=1 tokens=*" %%a in ('wmic diskdrive get Size 2^>nul') do (
    set "TEMP_VAL=%%a"
    if not "!TEMP_VAL!"=="" if not "!TEMP_VAL!"=="  " (
        for /f "tokens=*" %%b in ("!TEMP_VAL!") do set "DISK_BYTES=%%b"
        goto :done_disksize
    )
)
:done_disksize
set "DISK_BYTES=!DISK_BYTES: =!"
if defined DISK_BYTES (
    set /a "DISK_GB=!DISK_BYTES:~0,-9!" 2>nul
    if !DISK_GB! lss 1 set "DISK_GB=500"
)
set "HDD_CAPACITY=!DISK_GB! GB"
echo        !HARD_DISK! - !HDD_CAPACITY!

:: Check SSD
echo !HARD_DISK! | findstr /i "SSD NVMe" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "SSD=!HARD_DISK!"
    set "SSD_CAPACITY=!HDD_CAPACITY!"
)

echo [11/15] Getting Graphics Card...
for /f "skip=1 tokens=*" %%a in ('wmic path win32_videocontroller get name 2^>nul') do (
    set "TEMP_VAL=%%a"
    if not "!TEMP_VAL!"=="" if not "!TEMP_VAL!"=="  " (
        for /f "tokens=*" %%b in ("!TEMP_VAL!") do set "GRAPHICS_CARD=%%b"
        goto :done_gpu
    )
)
:done_gpu
for /f "skip=1 tokens=*" %%a in ('wmic path win32_videocontroller get AdapterRAM 2^>nul') do (
    set "TEMP_VAL=%%a"
    if not "!TEMP_VAL!"=="" if not "!TEMP_VAL!"=="  " (
        for /f "tokens=*" %%b in ("!TEMP_VAL!") do set "GPU_RAM=%%b"
        goto :done_gpuram
    )
)
:done_gpuram
set "GPU_RAM=!GPU_RAM: =!"
if defined GPU_RAM (
    set /a "GPU_MB=!GPU_RAM:~0,-6!" 2>nul
    if !GPU_MB! gtr 0 set "GRAPHICS_MEMORY=!GPU_MB! MB"
)
echo        !GRAPHICS_CARD!

echo [12/15] Getting OS Info...
for /f "skip=1 tokens=*" %%a in ('wmic os get Caption 2^>nul') do (
    set "TEMP_VAL=%%a"
    if not "!TEMP_VAL!"=="" if not "!TEMP_VAL!"=="  " (
        for /f "tokens=*" %%b in ("!TEMP_VAL!") do set "OPERATING_SYSTEM=%%b"
        goto :done_os
    )
)
:done_os
for /f "skip=1 tokens=*" %%a in ('wmic os get Version 2^>nul') do (
    set "TEMP_VAL=%%a"
    if not "!TEMP_VAL!"=="" if not "!TEMP_VAL!"=="  " (
        for /f "tokens=*" %%b in ("!TEMP_VAL!") do set "OS_VERSION=%%b"
        goto :done_osver
    )
)
:done_osver
for /f "skip=1 tokens=*" %%a in ('wmic os get OSArchitecture 2^>nul') do (
    set "TEMP_VAL=%%a"
    if not "!TEMP_VAL!"=="" if not "!TEMP_VAL!"=="  " (
        for /f "tokens=*" %%b in ("!TEMP_VAL!") do set "OS_ARCH=%%b"
        goto :done_osarch
    )
)
:done_osarch
set "OS_VERSION=!OS_VERSION: =!"
set "OS_ARCH=!OS_ARCH: =!"
echo        !OPERATING_SYSTEM!

echo [13/15] Getting Network Info...
for /f "skip=1 tokens=*" %%a in ('wmic nic where "NetEnabled=true" get MACAddress 2^>nul') do (
    set "TEMP_VAL=%%a"
    if not "!TEMP_VAL!"=="" if not "!TEMP_VAL!"=="  " (
        for /f "tokens=*" %%b in ("!TEMP_VAL!") do set "MAC_ADDRESS=%%b"
        goto :done_mac
    )
)
:done_mac
set "MAC_ADDRESS=!MAC_ADDRESS: =!"
:: Get IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" 2^>nul') do (
    set "IP_ADDRESS=%%a"
    set "IP_ADDRESS=!IP_ADDRESS: =!"
    goto :done_ip
)
:done_ip
echo        MAC: !MAC_ADDRESS!
echo        IP: !IP_ADDRESS!

echo [14/15] Getting BIOS Info...
for /f "skip=1 tokens=*" %%a in ('wmic bios get SerialNumber 2^>nul') do (
    set "TEMP_VAL=%%a"
    if not "!TEMP_VAL!"=="" if not "!TEMP_VAL!"=="  " (
        for /f "tokens=*" %%b in ("!TEMP_VAL!") do set "SERIAL_NUMBER=%%b"
        goto :done_serial
    )
)
:done_serial
for /f "skip=1 tokens=*" %%a in ('wmic bios get SMBIOSBIOSVersion 2^>nul') do (
    set "TEMP_VAL=%%a"
    if not "!TEMP_VAL!"=="" if not "!TEMP_VAL!"=="  " (
        for /f "tokens=*" %%b in ("!TEMP_VAL!") do set "BIOS_VERSION=%%b"
        goto :done_bios
    )
)
:done_bios
echo        Serial: !SERIAL_NUMBER!

echo [15/15] Getting Security Info...
for /f "skip=1 tokens=*" %%a in ('wmic /namespace:\\root\SecurityCenter2 path AntiVirusProduct get displayName 2^>nul') do (
    set "TEMP_VAL=%%a"
    if not "!TEMP_VAL!"=="" if not "!TEMP_VAL!"=="  " (
        for /f "tokens=*" %%b in ("!TEMP_VAL!") do set "ANTIVIRUS=%%b"
        goto :done_av
    )
)
:done_av
:: Check Office
if exist "C:\Program Files\Microsoft Office" set "MS_OFFICE=Microsoft Office Installed"
if exist "C:\Program Files (x86)\Microsoft Office" set "MS_OFFICE=Microsoft Office Installed"
reg query "HKLM\SOFTWARE\Microsoft\Office" >nul 2>&1 && set "MS_OFFICE=Microsoft Office Installed"
echo        Antivirus: !ANTIVIRUS!

echo.
echo ========================================================
echo                 ALL DATA COLLECTED!
echo ========================================================

:: ========================================
:: STEP 4: CREATE JSON AND UPLOAD
:: ========================================
echo.
echo Preparing data for upload...

:: Clean special characters from values
set "PROCESSOR=!PROCESSOR:"=!"
set "MOTHERBOARD=!MOTHERBOARD:"=!"
set "MB_MANUFACTURER=!MB_MANUFACTURER:"=!"
set "HARD_DISK=!HARD_DISK:"=!"
set "GRAPHICS_CARD=!GRAPHICS_CARD:"=!"
set "OPERATING_SYSTEM=!OPERATING_SYSTEM:"=!"
set "ANTIVIRUS=!ANTIVIRUS:"=!"
set "SERIAL_NUMBER=!SERIAL_NUMBER:"=!"
set "BIOS_VERSION=!BIOS_VERSION:"=!"

:: Create JSON file
set "JSON_FILE=%TEMP_DIR%\system_info.json"
set "UPLOAD_RESP=%TEMP_DIR%\upload_response.txt"

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

:: Upload using VBScript
cscript //nologo "%HTTP_SCRIPT%" "%SERVER_URL%/api/system-info/collect" "%JSON_FILE%" "%UPLOAD_RESP%" 2>nul

:: Check response
set "UPLOAD_SUCCESS=false"
if exist "%UPLOAD_RESP%" (
    for /f "tokens=*" %%a in ('type "%UPLOAD_RESP%" 2^>nul') do set "UPLOAD_RESPONSE=%%a"
)

echo !UPLOAD_RESPONSE! | findstr /i "\"success\":true" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo                      SUCCESS!
    echo ========================================================
    echo.
    echo System information has been saved to the database!
    echo.
    echo You can now view this data in the Customer Portal
    echo under the "System Details" tab.
    echo.
) else (
    echo.
    echo ========================================================
    echo                      UPLOAD FAILED
    echo ========================================================
    echo.
    echo Could not save data to server.
    echo Response: !UPLOAD_RESPONSE!
    echo.
    echo Please check:
    echo  - Server is running
    echo  - Network connection is available
    echo  - Login credentials are correct
    echo.
)

:: Cleanup
del /q "%TEMP_DIR%\*.json" 2>nul
del /q "%TEMP_DIR%\*.txt" 2>nul
del /q "%TEMP_DIR%\*.vbs" 2>nul

echo.
echo Press any key to exit...
pause >nul

endlocal
exit /b 0
