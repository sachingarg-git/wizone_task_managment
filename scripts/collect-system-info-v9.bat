@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

:: ========================================
:: WIZONE Customer Portal - System Info Collector
:: Version: 9.0 - FIXED JSON ESCAPING
:: ========================================

title WIZONE System Information Collector v9

echo.
echo ========================================================
echo    WIZONE Customer Portal - System Information Collector
echo               Version 9.0 - JSON Safe Edition
echo ========================================================
echo.

:: ========================================
:: CONFIGURATION
:: ========================================
set "SERVER_URL=http://103.122.85.61:3007"
set "TEMP_DIR=%TEMP%\wizone_collect"

:: Create temp directory
if not exist "%TEMP_DIR%" mkdir "%TEMP_DIR%" 2>nul

:: Clean old files
del /q "%TEMP_DIR%\*.txt" 2>nul
del /q "%TEMP_DIR%\*.json" 2>nul
del /q "%TEMP_DIR%\*.vbs" 2>nul

:: ========================================
:: CREATE HTTP HELPER
:: ========================================
set "HTTP_VBS=%TEMP_DIR%\http_helper.vbs"

(
echo On Error Resume Next
echo Set args = WScript.Arguments
echo url = args(0^)
echo jsonFile = args(1^)
echo responseFile = args(2^)
echo Set fso = CreateObject("Scripting.FileSystemObject"^)
echo Set f = fso.OpenTextFile(jsonFile, 1^)
echo jsonData = f.ReadAll : f.Close
echo Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0"^)
echo http.setOption 2, 13056
echo http.open "POST", url, False
echo http.setRequestHeader "Content-Type", "application/json; charset=utf-8"
echo http.send jsonData
echo Set r = fso.CreateTextFile(responseFile, True^)
echo r.Write http.responseText : r.Close
) > "%HTTP_VBS%"

:: ========================================
:: COLLECT SYSTEMINFO FIRST
:: ========================================
echo Collecting system information (please wait ~30 seconds)...
echo.
systeminfo > "%TEMP_DIR%\sysinfo.txt" 2>nul

:: ========================================
:: STEP 1: LOGIN
:: ========================================
echo ========================================================
echo                 STEP 1: CUSTOMER PORTAL LOGIN
echo ========================================================
echo.

set /p "PORTAL_USER=Portal Username: "
set /p "PORTAL_PASS=Portal Password: "

echo.
echo Authenticating...

(echo {"username":"%PORTAL_USER%","password":"%PORTAL_PASS%"}) > "%TEMP_DIR%\login.json"

cscript //nologo "%HTTP_VBS%" "%SERVER_URL%/api/system-info/login" "%TEMP_DIR%\login.json" "%TEMP_DIR%\login_resp.txt" 2>nul

set "LOGIN_OK=false"
set "CUSTOMER_NAME=Unknown"
set "CUSTOMER_ID=0"

if exist "%TEMP_DIR%\login_resp.txt" (
    for /f "tokens=*" %%a in ('type "%TEMP_DIR%\login_resp.txt"') do set "RESP=%%a"
    echo !RESP! | findstr /i "\"success\":true" >nul && set "LOGIN_OK=true"
    
    if "!LOGIN_OK!"=="true" (
        for /f "tokens=2 delims=:," %%a in ('echo !RESP! ^| findstr /i customerName') do (
            set "TMP=%%a" & set "CUSTOMER_NAME=!TMP:"=!"
        )
        for /f "tokens=2 delims=:,}" %%a in ('echo !RESP! ^| findstr /i customerId') do (
            set "TMP=%%a" & set "CUSTOMER_ID=!TMP:"=!"
        )
    )
)

if "!LOGIN_OK!"=="true" (
    echo.
    echo [SUCCESS] Logged in as: !CUSTOMER_NAME!
    echo.
) else (
    echo.
    echo [FAILED] Login failed.
    pause
    exit /b 1
)

:: ========================================
:: STEP 2: ENTER DETAILS
:: ========================================
echo ========================================================
echo                 STEP 2: ENTER DETAILS
echo ========================================================
echo.

