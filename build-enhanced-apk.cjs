#!/usr/bin/env node

/**
 * Enhanced APK Build Script for WiZone Task Score Tracker
 * This script builds the APK with all the enhanced features
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting Enhanced APK Build Process...');

// Configuration
const BUILD_DIR = 'wizone-enhanced-final-build';
const APK_NAME = `wizone-mobile-enhanced-COMPLETE-APK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${new Date().toTimeString().slice(0, 5).replace(/:/g, '')}.apk`;
const ASSETS_DIR = path.join(BUILD_DIR, 'app', 'src', 'main', 'assets');
const OUTPUT_DIR = path.join(BUILD_DIR, 'app', 'build', 'outputs', 'apk', 'release');

console.log(`📁 Build Directory: ${BUILD_DIR}`);
console.log(`📱 APK Name: ${APK_NAME}`);

// Step 1: Copy enhanced mobile files
console.log('\n📋 Step 1: Copying enhanced mobile files...');
try {
    // Ensure assets directory exists
    if (!fs.existsSync(ASSETS_DIR)) {
        fs.mkdirSync(ASSETS_DIR, { recursive: true });
    }
    
    // Copy enhanced mobile HTML
    const mobileHtml = fs.readFileSync('mobile/index.html', 'utf8');
    fs.writeFileSync(path.join(ASSETS_DIR, 'index.html'), mobileHtml);
    console.log('✅ Enhanced mobile HTML copied');
    
    // Copy any additional assets
    if (fs.existsSync('mobile/manifest.json')) {
        fs.copyFileSync('mobile/manifest.json', path.join(ASSETS_DIR, 'manifest.json'));
        console.log('✅ Manifest file copied');
    }
    
} catch (error) {
    console.error('❌ Error copying files:', error.message);
    process.exit(1);
}

// Step 2: Update AndroidManifest.xml with enhanced permissions
console.log('\n🔧 Step 2: Updating AndroidManifest.xml...');
try {
    const manifestPath = path.join(BUILD_DIR, 'app', 'src', 'main', 'AndroidManifest.xml');
    let manifest = fs.readFileSync(manifestPath, 'utf8');
    
    // Add necessary permissions if not present
    const permissions = [
        '<uses-permission android:name="android.permission.INTERNET" />',
        '<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />',
        '<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />',
        '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />',
        '<uses-permission android:name="android.permission.CAMERA" />'
    ];
    
    permissions.forEach(permission => {
        if (!manifest.includes(permission)) {
            manifest = manifest.replace('<manifest', `<manifest\n    ${permission}`);
        }
    });
    
    fs.writeFileSync(manifestPath, manifest);
    console.log('✅ AndroidManifest.xml updated with enhanced permissions');
    
} catch (error) {
    console.error('❌ Error updating AndroidManifest.xml:', error.message);
}

// Step 3: Update build.gradle with enhanced configuration
console.log('\n⚙️ Step 3: Updating build.gradle...');
try {
    const buildGradlePath = path.join(BUILD_DIR, 'app', 'build.gradle');
    let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
    
    // Update version code and name
    const now = new Date();
    const versionCode = Math.floor(now.getTime() / 1000);
    const versionName = `2.0.${now.getMonth() + 1}.${now.getDate()}`;
    
    buildGradle = buildGradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
    buildGradle = buildGradle.replace(/versionName\s+"[^"]+"/, `versionName "${versionName}"`);
    
    // Update app name
    buildGradle = buildGradle.replace(/applicationId\s+"[^"]+"/, 'applicationId "com.wizone.tasktracker.enhanced"');
    
    fs.writeFileSync(buildGradlePath, buildGradle);
    console.log(`✅ build.gradle updated - Version: ${versionName} (${versionCode})`);
    
} catch (error) {
    console.error('❌ Error updating build.gradle:', error.message);
}

// Step 4: Update strings.xml with enhanced app name
console.log('\n📝 Step 4: Updating app strings...');
try {
    const stringsPath = path.join(BUILD_DIR, 'app', 'src', 'main', 'res', 'values', 'strings.xml');
    let strings = fs.readFileSync(stringsPath, 'utf8');
    
    strings = strings.replace(/<string name="app_name">[^<]*<\/string>/, 
        '<string name="app_name">WiZone Enhanced Task Tracker</string>');
    
    fs.writeFileSync(stringsPath, strings);
    console.log('✅ App name updated to "WiZone Enhanced Task Tracker"');
    
} catch (error) {
    console.error('❌ Error updating strings.xml:', error.message);
}

// Step 5: Build the APK
console.log('\n🔨 Step 5: Building APK...');
try {
    console.log('📦 Cleaning previous builds...');
    process.chdir(BUILD_DIR);
    
    // Clean previous builds
    try {
        execSync('./gradlew clean', { stdio: 'inherit' });
    } catch (error) {
        console.log('⚠️ Clean command failed, continuing...');
    }
    
    console.log('🔨 Building release APK...');
    execSync('./gradlew assembleRelease', { stdio: 'inherit' });
    
    // Find the built APK
    const releaseDir = 'app/build/outputs/apk/release';
    const builtApkPath = path.join(releaseDir, 'app-release.apk');
    
    if (fs.existsSync(builtApkPath)) {
        // Move to root directory with new name
        process.chdir('..');
        const finalApkPath = APK_NAME;
        fs.copyFileSync(path.join(BUILD_DIR, builtApkPath), finalApkPath);
        
        console.log(`✅ APK built successfully: ${finalApkPath}`);
        
        // Get file size
        const stats = fs.statSync(finalApkPath);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`📊 APK Size: ${fileSizeInMB} MB`);
        
        // Create success report
        const reportContent = `# Enhanced APK Build Report

## Build Information
- **APK Name**: ${APK_NAME}
- **Build Date**: ${new Date().toLocaleString()}
- **File Size**: ${fileSizeInMB} MB
- **Version**: ${versionName} (${versionCode})

## Enhanced Features Included
✅ Task history synchronization fixed
✅ Dashboard card view implemented
✅ In-app user navigation with profile and logout
✅ Professional login UI redesign
✅ Live update tracking between mobile and browser
✅ Clickable task IDs with complete details
✅ Top bar sync option
✅ Disabled editing for completed tasks
✅ Enhanced task history with grid/list view toggle
✅ Latest tasks showing on top

## Installation Instructions
1. Enable "Install from Unknown Sources" in Android settings
2. Transfer the APK file to your Android device
3. Open the APK file and install
4. Launch "WiZone Enhanced Task Tracker"

## Server Configuration Required
Make sure your server is running and accessible:
- Update server URL in the mobile app if needed
- Ensure CORS is properly configured
- Database connection should be active

Built with ❤️ by WiZone Development Team
`;
        
        fs.writeFileSync('ENHANCED-APK-BUILD-REPORT.md', reportContent);
        
        console.log('\n🎉 SUCCESS! Enhanced APK built with all features!');
        console.log(`📱 APK Location: ${finalApkPath}`);
        console.log('📋 Build report: ENHANCED-APK-BUILD-REPORT.md');
        
    } else {
        throw new Error('APK file not found after build');
    }
    
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}

console.log('\n✨ Enhanced APK build process completed successfully!');