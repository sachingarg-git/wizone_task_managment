#!/usr/bin/env node

/**
 * Capacitor APK Builder - Mobile Folder Solution
 * Easy APK generation without complex setup
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Mobile Folder APK Builder - Wizone IT Support Portal');
console.log('');

// Check current directory
const currentDir = process.cwd();
console.log('📁 Current directory:', currentDir);

// Check if we're in mobile folder
if (!fs.existsSync('capacitor.config.ts')) {
  console.error('❌ Please run this from mobile/ folder');
  console.log('💡 Tip: cd mobile && node build-capacitor-apk.cjs');
  process.exit(1);
}

// Step 1: Check Capacitor setup
console.log('🔧 Step 1: Checking Capacitor configuration...');
try {
  // Check if capacitor config exists
  if (fs.existsSync('capacitor.config.ts')) {
    console.log('✅ Capacitor config found');
  } else {
    console.error('❌ Missing capacitor.config.ts');
    process.exit(1);
  }
  
  // Check if android folder exists
  if (fs.existsSync('android')) {
    console.log('✅ Android project folder exists');
  } else {
    console.log('⚠️  Android folder missing, adding platform...');
    execSync('npx cap add android', { stdio: 'inherit' });
  }
  
} catch (error) {
  console.error('❌ Capacitor check failed:', error.message);
}

// Step 2: Sync web assets
console.log('');
console.log('📦 Step 2: Syncing web assets...');
try {
  execSync('npx cap sync android', { stdio: 'inherit' });
  console.log('✅ Assets synced successfully');
} catch (error) {
  console.error('⚠️  Sync warning (continuing anyway):', error.message);
}

// Step 3: Check build tools
console.log('');
console.log('🔨 Step 3: Checking build requirements...');

// Check if gradlew exists
if (fs.existsSync('android/gradlew')) {
  console.log('✅ Gradle wrapper found');
} else {
  console.error('❌ Gradle wrapper missing');
}

// Step 4: Build APK
console.log('');
console.log('🏗️  Step 4: Building APK...');
console.log('📍 Location: android/ folder');

try {
  // Make gradlew executable
  if (process.platform !== 'win32') {
    execSync('chmod +x android/gradlew');
  }
  
  // Change to android directory and build
  process.chdir('android');
  console.log('📂 Changed to android directory');
  
  console.log('🔨 Running: ./gradlew assembleDebug');
  execSync('./gradlew assembleDebug', { stdio: 'inherit' });
  
  console.log('');
  console.log('🎉 APK BUILD SUCCESSFUL!');
  console.log('');
  console.log('📱 APK Location:');
  console.log('   app/build/outputs/apk/debug/app-debug.apk');
  console.log('');
  console.log('✅ Ready for installation on Android devices');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.log('');
  console.log('🔧 Alternative Solutions:');
  console.log('');
  console.log('1. Manual Android Studio Build:');
  console.log('   • Open mobile/android folder in Android Studio');
  console.log('   • Build > Generate Signed Bundle / APK');
  console.log('   • Select APK and build');
  console.log('');
  console.log('2. Use Native Android App (No WebView):');
  console.log('   • Location: ../wizone-native-app');
  console.log('   • Pure Java implementation');
  console.log('   • Guaranteed working APK');
  console.log('');
  console.log('3. Online APK Builder:');
  console.log('   • Use ../generate-instant-apk.html');
  console.log('   • Generate APK in 2-3 minutes');
  
  process.exit(1);
}