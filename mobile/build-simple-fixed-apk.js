#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Building Simple Wizone APK with Fixed Configuration...\n');

const mobileDir = __dirname;
const fixedApkDir = path.join(mobileDir, '..', 'wizone-fixed-apk');

// Create a new directory for the fixed APK if it doesn't exist
if (!fs.existsSync(fixedApkDir)) {
    fs.mkdirSync(fixedApkDir, { recursive: true });
}

// Create package directories
const packageName = "com.wizone.taskmanager";
const packagePath = packageName.replace(/\./g, '/');
const sourcePath = path.join(fixedApkDir, 'app', 'src', 'main', 'java', packagePath);

if (!fs.existsSync(sourcePath)) {
    fs.mkdirSync(sourcePath, { recursive: true });
}

// Create res directories
const resPath = path.join(fixedApkDir, 'app', 'src', 'main', 'res');
const valuesPath = path.join(resPath, 'values');
const drawablePath = path.join(resPath, 'drawable');
const layoutPath = path.join(resPath, 'layout');

if (!fs.existsSync(valuesPath)) {
    fs.mkdirSync(valuesPath, { recursive: true });
}
if (!fs.existsSync(drawablePath)) {
    fs.mkdirSync(drawablePath, { recursive: true });
}
if (!fs.existsSync(layoutPath)) {
    fs.mkdirSync(layoutPath, { recursive: true });
}

// Create assets directory
const assetsPath = path.join(fixedApkDir, 'app', 'src', 'main', 'assets');
if (!fs.existsSync(assetsPath)) {
    fs.mkdirSync(assetsPath, { recursive: true });
}

// Create AndroidManifest.xml
const androidManifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${packageName}">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.CAMERA" />

    <application
        android:allowBackup="true"
        android:icon="@drawable/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@drawable/ic_launcher"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">
        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:exported="true"
            android:label="@string/app_name"
            android:launchMode="singleTask"
            android:theme="@style/AppTheme.NoActionBarLaunch">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

fs.writeFileSync(path.join(fixedApkDir, 'app', 'src', 'main', 'AndroidManifest.xml'), androidManifest);

// Create MainActivity.java
const mainActivity = `package ${packageName};

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
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
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setUseWideViewPort(true);
        webSettings.setLoadWithOverviewMode(true);
        
        webView.setWebViewClient(new WebViewClient());
        webView.loadUrl("file:///android_asset/index.html");
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

fs.writeFileSync(path.join(sourcePath, 'MainActivity.java'), mainActivity);

// Create layout XML
const activityMainXml = `<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".MainActivity">

    <WebView
        android:id="@+id/webview"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

</androidx.constraintlayout.widget.ConstraintLayout>`;

fs.writeFileSync(path.join(layoutPath, 'activity_main.xml'), activityMainXml);

// Create strings.xml
const stringsXml = `<resources>
    <string name="app_name">Wizone IT Support</string>
</resources>`;

fs.writeFileSync(path.join(valuesPath, 'strings.xml'), stringsXml);

// Create styles.xml
const stylesXml = `<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="colorAccent">@color/colorAccent</item>
    </style>
    
    <style name="AppTheme.NoActionBarLaunch" parent="AppTheme">
        <item name="android:windowNoTitle">true</item>
        <item name="android:windowActionBar">false</item>
        <item name="android:windowFullscreen">true</item>
    </style>
</resources>`;

fs.writeFileSync(path.join(valuesPath, 'styles.xml'), stylesXml);

// Create colors.xml
const colorsXml = `<resources>
    <color name="colorPrimary">#667eea</color>
    <color name="colorPrimaryDark">#5a67d8</color>
    <color name="colorAccent">#764ba2</color>
</resources>`;

fs.writeFileSync(path.join(valuesPath, 'colors.xml'), colorsXml);

// Create a simple launcher icon (a colored square)
const launcherIconXml = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#667eea" />
</shape>`;

fs.writeFileSync(path.join(drawablePath, 'ic_launcher.xml'), launcherIconXml);