set /p "ENGINEER_NAME=Engineer Name: "
set /p "SYSTEM_USER_NAME=System User Name: "

:: ========================================
:: STEP 3: COLLECT SYSTEM INFO
:: ========================================
echo.
echo ========================================================
echo         STEP 3: COLLECTING SYSTEM INFORMATION
echo ========================================================
echo.

:: Initialize defaults
set "SYSTEM_NAME=%COMPUTERNAME%"
set "SYSTEM_TYPE=Desktop"
set "PROCESSOR=Unknown"
set "CPU_CORES=1"
set "PROCESSOR_SPEED=Unknown"
set "RAM=Unknown"
set "RAM_TYPE=DDR4"
set "RAM_FREQUENCY=Unknown"
set "MOTHERBOARD=Unknown"
set "MB_MANUFACTURER=Unknown"
set "HARD_DISK=Unknown"
set "HDD_CAPACITY=Unknown"
set "SSD=Not Detected"
set "SSD_CAPACITY="
set "GRAPHICS_CARD=Unknown"
set "GRAPHICS_MEMORY=Unknown"
set "OPERATING_SYSTEM=Windows"
set "OS_VERSION=Unknown"
set "OS_ARCH=64-bit"
set "MAC_ADDRESS=Unknown"
set "IP_ADDRESS=Unknown"
set "SERIAL_NUMBER=Unknown"
set "BIOS_VERSION=Unknown"
set "ANTIVIRUS=Not Detected"
set "MS_OFFICE=Not Installed"

:: ========================================
:: PARSE SYSTEMINFO
:: ========================================
echo [1/5] Parsing systeminfo...

if exist "%TEMP_DIR%\sysinfo.txt" (
    for /f "tokens=2* delims=:" %%a in ('findstr /i "Host Name" "%TEMP_DIR%\sysinfo.txt"') do (
        set "TMP=%%b" & for /f "tokens=*" %%c in ("!TMP!") do set "SYSTEM_NAME=%%c"
    )
    
    for /f "tokens=2* delims=:" %%a in ('findstr /i "OS Name" "%TEMP_DIR%\sysinfo.txt" ^| findstr /v "BIOS"') do (
        set "TMP=%%b" & for /f "tokens=*" %%c in ("!TMP!") do set "OPERATING_SYSTEM=%%c"
    )
    
    for /f "tokens=2* delims=:" %%a in ('findstr /i "OS Version" "%TEMP_DIR%\sysinfo.txt"') do (
        set "TMP=%%b" & for /f "tokens=1" %%c in ("!TMP!") do set "OS_VERSION=%%c"
    )
    
    for /f "tokens=2 delims=:" %%a in ('findstr /i "System Type" "%TEMP_DIR%\sysinfo.txt"') do (
        set "TMP=%%a"
        echo !TMP! | findstr /i "x64 64" >nul && set "OS_ARCH=64-bit"
        echo !TMP! | findstr /i "x86 32" >nul && set "OS_ARCH=32-bit"
    )
    
    for /f "tokens=2* delims=:" %%a in ('findstr /i "Total Physical Memory" "%TEMP_DIR%\sysinfo.txt"') do (
        set "TMP=%%b" & for /f "tokens=*" %%c in ("!TMP!") do set "RAM=%%c"
    )
    
    for /f "tokens=1* delims=]" %%a in ('findstr /i "Intel AMD Ryzen Xeon Core" "%TEMP_DIR%\sysinfo.txt"') do (
        set "TMP=%%b" & for /f "tokens=*" %%c in ("!TMP!") do (
            if "!PROCESSOR!"=="Unknown" set "PROCESSOR=%%c"
        )
    )
    
    for /f "tokens=2* delims=:" %%a in ('findstr /i "System Model" "%TEMP_DIR%\sysinfo.txt"') do (
        set "MODEL=%%b"
        echo !MODEL! | findstr /i "Laptop Notebook Book ThinkPad Latitude" >nul && set "SYSTEM_TYPE=Laptop"
    )
    
    echo     [OK] Systeminfo parsed
)

