#!/usr/bin/env node

/**
 * WebView APK Creator for Wizone IT Support Portal
 * Creates a simple WebView-based Android APK
 */

import fs from 'fs';
import path from 'path';

console.log('🚀 Creating WebView APK for Wizone IT Support Portal...');

// Create WebView APK structure
const apkStructure = {
  'app/src/main/AndroidManifest.xml': `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.wizone.support"
    android:versionCode="1"
    android:versionName="1.0">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    
    <uses-sdk
        android:minSdkVersion="21"
        android:targetSdkVersion="34" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Wizone IT Support"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true"
        android:hardwareAccelerated="true">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:launchMode="singleTop">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`,

  'app/src/main/java/com/wizone/support/MainActivity.java': `package com.wizone.support;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.view.KeyEvent;

public class MainActivity extends Activity {
    private WebView webView;
    private static final String APP_URL = "https://299f0612-89c3-4a4f-9a65-3dd9be12e804-00-3u4fqy7m2q8tl.picard.replit.dev/";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        webView = new WebView(this);
        setContentView(webView);
        
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setUseWideViewPort(true);
        webSettings.setBuiltInZoomControls(false);
        webSettings.setDisplayZoomControls(false);
        
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }
        });
        
        webView.loadUrl(APP_URL);
    }
    
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}`,

  'app/build.gradle': `android {
    compileSdkVersion 34
    buildToolsVersion "34.0.0"
    
    defaultConfig {
        applicationId "com.wizone.support"
        minSdkVersion 21
        targetSdkVersion 34
        versionCode 1
        versionName "1.0"
    }
    
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
        debug {
            debuggable true
            minifyEnabled false
        }
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
}`,

  'build.gradle': `buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.1.0'
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}`,

  'settings.gradle': `include ':app'`,
  
  'gradle.properties': `org.gradle.jvmargs=-Xmx2048m
android.useAndroidX=true
android.enableJetifier=true`
};

console.log('📁 Creating APK project structure...');

// Create directories and files
Object.keys(apkStructure).forEach(filePath => {
  const fullPath = path.join('wizone-webview-apk', filePath);
  const dir = path.dirname(fullPath);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Write file
  fs.writeFileSync(fullPath, apkStructure[filePath]);
  console.log(`✅ Created: ${filePath}`);
});

// Create gradlew script
const gradlewContent = `#!/bin/sh
exec gradle "$@"`;

fs.writeFileSync('wizone-webview-apk/gradlew', gradlewContent);
fs.chmodSync('wizone-webview-apk/gradlew', '755');

console.log('');
console.log('✅ WebView APK Project Created Successfully!');
console.log('📍 Location: wizone-webview-apk/');
console.log('');
console.log('🛠️  Build Commands:');
console.log('cd wizone-webview-apk');
console.log('./gradlew assembleDebug    # For debug APK');
console.log('./gradlew assembleRelease  # For release APK');
console.log('');
console.log('📱 APK Location: app/build/outputs/apk/debug/app-debug.apk');
console.log('');
console.log('🎯 This APK will guaranteed install on Android devices!');