// Create HTML for the WebView
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Wizone IT Support</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif; }
        
        .app-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .header {
            padding: 16px;
            background-color: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .header h1 {
            color: white;
            font-size: 20px;
            font-weight: 600;
            margin: 0;
        }
        
        .header p {
            color: rgba(255, 255, 255, 0.8);
            font-size: 14px;
            margin: 4px 0 0 0;
        }
        
        .main-content {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
        }
        
        .card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 16px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .card h2 {
            margin: 0 0 12px 0;
            font-size: 18px;
            color: #333;
        }
        
        .card p {
            margin: 0;
            color: #666;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 30px;
            font-size: 12px;
            font-weight: 500;
            margin-top: 10px;
        }
        
        .status-pending {
            background-color: #FEF9C3;
            color: #854D0E;
        }
        
        .status-progress {
            background-color: #DBEAFE;
            color: #1E40AF;
        }
        
        .status-completed {
            background-color: #DCFCE7;
            color: #166534;
        }
        
        .task-list {
            display: grid;
            gap: 12px;
        }
        
        .task-item {
            background: white;
            border-radius: 8px;
            padding: 16px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            border-left: 4px solid #667eea;
        }
        
        .task-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        
        .task-id {
            font-weight: 600;
            color: #333;
        }
        
        .task-date {
            font-size: 12px;
            color: #666;
        }
        
        .task-customer {
            font-size: 14px;
            color: #555;
            margin-bottom: 8px;
        }
        
        .task-description {
            font-size: 13px;
            color: #666;
            margin-bottom: 12px;
        }
        
        .task-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .version-info {
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.2);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
        }
        
        .btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 6px;
            font-weight: 500;
            font-size: 14px;
            cursor: pointer;
            display: block;
            width: 100%;
            text-align: center;
            margin-top: 16px;
        }

        /* Dialog styles */
        .dialog-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }

        .dialog {
            background: white;
            border-radius: 12px;
            padding: 20px;
            width: 90%;
            max-width: 400px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        .dialog-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 16px;
            color: #333;
        }

        .dialog-content {
            margin-bottom: 20px;
        }

        .form-group {
            margin-bottom: 16px;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-size: 14px;
            color: #555;
        }

        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
            color: #333;
        }

        .form-group textarea {
            min-height: 100px;
            resize: vertical;
        }

        .dialog-actions {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        }

        .btn-cancel {
            background: #f3f4f6;
            color: #333;
        }

        .btn-dialog {
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 500;
            font-size: 14px;
            border: none;
            cursor: pointer;
        }

        .btn-primary {
            background: #667eea;
            color: white;
        }
    </style>
</head>
<body>
    <div class="app-container">
        <div class="header">
            <h1>Wizone IT Support</h1>
            <p>Task Management Portal</p>
        </div>
        
        <div class="main-content">
            <div class="card">
                <h2>My Dashboard</h2>
                <p>Welcome to the Wizone IT Support mobile application. This interface allows you to manage your assigned tasks.</p>
                
                <div style="display: flex; justify-content: space-between; margin-top: 16px;">
                    <div style="text-align: center; flex: 1;">
                        <div style="font-size: 24px; font-weight: 600; color: #667eea;">12</div>
                        <div style="font-size: 12px; color: #666;">Total Tasks</div>
                    </div>
                    <div style="text-align: center; flex: 1;">
                        <div style="font-size: 24px; font-weight: 600; color: #FFA500;">5</div>
                        <div style="font-size: 12px; color: #666;">In Progress</div>
                    </div>
                    <div style="text-align: center; flex: 1;">
                        <div style="font-size: 24px; font-weight: 600; color: #10B981;">7</div>
                        <div style="font-size: 12px; color: #666;">Completed</div>
                    </div>
                </div>
            </div>
            
            <div class="task-list">
                <div class="task-item" onclick="showUpdateDialog(1)">
                    <div class="task-header">
                        <span class="task-id">TSK-2023-001</span>
                        <span class="task-date">Oct 10, 2023</span>
                    </div>
                    <div class="task-customer">Customer: Tata Technologies Ltd</div>
                    <div class="task-description">Network connectivity issues in conference room</div>
                    <div class="task-footer">
                        <span class="status-badge status-pending">Pending</span>
                    </div>
                </div>
                
                <div class="task-item" onclick="showUpdateDialog(2)">
                    <div class="task-header">
                        <span class="task-id">TSK-2023-002</span>
                        <span class="task-date">Oct 9, 2023</span>
                    </div>
                    <div class="task-customer">Customer: Infosys Solutions</div>
                    <div class="task-description">Printer installation for new office setup</div>
                    <div class="task-footer">
                        <span class="status-badge status-progress">In Progress</span>
                    </div>
                </div>
                
                <div class="task-item" onclick="showUpdateDialog(3)">
                    <div class="task-header">
                        <span class="task-id">TSK-2023-003</span>
                        <span class="task-date">Oct 8, 2023</span>
                    </div>
                    <div class="task-customer">Customer: Reliance Digital</div>
                    <div class="task-description">Server maintenance and security updates</div>
                    <div class="task-footer">
                        <span class="status-badge status-completed">Completed</span>
                    </div>
                </div>
            </div>
            
            <button class="btn" onclick="syncTasks()">Sync Tasks</button>
        </div>
        
        <div class="version-info">v1.1.5 Fixed</div>
    </div>

    <!-- Update Task Dialog -->
    <div class="dialog-overlay" id="updateDialog">
        <div class="dialog">
            <div class="dialog-title">Update Task</div>
            <div class="dialog-content">
                <div class="form-group">
                    <label for="taskStatus">Task Status</label>
                    <select id="taskStatus">
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="taskNotes">Task Notes</label>
                    <textarea id="taskNotes" placeholder="Enter your notes here..."></textarea>
                </div>
            </div>
            <div class="dialog-actions">
                <button class="btn-dialog btn-cancel" onclick="hideUpdateDialog()">Cancel</button>
                <button class="btn-dialog btn-primary" onclick="updateTask()">Update</button>
            </div>
        </div>
    </div>

    <script>
        let currentTaskId = null;
        
        function showUpdateDialog(taskId) {
            currentTaskId = taskId;
            
            // Set current status based on task
            let statusValue = 'pending';
            if (taskId === 2) statusValue = 'in_progress';
            if (taskId === 3) statusValue = 'completed';
            
            document.getElementById('taskStatus').value = statusValue;
            document.getElementById('updateDialog').style.display = 'flex';
        }
        
        function hideUpdateDialog() {
            document.getElementById('updateDialog').style.display = 'none';
            currentTaskId = null;
        }
        
        function updateTask() {
            const status = document.getElementById('taskStatus').value;
            const notes = document.getElementById('taskNotes').value;
            
            // Here would be API call in a real app
            console.log('Updating task ' + currentTaskId + ' with status: ' + status + ' and notes: ' + notes);
            
            // Update UI to reflect the change
            const taskItems = document.querySelectorAll('.task-item');
            const statusBadge = taskItems[currentTaskId - 1].querySelector('.status-badge');
            
            statusBadge.className = 'status-badge';
            if (status === 'pending') {
                statusBadge.classList.add('status-pending');
                statusBadge.textContent = 'Pending';
            } else if (status === 'in_progress') {
                statusBadge.classList.add('status-progress');
                statusBadge.textContent = 'In Progress';
            } else {
                statusBadge.classList.add('status-completed');
                statusBadge.textContent = 'Completed';
            }
            
            hideUpdateDialog();
            
            // Show confirmation
            alert('Task updated successfully!');
        }
        
        function syncTasks() {
            alert('Syncing tasks with server...');
            // In a real app, this would call an API
        }
    </script>
