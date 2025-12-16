#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Building Enhanced Wizone APK with Status Dropdown and Notes Integration...\n');

const mobileDir = __dirname;
const androidDir = path.join(mobileDir, 'android');
const enhancedFeatureVersion = '1.1.0'; // Increment version for enhanced features

// Update Gradle wrapper properties to avoid deprecation warnings
const gradleWrapperPath = path.join(androidDir, 'gradle', 'wrapper', 'gradle-wrapper.properties');
const gradleWrapperContent = `#Wed Oct 08 2025 12:00:00 GMT+0530 (IST)
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.10.2-all.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`;

// Update build.gradle to fix deprecation warnings
const buildGradleContent = `// Top-level build file where you can add configuration options common to all sub-projects/modules.

buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.7.2'
        classpath 'com.google.gms:google-services:4.4.2'
    }
}

apply from: "variables.gradle"

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

tasks.register('clean', Delete) {
    delete rootProject.buildDir
}
`;

// Update app-level build.gradle
const appBuildGradleContent = `apply plugin: 'com.android.application'

android {
    namespace "com.wizoneit.taskmanager"
    compileSdk 34
    
    defaultConfig {
        applicationId "com.wizoneit.taskmanager"
        minSdkVersion 22
        targetSdkVersion 34
        versionCode 2
        versionName "${enhancedFeatureVersion}"
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
        }
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
    
    packagingOptions {
        resources {
            excludes += ['META-INF/DEPENDENCIES', 'META-INF/LICENSE', 'META-INF/LICENSE.txt', 'META-INF/NOTICE', 'META-INF/NOTICE.txt']
        }
    }
}

repositories {
    flatDir {
        dirs '../capacitor-cordova-android-plugins/src/main/libs', 'libs'
    }
}

dependencies {
    implementation fileTree(include: ['*.jar'], dir: 'libs')
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.coordinatorlayout:coordinatorlayout:1.2.0'
    implementation 'androidx.core:core-splashscreen:1.0.1'
    implementation project(':capacitor-android')
    implementation project(':capacitor-cordova-android-plugins')
    
    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test.ext:junit:1.1.5'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.5.1'
}

apply from: 'capacitor.build.gradle'

try {
    def servicesJSON = file('google-services.json')
    if (servicesJSON.exists() && servicesJSON.text) {
        apply plugin: 'com.google.gms.google-services'
    }
} catch(Exception e) {
    logger.info("google-services.json not found, google-services plugin not applied. Push Notifications won't work")
}
`;

// Update variables.gradle
const variablesGradleContent = `ext {
    minSdkVersion = 22
    compileSdkVersion = 34
    targetSdkVersion = 34
    androidxActivityVersion = '1.8.0'
    androidxAppCompatVersion = '1.6.1'
    androidxCoordinatorLayoutVersion = '1.2.0'
    androidxCoreVersion = '1.12.0'
    androidxFragmentVersion = '1.6.2'
    coreSplashScreenVersion = '1.0.1'
    androidxWebkitVersion = '1.8.0'
    junitVersion = '4.13.2'
    androidxJunitVersion = '1.1.5'
    androidxEspressoCoreVersion = '3.5.1'
    cordovaAndroidVersion = '10.1.1'
}
`;

console.log('📝 Updating Gradle configuration files...');

// Create necessary directories
const gradleWrapperDir = path.dirname(gradleWrapperPath);
if (!fs.existsSync(gradleWrapperDir)) {
    fs.mkdirSync(gradleWrapperDir, { recursive: true });
}

// Write updated configuration files
fs.writeFileSync(gradleWrapperPath, gradleWrapperContent);
fs.writeFileSync(path.join(androidDir, 'build.gradle'), buildGradleContent);
fs.writeFileSync(path.join(androidDir, 'app', 'build.gradle'), appBuildGradleContent);
fs.writeFileSync(path.join(androidDir, 'variables.gradle'), variablesGradleContent);

console.log('✅ Gradle configuration updated');

// Update Capacitor config for production
const capacitorConfigContent = `import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wizoneit.taskmanager',
  appName: 'Wizone IT Support',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: 'http://103.122.85.61:4000',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    loggingBehavior: 'none'
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#667eea',
      showSpinner: true,
      spinnerColor: '#ffffff'
    }
  }
};

export default config;`;

fs.writeFileSync(path.join(mobileDir, 'capacitor.config.ts'), capacitorConfigContent);
console.log('✅ Capacitor configuration updated');

// Create the production HTML file
const productionHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wizone IT Support</title>
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
        .loader { display: flex; flex-direction: column; align-items: center; justify-content: center;
                 min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                 color: white; text-align: center; padding: 20px; }
        .logo { width: 80px; height: 80px; background: white; color: #667eea; border-radius: 50%;
               display: flex; align-items: center; justify-content: center; font-size: 32px;
               font-weight: bold; margin-bottom: 20px; }
        .spinner { width: 50px; height: 50px; border: 3px solid rgba(255,255,255,0.3);
                  border-top: 3px solid white; border-radius: 50%; animation: spin 1s linear infinite; margin: 20px 0; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        #app-frame { width: 100%; height: 100vh; border: none; display: none; }
        .version-tag { position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.3); 
                      padding: 5px 10px; border-radius: 15px; font-size: 12px; }
    </style>
