@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

:: ========================================
:: WIZONE Customer Portal - System Info Collector
:: Version: 8.0 ANTIVIRUS SAFE
:: Uses multiple fallback methods when WMIC is blocked
:: ========================================

title WIZONE System Information Collector v8

echo.
echo ========================================================
echo    WIZONE Customer Portal - System Information Collector
echo           Version 8.0 - Antivirus Safe Edition
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
:: CREATE HTTP HELPER (VBScript - trusted by AV)
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
:: COLLECT SYSTEMINFO FIRST (AV-SAFE)
:: ========================================
echo Collecting system information (this may take 30 seconds)...
echo.
systeminfo > "%TEMP_DIR%\sysinfo.txt" 2>nul

:: ========================================
:: STEP 1: CUSTOMER PORTAL LOGIN
:: ========================================
echo ========================================================
echo                 STEP 1: CUSTOMER PORTAL LOGIN
echo ========================================================
echo.

set /p "PORTAL_USER=Portal Username: "
set /p "PORTAL_PASS=Portal Password: "

echo.
echo Authenticating...

:: Create login JSON
(echo {"username":"%PORTAL_USER%","password":"%PORTAL_PASS%"}) > "%TEMP_DIR%\login.json"

:: Send login
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
    echo [FAILED] Login failed. Check credentials.
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
:: STEP 3: COLLECT SYSTEM INFO (MULTIPLE METHODS)
:: ========================================
echo.
echo ========================================================
echo         STEP 3: COLLECTING SYSTEM INFORMATION
echo ========================================================
echo.
echo Using multiple collection methods for best results...
echo.

:: Initialize all with defaults
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
:: METHOD 1: Parse SYSTEMINFO output (MOST RELIABLE - AV Safe)
:: ========================================
echo [1/5] Parsing systeminfo output...

if exist "%TEMP_DIR%\sysinfo.txt" (
    :: Get Computer Name
    for /f "tokens=2 delims=:" %%a in ('findstr /i "Host Name" "%TEMP_DIR%\sysinfo.txt"') do (
        set "TMP=%%a" & for /f "tokens=*" %%b in ("!TMP!") do set "SYSTEM_NAME=%%b"
    )
    
    :: Get OS Name
    for /f "tokens=2* delims=:" %%a in ('findstr /i "OS Name" "%TEMP_DIR%\sysinfo.txt" ^| findstr /v "BIOS"') do (
        set "TMP=%%b" & for /f "tokens=*" %%c in ("!TMP!") do set "OPERATING_SYSTEM=%%c"
    )
    
    :: Get OS Version
    for /f "tokens=2* delims=:" %%a in ('findstr /i "OS Version" "%TEMP_DIR%\sysinfo.txt"') do (
        set "TMP=%%b" & for /f "tokens=*" %%c in ("!TMP!") do set "OS_VERSION=%%c"
    )
    
    :: Get System Type (shows x64 or x86)
    for /f "tokens=2 delims=:" %%a in ('findstr /i "System Type" "%TEMP_DIR%\sysinfo.txt"') do (
        set "TMP=%%a"
        echo !TMP! | findstr /i "x64 64" >nul && set "OS_ARCH=64-bit"
        echo !TMP! | findstr /i "x86 32" >nul && set "OS_ARCH=32-bit"
    )
    
    :: Get Total Physical Memory
    for /f "tokens=2* delims=:" %%a in ('findstr /i "Total Physical Memory" "%TEMP_DIR%\sysinfo.txt"') do (
        set "TMP=%%b" & for /f "tokens=*" %%c in ("!TMP!") do set "RAM=%%c"
    )
    
    :: Get Processor from systeminfo
    for /f "tokens=2* delims=:" %%a in ('findstr /i "Processor(s)" "%TEMP_DIR%\sysinfo.txt"') do (
        set "PROC_LINE=%%b"
    )
    :: Get the actual processor name from next line
    for /f "tokens=1* delims=]" %%a in ('findstr /i "Intel AMD Ryzen Core" "%TEMP_DIR%\sysinfo.txt"') do (
        set "TMP=%%b" & for /f "tokens=*" %%c in ("!TMP!") do (
            if "!PROCESSOR!"=="Unknown" set "PROCESSOR=%%c"
        )
    )
    
    :: Get BIOS Version
    for /f "tokens=2* delims=:" %%a in ('findstr /i "BIOS Version" "%TEMP_DIR%\sysinfo.txt"') do (
        set "TMP=%%b" & for /f "tokens=*" %%c in ("!TMP!") do set "BIOS_VERSION=%%c"
    )
    
    :: Check System Model for Laptop/Desktop
    for /f "tokens=2* delims=:" %%a in ('findstr /i "System Model" "%TEMP_DIR%\sysinfo.txt"') do (
        set "MODEL=%%b"
        echo !MODEL! | findstr /i "Laptop Notebook Book ThinkPad Latitude Pavilion" >nul && set "SYSTEM_TYPE=Laptop"
    )
    
    echo     [OK] Systeminfo parsed
)

