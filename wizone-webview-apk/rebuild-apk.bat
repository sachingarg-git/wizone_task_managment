@echo off
echo 🔧 Building APK with updated server configuration...
echo Server IP: 103.122.85.61:3001

cd /d "%~dp0"

echo 🧹 Cleaning previous builds...
if exist "app\build" rmdir /s /q "app\build"
if exist "build" rmdir /s /q "build"

echo 🔨 Building APK...
call gradlew assembleDebug

echo 📱 APK build complete!
echo ✅ Updated APK location: app\build\outputs\apk\debug\app-debug.apk

if exist "app\build\outputs\apk\debug\app-debug.apk" (
    echo 📋 APK Details:
    echo    - Server IP: 103.122.85.61:3001
    echo    - Database: PostgreSQL (103.122.85.61:9095)
    echo    - All API endpoints updated to /api/ prefix
    echo    - Enhanced mobile CORS support
    echo.
    echo 🚀 Ready to install on Android device!
    echo.
    pause
) else (
    echo ❌ Build failed! Check the output above for errors.
    pause
)