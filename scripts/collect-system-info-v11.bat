@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

:: ========================================
:: WIZONE Customer Portal - System Info Collector
:: Version: 11.0 - ACCURATE DISK & NETWORK DATA
:: ========================================

title WIZONE System Information Collector v11

echo.
echo ========================================================
echo    WIZONE Customer Portal - System Information Collector
echo      Version 11.0 - Accurate Disk ^& Network Data
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
:: COLLECT SYSTEMINFO
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
        for /f "tokens=*" %%x in ('powershell -Command "(ConvertFrom-Json '!RESP!').customerName" 2^>nul') do set "CUSTOMER_NAME=%%x"
        for /f "tokens=*" %%x in ('powershell -Command "(ConvertFrom-Json '!RESP!').customerId" 2^>nul') do set "CUSTOMER_ID=%%x"
        if "!CUSTOMER_NAME!"=="" set "CUSTOMER_NAME=Unknown"
        if "!CUSTOMER_ID!"=="" set "CUSTOMER_ID=0"
    )
)

if "!LOGIN_OK!"=="true" (
    echo.
    echo [SUCCESS] Logged in as: !CUSTOMER_NAME!
    echo Customer ID: !CUSTOMER_ID!
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
set "RAM_SLOTS=1"
set "MOTHERBOARD=Unknown"
set "MB_MANUFACTURER=Unknown"
set "HARD_DISK=Not Detected"
set "HDD_CAPACITY=Not Detected"
set "SSD=Not Detected"
set "SSD_CAPACITY=Not Detected"
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
set "ETHERNET_SPEED=Unknown"

:: ========================================
:: PARSE SYSTEMINFO
:: ========================================
echo [1/6] Parsing systeminfo...

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
    
    for /f "tokens=2* delims=:" %%a in ('findstr /i "System Model" "%TEMP_DIR%\sysinfo.txt"') do (
        set "MODEL=%%b"
        echo !MODEL! | findstr /i "Laptop Notebook Book ThinkPad Latitude Pavilion" >nul && set "SYSTEM_TYPE=Laptop"
    )
    
    echo     [OK] Systeminfo parsed
)

:: ========================================
:: REGISTRY QUERIES
:: ========================================
echo [2/6] Reading Registry...

for /f "tokens=2*" %%a in ('reg query "HKLM\HARDWARE\DESCRIPTION\System\CentralProcessor\0" /v ProcessorNameString 2^>nul ^| findstr /i ProcessorNameString') do (
    set "TMP=%%b"
    if not "!TMP!"=="" set "PROCESSOR=!TMP!"
)

for /f "tokens=3" %%a in ('reg query "HKLM\HARDWARE\DESCRIPTION\System\CentralProcessor\0" /v ~MHz 2^>nul ^| findstr /i MHz') do (
    set "TMP=%%a"
    set /a "SPEED_NUM=!TMP!" 2>nul
    if !SPEED_NUM! gtr 0 set "PROCESSOR_SPEED=!SPEED_NUM! MHz"
)

