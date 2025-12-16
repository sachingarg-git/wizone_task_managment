# WIZONE IT Support - Mobile APK Build Guide
# Complete Mobile Application with Full Portal Functionality

## Overview
This guide creates a fully functional mobile APK with:
- ✅ Complete task management (view, update, upload files)
- ✅ Card view with counts (completed, pending, cancelled tasks)
- ✅ Task history with hyperlinks
- ✅ Status change functionality
- ✅ File upload from mobile camera and gallery
- ✅ Real-time sync between APK and web
- ✅ Full responsive mobile interface
- ✅ Network monitoring (for authorized roles)

## Prerequisites

### Required Software
1. **Node.js** (v18 or higher)
2. **Java JDK** (JDK 17 recommended)
   - Download: https://adoptium.net/
   - Set JAVA_HOME environment variable
3. **Android Studio** (Latest version)
   - Download: https://developer.android.com/studio
4. **Gradle** (Included with Android Studio)

### Environment Variables (Windows PowerShell)
```powershell
# Set Java Home (adjust path to your JDK installation)
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.x-hotspot"

# Set Android SDK (adjust path to your Android SDK)
$env:ANDROID_SDK_ROOT = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_HOME = "$env:ANDROID_SDK_ROOT"

# Add to PATH
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_SDK_ROOT\cmdline-tools\latest\bin;$env:ANDROID_SDK_ROOT\platform-tools;$env:PATH"
```

## Step-by-Step Build Process

### Step 1: Update Server Configuration
Update `server/index.ts` to allow mobile connections:

```typescript
// Add CORS configuration for mobile
app.use(cors({
  origin: [
    'capacitor://localhost',
    'http://localhost',
    'http://localhost:3007',
    'http://192.168.1.1:3007', // Replace with your local IP
  ],
  credentials: true
}));
```

### Step 2: Build Web Application
```powershell
# Install dependencies (if not done)
npm install

# Build the frontend
npm run build
```

### Step 3: Initialize Capacitor (First time only)
```powershell
# Add Android platform
npx cap add android

# This creates the android folder with Android Studio project
```

### Step 4: Sync Web Build to Android
```powershell
# Copy web assets to Android project
npx cap sync android

# Or use copy if sync fails
npx cap copy android
```

### Step 5: Update Android Configuration

#### A. Update `android/app/src/main/AndroidManifest.xml`
Add these permissions:

```xml
<manifest>
    <!-- Internet and Network -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    
    <!-- Camera and Storage -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
    
    <!-- Vibration and Notifications -->
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    
    <!-- Background tasks -->
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    
    <application
        android:usesCleartextTraffic="true"
        android:requestLegacyExternalStorage="true"
        android:networkSecurityConfig="@xml/network_security_config">
        <!-- ... rest of application config -->
    </application>
</manifest>
```

#### B. Create `android/app/src/main/res/xml/network_security_config.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">192.168.1.1</domain>
        <domain includeSubdomains="true">103.122.85.61</domain>
    </domain-config>
</network-security-config>
```

#### C. Update `android/app/build.gradle`
```gradle
android {
    namespace "com.wizoneit.taskmanager"
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "com.wizoneit.taskmanager"
        minSdkVersion 24
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
        
        // Enable 16KB page size support
        ndk {
            abiFilters 'arm64-v8a', 'armeabi-v7a', 'x86', 'x86_64'
        }
    }
    
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}
```

### Step 6: Build APK

#### Method A: Using Android Studio (Recommended)
```powershell
# Open project in Android Studio
npx cap open android

# In Android Studio:
# 1. Build > Build Bundle(s) / APK(s) > Build APK(s)
# 2. Wait for build to complete
# 3. Click "locate" link in notification to find APK
# 4. APK location: android/app/build/outputs/apk/debug/app-debug.apk
```

#### Method B: Using Gradle Command Line
```powershell
# Navigate to android folder
cd android

# Build debug APK
.\gradlew assembleDebug

