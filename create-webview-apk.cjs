const fs = require('fs');
const path = require('path');

console.log('🚀 Creating Complete Android Studio Project...');

// Create project structure
const projectDir = 'android-studio-project';

// Clean existing
if (fs.existsSync(projectDir)) {
    fs.rmSync(projectDir, { recursive: true, force: true });
}

// Create directories
const createDir = (dir) => fs.mkdirSync(dir, { recursive: true });

createDir(`${projectDir}/app/src/main/java/com/wizoneit/taskmanager`);
createDir(`${projectDir}/app/src/main/res/layout`);
createDir(`${projectDir}/app/src/main/res/values`);
createDir(`${projectDir}/app/src/main/res/drawable`);
createDir(`${projectDir}/app/src/main/res/mipmap-hdpi`);
createDir(`${projectDir}/app/src/main/res/mipmap-mdpi`);
createDir(`${projectDir}/app/src/main/res/mipmap-xhdpi`);
createDir(`${projectDir}/app/src/main/res/mipmap-xxhdpi`);
createDir(`${projectDir}/app/src/main/res/mipmap-xxxhdpi`);
createDir(`${projectDir}/app/src/main/assets`);
createDir(`${projectDir}/gradle/wrapper`);

// Create MainActivity.java with better WebView handling
const mainActivityContent = `package com.wizoneit.taskmanager;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.webkit.WebChromeClient;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.Toast;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.content.Context;

public class MainActivity extends Activity {
    
    private WebView webView;
    private ProgressBar progressBar;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        webView = findViewById(R.id.webview);
        progressBar = findViewById(R.id.progressBar);
        
        setupWebView();
        loadApplication();
    }
    
    private void setupWebView() {
        WebSettings webSettings = webView.getSettings();
        
        // Enable JavaScript and modern web features
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setAppCacheEnabled(true);
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        
        // File access permissions
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setAllowFileAccessFromFileURLs(true);
        webSettings.setAllowUniversalAccessFromFileURLs(true);
        
        // Viewport and zoom settings
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setUseWideViewPort(true);
        webSettings.setSupportZoom(false);
        webSettings.setBuiltInZoomControls(false);
        
        // Performance settings
        webSettings.setRenderPriority(WebSettings.RenderPriority.HIGH);
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        
        // Modern browser features
        webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                progressBar.setVisibility(View.VISIBLE);
            }
            
            @Override
            public void onPageFinished(WebView view, String url) {
                progressBar.setVisibility(View.GONE);
                
                // Inject CSS to hide any loading issues
                String css = "javascript:(function() {" +
                    "var style = document.createElement('style');" +
                    "style.innerHTML = 'body { background-color: #1e40af !important; }';" +
                    "document.head.appendChild(style);" +
                    "})()";
                view.loadUrl(css);
            }
            
            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                progressBar.setVisibility(View.GONE);
                
                // Try fallback URL if local assets fail
                if (failingUrl.contains("android_asset")) {
                    Toast.makeText(MainActivity.this, "Loading online version...", Toast.LENGTH_SHORT).show();
                    webView.loadUrl("https://window.299f0612-89c3-4a4f-9a65-3dd9be12e804-00-3u4fqy7m2q8tl.picard.replit.dev/");
                } else {
                    Toast.makeText(MainActivity.this, "Error: " + description, Toast.LENGTH_LONG).show();
                }
            }
            
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }
        });
        
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setProgress(newProgress);
            }
        });
    }
    
    private void loadApplication() {
        try {
            // Check if we have internet connectivity
            if (isNetworkAvailable()) {
                // Load online version first (more reliable)
                webView.loadUrl("https://window.299f0612-89c3-4a4f-9a65-3dd9be12e804-00-3u4fqy7m2q8tl.picard.replit.dev/");
            } else {
                // Fallback to local assets
                webView.loadUrl("file:///android_asset/index.html");
            }
        } catch (Exception e) {
            Toast.makeText(this, "Loading application...", Toast.LENGTH_SHORT).show();
            webView.loadUrl("file:///android_asset/index.html");
        }
    }
    
    private boolean isNetworkAvailable() {
        ConnectivityManager connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo activeNetworkInfo = connectivityManager.getActiveNetworkInfo();
        return activeNetworkInfo != null && activeNetworkInfo.isConnected();
    }
    
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
    
    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.onResume();
        }
    }
    
    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) {
            webView.onPause();
        }
    }
}`;

