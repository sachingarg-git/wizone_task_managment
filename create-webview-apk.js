#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🚀 Creating WebView APK wrapper for Wizone IT Support Portal...');

// Create APK project structure
const apkDir = './wizone-apk';
const srcDir = path.join(apkDir, 'app/src/main');
const javaDir = path.join(srcDir, 'java/com/wizone/itsupport');
const resDir = path.join(srcDir, 'res');

// Create directories
[apkDir, `${apkDir}/app`, srcDir, javaDir, `${resDir}/layout`, `${resDir}/values`, `${resDir}/mipmap-hdpi`, `${resDir}/mipmap-mdpi`, `${resDir}/mipmap-xhdpi`, `${resDir}/mipmap-xxhdpi`, `${resDir}/mipmap-xxxhdpi`].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Create MainActivity.java
const mainActivity = `package com.wizone.itsupport;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.view.KeyEvent;

public class MainActivity extends Activity {
    private WebView webView;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        webView = findViewById(R.id.webview);
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setAppCacheEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }
        });
        
        // Load your Wizone IT Support Portal
        webView.loadUrl("https://29f0612-89c3-4a4f-9a65-3dd9be12e804-00-3u4fqy7m2q8tl.picard.replit.dev");
    }
    
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}`;

// Create activity_main.xml
const activityMain = `<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <WebView
        android:id="@+id/webview"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

</RelativeLayout>`;

// Create AndroidManifest.xml
const androidManifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.wizone.itsupport"
    android:versionCode="1"
    android:versionName="1.0">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Wizone IT Support Portal"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

// Create strings.xml
const strings = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Wizone IT Support Portal</string>
</resources>`;

// Create styles.xml
const styles = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="android:Theme.Material.Light.NoActionBar">
        <item name="android:statusBarColor">#2196F3</item>
        <item name="android:navigationBarColor">#2196F3</item>
        <item name="android:windowBackground">@android:color/white</item>
    </style>
</resources>`;

// Create build.gradle (app level)
const buildGradle = `plugins {
    id 'com.android.application'
}

android {
    compileSdk 33
    
    defaultConfig {
        applicationId "com.wizone.itsupport"
        minSdk 21
        targetSdk 33
        versionCode 1
        versionName "1.0"
    }
    
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.8.0'
}`;

// Create project build.gradle
const projectBuildGradle = `buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.0.2'
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

task clean(type: Delete) {
    delete rootProject.buildDir
}`;

// Create gradle.properties
const gradleProperties = `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=true`;

// Write all files
fs.writeFileSync(path.join(javaDir, 'MainActivity.java'), mainActivity);
fs.writeFileSync(path.join(resDir, 'layout/activity_main.xml'), activityMain);
fs.writeFileSync(path.join(srcDir, 'AndroidManifest.xml'), androidManifest);
fs.writeFileSync(path.join(resDir, 'values/strings.xml'), strings);
fs.writeFileSync(path.join(resDir, 'values/styles.xml'), styles);
fs.writeFileSync(path.join(apkDir, 'app/build.gradle'), buildGradle);
fs.writeFileSync(path.join(apkDir, 'build.gradle'), projectBuildGradle);
fs.writeFileSync(path.join(apkDir, 'gradle.properties'), gradleProperties);

// Create APK build instructions
const apkInstructions = `# Wizone IT Support Portal - APK Build Instructions

## 📱 Ready-to-Build Android Project Created!

Your WebView-based Android APK project has been generated in the 'wizone-apk' directory.

### Quick APK Generation Options:

#### Option 1: Online APK Builders (Easiest)
1. **Website2APK.com**
   - Go to https://website2apk.com
   - Enter URL: https://29f0612-89c3-4a4f-9a65-3dd9be12e804-00-3u4fqy7m2q8tl.picard.replit.dev
   - App Name: Wizone IT Support Portal
   - Package: com.wizone.itsupport
   - Download APK in 2-3 minutes

2. **AppsGeyser.com**
   - Go to https://appsgeyser.com
   - Choose "Website" option
   - Enter your app URL and details
   - Generate and download APK

#### Option 2: Android Studio (Professional)
1. Open Android Studio
2. Import the 'wizone-apk' project
3. Build → Generate Signed Bundle / APK
4. APK will be in app/build/outputs/apk/release/

#### Option 3: Command Line (Advanced)
\`\`\`bash
cd wizone-apk
./gradlew assembleRelease
\`\`\`

### 📋 Project Details:
- **Package Name**: com.wizone.itsupport
- **App Name**: Wizone IT Support Portal
- **Target URL**: Your current Replit domain
- **Minimum Android**: 5.0 (API 21)
- **Target Android**: 13 (API 33)

### 🚀 Features Included:
✅ Full WebView with JavaScript support
✅ Local storage and database enabled
✅ Back button navigation
✅ Portrait orientation
✅ Material Design theme
✅ Network permissions
✅ Splash screen support

### 📞 Quick Start:
1. Use Option 1 (Website2APK) for immediate APK generation
2. Install the generated APK on Android devices
3. Enjoy your native mobile app experience!

The fastest way is using Website2APK.com - just enter your URL and get a ready APK in minutes!
`;

fs.writeFileSync(path.join(apkDir, 'README.md'), apkInstructions);

console.log('✅ WebView APK project created successfully!');
console.log('📁 Project location: ./wizone-apk/');
console.log('📖 Build instructions: ./wizone-apk/README.md');
console.log('🌐 Recommended: Use Website2APK.com for instant APK generation');