# Or build release APK (unsigned)
.\gradlew assembleRelease

# APK output: android/app/build/outputs/apk/debug/app-debug.apk
cd ..
```

### Step 7: Install APK on Device

#### Via USB (ADB)
```powershell
# Enable USB debugging on Android device
# Connect device via USB

# Check if device is connected
adb devices

# Install APK
adb install android\app\build\outputs\apk\debug\app-debug.apk

# Or force reinstall
adb install -r android\app\build\outputs\apk\debug\app-debug.apk
```

#### Via File Transfer
1. Copy `app-debug.apk` to device via USB or cloud
2. Open APK file on device
3. Allow "Install from unknown sources" if prompted
4. Install the app

### Step 8: Configure Server Connection

#### For Development (Local Server)
1. Find your computer's local IP:
```powershell
ipconfig
# Look for IPv4 Address (e.g., 192.168.1.XXX)
```

2. Update `capacitor.config.ts`:
```typescript
server: {
  url: 'http://192.168.1.XXX:3007', // Replace XXX with your IP
  cleartext: true,
}
```

3. Ensure your server is running:
```powershell
npm run dev
```

4. Make sure device is on same WiFi network

#### For Production (Remote Server)
Update `capacitor.config.ts`:
```typescript
server: {
  url: 'https://your-production-server.com',
  androidScheme: 'https',
}
```

## Complete Build Script

Save this as `build-mobile-apk.ps1`:

```powershell
# WIZONE IT Support - Mobile APK Builder
Write-Host "🚀 WIZONE Task Manager - Mobile APK Builder" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Step 1: Build frontend
Write-Host "`n📦 Step 1: Building frontend..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend built successfully!" -ForegroundColor Green

# Step 2: Sync to Android
Write-Host "`n🔄 Step 2: Syncing to Android..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Sync failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Synced successfully!" -ForegroundColor Green

# Step 3: Build APK
Write-Host "`n🏗️  Step 3: Building APK..." -ForegroundColor Yellow
cd android
.\gradlew assembleDebug
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ APK build failed!" -ForegroundColor Red
    cd ..
    exit 1
}
cd ..
Write-Host "✅ APK built successfully!" -ForegroundColor Green

# Step 4: Copy APK to root
$apkSource = "android\app\build\outputs\apk\debug\app-debug.apk"
$apkDest = "WIZONE-TaskManager-v1.0.apk"