fs.writeFileSync(`${projectDir}/app/src/main/java/com/wizoneit/taskmanager/MainActivity.java`, mainActivityContent);

// Create activity_main.xml
const layoutContent = `<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#1e40af">

    <ProgressBar
        android:id="@+id/progressBar"
        style="?android:attr/progressBarStyleHorizontal"
        android:layout_width="match_parent"
        android:layout_height="6dp"
        android:layout_alignParentTop="true"
        android:progressTint="#22d3ee"
        android:progressBackgroundTint="#1e3a8a"
        android:visibility="gone" />

    <WebView
        android:id="@+id/webview"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:layout_below="@id/progressBar"
        android:background="#1e40af" />

</RelativeLayout>`;

fs.writeFileSync(`${projectDir}/app/src/main/res/layout/activity_main.xml`, layoutContent);

// Create strings.xml
const stringsContent = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Wizone IT Portal</string>
</resources>`;

fs.writeFileSync(`${projectDir}/app/src/main/res/values/strings.xml`, stringsContent);

// Create colors.xml
const colorsContent = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="primary">#1e40af</color>
    <color name="primary_dark">#1e3a8a</color>
    <color name="accent">#22d3ee</color>
    <color name="white">#FFFFFF</color>
    <color name="black">#000000</color>
</resources>`;

fs.writeFileSync(`${projectDir}/app/src/main/res/values/colors.xml`, colorsContent);

// Create AndroidManifest.xml
const manifestContent = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.wizoneit.taskmanager"
    android:versionCode="1"
    android:versionName="1.0">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@android:style/Theme.Material.Light.NoActionBar"
        android:usesCleartextTraffic="true"
        android:hardwareAccelerated="true"
        android:largeHeap="true">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait"
            android:configChanges="orientation|screenSize|keyboardHidden|smallestScreenSize|screenLayout"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

fs.writeFileSync(`${projectDir}/app/src/main/AndroidManifest.xml`, manifestContent);

// Create app build.gradle
const appBuildGradleContent = `plugins {
    id 'com.android.application'
}

android {
    namespace 'com.wizoneit.taskmanager'
    compileSdk 34

    defaultConfig {
        applicationId "com.wizoneit.taskmanager"
        minSdk 21
        targetSdk 34
        versionCode 1
        versionName "1.0"
        
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.debug
        }
        debug {
            applicationIdSuffix ".debug"
            debuggable true
            minifyEnabled false
        }
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
    
    packagingOptions {
        pickFirst '**/libc++_shared.so'
        pickFirst '**/libjsc.so'
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    implementation 'com.google.android.material:material:1.10.0'
}`;

fs.writeFileSync(`${projectDir}/app/build.gradle`, appBuildGradleContent);

// Create project build.gradle
const projectBuildGradleContent = `buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.1.4'
    }
}

plugins {
    id 'com.android.application' version '8.1.4' apply false
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

tasks.register('clean', Delete) {
    delete rootProject.buildDir
}`;

fs.writeFileSync(`${projectDir}/build.gradle`, projectBuildGradleContent);

// Create gradle.properties
const gradlePropertiesContent = `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=true
android.nonTransitiveRClass=false
org.gradle.parallel=true
org.gradle.caching=true
android.defaults.buildfeatures.buildconfig=true
android.nonFinalResIds=false`;

fs.writeFileSync(`${projectDir}/gradle.properties`, gradlePropertiesContent);

// Create settings.gradle
const settingsGradleContent = `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "Wizone IT Portal"
include ':app'`;

fs.writeFileSync(`${projectDir}/settings.gradle`, settingsGradleContent);

// Create gradle wrapper properties
const gradleWrapperPropertiesContent = `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.4-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists`;

fs.writeFileSync(`${projectDir}/gradle/wrapper/gradle-wrapper.properties`, gradleWrapperPropertiesContent);

// Create proguard-rules.pro
const proguardContent = `# Add project specific ProGuard rules here.
-keep class * {
    public private *;
}

# Keep WebView related classes
-keepclassmembers class fqcn.of.javascript.interface.for.webview {
   public *;
}

-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Keep JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}`;

fs.writeFileSync(`${projectDir}/app/proguard-rules.pro`, proguardContent);

console.log('✅ Android Studio project created successfully!');
console.log('📁 Location: ' + projectDir);
console.log('');
console.log('🔧 Next steps will copy web assets and configure build...');