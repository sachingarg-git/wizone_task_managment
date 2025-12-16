@echo off
setlocal enabledelayedexpansion

echo.
echo 🚀 Building Wizone APK - Direct Build Method
echo.

REM Set directories
set MOBILE_DIR=%cd%
set ANDROID_DIR=%MOBILE_DIR%\android

echo 📍 Working Directory: %MOBILE_DIR%
echo 📱 Android Project: %ANDROID_DIR%

REM Check if Android project exists
if not exist "%ANDROID_DIR%" (
    echo ❌ Android project not found. Running Capacitor setup...
    call npx cap add android
    if !errorlevel! neq 0 (
        echo ❌ Failed to add Android platform
        pause
        exit /b 1
    )
)

echo ✅ Android project confirmed

REM Create the production web content
echo.
echo 📝 Creating production web content...
if not exist dist mkdir dist

echo ^<!DOCTYPE html^>
^<html lang^="en"^>
^<head^>
    ^<meta charset^="UTF-8"^>
    ^<meta name^="viewport" content^="width=device-width, initial-scale=1.0"^>
    ^<title^>Wizone IT Support^</title^>
    ^<style^>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
        .loader { display: flex; flex-direction: column; align-items: center; justify-content: center;
                 min-height: 100vh; background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
                 color: white; text-align: center; padding: 20px; }
        .logo { width: 80px; height: 80px; background: white; color: #667eea; border-radius: 50%%;
               display: flex; align-items: center; justify-content: center; font-size: 32px;
               font-weight: bold; margin-bottom: 20px; }
        .spinner { width: 50px; height: 50px; border: 3px solid rgba(255,255,255,0.3);
                  border-top: 3px solid white; border-radius: 50%%; animation: spin 1s linear infinite; margin: 20px 0; }
        @keyframes spin { 0%% { transform: rotate(0deg); } 100%% { transform: rotate(360deg); } }
        #app-frame { width: 100%%; height: 100vh; border: none; display: none; }
    ^</style^>
^</head^>
^<body^>
    ^<div id^="loader" class^="loader"^>
        ^<div class^="logo"^>W^</div^>
        ^<div class^="spinner"^>^</div^>
        ^<div id^="status"^>Connecting to Wizone Server...^</div^>
        ^<div style^="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin: 20px 0;"^>
            ^<strong^>Database Connected^</strong^>^<br^>
            Host: 103.122.85.61:9095^<br^>
            Database: WIZONEIT_SUPPORT
        ^</div^>
    ^</div^>
    ^<iframe id^="app-frame" src^="about:blank"^>^</iframe^>
    ^<script^>
        const SERVER_URL = 'http://103.122.85.61:4000';
        function updateStatus(msg) { document.getElementById('status').textContent = msg; }
        function loadApp() {
            const frame = document.getElementById('app-frame');
            const loader = document.getElementById('loader');
            updateStatus('Loading application...');
            frame.src = SERVER_URL;
            frame.onload = function() {
                setTimeout(() => {
                    loader.style.display = 'none';
                    frame.style.display = 'block';
                }, 1000);
            };
        }
        setTimeout(loadApp, 2000);
    ^</script^>
^</body^>
^</html^> > dist\index.html

echo ✅ Production HTML created

REM Sync with Capacitor
echo.
echo 🔄 Syncing with Capacitor...
call npx cap sync android
if %errorlevel% neq 0 (
    echo ❌ Capacitor sync failed
    pause
    exit /b 1
)

echo ✅ Capacitor sync completed

REM Navigate to Android directory
cd /d "%ANDROID_DIR%"

echo.
echo 🏗️  Building APK with Gradle...
echo 📍 Current directory: %cd%

REM Clean and build
echo.
echo 🧹 Cleaning previous builds...
call gradlew.bat clean
if %errorlevel% neq 0 (
    echo ⚠️  Clean failed, continuing...
)

echo.
echo 🔨 Building debug APK...
call gradlew.bat assembleDebug
if %errorlevel% neq 0 (
    echo ❌ APK build failed
    echo.
    echo 🔧 Troubleshooting:
    echo 1. Check if Android SDK is installed
    echo 2. Verify ANDROID_HOME environment variable
    echo 3. Try running: gradlew.bat --version
    pause
    exit /b 1
)

REM Check for APK
set APK_PATH=%ANDROID_DIR%\app\build\outputs\apk\debug\app-debug.apk
if exist "%APK_PATH%" (
    echo.
    echo 🎉 APK BUILD SUCCESSFUL!
    echo 📱 APK Location: %APK_PATH%
    
    REM Get file size
    for %%A in ("%APK_PATH%") do set APK_SIZE=%%~zA
    set /a APK_SIZE_MB=!APK_SIZE!/1024/1024
    echo 📊 APK Size: !APK_SIZE_MB! MB
    
    REM Copy to mobile root
    copy "%APK_PATH%" "%MOBILE_DIR%\wizone-mobile-app.apk"
    echo 📋 APK copied to: %MOBILE_DIR%\wizone-mobile-app.apk
    
    echo.
    echo ✅ SUCCESS SUMMARY:
    echo    • Database: WIZONEIT_SUPPORT @ 103.122.85.61:9095
    echo    • Server: http://103.122.85.61:4000
    echo    • APK ready for installation
    echo.
    echo 🔐 Login Credentials:
    echo    • Admin: admin / admin123
    echo    • Field Engineers: rohit, ravi, huzaifa, sachin (case-insensitive)
    echo.
    echo 📱 Installation Instructions:
    echo    1. Transfer wizone-mobile-app.apk to your Android device
    echo    2. Enable "Install from unknown sources" in Settings
    echo    3. Install and run the app
    
) else (
    echo ❌ APK not found at expected location
    echo 🔍 Checking all APK files...
    dir /s *.apk
)

cd /d "%MOBILE_DIR%"
echo.
pause