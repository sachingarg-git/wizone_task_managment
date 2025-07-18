const fs = require('fs');
const path = require('path');

// Create native Android project structure
const projectStructure = {
  'android-native': {
    'app': {
      'src': {
        'main': {
          'java': {
            'com': {
              'wizoneit': {
                'taskmanager': {}
              }
            }
          },
          'res': {
            'layout': {},
            'values': {},
            'drawable': {},
            'mipmap-hdpi': {},
            'mipmap-mdpi': {},
            'mipmap-xhdpi': {},
            'mipmap-xxhdpi': {},
            'mipmap-xxxhdpi': {}
          }
        }
      }
    },
    'gradle': {
      'wrapper': {}
    }
  }
};

function createDirectoryStructure(basePath, structure) {
  for (const [name, content] of Object.entries(structure)) {
    const dirPath = path.join(basePath, name);
    
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    if (typeof content === 'object' && content !== null) {
      createDirectoryStructure(dirPath, content);
    }
  }
}

// Create the directory structure
createDirectoryStructure('.', projectStructure);

console.log('Native Android project structure created successfully');

// Create MainActivity.java
const mainActivityContent = `package com.wizoneit.taskmanager;

import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;
import android.widget.LinearLayout;
import android.widget.Button;
import android.graphics.Color;
import android.view.ViewGroup;
import android.view.Gravity;
import android.widget.Toast;
import android.content.Intent;
import android.net.Uri;

public class MainActivity extends Activity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Create main layout
        LinearLayout mainLayout = new LinearLayout(this);
        mainLayout.setOrientation(LinearLayout.VERTICAL);
        mainLayout.setBackgroundColor(Color.parseColor("#22d3ee"));
        mainLayout.setPadding(40, 60, 40, 40);
        
        // Header
        TextView header = new TextView(this);
        header.setText("🏢 Wizone IT Support Portal");
        header.setTextSize(24);
        header.setTextColor(Color.WHITE);
        header.setGravity(Gravity.CENTER);
        header.setPadding(0, 0, 0, 40);
        mainLayout.addView(header);
        
        // Success message
        TextView successMsg = new TextView(this);
        successMsg.setText("✅ Native Android App Loaded!");
        successMsg.setTextSize(18);
        successMsg.setTextColor(Color.WHITE);
        successMsg.setBackgroundColor(Color.parseColor("#10b981"));
        successMsg.setPadding(30, 20, 30, 20);
        successMsg.setGravity(Gravity.CENTER);
        mainLayout.addView(successMsg);
        
        // Add some spacing
        TextView spacing1 = new TextView(this);
        spacing1.setHeight(40);
        mainLayout.addView(spacing1);
        
        // Description
        TextView description = new TextView(this);
        description.setText("Welcome to Wizone IT Support Portal\\n\\nThis is a native Android application that provides comprehensive task management and customer support capabilities.");
        description.setTextSize(16);
        description.setTextColor(Color.WHITE);
        description.setPadding(0, 0, 0, 30);
        mainLayout.addView(description);
        
        // Statistics section
        LinearLayout statsLayout = new LinearLayout(this);
        statsLayout.setOrientation(LinearLayout.HORIZONTAL);
        statsLayout.setWeightSum(2);
        
        // Tasks stat
        TextView tasksStat = createStatCard("12\\nActive Tasks");
        statsLayout.addView(tasksStat);
        
        // Customers stat  
        TextView customersStat = createStatCard("85\\nCustomers");
        statsLayout.addView(customersStat);
        
        mainLayout.addView(statsLayout);
        
        // Add spacing
        TextView spacing2 = new TextView(this);
        spacing2.setHeight(40);
        mainLayout.addView(spacing2);
        
        // Feature buttons
        Button tasksBtn = createFeatureButton("📋 View Tasks");
        tasksBtn.setOnClickListener(v -> showToast("Tasks module would load here"));
        mainLayout.addView(tasksBtn);
        
        Button customersBtn = createFeatureButton("👥 Manage Customers");
        customersBtn.setOnClickListener(v -> showToast("Customer management would load here"));
        mainLayout.addView(customersBtn);
        
        Button analyticsBtn = createFeatureButton("📊 View Analytics");
        analyticsBtn.setOnClickListener(v -> showToast("Analytics dashboard would load here"));
        mainLayout.addView(analyticsBtn);
        
        Button settingsBtn = createFeatureButton("⚙️ Settings");
        settingsBtn.setOnClickListener(v -> showToast("Settings panel would load here"));
        mainLayout.addView(settingsBtn);
        
        // Web version button
        Button webBtn = createFeatureButton("🌐 Open Web Version");
        webBtn.setOnClickListener(v -> openWebVersion());
        mainLayout.addView(webBtn);
        
        setContentView(mainLayout);
    }
    
    private TextView createStatCard(String text) {
        TextView statCard = new TextView(this);
        statCard.setText(text);
        statCard.setTextSize(14);
        statCard.setTextColor(Color.WHITE);
        statCard.setBackgroundColor(Color.parseColor("#3b82f6"));
        statCard.setPadding(20, 30, 20, 30);
        statCard.setGravity(Gravity.CENTER);
        
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
            0, ViewGroup.LayoutParams.WRAP_CONTENT, 1);
        params.setMargins(5, 0, 5, 0);
        statCard.setLayoutParams(params);
        
        return statCard;
    }
    
    private Button createFeatureButton(String text) {
        Button button = new Button(this);
        button.setText(text);
        button.setTextSize(16);
        button.setTextColor(Color.WHITE);
        button.setBackgroundColor(Color.parseColor("#1e40af"));
        button.setPadding(20, 20, 20, 20);
        
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        params.setMargins(0, 10, 0, 10);
        button.setLayoutParams(params);
        
        return button;
    }
    
    private void showToast(String message) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
    }
    
    private void openWebVersion() {
        String url = "https://window.299f0612-89c3-4a4f-9a65-3dd9be12e804-00-3u4fqy7m2q8tl.picard.replit.dev/";
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        startActivity(intent);
    }
}`;

