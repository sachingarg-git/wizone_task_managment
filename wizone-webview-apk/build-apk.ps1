# Build APK Script for Windows PowerShell

Write-Host "🚀 Wizone Task Manager APK Builder" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

$PROJECT_PATH = "D:\Sachin Garg Profile\New folder\ppll11\TaskScoreTracker\wizone-webview-apk"
$APK_OUTPUT = "$PROJECT_PATH\app\build\outputs\apk\debug\app-debug.apk"

Write-Host "📁 Project Path: $PROJECT_PATH" -ForegroundColor Yellow

# Check if Android Studio is installed
$androidStudioPaths = @(
    "${env:ProgramFiles}\Android\Android Studio\bin\studio64.exe",
    "${env:ProgramFiles(x86)}\Android\Android Studio\bin\studio64.exe",
    "${env:LOCALAPPDATA}\JetBrains\Toolbox\apps\AndroidStudio\ch-0\*\bin\studio64.exe"
)

$androidStudio = $null
foreach ($path in $androidStudioPaths) {
    if (Test-Path $path) {
        $androidStudio = $path
        break
    }
}

if ($androidStudio) {
    Write-Host "✅ Android Studio found at: $androidStudio" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔧 RECOMMENDED METHOD: Android Studio Build" -ForegroundColor Cyan
    Write-Host "1. Opening Android Studio..." -ForegroundColor White
    Write-Host "2. Import project from: $PROJECT_PATH" -ForegroundColor White
    Write-Host "3. Let Android Studio sync dependencies" -ForegroundColor White
    Write-Host "4. Build → Generate Signed Bundle / APK → APK" -ForegroundColor White
    Write-Host "5. Choose Debug or Release build" -ForegroundColor White
    Write-Host ""
    
    $openStudio = Read-Host "Open Android Studio now? (y/n)"
    if ($openStudio -eq "y" -or $openStudio -eq "Y") {
        Start-Process $androidStudio -ArgumentList $PROJECT_PATH
        Write-Host "✅ Android Studio opened with project" -ForegroundColor Green
        exit 0
    }
} else {
    Write-Host "❌ Android Studio not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔧 ALTERNATIVE METHODS:" -ForegroundColor Cyan

# Check for compatible JDK
Write-Host ""
Write-Host "Checking Java compatibility..." -ForegroundColor Yellow

try {
    $javaVersionOutput = java -version 2>&1 | Out-String
    $javaVersion = ($javaVersionOutput -split '"')[1]
    Write-Host "Current Java version: $javaVersion" -ForegroundColor White
} catch {
    $javaVersion = "unknown"
    Write-Host "Java version: unknown" -ForegroundColor White
}

if ($javaVersion -like "25.*") {
    Write-Host "⚠️  JDK 25 detected - incompatible with Gradle 7.x" -ForegroundColor Red
    Write-Host ""
    Write-Host "METHOD 2: Install Compatible JDK" -ForegroundColor Cyan
    Write-Host "1. Download JDK 11 or JDK 17 from:" -ForegroundColor White
    Write-Host "   - Oracle JDK: https://www.oracle.com/java/technologies/downloads/" -ForegroundColor White
    Write-Host "   - OpenJDK: https://adoptium.net/" -ForegroundColor White
    Write-Host "2. Install and set JAVA_HOME environment variable" -ForegroundColor White
    Write-Host "3. Run: gradlew assembleDebug" -ForegroundColor White
} else {
    Write-Host "✅ Java version appears compatible" -ForegroundColor Green
    
    # Try Gradle build
    Write-Host ""
    Write-Host "METHOD 2: Gradle Command Line Build" -ForegroundColor Cyan
    $gradleBuild = Read-Host "Try Gradle build now? (y/n)"
    
    if ($gradleBuild -eq "y" -or $gradleBuild -eq "Y") {
        Write-Host "Building APK..." -ForegroundColor Yellow
        Set-Location $PROJECT_PATH
        
        if (Test-Path "gradlew.bat") {
            & .\gradlew.bat assembleDebug
        } elseif (Test-Path "C:\gradle\gradle-7.5.1\bin\gradle.bat") {
            & "C:\gradle\gradle-7.5.1\bin\gradle.bat" assembleDebug
        } else {
            Write-Host "❌ Gradle not found" -ForegroundColor Red
        }
        
        if (Test-Path $APK_OUTPUT) {
            Write-Host "✅ APK built successfully!" -ForegroundColor Green
            Write-Host "📱 APK location: $APK_OUTPUT" -ForegroundColor Yellow
            explorer.exe "$PROJECT_PATH\app\build\outputs\apk\debug"
        } else {
            Write-Host "❌ APK build failed" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "METHOD 3: Online APK Builder" -ForegroundColor Cyan
Write-Host "1. Zip the project folder: $PROJECT_PATH" -ForegroundColor White
Write-Host "2. Upload to online Android APK builder:" -ForegroundColor White
Write-Host "   - AppGyver Build Service" -ForegroundColor White
Write-Host "   - PhoneGap Build" -ForegroundColor White
Write-Host "   - Ionic Appflow" -ForegroundColor White

Write-Host ""
Write-Host "📋 PROJECT STATUS:" -ForegroundColor Cyan
Write-Host "✅ WebView HTML interface created" -ForegroundColor Green
Write-Host "✅ Android project structure complete" -ForegroundColor Green
Write-Host "✅ Permissions and network config set" -ForegroundColor Green
Write-Host "✅ MainActivity and layouts configured" -ForegroundColor Green
Write-Host "✅ Build configuration files ready" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 The APK will load: http://103.122.85.61:4000/mobile" -ForegroundColor Yellow
Write-Host "🎯 Professional task management system included" -ForegroundColor Yellow

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")