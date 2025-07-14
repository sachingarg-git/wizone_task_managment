# Wizone IT Support Portal - APK Build Instructions

## Quick APK Creation

### Method 1: Progressive Web App (PWA) - RECOMMENDED
Your Wizone app is now configured as a PWA and can be installed directly:

1. **Access the web app on Android device:**
   - Open Chrome browser
   - Navigate to your app URL
   - Tap the menu (⋮) → "Add to Home screen" 
   - The app will install like a native APK

2. **PWA Features:**
   - Works offline with cached data
   - Full-screen app experience
   - Native app icon on home screen
   - Push notifications support
   - Automatic updates

### Method 2: WebView APK Wrapper
Use the generated Android project files:

1. **Android Studio Method:**
   - Import the generated project into Android Studio
   - Update the webUrl in MainActivity.java to your domain
   - Build → Generate Signed Bundle / APK
   - Choose APK and create signing key
   - APK will be generated in app/build/outputs/apk/

2. **Online APK Builders:**
   - Use services like AppsGeyser, AppMaker, or WebViewGold
   - Upload the generated files or just provide your web URL
   - Customize app name, icon, and settings
   - Download the generated APK

### Files Generated:
- AndroidManifest.xml (App permissions and configuration)
- MainActivity.java (WebView wrapper for your web app)
- build.gradle (Android build configuration)

### Current App URL:
Replace with your actual domain in the files above.

## Installation Methods:

### For End Users:
1. **PWA Installation (Easiest):**
   - Visit app URL on Android
   - Use "Add to Home Screen" from browser menu

2. **APK Installation:**
   - Enable "Unknown Sources" in Android settings
   - Download and install APK file
   - App will appear in app drawer

### Distribution:
- **Internal Testing:** Share APK file directly
- **Google Play Store:** Upload AAB (Android App Bundle)
- **Enterprise:** Use MDM systems for deployment

The PWA approach is recommended as it provides immediate installation without requiring APK compilation.