fs.writeFileSync('./android-native/app/src/main/java/com/wizoneit/taskmanager/MainActivity.java', mainActivityContent);

// Create AndroidManifest.xml
const manifestContent = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.wizoneit.taskmanager"
    android:versionCode="1"
    android:versionName="1.0">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Wizone IT Portal"
        android:theme="@android:style/Theme.Material.Light.NoActionBar">
        
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

fs.writeFileSync('./android-native/app/src/main/AndroidManifest.xml', manifestContent);

// Create build.gradle (app level)
const appBuildGradleContent = `apply plugin: 'com.android.application'

android {
    compileSdkVersion 34
    buildToolsVersion "34.0.0"

    defaultConfig {
        applicationId "com.wizoneit.taskmanager"
        minSdkVersion 21
        targetSdkVersion 34
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
    implementation 'com.google.android.material:material:1.10.0'
}`;

fs.writeFileSync('./android-native/app/build.gradle', appBuildGradleContent);

// Create project-level build.gradle
const projectBuildGradleContent = `buildscript {
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

fs.writeFileSync('./android-native/build.gradle', projectBuildGradleContent);

// Create gradle.properties
const gradlePropertiesContent = `android.useAndroidX=true
android.enableJetifier=true
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
org.gradle.parallel=true
org.gradle.caching=true`;

fs.writeFileSync('./android-native/gradle.properties', gradlePropertiesContent);

// Create settings.gradle
const settingsGradleContent = `include ':app'
rootProject.name = "Wizone IT Portal"`;

fs.writeFileSync('./android-native/settings.gradle', settingsGradleContent);

// Create gradle wrapper
const gradleWrapperPropertiesContent = `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.0-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists`;

fs.writeFileSync('./android-native/gradle/wrapper/gradle-wrapper.properties', gradleWrapperPropertiesContent);

console.log('Native Android project created successfully!');
console.log('Location: ./android-native/');
console.log('To build: cd android-native && ./gradlew assembleDebug');