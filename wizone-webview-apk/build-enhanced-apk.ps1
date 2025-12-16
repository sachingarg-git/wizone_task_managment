# Wizone APK Build Script - Enhanced Authentication v4.0
Write-Host "🔨 Building Wizone APK - Enhanced Authentication v4.0" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Yellow

# Set the APK output name with timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$apkName = "wizone-mobile-database-connected-v4-$timestamp.apk"

Write-Host "📱 APK Name: $apkName" -ForegroundColor Cyan
Write-Host "🏗️ Starting Gradle build..." -ForegroundColor Yellow

# Navigate to the APK directory
$apkDir = "D:\Sachin Garg Profile\New folder\ppll11\TaskScoreTracker\wizone-webview-apk"
Set-Location $apkDir

# Clean previous builds
Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
& ".\gradlew.bat" clean

# Build the APK
Write-Host "🔨 Building APK..." -ForegroundColor Yellow
& ".\gradlew.bat" assembleRelease

# Check if build was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
    
    # Copy the APK to the root directory with our custom name
    $sourceApk = "app\build\outputs\apk\release\app-release.apk"
    if (Test-Path $sourceApk) {
        Copy-Item $sourceApk $apkName
        Write-Host "📱 APK created: $apkName" -ForegroundColor Green
        
        # Show APK details
        $apkSize = (Get-Item $apkName).Length
        $apkSizeMB = [math]::Round($apkSize / 1MB, 2)
        Write-Host "📊 APK Size: $apkSizeMB MB" -ForegroundColor Cyan
        Write-Host "📅 Build Date: $(Get-Date)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "🎉 SUCCESS! APK is ready for testing" -ForegroundColor Green -BackgroundColor Black
        Write-Host "====================================" -ForegroundColor Yellow
        Write-Host "📱 File: $apkName" -ForegroundColor White
        Write-Host "🔐 Login: ravi / ravi@123 or admin / admin123" -ForegroundColor White
        Write-Host "🌐 Server: http://localhost:8050 (Ultra Stable Server)" -ForegroundColor White
        Write-Host "💾 Database: PostgreSQL (103.122.85.61:9095)" -ForegroundColor White
        Write-Host "====================================" -ForegroundColor Yellow
        
        # Create installation instructions
        Write-Host ""
        Write-Host "📋 INSTALLATION INSTRUCTIONS:" -ForegroundColor Magenta
        Write-Host "1. Transfer $apkName to your Android device" -ForegroundColor White
        Write-Host "2. Enable 'Unknown sources' in Settings > Security" -ForegroundColor White
        Write-Host "3. Install the APK" -ForegroundColor White
        Write-Host "4. Make sure Ultra Stable Server is running on port 8050" -ForegroundColor White
        Write-Host "5. Login with ravi/ravi@123 or any valid credentials" -ForegroundColor White
        
    } else {
        Write-Host "❌ APK file not found after build" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}