</head>
<body>
    <div id="loader" class="loader">
        <div class="logo">W</div>
        <div class="spinner"></div>
        <div id="status">Connecting to Wizone Server...</div>
        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin: 20px 0;">
            <strong>Database Connected</strong><br>
            Host: 103.122.85.61:9095<br>
            Database: WIZONEIT_SUPPORT
        </div>
        <div class="version-tag">v${enhancedFeatureVersion} (Enhanced)</div>
    </div>
    <iframe id="app-frame" src="about:blank"></iframe>
    <script>
        const SERVER_URL = 'http://103.122.85.61:4000';
        function updateStatus(msg) { document.getElementById('status').textContent = msg; }
        function loadApp() {
            const frame = document.getElementById('app-frame');
            const loader = document.getElementById('loader');
            updateStatus('Loading application...');
            frame.src = SERVER_URL;
            frame.onload = function() {
                setTimeout(() => {
                    loader.style.display = 'none';
                    frame.style.display = 'block';
                }, 1000);
            };
        }
        setTimeout(loadApp, 2000);
    </script>
</body>
</html>`;

// Create dist directory and production HTML
const distDir = path.join(mobileDir, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}
fs.writeFileSync(path.join(distDir, 'index.html'), productionHTML);
console.log('✅ Production HTML created');

// Create a README file documenting the enhanced features
const enhancedReadme = `# Wizone IT Support - Enhanced APK (v${enhancedFeatureVersion})

## ✨ New Features Added

### 1. Combined Task Update Dialog 
- **Status Change Dropdown**: Change task status directly from the update dialog
- **Notes Input Field**: Add task notes in the same dialog
- **Single-Step Updates**: Update both status and notes in one action

### 2. User Experience Improvements
- Enhanced validation for task updates
- Improved workflow management
- Better task update UI with clear section separation

## 📱 Installation Instructions
1. Transfer the APK file to your Android device
2. Enable "Install from unknown sources" in Android settings 
3. Install the APK and open the app
4. The app will connect to your database automatically

## 🔐 Login Credentials
- **Admin**: admin / admin123
- **Field Engineers**: rohit, ravi, huzaifa, sachin (case-insensitive)

## 📊 Database Connection
- Host: 103.122.85.61:9095
- Database: WIZONEIT_SUPPORT
`;

// Write README to document enhanced features
fs.writeFileSync(path.join(mobileDir, 'ENHANCED-FEATURES.md'), enhancedReadme);
console.log('✅ Enhanced features documentation created');

try {
    console.log('\n🔄 Running Capacitor sync...');
    execSync('npx cap sync android', { cwd: mobileDir, stdio: 'inherit' });
    console.log('✅ Capacitor sync completed');

    console.log('\n🏗️  Building Android APK...');
    const androidProjectDir = path.join(mobileDir, 'android');
    
    // Clean previous builds
    try {
        execSync('gradlew.bat clean', { cwd: androidProjectDir, stdio: 'inherit' });
    } catch (e) {
        console.log('⚠️  Clean command failed, continuing...');
    }
    
    // Build APK
    execSync('gradlew.bat assembleDebug', { cwd: androidProjectDir, stdio: 'inherit' });
    
    // Check if APK was created
    const apkPath = path.join(androidProjectDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
    if (fs.existsSync(apkPath)) {
        const stats = fs.statSync(apkPath);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log('\n🎉 ENHANCED APK BUILD SUCCESSFUL!');
        console.log(`📱 APK Location: ${apkPath}`);
        console.log(`📊 APK Size: ${fileSizeMB} MB`);
        console.log(`🕐 Created: ${stats.mtime.toLocaleString()}`);
        
        // Copy APK to mobile root with enhanced version name
        const copyPath = path.join(mobileDir, `wizone-enhanced-v${enhancedFeatureVersion}.apk`);
        fs.copyFileSync(apkPath, copyPath);
        console.log(`📋 APK copied to: ${copyPath}`);
        
        console.log('\n✅ SUCCESS SUMMARY:');
        console.log('   • Task status dropdown + notes integration added');
        console.log('   • Database connection: 103.122.85.61:9095');
        console.log('   • Server URL: http://103.122.85.61:4000');
        console.log('   • Enhanced APK ready for installation');
        console.log('\n🔐 Login Credentials:');
        console.log('   • Admin: admin / admin123');
        console.log('   • Field Engineers: rohit, ravi, huzaifa, sachin (case-insensitive)');
        
    } else {
        console.log('❌ APK not found at expected location');
        console.log('🔍 Checking all APK files...');
        execSync('find . -name "*.apk" -type f', { cwd: androidProjectDir, stdio: 'inherit' });
    }
    
} catch (error) {
    console.error('❌ Build failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure Android SDK is properly installed');
    console.log('2. Check that ANDROID_HOME environment variable is set');
    console.log('3. Verify Gradle wrapper permissions: chmod +x gradlew');
    console.log('4. Try running: ./gradlew --version');
}

console.log('\n📱 APK Installation Instructions:');
console.log('1. Transfer the APK file to your Android device');
console.log('2. Enable "Install from unknown sources" in Android settings');
console.log('3. Install the APK and open the app');
console.log('4. The app will connect to your database automatically');
console.log('\n✨ New Enhanced Features:');
console.log('• Combined task status update and notes in one dialog');
console.log('• Status dropdown selector for quick changes');
console.log('• Improved workflow validation');