:: ========================================
:: METHOD 2: Registry Queries (AV Safe - Direct read)
:: ========================================
echo [2/5] Reading from Registry...

:: Get Processor from Registry
for /f "tokens=2*" %%a in ('reg query "HKLM\HARDWARE\DESCRIPTION\System\CentralProcessor\0" /v ProcessorNameString 2^>nul ^| findstr /i ProcessorNameString') do (
    set "TMP=%%b"
    if not "!TMP!"=="" set "PROCESSOR=!TMP!"
)

:: Get Processor Speed from Registry
for /f "tokens=2*" %%a in ('reg query "HKLM\HARDWARE\DESCRIPTION\System\CentralProcessor\0" /v ~MHz 2^>nul ^| findstr /i MHz') do (
    set "TMP=%%b"
    if not "!TMP!"=="" set "PROCESSOR_SPEED=!TMP! MHz"
)

:: Count CPU cores from registry
set "CORE_COUNT=0"
for /f %%a in ('reg query "HKLM\HARDWARE\DESCRIPTION\System\CentralProcessor" 2^>nul ^| find /c "CentralProcessor"') do (
    set "CORE_COUNT=%%a"
)
if !CORE_COUNT! gtr 0 set "CPU_CORES=!CORE_COUNT!"

:: Get System Manufacturer/Model from Registry
for /f "tokens=2*" %%a in ('reg query "HKLM\HARDWARE\DESCRIPTION\System\BIOS" /v SystemManufacturer 2^>nul ^| findstr /i SystemManufacturer') do (
    set "MB_MANUFACTURER=%%b"
)

for /f "tokens=2*" %%a in ('reg query "HKLM\HARDWARE\DESCRIPTION\System\BIOS" /v SystemProductName 2^>nul ^| findstr /i SystemProductName') do (
    set "MOTHERBOARD=%%b"
)

:: Get BIOS Serial Number from Registry
for /f "tokens=2*" %%a in ('reg query "HKLM\HARDWARE\DESCRIPTION\System\BIOS" /v SystemSerialNumber 2^>nul ^| findstr /i SystemSerialNumber') do (
    set "SERIAL_NUMBER=%%b"
)

:: Check for MS Office
reg query "HKLM\SOFTWARE\Microsoft\Office" >nul 2>&1 && set "MS_OFFICE=Microsoft Office Installed"
reg query "HKLM\SOFTWARE\WOW6432Node\Microsoft\Office" >nul 2>&1 && set "MS_OFFICE=Microsoft Office Installed"

echo     [OK] Registry read complete

:: ========================================
:: METHOD 3: WMIC (May be blocked by AV)
:: ========================================
echo [3/5] Trying WMIC commands...

:: Try WMIC for disk info
for /f "skip=1 tokens=*" %%a in ('wmic diskdrive get Model 2^>nul') do (
    set "TMP=%%a"
    if not "!TMP!"=="" if not "!TMP!"=="  " (
        for /f "tokens=*" %%b in ("!TMP!") do (
            if "!HARD_DISK!"=="Unknown" set "HARD_DISK=%%b"
        )
    )
)

:: Try WMIC for disk size
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

:: Check for SSD
echo !HARD_DISK! | findstr /i "SSD NVMe NVME Solid" >nul && (
    set "SSD=!HARD_DISK!"
    set "SSD_CAPACITY=!HDD_CAPACITY!"
)

:: Try WMIC for Graphics
for /f "skip=1 tokens=*" %%a in ('wmic path win32_videocontroller get name 2^>nul') do (
    set "TMP=%%a"
    if not "!TMP!"=="" if not "!TMP!"=="  " (
        for /f "tokens=*" %%b in ("!TMP!") do (
            if "!GRAPHICS_CARD!"=="Unknown" set "GRAPHICS_CARD=%%b"
        )
    )
)

:: Try WMIC for Graphics Memory
for /f "skip=1 tokens=*" %%a in ('wmic path win32_videocontroller get AdapterRAM 2^>nul') do (
    set "TMP=%%a"
    if not "!TMP!"=="" if not "!TMP!"=="  " (
        set "GPU_RAM=!TMP: =!"
        if defined GPU_RAM (
            set /a "GPU_MB=!GPU_RAM:~0,-6!" 2>nul
            if !GPU_MB! gtr 0 set "GRAPHICS_MEMORY=!GPU_MB! MB"
        )
    )
)