if (Test-Path $apkSource) {
    Copy-Item $apkSource $apkDest -Force
    Write-Host "`n✅ SUCCESS! APK ready for installation" -ForegroundColor Green
    Write-Host "📱 APK Location: $apkDest" -ForegroundColor Cyan
    Write-Host "📱 Size: $((Get-Item $apkDest).Length / 1MB) MB" -ForegroundColor Cyan
    
    Write-Host "`n📋 Installation Instructions:" -ForegroundColor Yellow
    Write-Host "1. Transfer APK to Android device" -ForegroundColor White
    Write-Host "2. Open APK file on device" -ForegroundColor White
    Write-Host "3. Allow 'Install from unknown sources'" -ForegroundColor White
    Write-Host "4. Install and enjoy!" -ForegroundColor White
    
    Write-Host "`nOr install via ADB:" -ForegroundColor Yellow
    Write-Host "adb install -r $apkDest" -ForegroundColor Cyan
} else {
    Write-Host "❌ APK file not found at $apkSource" -ForegroundColor Red
    exit 1
}
```

## Mobile Features

### ✅ Implemented Features
1. **Task Cards with Statistics**
   - Total Tasks count
   - Pending Tasks count
   - In Progress count  
   - Completed Tasks count

2. **Task Details View**
   - Tap task card to view full details
   - Customer information
   - Issue type and priority
   - Current status with badges
   - Created and updated timestamps

3. **Task History**
   - Complete update timeline
   - Status changes tracking
   - File upload history
   - User activity log
   - Clickable task IDs

4. **Update Task Functionality**
   - Change status (pending, in_progress, completed, cancelled)
   - Add update notes
   - Resolution notes for completed tasks
   - Real-time validation

5. **File Upload**
   - 📷 Take photo with camera
   - 📁 Choose from gallery
   - 📎 Attach multiple files
   - 💬 Add notes to uploads
   - Preview files before upload
   - Upload progress indicator

6. **Sync Functionality**
   - Manual refresh button
   - Auto-sync on app launch
   - Real-time data between web and APK
   - Offline capabilities (with Capacitor Preferences)

7. **Network Monitoring** (For authorized roles)
   - Dashboard with KPIs
   - Tower management
   - Real-time monitoring
   - Analytics and alerts

### 🎨 Mobile UI Enhancements
- Touch-optimized buttons and cards
- Swipe-friendly interface
- Bottom sheet dialogs
- Pull-to-refresh
- Haptic feedback
- Smooth animations
- Responsive grid layouts
- Mobile-first navigation

## Testing Checklist

### On Device Testing
- [ ] App launches successfully
- [ ] Login works correctly
- [ ] Task list displays properly
- [ ] Task cards show correct counts
- [ ] Task details open on tap
- [ ] History shows all updates
- [ ] Status can be changed
- [ ] Camera opens for photo
- [ ] Gallery selection works
- [ ] Files upload successfully
- [ ] Notes are saved
- [ ] Sync button works
- [ ] Network monitoring accessible (if authorized)

### Data Sync Testing
- [ ] Create task on web → appears in APK
- [ ] Update task in APK → reflects on web
- [ ] Upload file in APK → visible on web
- [ ] Change status in web → updates in APK
- [ ] History syncs both ways

## Troubleshooting

### Common Issues

#### 1. APK Build Fails
```powershell
# Clean build
cd android
.\gradlew clean
.\gradlew assembleDebug
cd ..
```

#### 2. White Screen on Launch
- Check `capacitor.config.ts` server URL
- Ensure server is running
- Check device is on same network
- Verify CORS settings in server

#### 3. Cannot Install APK
- Enable "Install from unknown sources" in device settings
- Check APK is not corrupted (re-download/copy)
- Use ADB install if manual install fails

#### 4. Camera/Storage Permission Denied
- Check AndroidManifest.xml has all permissions
- Request permissions at runtime in app

#### 5. Network Request Fails
- Check server URL in capacitor.config.ts
- Verify device can reach server (ping test)
- Check firewall settings on server
- Ensure cleartext traffic is allowed

### Debug Mode

To debug on device:
```powershell
# Open Android Studio with project
npx cap open android

# Run with debugging enabled
# Device logs will appear in Logcat
```

Chrome Remote Debugging:
1. Open Chrome on PC: `chrome://inspect`
2. Connect device via USB
3. Enable USB debugging on device
4. Click "Inspect" when device appears

## Production Release

### Create Signed APK

1. Generate Keystore:
```powershell
keytool -genkey -v -keystore wizone-release-key.keystore -alias wizone -keyalg RSA -keysize 2048 -validity 10000
```

2. Update `android/app/build.gradle`:
```gradle
signingConfigs {
    release {
        storeFile file('../../wizone-release-key.keystore')
        storePassword 'your-store-password'
        keyAlias 'wizone'
        keyPassword 'your-key-password'
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android.txt')
    }
}
```

3. Build Release APK:
```powershell
cd android
.\gradlew assembleRelease
cd ..
```

APK Location: `android/app/build/outputs/apk/release/app-release.apk`

## Support

For issues or questions:
- Check server logs: `server/index.ts`
- Check browser console in Chrome DevTools
- Check Android Logcat in Android Studio
- Review Capacitor documentation: https://capacitorjs.com/docs

## Version History

- **v1.0.0** - Initial release
  - Full task management
  - File uploads
  - Status updates
  - History tracking
  - Mobile-optimized UI

---

Built with ❤️ for WIZONE IT Support System
