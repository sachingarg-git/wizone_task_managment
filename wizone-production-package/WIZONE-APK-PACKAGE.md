# Wizone IT Support Portal - Mobile APK Package

## 📱 APK Installation Options

### Option 1: Progressive Web App (PWA) - RECOMMENDED ⭐

**Instant Installation - No APK Compilation Required!**

Your Wizone IT Support Portal is now configured as a Progressive Web App:

1. **On Android Device:**
   - Open Chrome/Edge browser
   - Navigate to: `https://replit.dev` (or your custom domain)
   - Tap browser menu (⋮) → "Add to Home screen"
   - Choose app name and tap "Add"
   - App icon appears on home screen like any native app

2. **PWA Features:**
   ✅ Works offline with cached data  
   ✅ Full-screen native app experience  
   ✅ Push notifications support  
   ✅ Automatic background updates  
   ✅ Fast loading and smooth performance  

### Option 2: Native APK Wrapper

**Files Generated for APK Creation:**

1. **AndroidManifest.xml** - App configuration and permissions
2. **MainActivity.java** - WebView wrapper pointing to your web app
3. **build.gradle** - Android build configuration

**APK Creation Methods:**

#### A) Android Studio (Professional)
1. Install Android Studio
2. Create new Android project
3. Replace generated files with provided ones
4. Update `webView.loadUrl("https://replit.dev")` with your domain
5. Build → Generate Signed Bundle / APK
6. APK will be in `app/build/outputs/apk/release/`

#### B) Online APK Builders (Quick)
- **Website2APK**: Upload web URL and get APK
- **AppsGeyser**: Convert website to Android app
- **AppMaker**: Simple web-to-APK conversion
- **WebViewGold**: Professional web app wrapper

#### C) Expo Build (React Native)
```bash
cd mobile/
npm install
npx expo build:android --type apk
```

## 📋 App Configuration

**Package Details:**
- Package Name: `com.wizone.itsupport`
- App Name: "Wizone IT Support Portal"
- Version: 1.0.0
- Minimum Android: API 21 (Android 5.0)
- Target Android: API 33 (Android 13)

**Permissions:**
- INTERNET (for web connectivity)
- ACCESS_NETWORK_STATE (for network status)

**Features:**
- Full-screen WebView
- JavaScript enabled
- Local storage support
- Back button navigation
- Portrait orientation optimized

## 🚀 Quick Start Guide

### For End Users:
1. **PWA Installation (Easiest):**
   - Visit app URL on Android
   - Use "Add to Home Screen"
   - Launch from home screen

2. **APK Installation:**
   - Enable "Unknown Sources" in Android Settings
   - Download and install APK file
   - Launch from app drawer

### For IT Administrators:
1. **Mass Deployment:**
   - Use MDM (Mobile Device Management) systems
   - Deploy APK via enterprise app stores
   - Configure app policies and restrictions

2. **Custom Domain Setup:**
   - Update URL in MainActivity.java
   - Rebuild APK with your domain
   - Distribute to organization

## 🔧 Customization Options

**Branding:**
- App icon: Replace icon.png in assets
- App name: Update in AndroidManifest.xml
- Colors: Modify theme in build.gradle
- URL: Change webView.loadUrl() in MainActivity.java

**Advanced Features:**
- Push notifications via web APIs
- Offline data synchronization
- Biometric authentication integration
- Custom splash screen

## 📞 Support & Distribution

**Testing:**
- Internal testing with APK file sharing
- Beta testing via Google Play Console
- PWA testing on various Android devices

**Production Deployment:**
- Google Play Store (AAB format required)
- Enterprise app stores
- Direct APK distribution
- PWA via web browser

**Maintenance:**
- PWA updates automatically
- APK updates require redistribution
- Monitor app performance and usage

## 🎯 Recommended Approach

**For immediate use:** Use PWA installation - it's faster, easier, and provides the same user experience as a native app.

**For enterprise deployment:** Create APK using Android Studio for full control and branding customization.

**For app store publishing:** Use Expo or Android Studio to create production-ready AAB files.

The PWA approach is ideal for most use cases as it provides instant installation, automatic updates, and full app functionality without requiring APK compilation or side-loading permissions.