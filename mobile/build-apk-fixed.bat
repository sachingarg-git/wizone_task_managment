@echo off
setlocal enabledelayedexpansion

echo.
echo 🚀 Building Wizone APK - Fixed Version
echo.
echo 📊 Database Configuration:
echo    Host: 103.122.85.61:9095
echo    Database: WIZONEIT_SUPPORT
echo    Server: http://103.122.85.61:4000
echo.

REM Check if we're in the mobile directory
if not exist "package.json" (
    echo ❌ Please run this script from the mobile directory
    echo    Current directory: %cd%
    pause
    exit /b 1
)

echo ✅ Mobile directory confirmed

REM Run the Node.js build script that fixes Gradle issues
echo.
echo 🔧 Running APK build with Gradle fixes...
node build-apk-fixed.js

if %errorlevel% equ 0 (
    echo.
    echo 🎉 BUILD COMPLETED SUCCESSFULLY!
    echo.
    echo 📱 Your APK files should be in:
    echo    • android/app/build/outputs/apk/debug/app-debug.apk
    echo    • wizone-app-debug.apk (copied for convenience)
    echo.
    echo 🔐 Login Credentials:
    echo    • Admin: admin / admin123
    echo    • Field Engineers: rohit, ravi, huzaifa, sachin (case-insensitive)
    echo.
    echo 📋 Next Steps:
    echo    1. Transfer APK to your Android device
    echo    2. Enable "Install from unknown sources"
    echo    3. Install and run the app
    echo.
) else (
    echo.
    echo ❌ Build failed. Please check the error messages above.
    echo.
    echo 🔧 Troubleshooting:
    echo    1. Ensure Node.js is installed
    echo    2. Check that Android SDK is available
    echo    3. Try running: npx cap doctor
    echo.
)

pause