:: ========================================
:: REGISTRY QUERIES
:: ========================================
echo [2/5] Reading Registry...

for /f "tokens=2*" %%a in ('reg query "HKLM\HARDWARE\DESCRIPTION\System\CentralProcessor\0" /v ProcessorNameString 2^>nul ^| findstr /i ProcessorNameString') do (
    set "TMP=%%b"
    if not "!TMP!"=="" set "PROCESSOR=!TMP!"
)

for /f "tokens=3" %%a in ('reg query "HKLM\HARDWARE\DESCRIPTION\System\CentralProcessor\0" /v ~MHz 2^>nul ^| findstr /i MHz') do (
    set "TMP=%%a"
    :: Convert hex to decimal if needed
    set /a "SPEED_NUM=!TMP!" 2>nul
    if !SPEED_NUM! gtr 0 set "PROCESSOR_SPEED=!SPEED_NUM! MHz"
)

set "CORE_COUNT=0"
for /f %%a in ('reg query "HKLM\HARDWARE\DESCRIPTION\System\CentralProcessor" 2^>nul ^| find /c "CentralProcessor\\"') do (
    set "CORE_COUNT=%%a"
)
if !CORE_COUNT! gtr 0 set "CPU_CORES=!CORE_COUNT!"

for /f "tokens=2*" %%a in ('reg query "HKLM\HARDWARE\DESCRIPTION\System\BIOS" /v SystemManufacturer 2^>nul ^| findstr /i SystemManufacturer') do (
    set "MB_MANUFACTURER=%%b"
)

for /f "tokens=2*" %%a in ('reg query "HKLM\HARDWARE\DESCRIPTION\System\BIOS" /v SystemProductName 2^>nul ^| findstr /i SystemProductName') do (
    set "MOTHERBOARD=%%b"
)

for /f "tokens=2*" %%a in ('reg query "HKLM\HARDWARE\DESCRIPTION\System\BIOS" /v SystemSerialNumber 2^>nul ^| findstr /i SystemSerialNumber') do (
    set "SERIAL_NUMBER=%%b"
)

for /f "tokens=2*" %%a in ('reg query "HKLM\HARDWARE\DESCRIPTION\System\BIOS" /v BIOSVersion 2^>nul ^| findstr /i BIOSVersion') do (
    set "BIOS_VERSION=%%b"
)

reg query "HKLM\SOFTWARE\Microsoft\Office" >nul 2>&1 && set "MS_OFFICE=Microsoft Office Installed"
reg query "HKLM\SOFTWARE\WOW6432Node\Microsoft\Office" >nul 2>&1 && set "MS_OFFICE=Microsoft Office Installed"

echo     [OK] Registry read

:: ========================================
:: WMIC COMMANDS
:: ========================================
echo [3/5] Running WMIC queries...

for /f "skip=1 tokens=*" %%a in ('wmic diskdrive get Model 2^>nul') do (
    set "TMP=%%a"
    if not "!TMP!"=="" if not "!TMP!"=="  " (
        for /f "tokens=*" %%b in ("!TMP!") do (
            if "!HARD_DISK!"=="Unknown" set "HARD_DISK=%%b"
        )
    )
)

for /f "skip=1 tokens=*" %%a in ('wmic diskdrive get Size 2^>nul') do (
    set "TMP=%%a"
    if not "!TMP!"=="" if not "!TMP!"=="  " (
        set "DISK_SIZE=!TMP: =!"
        if defined DISK_SIZE (
            set /a "DISK_GB=!DISK_SIZE:~0,-9!" 2>nul
            if !DISK_GB! gtr 0 set "HDD_CAPACITY=!DISK_GB! GB"
        )
    )
)

echo !HARD_DISK! | findstr /i "SSD NVMe NVME Solid" >nul && (
    set "SSD=!HARD_DISK!"
    set "SSD_CAPACITY=!HDD_CAPACITY!"
)

