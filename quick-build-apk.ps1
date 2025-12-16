# Quick Mobile APK Builder
# Fast build without prompts

Write-Host "🚀 Quick Building WIZONE Mobile APK..." -ForegroundColor Cyan

npm run build
npx cap copy android

Push-Location android
.\gradlew.bat assembleDebug
Pop-Location

$apkSource = "android\app\build\outputs\apk\debug\app-debug.apk"
$apkDest = "WIZONE-TaskManager-Mobile.apk"

if (Test-Path $apkSource) {
    Copy-Item $apkSource $apkDest -Force
    $apkSize = "{0:N2}" -f ((Get-Item $apkDest).Length / 1MB)
    Write-Host "✅ APK Ready: $apkDest ($apkSize MB)" -ForegroundColor Green
    Write-Host "Install: adb install -r $apkDest" -ForegroundColor Cyan
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
}