set "CORE_COUNT=0"
for /f %%a in ('reg query "HKLM\HARDWARE\DESCRIPTION\System\CentralProcessor" 2^>nul ^| find /c "0"') do (
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
:: ACCURATE DISK DETECTION (PowerShell method)
:: ========================================
echo [3/6] Detecting storage devices (ACCURATE)...

:: Use PowerShell for accurate disk info - detects HDD and SSD separately
set "PS_DISK=%TEMP_DIR%\disk_info.ps1"

(
echo $disks = Get-PhysicalDisk 2^>$null
echo if ($disks^) {
echo     foreach ($disk in $disks^) {
echo         $sizeGB = [math]::Round($disk.Size / 1GB^)
echo         $type = $disk.MediaType
echo         $model = $disk.FriendlyName -replace '[\\"]', ''
echo         Write-Host "$type|$model|$sizeGB"
echo     }
echo } else {
echo     # Fallback to WMI
echo     $drives = Get-WmiObject Win32_DiskDrive
echo     foreach ($drive in $drives^) {
echo         $sizeGB = [math]::Round($drive.Size / 1GB^)
echo         $model = $drive.Model -replace '[\\"]', ''
echo         $type = "HDD"
echo         if ($model -match 'SSD^|NVMe^|Solid'^) { $type = "SSD" }
echo         Write-Host "$type|$model|$sizeGB"
echo     }
echo }
) > "%PS_DISK%"

:: Reset disk variables
set "HDD_FOUND=0"
set "SSD_FOUND=0"
set "HARD_DISK=Not Detected"
set "HDD_CAPACITY=Not Detected"
set "SSD=Not Detected"
set "SSD_CAPACITY=Not Detected"

:: Run PowerShell and parse output
for /f "tokens=1,2,3 delims=|" %%a in ('powershell -ExecutionPolicy Bypass -File "%PS_DISK%" 2^>nul') do (
    set "DISK_TYPE=%%a"
    set "DISK_MODEL=%%b"
    set "DISK_SIZE=%%c"
    
    :: Clean model name
    set "DISK_MODEL=!DISK_MODEL:~0,50!"
    
    echo     Found: !DISK_TYPE! - !DISK_MODEL! - !DISK_SIZE! GB
    
    :: Check if SSD
    echo !DISK_TYPE! | findstr /i "SSD Solid" >nul
    if !ERRORLEVEL! equ 0 (
        if !SSD_FOUND! equ 0 (
            set "SSD=!DISK_MODEL!"
            set "SSD_CAPACITY=!DISK_SIZE! GB"
            set "SSD_FOUND=1"
        )
    ) else (
        :: Check model name for SSD indicators
        echo !DISK_MODEL! | findstr /i "SSD NVMe NVME Solid" >nul
        if !ERRORLEVEL! equ 0 (
            if !SSD_FOUND! equ 0 (
                set "SSD=!DISK_MODEL!"
                set "SSD_CAPACITY=!DISK_SIZE! GB"
                set "SSD_FOUND=1"
            )
        ) else (
            :: It's HDD
            if !HDD_FOUND! equ 0 (
                set "HARD_DISK=!DISK_MODEL!"
                set "HDD_CAPACITY=!DISK_SIZE! GB"
                set "HDD_FOUND=1"
            )
        )
    )
)

:: If PowerShell failed, try WMIC fallback
if "!HARD_DISK!"=="Not Detected" if "!SSD!"=="Not Detected" (
    echo     [WARN] PowerShell failed, using WMIC fallback...
    
    for /f "skip=1 tokens=*" %%a in ('wmic diskdrive get Model^,Size^,MediaType /format:csv 2^>nul ^| findstr /v "^$"') do (
        for /f "tokens=2,3,4 delims=," %%x in ("%%a") do (
            set "D_TYPE=%%x"
            set "D_MODEL=%%y"
            set "D_SIZE=%%z"
            
            :: Calculate size in GB
            if defined D_SIZE (
                set /a "SIZE_GB=!D_SIZE:~0,-9!" 2>nul
                if !SIZE_GB! gtr 0 (
                    echo !D_MODEL! | findstr /i "SSD NVMe NVME Solid" >nul
                    if !ERRORLEVEL! equ 0 (
                        if "!SSD!"=="Not Detected" (
                            set "SSD=!D_MODEL!"
                            set "SSD_CAPACITY=!SIZE_GB! GB"
                        )
                    ) else (
                        if "!HARD_DISK!"=="Not Detected" (
                            set "HARD_DISK=!D_MODEL!"
                            set "HDD_CAPACITY=!SIZE_GB! GB"
                        )
                    )
                )
            )
        )
    )
)

echo     [OK] Disk detection complete

:: ========================================
:: ETHERNET SPEED DETECTION
:: ========================================
echo [4/6] Detecting Ethernet speed...

:: Get network adapter speed using PowerShell
set "ETHERNET_SPEED=Unknown"

for /f "tokens=*" %%a in ('powershell -Command "Get-NetAdapter | Where-Object {$_.Status -eq 'Up' -and $_.PhysicalMediaType -match 'Ethernet|802.3'} | Select-Object -First 1 -ExpandProperty LinkSpeed" 2^>nul') do (
    set "ETHERNET_SPEED=%%a"
)

:: If not found, try alternative
if "!ETHERNET_SPEED!"=="Unknown" (
    for /f "tokens=*" %%a in ('powershell -Command "(Get-NetAdapter | Where-Object {$_.Status -eq 'Up'} | Select-Object -First 1).LinkSpeed" 2^>nul') do (
        set "ETHERNET_SPEED=%%a"
    )
)

:: Try WMIC fallback
if "!ETHERNET_SPEED!"=="Unknown" (
    for /f "skip=1 tokens=*" %%a in ('wmic nic where "NetConnectionStatus=2" get Speed 2^>nul') do (
        set "TMP=%%a"
        if not "!TMP!"=="" if not "!TMP!"=="  " (
            set "SPD=!TMP: =!"
            if defined SPD (
                :: Convert to Mbps
                set /a "SPD_MBPS=!SPD:~0,-6!" 2>nul
                if !SPD_MBPS! gtr 0 (
                    if !SPD_MBPS! geq 1000 (
                        set /a "SPD_GBPS=!SPD_MBPS! / 1000"
                        set "ETHERNET_SPEED=!SPD_GBPS! Gbps"
                    ) else (
                        set "ETHERNET_SPEED=!SPD_MBPS! Mbps"
                    )
                )
            )
        )
    )
)

echo     Ethernet Speed: !ETHERNET_SPEED!
echo     [OK] Network speed detected

:: ========================================
:: OTHER WMIC QUERIES
:: ========================================
echo [5/6] Running additional queries...

:: Graphics Card
for /f "skip=1 tokens=*" %%a in ('wmic path win32_videocontroller get caption 2^>nul') do (
    set "TMP=%%a"
    if not "!TMP!"=="" if not "!TMP!"=="  " (
        for /f "tokens=*" %%b in ("!TMP!") do (
            if "!GRAPHICS_CARD!"=="Unknown" set "GRAPHICS_CARD=%%b"
        )
    )
)

:: RAM slots count
set "SLOT_COUNT=0"
for /f %%a in ('wmic memorychip get DeviceLocator 2^>nul ^| find /c "DIMM"') do set "SLOT_COUNT=%%a"
if !SLOT_COUNT! gtr 0 set "RAM_SLOTS=!SLOT_COUNT!"

:: RAM Type
for /f "skip=1 tokens=*" %%a in ('wmic memorychip get SMBIOSMemoryType 2^>nul') do (
    set "TMP=%%a"
    if not "!TMP!"=="" if not "!TMP!"=="  " (
        set "MEM_TYPE=!TMP: =!"
        if "!MEM_TYPE!"=="24" set "RAM_TYPE=DDR3"
        if "!MEM_TYPE!"=="26" set "RAM_TYPE=DDR4"
        if "!MEM_TYPE!"=="34" set "RAM_TYPE=DDR5"
    )
)

:: RAM Frequency
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

:: Antivirus
for /f "skip=1 tokens=*" %%a in ('wmic /namespace:\\root\SecurityCenter2 path AntiVirusProduct get displayName 2^>nul') do (
    set "TMP=%%a"
    if not "!TMP!"=="" if not "!TMP!"=="  " (
        for /f "tokens=*" %%b in ("!TMP!") do (
            if "!ANTIVIRUS!"=="Not Detected" set "ANTIVIRUS=%%b"
        )
    )
)

echo     [OK] Additional queries complete

:: ========================================
:: NETWORK INFO
:: ========================================
echo [6/6] Getting network info...

:: IP Address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" 2^>nul') do (
    set "TMP=%%a"
    for /f "tokens=*" %%b in ("!TMP!") do (
        if "!IP_ADDRESS!"=="Unknown" set "IP_ADDRESS=%%b"
    )
)