for /f "skip=1 tokens=*" %%a in ('wmic path win32_videocontroller get name 2^>nul') do (
    set "TMP=%%a"
    if not "!TMP!"=="" if not "!TMP!"=="  " (
        for /f "tokens=*" %%b in ("!TMP!") do (
            if "!GRAPHICS_CARD!"=="Unknown" set "GRAPHICS_CARD=%%b"
        )
    )
)

for /f "skip=1 tokens=*" %%a in ('wmic memorychip get SMBIOSMemoryType 2^>nul') do (
    set "TMP=%%a"
    if not "!TMP!"=="" if not "!TMP!"=="  " (
        set "MEM_TYPE=!TMP: =!"
        if "!MEM_TYPE!"=="24" set "RAM_TYPE=DDR3"
        if "!MEM_TYPE!"=="26" set "RAM_TYPE=DDR4"
        if "!MEM_TYPE!"=="34" set "RAM_TYPE=DDR5"
    )
)

for /f "skip=1 tokens=*" %%a in ('wmic memorychip get Speed 2^>nul') do (
    set "TMP=%%a"
    if not "!TMP!"=="" if not "!TMP!"=="  " (
        set "RAM_SPD=!TMP: =!"
        if defined RAM_SPD (
            set /a "SPD_NUM=!RAM_SPD!" 2>nul
            if !SPD_NUM! gtr 0 set "RAM_FREQUENCY=!SPD_NUM! MHz"
        )
    )
)

for /f "skip=1 tokens=*" %%a in ('wmic /namespace:\\root\SecurityCenter2 path AntiVirusProduct get displayName 2^>nul') do (
    set "TMP=%%a"
    if not "!TMP!"=="" if not "!TMP!"=="  " (
        for /f "tokens=*" %%b in ("!TMP!") do (
            if "!ANTIVIRUS!"=="Not Detected" set "ANTIVIRUS=%%b"
        )
    )
)

echo     [OK] WMIC complete

:: ========================================
:: NETWORK INFO
:: ========================================
echo [4/5] Getting network info...

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" 2^>nul') do (
    set "TMP=%%a"
    for /f "tokens=*" %%b in ("!TMP!") do (
        if "!IP_ADDRESS!"=="Unknown" set "IP_ADDRESS=%%b"
    )
)

:: Get MAC using getmac - first column only
for /f "tokens=1" %%a in ('getmac /fo csv /nh 2^>nul') do (
    set "TMP=%%a"
    set "TMP=!TMP:"=!"
    if not "!TMP!"=="" if not "!TMP!"=="N/A" if not "!TMP!"=="Disabled" (
        :: Only take the MAC address part (XX-XX-XX-XX-XX-XX format)
        echo !TMP! | findstr /r "^[0-9A-Fa-f][0-9A-Fa-f]-" >nul && (
            if "!MAC_ADDRESS!"=="Unknown" set "MAC_ADDRESS=!TMP!"
        )
    )
)

:: Clean MAC address - take only first 17 characters (XX-XX-XX-XX-XX-XX)
if not "!MAC_ADDRESS!"=="Unknown" (
    set "MAC_ADDRESS=!MAC_ADDRESS:~0,17!"
)

echo     [OK] Network info collected

:: ========================================
:: DXDIAG FALLBACK
:: ========================================
echo [5/5] DirectX diagnostic...

if "!GRAPHICS_CARD!"=="Unknown" (
    dxdiag /t "%TEMP_DIR%\dxdiag.txt" 2>nul
    timeout /t 2 /nobreak >nul
    
    if exist "%TEMP_DIR%\dxdiag.txt" (
        for /f "tokens=2* delims=:" %%a in ('findstr /i "Card name" "%TEMP_DIR%\dxdiag.txt" 2^>nul') do (
            set "TMP=%%b" & for /f "tokens=*" %%c in ("!TMP!") do set "GRAPHICS_CARD=%%c"
        )
    )
)

echo     [OK] Complete

:: ========================================
:: SANITIZE ALL VALUES FOR JSON
:: ========================================
echo.
echo Sanitizing data for JSON...

