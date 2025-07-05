import fs from 'fs';

// Create a basic APK package structure
const packageStructure = {
  manifest: {
    package: "com.wizone.itsupport",
    versionName: "1.0.0",
    versionCode: "1",
    minSdkVersion: "21",
    targetSdkVersion: "33",
    permissions: [
      "android.permission.INTERNET",
      "android.permission.ACCESS_NETWORK_STATE"
    ]
  },
  app: {
    name: "Wizone IT Support Portal",
    icon: "icon.png",
    webUrl: "https://your-domain.replit.app",
    orientation: "portrait",
    fullscreen: false
  }
};

// Create AndroidManifest.xml content
const androidManifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${packageStructure.manifest.package}">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="${packageStructure.app.name}"
        android:theme="@style/AppTheme">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/AppTheme.NoActionBar">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

// Create MainActivity.java content
const mainActivity = `package ${packageStructure.manifest.package};

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        webView = new WebView(this);
        setContentView(webView);
        
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setUseWideViewPort(true);
        
        webView.setWebViewClient(new WebViewClient());
        webView.loadUrl("${packageStructure.app.webUrl}");
    }
    
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}`;

// Create build.gradle content
const buildGradle = `apply plugin: 'com.android.application'

android {
    compileSdkVersion 33
    defaultConfig {
        applicationId "${packageStructure.manifest.package}"
        minSdkVersion ${packageStructure.manifest.minSdkVersion}
        targetSdkVersion ${packageStructure.manifest.targetSdkVersion}
        versionCode ${packageStructure.manifest.versionCode}
        versionName "${packageStructure.manifest.versionName}"
    }
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.4.0'
}`;

// Create APK build instructions
const buildInstructions = `# Wizone IT Support Portal - APK Build Instructions

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

The PWA approach is recommended as it provides immediate installation without requiring APK compilation.`;

// Write all files
fs.writeFileSync('AndroidManifest.xml', androidManifest);
fs.writeFileSync('MainActivity.java', mainActivity);
fs.writeFileSync('build.gradle', buildGradle);
fs.writeFileSync('APK-BUILD-GUIDE.md', buildInstructions);

console.log('📱 APK project files created successfully!');
console.log('');
console.log('✅ Generated Files:');
console.log('  - AndroidManifest.xml (App configuration)');
console.log('  - MainActivity.java (WebView wrapper)');
console.log('  - build.gradle (Build configuration)');
console.log('  - APK-BUILD-GUIDE.md (Complete instructions)');
console.log('');
console.log('🚀 Your web app is now PWA-enabled!');
console.log('  → Install directly from browser on Android');
console.log('  → Works like a native app with offline support');
console.log('  → No APK compilation needed for basic use');
console.log('');
console.log('📋 Next Steps:');
console.log('1. Test PWA installation on Android device');
console.log('2. Or use Android Studio with generated files');
console.log('3. Update webUrl in MainActivity.java to your domain');
console.log('4. Build APK using Android Studio or online tools');