:: MAC Address
for /f "tokens=1" %%a in ('getmac /fo csv /nh 2^>nul') do (
    set "TMP=%%a"
    set "TMP=!TMP:"=!"
    if not "!TMP!"=="" if not "!TMP!"=="N/A" if not "!TMP!"=="Disabled" (
        echo !TMP! | findstr /r "^[0-9A-Fa-f][0-9A-Fa-f]-" >nul && (
            if "!MAC_ADDRESS!"=="Unknown" set "MAC_ADDRESS=!TMP:~0,17!"
        )
    )
)

echo     [OK] Network info collected

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
set "SSD=!SSD:"=!"
set "GRAPHICS_CARD=!GRAPHICS_CARD:"=!"
set "OPERATING_SYSTEM=!OPERATING_SYSTEM:"=!"
set "ANTIVIRUS=!ANTIVIRUS:"=!"
set "SERIAL_NUMBER=!SERIAL_NUMBER:"=!"
set "BIOS_VERSION=!BIOS_VERSION:"=!"
set "OS_VERSION=!OS_VERSION:"=!"
set "RAM=!RAM:"=!"
set "MAC_ADDRESS=!MAC_ADDRESS:"=!"
set "CUSTOMER_NAME=!CUSTOMER_NAME:"=!"
set "ETHERNET_SPEED=!ETHERNET_SPEED:"=!"

