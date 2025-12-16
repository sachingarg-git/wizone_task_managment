@echo off
cd /d "d:\Sachin Garg Profile\New folder\ppll11\TaskScoreTracker\android-studio-project"

echo Building Wizone Enhanced APK with Task Status Dropdown and Notes...
echo.

REM Check if gradlew exists
if exist gradlew (
    echo Using gradlew wrapper...
    
    REM Make gradlew executable and build
    java -jar gradle\wrapper\gradle-wrapper.jar assembleDebug
    
    if %ERRORLEVEL% NEQ 0 (
        echo Gradle wrapper failed, trying alternative method...
        
        REM Try using system gradle if installed
        where gradle >nul 2>nul
        if %ERRORLEVEL% EQU 0 (
            echo Using system gradle...
            gradle assembleDebug
        ) else (
            echo No gradle found. Please install Gradle or Android Studio.
            exit /b 1
        )
    )
) else (
    echo Gradle wrapper not found. Trying system gradle...
    where gradle >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        gradle assembleDebug
    ) else (
        echo No gradle found. Please install Gradle or Android Studio.
        exit /b 1
    )
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo BUILD SUCCESSFUL!
    echo.
    echo APK Location: app\build\outputs\apk\debug\app-debug.apk
    echo.
    
    REM Copy APK to root directory
    if exist "app\build\outputs\apk\debug\app-debug.apk" (
        copy "app\build\outputs\apk\debug\app-debug.apk" "..\WizoneEnhanced-TaskDropdown-Notes-PROPER.apk"
        echo APK copied to: ..\WizoneEnhanced-TaskDropdown-Notes-PROPER.apk
    )
) else (
    echo.
    echo BUILD FAILED!
    echo Please check the error messages above.
)

pause