:: Remove quotes
set "SYSTEM_NAME=!SYSTEM_NAME:"=!"
set "PROCESSOR=!PROCESSOR:"=!"
set "MOTHERBOARD=!MOTHERBOARD:"=!"
set "MB_MANUFACTURER=!MB_MANUFACTURER:"=!"
set "HARD_DISK=!HARD_DISK:"=!"
set "GRAPHICS_CARD=!GRAPHICS_CARD:"=!"
set "OPERATING_SYSTEM=!OPERATING_SYSTEM:"=!"
set "ANTIVIRUS=!ANTIVIRUS:"=!"
set "SERIAL_NUMBER=!SERIAL_NUMBER:"=!"
set "BIOS_VERSION=!BIOS_VERSION:"=!"
set "OS_VERSION=!OS_VERSION:"=!"
set "RAM=!RAM:"=!"
set "MAC_ADDRESS=!MAC_ADDRESS:"=!"

:: Remove backslashes (escape for JSON)
set "MAC_ADDRESS=!MAC_ADDRESS:\=!"
set "SERIAL_NUMBER=!SERIAL_NUMBER:\=!"
set "BIOS_VERSION=!BIOS_VERSION:\=!"

:: Remove commas that might break JSON
set "MAC_ADDRESS=!MAC_ADDRESS:,=!"
set "RAM=!RAM:,=!"

:: Trim trailing spaces from all values
for %%v in (SYSTEM_NAME PROCESSOR MOTHERBOARD MB_MANUFACTURER HARD_DISK GRAPHICS_CARD OPERATING_SYSTEM ANTIVIRUS SERIAL_NUMBER BIOS_VERSION OS_VERSION RAM MAC_ADDRESS IP_ADDRESS) do (
    for /f "tokens=*" %%a in ("!%%v!") do set "%%v=%%a"
)

:: Ensure no empty values
if "!RAM_FREQUENCY!"=="" set "RAM_FREQUENCY=Unknown"
if "!PROCESSOR_SPEED!"=="" set "PROCESSOR_SPEED=Unknown"
if "!RAM_FREQUENCY!"==" MHz" set "RAM_FREQUENCY=Unknown"
if "!PROCESSOR_SPEED!"==" MHz" set "PROCESSOR_SPEED=Unknown"

:: ========================================
:: DISPLAY COLLECTED DATA
:: ========================================
echo.
echo ========================================================
echo                COLLECTED SYSTEM INFORMATION
echo ========================================================
echo.
echo   Computer Name:    !SYSTEM_NAME!
echo   System Type:      !SYSTEM_TYPE!
echo   Processor:        !PROCESSOR!
echo   Cores:            !CPU_CORES!
echo   Speed:            !PROCESSOR_SPEED!
echo   RAM:              !RAM!
echo   RAM Type:         !RAM_TYPE!
echo   RAM Speed:        !RAM_FREQUENCY!
echo   Motherboard:      !MOTHERBOARD!
echo   Manufacturer:     !MB_MANUFACTURER!
echo   Hard Disk:        !HARD_DISK!
echo   Capacity:         !HDD_CAPACITY!
echo   SSD:              !SSD!
echo   Graphics:         !GRAPHICS_CARD!
echo   GPU Memory:       !GRAPHICS_MEMORY!
echo   Operating System: !OPERATING_SYSTEM!
echo   OS Version:       !OS_VERSION!
echo   Architecture:     !OS_ARCH!
echo   MAC Address:      !MAC_ADDRESS!
echo   IP Address:       !IP_ADDRESS!
echo   Serial Number:    !SERIAL_NUMBER!
echo   BIOS Version:     !BIOS_VERSION!
echo   Antivirus:        !ANTIVIRUS!
echo   MS Office:        !MS_OFFICE!
echo.

:: ========================================
:: CREATE JSON FILE
:: ========================================
echo ========================================================
echo                 UPLOADING TO SERVER...
echo ========================================================
echo.

set "JSON=%TEMP_DIR%\data.json"

