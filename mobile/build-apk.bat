@echo off
echo.
echo 🚀 Building Wizone IT Support Portal APK...
echo.
echo 📊 Database Configuration:
echo    Host: 103.122.85.61:9095
echo    Database: WIZONEIT_SUPPORT
echo    Server: http://103.122.85.61:4000
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detected

REM Check if we're in the mobile directory
if not exist "package.json" (
    echo ❌ Please run this script from the mobile directory
    echo    Current directory: %cd%
    pause
    exit /b 1
)

echo ✅ Mobile directory confirmed

REM Install dependencies
echo.
echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed

REM Install Capacitor CLI if not present
echo.
echo 🔧 Installing Capacitor CLI...
call npm install -g @capacitor/cli
if %errorlevel% neq 0 (
    echo ⚠️  Could not install Capacitor CLI globally, continuing...
)

REM Build the project
echo.
echo 🏗️  Building project...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo ✅ Project built successfully

REM Add Android platform
echo.
echo 📱 Adding Android platform...
call npx cap add android
if %errorlevel% neq 0 (
    echo ⚠️  Android platform might already exist, continuing...
)

REM Sync with Capacitor
echo.
echo 🔄 Syncing with Capacitor...
call npx cap sync android
if %errorlevel% neq 0 (
    echo ❌ Capacitor sync failed
    pause
    exit /b 1
)

echo ✅ Capacitor sync complete

REM Open Android Studio
echo.
echo 🎯 Opening Android Studio...
echo.
echo 📝 Next Steps:
echo    1. Android Studio will open your project
echo    2. Go to Build → Generate Signed Bundle/APK
echo    3. Choose APK and follow the signing wizard
echo    4. Your APK will be in android/app/build/outputs/apk/
echo.
echo 🔐 Login Credentials:
echo    Admin: admin / admin123
echo    Field Engineers: rohit, ravi, huzaifa, sachin (case-insensitive)
echo.

call npx cap open android

echo.
echo 🎉 APK build process initiated!
echo    Your mobile app connects to: http://103.122.85.61:4000
echo    Database: WIZONEIT_SUPPORT @ 103.122.85.61:9095
echo.
pause