:: Remove backslashes
set "SYSTEM_NAME=!SYSTEM_NAME:\=!"
set "PROCESSOR=!PROCESSOR:\=!"
set "MOTHERBOARD=!MOTHERBOARD:\=!"
set "MB_MANUFACTURER=!MB_MANUFACTURER:\=!"
set "HARD_DISK=!HARD_DISK:\=!"
set "SSD=!SSD:\=!"
set "GRAPHICS_CARD=!GRAPHICS_CARD:\=!"
set "OPERATING_SYSTEM=!OPERATING_SYSTEM:\=!"
set "ANTIVIRUS=!ANTIVIRUS:\=!"
set "SERIAL_NUMBER=!SERIAL_NUMBER:\=!"
set "BIOS_VERSION=!BIOS_VERSION:\=!"
set "MAC_ADDRESS=!MAC_ADDRESS:\=!"

:: Remove commas
set "RAM=!RAM:,=!"
set "MAC_ADDRESS=!MAC_ADDRESS:,=!"
set "HDD_CAPACITY=!HDD_CAPACITY:,=!"
set "SSD_CAPACITY=!SSD_CAPACITY:,=!"

:: Remove ampersands
set "GRAPHICS_CARD=!GRAPHICS_CARD:&= and !"
set "PROCESSOR=!PROCESSOR:&= and !"

:: Ensure no empty values
if "!RAM_FREQUENCY!"=="" set "RAM_FREQUENCY=Unknown"
if "!PROCESSOR_SPEED!"=="" set "PROCESSOR_SPEED=Unknown"
if "!GRAPHICS_CARD!"=="" set "GRAPHICS_CARD=Unknown"
if "!ETHERNET_SPEED!"=="" set "ETHERNET_SPEED=Unknown"

:: Trim trailing spaces
for %%v in (SYSTEM_NAME PROCESSOR MOTHERBOARD MB_MANUFACTURER HARD_DISK HDD_CAPACITY SSD SSD_CAPACITY GRAPHICS_CARD OPERATING_SYSTEM ANTIVIRUS SERIAL_NUMBER BIOS_VERSION OS_VERSION RAM MAC_ADDRESS IP_ADDRESS CUSTOMER_NAME ETHERNET_SPEED) do (
    for /f "tokens=*" %%a in ("!%%v!") do set "%%v=%%a"
)

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
echo   RAM Slots:        !RAM_SLOTS!
echo   Motherboard:      !MOTHERBOARD!
echo   Manufacturer:     !MB_MANUFACTURER!
echo.
echo   === STORAGE ===
echo   HDD:              !HARD_DISK!
echo   HDD Capacity:     !HDD_CAPACITY!
echo   SSD:              !SSD!
echo   SSD Capacity:     !SSD_CAPACITY!
echo.
echo   Graphics:         !GRAPHICS_CARD!
echo   GPU Memory:       !GRAPHICS_MEMORY!
echo   Operating System: !OPERATING_SYSTEM!
echo   OS Version:       !OS_VERSION!
echo   Architecture:     !OS_ARCH!
echo.
echo   === NETWORK ===
echo   MAC Address:      !MAC_ADDRESS!
echo   IP Address:       !IP_ADDRESS!
echo   Ethernet Speed:   !ETHERNET_SPEED!
echo.
echo   Serial Number:    !SERIAL_NUMBER!
echo   BIOS Version:     !BIOS_VERSION!
echo   Antivirus:        !ANTIVIRUS!
echo   MS Office:        !MS_OFFICE!
echo.

:: ========================================
:: CREATE JSON
:: ========================================
echo ========================================================
echo                 UPLOADING TO SERVER...
echo ========================================================
echo.

set "JSON=%TEMP_DIR%\data.json"

:: Create JSON using echo with proper escaping
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
echo     "ramSlots": "!RAM_SLOTS!",
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
echo     "ethernetSpeed": "!ETHERNET_SPEED!",
echo     "serialNumber": "!SERIAL_NUMBER!",
echo     "biosVersion": "!BIOS_VERSION!",
echo     "antivirus": "!ANTIVIRUS!",
echo     "msOffice": "!MS_OFFICE!"
echo   }
echo }
) > "!JSON!"

:: Show JSON
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
del /q "%TEMP_DIR%\*.ps1" 2>nul

echo Press any key to exit...
pause >nul

endlocal
exit /b 0
