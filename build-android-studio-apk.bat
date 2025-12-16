@echo off
echo.
echo 🚀 Wizone Enhanced APK Builder with Task Status Dropdown and Notes
echo ============================================================
echo.
echo This script will build the enhanced version of the Wizone APK
echo that includes the task status dropdown and notes functionality.
echo.

echo 📂 Using Android Studio project directory...
cd android-studio-project

echo.
echo 🔍 Checking if WizoneNativeActivity.java exists...
if exist app\src\main\java\com\wizone\mobile\WizoneNativeActivity.java (
    echo ✅ WizoneNativeActivity.java found!
) else (
    echo ❌ WizoneNativeActivity.java not found! Aborting...
    exit /b 1
)

echo.
echo 🔧 Making gradlew executable...
attrib -R gradlew

echo.
echo 🔨 Building APK...
if exist "gradlew.bat" (
    echo Using gradlew.bat...
    call gradlew.bat assembleDebug --stacktrace
) else if exist "gradlew" (
    echo Using gradlew (Windows)...
    copy gradlew gradlew.bat > nul
    call gradlew.bat assembleDebug --stacktrace
    if %ERRORLEVEL% NEQ 0 (
        echo Trying with system gradle instead...
        gradle assembleDebug --stacktrace
    )
) else (
    echo Using system gradle...
    gradle assembleDebug --stacktrace
)

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Build failed! Check the logs above for errors.
    exit /b 1
)

echo.
echo ✅ Build successful!
echo.
echo 📱 Your APK file is available at:
echo    app\build\outputs\apk\debug\app-debug.apk
echo.
echo 🚀 To install on your device, transfer this APK file to your Android device.

rem Copy the APK to the root directory for easier access
echo.
echo 📂 Copying APK file to root directory for easier access...
copy app\build\outputs\apk\debug\app-debug.apk ..\WizoneEnhanced-TaskDropdown-Notes.apk

echo.
echo ✅ APK copied to: ..\WizoneEnhanced-TaskDropdown-Notes.apk
echo.
echo 🎉 All done! The enhanced APK with task status dropdown and notes is ready!

cd ..
pause