:: Try WMIC for RAM Type
for /f "skip=1 tokens=*" %%a in ('wmic memorychip get SMBIOSMemoryType 2^>nul') do (
    set "TMP=%%a"
    if not "!TMP!"=="" if not "!TMP!"=="  " (
        set "MEM_TYPE=!TMP: =!"
        if "!MEM_TYPE!"=="24" set "RAM_TYPE=DDR3"
        if "!MEM_TYPE!"=="26" set "RAM_TYPE=DDR4"
        if "!MEM_TYPE!"=="34" set "RAM_TYPE=DDR5"
    )
)

:: Try WMIC for RAM Speed
for /f "skip=1 tokens=*" %%a in ('wmic memorychip get Speed 2^>nul') do (
    set "TMP=%%a"
    if not "!TMP!"=="" if not "!TMP!"=="  " (
        set "RAM_SPD=!TMP: =!"
        if defined RAM_SPD set "RAM_FREQUENCY=!RAM_SPD! MHz"
    )
)

:: Try WMIC for Antivirus
for /f "skip=1 tokens=*" %%a in ('wmic /namespace:\\root\SecurityCenter2 path AntiVirusProduct get displayName 2^>nul') do (
    set "TMP=%%a"
    if not "!TMP!"=="" if not "!TMP!"=="  " (
        for /f "tokens=*" %%b in ("!TMP!") do (
            if "!ANTIVIRUS!"=="Not Detected" set "ANTIVIRUS=%%b"
        )
    )
)

echo     [OK] WMIC queries complete

:: ========================================
:: METHOD 4: Network Info (ipconfig/getmac)
:: ========================================
echo [4/5] Getting network information...

:: Get IP Address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" 2^>nul') do (
    set "TMP=%%a"
    for /f "tokens=*" %%b in ("!TMP!") do (
        if "!IP_ADDRESS!"=="Unknown" set "IP_ADDRESS=%%b"
    )
)

:: Get MAC Address using getmac (more reliable than WMIC)
for /f "tokens=1" %%a in ('getmac /fo csv /nh 2^>nul') do (
    set "TMP=%%a"
    set "TMP=!TMP:"=!"
    if not "!TMP!"=="" if not "!TMP!"=="N/A" (
        if "!MAC_ADDRESS!"=="Unknown" set "MAC_ADDRESS=!TMP!"
    )
)

echo     [OK] Network info collected

:: ========================================
:: METHOD 5: DirectX Diagnostic (dxdiag)
:: ========================================
echo [5/5] Running DirectX diagnostic (quick mode)...

:: Run dxdiag in quick mode to get GPU info if WMIC failed
if "!GRAPHICS_CARD!"=="Unknown" (
    dxdiag /t "%TEMP_DIR%\dxdiag.txt" 2>nul
    timeout /t 3 /nobreak >nul
    
    if exist "%TEMP_DIR%\dxdiag.txt" (
        for /f "tokens=2* delims=:" %%a in ('findstr /i "Card name" "%TEMP_DIR%\dxdiag.txt" 2^>nul') do (
            set "TMP=%%b" & for /f "tokens=*" %%c in ("!TMP!") do set "GRAPHICS_CARD=%%c"
        )
        for /f "tokens=2* delims=:" %%a in ('findstr /i "Display Memory" "%TEMP_DIR%\dxdiag.txt" 2^>nul') do (
            set "TMP=%%b" & for /f "tokens=*" %%c in ("!TMP!") do set "GRAPHICS_MEMORY=%%c"
        )
        for /f "tokens=2* delims=:" %%a in ('findstr /i "^Processor" "%TEMP_DIR%\dxdiag.txt" 2^>nul') do (
            if "!PROCESSOR!"=="Unknown" (
                set "TMP=%%b" & for /f "tokens=*" %%c in ("!TMP!") do set "PROCESSOR=%%c"
            )
        )
    )
)

echo     [OK] Diagnostic complete

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
:: STEP 4: CREATE JSON AND UPLOAD
:: ========================================
echo ========================================================
echo                 UPLOADING TO SERVER...
echo ========================================================
echo.

:: Clean special characters
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

:: Create JSON
set "JSON=%TEMP_DIR%\data.json"

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
) > "!JSON!"

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
    echo System information has been saved to the database!
    echo You can view it in Customer Portal under "System Details"
    echo.
) else (
    echo.
    echo ========================================================
    echo                      UPLOAD FAILED
    echo ========================================================
    echo.
    echo Response: !UPLOAD_RESP!
    echo.
    echo JSON saved to: %JSON%
    echo.
)

:: Cleanup
del /q "%TEMP_DIR%\*.txt" 2>nul
del /q "%TEMP_DIR%\*.vbs" 2>nul

echo Press any key to exit...
pause >nul

endlocal
exit /b 0