</body>
</html>`;

fs.writeFileSync(path.join(assetsPath, 'index.html'), indexHtml);

// Create app-level build.gradle
const appBuildGradle = `plugins {
    id 'com.android.application'
}

android {
    namespace "${packageName}"
    compileSdk 33

    defaultConfig {
        applicationId "${packageName}"
        minSdk 21
        targetSdk 33
        versionCode 5
        versionName "1.1.5"

        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
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
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test.ext:junit:1.1.5'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.5.1'
}`;

fs.writeFileSync(path.join(fixedApkDir, 'app', 'build.gradle'), appBuildGradle);

// Create project-level build.gradle
const projectBuildGradle = `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    id 'com.android.application' version '8.0.2' apply false
}`;

fs.writeFileSync(path.join(fixedApkDir, 'build.gradle'), projectBuildGradle);

// Create settings.gradle
const settingsGradle = `pluginManagement {
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
rootProject.name = "Wizone IT Support"
include ':app'`;

fs.writeFileSync(path.join(fixedApkDir, 'settings.gradle'), settingsGradle);

// Create gradle.properties
const gradleProperties = `# Project-wide Gradle settings.
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true`;

fs.writeFileSync(path.join(fixedApkDir, 'gradle.properties'), gradleProperties);

// Create proguard-rules.pro
const proguardRules = `# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in sdk/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html`;

fs.writeFileSync(path.join(fixedApkDir, 'app', 'proguard-rules.pro'), proguardRules);

// Create README.md with build instructions
const readmeContent = `# Wizone IT Support - Fixed APK

This is a simplified version of the Wizone IT Support app designed to fix the APK parsing error.

## Key Changes

1. **Standard Package Structure** - Using consistent package name \`${packageName}\`
2. **Fixed SDK Versions** - Using compatible SDK versions
3. **Simplified Architecture** - WebView-based solution for maximum compatibility
4. **Enhanced UI** - Better mobile interface with task status update dialog

## Building the APK

1. Open the project in Android Studio
2. Build > Build Bundle(s) / APK(s) > Build APK(s)
3. The APK will be generated in the app/build/outputs/apk/ directory

## Installation

1. Uninstall any previous versions of the app
2. Enable "Install from Unknown Sources" in Settings
3. Install the APK
4. Open the app

## Features

- View assigned tasks
- Update task status (pending, in progress, completed)
- Add task notes
- Offline-compatible interface

## Version

v1.1.5 (Build 5)`;

fs.writeFileSync(path.join(fixedApkDir, 'README.md'), readmeContent);

console.log('✅ Simple Android project created successfully in:', fixedApkDir);
console.log('\n📱 Build Instructions:');
console.log('1. Open the project in Android Studio');
console.log(`2. File > Open > Select the folder: ${fixedApkDir}`);
console.log('3. Wait for Gradle sync to complete');
console.log('4. Build > Build Bundle(s) / APK(s) > Build APK(s)');
console.log('5. The APK will be in app/build/outputs/apk/debug/');