:: Write JSON line by line to avoid special character issues
echo { > "!JSON!"
echo   "username": "!PORTAL_USER!", >> "!JSON!"
echo   "password": "!PORTAL_PASS!", >> "!JSON!"
echo   "engineerName": "!ENGINEER_NAME!", >> "!JSON!"
echo   "systemUserName": "!SYSTEM_USER_NAME!", >> "!JSON!"
echo   "customerName": "!CUSTOMER_NAME!", >> "!JSON!"
echo   "customerId": !CUSTOMER_ID!, >> "!JSON!"
echo   "systemInfo": { >> "!JSON!"
echo     "systemName": "!SYSTEM_NAME!", >> "!JSON!"
echo     "systemType": "!SYSTEM_TYPE!", >> "!JSON!"
echo     "processor": "!PROCESSOR!", >> "!JSON!"
echo     "processorCores": "!CPU_CORES!", >> "!JSON!"
echo     "processorSpeed": "!PROCESSOR_SPEED!", >> "!JSON!"
echo     "ram": "!RAM!", >> "!JSON!"
echo     "ramType": "!RAM_TYPE!", >> "!JSON!"
echo     "ramFrequency": "!RAM_FREQUENCY!", >> "!JSON!"
echo     "ramSlots": "1", >> "!JSON!"
echo     "motherboard": "!MOTHERBOARD!", >> "!JSON!"
echo     "motherboardManufacturer": "!MB_MANUFACTURER!", >> "!JSON!"
echo     "hardDisk": "!HARD_DISK!", >> "!JSON!"
echo     "hddCapacity": "!HDD_CAPACITY!", >> "!JSON!"
echo     "ssd": "!SSD!", >> "!JSON!"
echo     "ssdCapacity": "!SSD_CAPACITY!", >> "!JSON!"
echo     "graphicsCard": "!GRAPHICS_CARD!", >> "!JSON!"
echo     "graphicsMemory": "!GRAPHICS_MEMORY!", >> "!JSON!"
echo     "operatingSystem": "!OPERATING_SYSTEM!", >> "!JSON!"
echo     "osVersion": "!OS_VERSION!", >> "!JSON!"
echo     "osArchitecture": "!OS_ARCH!", >> "!JSON!"
echo     "macAddress": "!MAC_ADDRESS!", >> "!JSON!"
echo     "ipAddress": "!IP_ADDRESS!", >> "!JSON!"
echo     "serialNumber": "!SERIAL_NUMBER!", >> "!JSON!"
echo     "biosVersion": "!BIOS_VERSION!", >> "!JSON!"
echo     "antivirus": "!ANTIVIRUS!", >> "!JSON!"
echo     "msOffice": "!MS_OFFICE!" >> "!JSON!"
echo   } >> "!JSON!"
echo } >> "!JSON!"

:: Verify JSON was created
if not exist "!JSON!" (
    echo [ERROR] Failed to create JSON file
    pause
    exit /b 1
)

:: Show JSON content for debugging
echo JSON Content:
type "!JSON!"
echo.

:: Upload
cscript //nologo "%HTTP_VBS%" "%SERVER_URL%/api/system-info/collect" "%JSON%" "%TEMP_DIR%\upload_resp.txt" 2>nul

:: Check result
set "UPLOAD_OK=false"
if exist "%TEMP_DIR%\upload_resp.txt" (
    for /f "tokens=*" %%a in ('type "%TEMP_DIR%\upload_resp.txt"') do set "UPLOAD_RESP=%%a"
    echo !UPLOAD_RESP! | findstr /i "\"success\":true" >nul && set "UPLOAD_OK=true"
)

if "!UPLOAD_OK!"=="true" (
    echo.
    echo ========================================================
    echo                      SUCCESS!
    echo ========================================================
    echo.
    echo System information saved to database!
    echo.
) else (
    echo.
    echo ========================================================
    echo                      UPLOAD FAILED
    echo ========================================================
    echo.
    echo Response: !UPLOAD_RESP!
    echo.
)

:: Cleanup
del /q "%TEMP_DIR%\*.txt" 2>nul
del /q "%TEMP_DIR%\*.vbs" 2>nul

echo Press any key to exit...
pause >nul

endlocal
exit /b 0
