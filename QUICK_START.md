# 🚀 QUICK START - Build Your Mobile APK in 3 Steps

## Prerequisites Check

```powershell
# Check if you have Node.js
node --version
# Should show v18 or higher ✅

# Check if you have Java
java -version
# Should show Java 17 or higher ✅
# If not, download from: https://adoptium.net/
```

## Build Your APK

### Step 1: Run Build Script
```powershell
.\build-mobile-apk.ps1
```

### Step 2: Wait for Build
- Takes 5-10 minutes first time
- Subsequent builds: 2-3 minutes
- Progress shown step-by-step

### Step 3: Install on Device
```powershell
# Method A: Via USB (ADB)
adb install -r WIZONE-TaskManager-Mobile-v1.0.apk

# Method B: Manual Transfer
# Copy APK to phone and open it
```

## That's It! 🎉

Your mobile app is ready with:
- ✅ Full task management
- ✅ Card view with statistics
- ✅ Complete history
- ✅ Status updates
- ✅ Camera & file upload
- ✅ Real-time sync with web

---

## Troubleshooting

### Build Fails?
```powershell
# Make sure Java JDK 17 is installed
java -version

# Try manual sync
npx cap sync android

# Clean build
cd android
.\gradlew.bat clean
.\gradlew.bat assembleDebug
cd ..
```

### APK Won't Install?
1. Enable "Install from unknown sources" on device
2. Allow installation when prompted
3. Or use ADB: `adb install -r WIZONE-TaskManager-Mobile-v1.0.apk`

### App Shows White Screen?
1. Check server is running: `npm run dev`
2. Verify server URL in `capacitor.config.ts`
3. Ensure device is on same network

---

## Full Documentation

- **Technical Guide**: `MOBILE_APK_BUILD_GUIDE.md`
- **User Guide**: `APK_USER_GUIDE.md`
- **Implementation Details**: `MOBILE_IMPLEMENTATION_COMPLETE.md`

---

**Need Help?** Check the full guides above or contact IT support.

**Ready to Build?** Run `.\build-mobile-apk.ps1` now! 🚀
