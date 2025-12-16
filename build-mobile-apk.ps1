# WIZONE IT Support - Mobile APK Builder
# Complete automation script for building mobile APK

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🚀 WIZONE Task Manager - Mobile APK Builder v1.0   ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Configuration
$ErrorActionPreference = "Stop"
$apkOutputName = "WIZONE-TaskManager-Mobile-v1.0.apk"

# Check if Node.js is installed
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found! Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if npm is available
try {
    $npmVersion = npm --version
    Write-Host "✅ npm $npmVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found!" -ForegroundColor Red
    exit 1
}

# Check if Java is installed
try {
    $javaVersion = java -version 2>&1 | Select-String "version"
    Write-Host "✅ Java detected: $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Java not detected. Install JDK 17 for Android builds." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Build Configuration:" -ForegroundColor Cyan
Write-Host "   App Name: WIZONE Task Manager" -ForegroundColor White
Write-Host "   Package: com.wizoneit.taskmanager" -ForegroundColor White
Write-Host "   Version: 1.0.0" -ForegroundColor White
Write-Host "   Output: $apkOutputName" -ForegroundColor White
Write-Host ""

# Ask user confirmation
$confirm = Read-Host "Continue with build? (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "Build cancelled by user." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📦 Step 1/5: Installing Dependencies" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

try {
    npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
    Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🏗️  Step 2/5: Building Frontend (Vite)" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }
    
    # Check if dist folder was created
    if (-not (Test-Path "dist\public")) {
        throw "Build output not found at dist\public"
    }
    
    Write-Host "✅ Frontend built successfully!" -ForegroundColor Green
    Write-Host "   Output: dist\public\" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Frontend build failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📱 Step 3/5: Adding Android Platform (if needed)" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path "android")) {
    Write-Host "Android platform not found. Adding it now..." -ForegroundColor Yellow
    try {
        npx cap add android
        if ($LASTEXITCODE -ne 0) { throw "Failed to add Android platform" }
        Write-Host "✅ Android platform added!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to add Android platform!" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Android platform already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔄 Step 4/5: Syncing Web Assets to Android" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

try {
    Write-Host "Copying web assets to Android project..." -ForegroundColor White
    npx cap copy android
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Copy failed, trying sync..." -ForegroundColor Yellow
        npx cap sync android
        if ($LASTEXITCODE -ne 0) { throw "Sync failed" }
    }
    Write-Host "✅ Assets synced to Android!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to sync assets!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🏗️  Step 5/5: Building Android APK" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if gradlew exists
if (-not (Test-Path "android\gradlew.bat")) {
    Write-Host "❌ Gradle wrapper not found!" -ForegroundColor Red
    Write-Host "Please run: npx cap sync android" -ForegroundColor Yellow
    exit 1
}

try {
    Write-Host "Building debug APK with Gradle..." -ForegroundColor White
    Write-Host "This may take several minutes on first run..." -ForegroundColor Cyan
    Write-Host ""
    
    Push-Location android
    
    # Clean previous builds
    Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
    .\gradlew.bat clean 2>&1 | Out-Null
    
    # Build debug APK
    Write-Host "Building APK..." -ForegroundColor Yellow
    .\gradlew.bat assembleDebug
    
    if ($LASTEXITCODE -ne 0) { throw "Gradle build failed" }
    
    Pop-Location
    
    Write-Host "✅ APK built successfully!" -ForegroundColor Green
} catch {
    Pop-Location
    Write-Host "❌ APK build failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    Write-Host ""
    Write-Host "💡 Troubleshooting tips:" -ForegroundColor Yellow
    Write-Host "   1. Ensure Java JDK 17 is installed" -ForegroundColor White
    Write-Host "   2. Set JAVA_HOME environment variable" -ForegroundColor White
    Write-Host "   3. Try opening in Android Studio: npx cap open android" -ForegroundColor White
    Write-Host "   4. Check Android SDK is installed" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📦 Finalizing APK Package" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Copy APK to root directory
$apkSource = "android\app\build\outputs\apk\debug\app-debug.apk"
$apkDest = $apkOutputName

if (Test-Path $apkSource) {
    Copy-Item $apkSource $apkDest -Force
    
    $apkSize = (Get-Item $apkDest).Length / 1MB
    $apkSizeFormatted = "{0:N2}" -f $apkSize
    
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║           ✅ SUCCESS! APK BUILD COMPLETE               ║" -ForegroundColor Green
    Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "📱 APK Details:" -ForegroundColor Cyan
    Write-Host "   ├─ Name: $apkDest" -ForegroundColor White
    Write-Host "   ├─ Size: $apkSizeFormatted MB" -ForegroundColor White
    Write-Host "   ├─ Type: Debug (unsigned)" -ForegroundColor White
    Write-Host "   └─ Ready for installation!" -ForegroundColor White
    Write-Host ""
    
    Write-Host "📋 Installation Methods:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   METHOD 1 - Manual Transfer (Recommended)" -ForegroundColor Cyan
    Write-Host "   ┌─────────────────────────────────────────┐" -ForegroundColor White
    Write-Host "   │ 1. Copy '$apkDest' to your device   │" -ForegroundColor White
    Write-Host "   │ 2. Open the APK file on device          │" -ForegroundColor White
    Write-Host "   │ 3. Allow 'Install from unknown sources' │" -ForegroundColor White
    Write-Host "   │ 4. Tap Install                          │" -ForegroundColor White
    Write-Host "   └─────────────────────────────────────────┘" -ForegroundColor White
    Write-Host ""
    
    Write-Host "   METHOD 2 - ADB Install (USB)" -ForegroundColor Cyan
    Write-Host "   ┌─────────────────────────────────────────┐" -ForegroundColor White
    Write-Host "   │ 1. Enable USB debugging on device       │" -ForegroundColor White
    Write-Host "   │ 2. Connect device via USB               │" -ForegroundColor White
    Write-Host "   │ 3. Run command:                         │" -ForegroundColor White
    Write-Host "   │    adb install -r $apkDest      │" -ForegroundColor Cyan
    Write-Host "   └─────────────────────────────────────────┘" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🌐 Server Configuration:" -ForegroundColor Yellow
    Write-Host "   ├─ Make sure your server is running" -ForegroundColor White
    Write-Host "   ├─ Server URL: http://localhost:3007" -ForegroundColor White
    Write-Host "   ├─ For device testing, update capacitor.config.ts" -ForegroundColor White
    Write-Host "   └─ Use your local IP (e.g., http://192.168.1.XXX:3007)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "✨ Mobile Features:" -ForegroundColor Yellow
    Write-Host "   ✅ View all assigned tasks" -ForegroundColor Green
    Write-Host "   ✅ Task cards with counts (pending, completed, cancelled)" -ForegroundColor Green
    Write-Host "   ✅ Complete task history with clickable IDs" -ForegroundColor Green
    Write-Host "   ✅ Change task status (in_progress, completed, etc.)" -ForegroundColor Green
    Write-Host "   ✅ Upload files from camera or gallery" -ForegroundColor Green
    Write-Host "   ✅ Add notes to tasks" -ForegroundColor Green
    Write-Host "   ✅ Real-time sync with web portal" -ForegroundColor Green
    Write-Host "   ✅ Network monitoring (authorized roles)" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "📚 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Start your server: npm run dev" -ForegroundColor White
    Write-Host "   2. Install APK on Android device" -ForegroundColor White
    Write-Host "   3. Login with your credentials" -ForegroundColor White
    Write-Host "   4. Start managing tasks on mobile!" -ForegroundColor White
    Write-Host ""
    
    Write-Host "📖 Full documentation: MOBILE_APK_BUILD_GUIDE.md" -ForegroundColor Cyan
    Write-Host ""
    
    # Ask if user wants to open Android Studio
    $openStudio = Read-Host "Open project in Android Studio for further customization? (Y/N)"
    if ($openStudio -eq "Y" -or $openStudio -eq "y") {
        Write-Host "Opening Android Studio..." -ForegroundColor Yellow
        npx cap open android
    }
    
} else {
    Write-Host "❌ APK file not found at $apkSource" -ForegroundColor Red
    Write-Host "Build may have failed. Check error messages above." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Build process completed!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
