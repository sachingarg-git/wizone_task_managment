@echo off
echo 🚀 Building Enhanced WiZone Task Tracker APK...
echo.

cd wizone-enhanced-final-build

echo 📦 Cleaning previous builds...
if exist "app\build" rd /s /q "app\build"

echo 🔨 Building release APK...

REM Try different gradle commands
if exist "gradlew.bat" (
    echo Using gradlew.bat...
    call gradlew.bat assembleRelease
) else if exist "gradlew" (
    echo Using gradlew...
    bash gradlew assembleRelease
) else (
    echo Using system gradle...
    gradle assembleRelease
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ APK Build Successful!
    echo.
    if exist "app\build\outputs\apk\release\app-release.apk" (
        echo 📱 APK Location: app\build\outputs\apk\release\app-release.apk
        copy "app\build\outputs\apk\release\app-release.apk" "..\wizone-mobile-enhanced-COMPLETE-APK-%date:~10,4%%date:~4,2%%date:~7,2%-%time:~0,2%%time:~3,2%.apk"
        echo 📋 APK copied to root directory with timestamp
    ) else (
        echo ❌ APK file not found after build
    )
) else (
    echo.
    echo ❌ APK Build Failed!
    echo Please check the error messages above.
)

cd ..
pause