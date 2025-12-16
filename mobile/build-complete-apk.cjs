#!/usr/bin/env node

/**
 * Complete APK Builder for Wizone IT Support Portal
 * Database: 103.122.85.61:9095/WIZONEIT_SUPPORT
 * User: postgres / Password: ss123456
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Wizone IT Support Portal - Complete APK Builder');
console.log('📱 Database: 103.122.85.61:9095/WIZONEIT_SUPPORT');
console.log('🔐 Authentication: Case-insensitive field engineer login');
console.log('');

// Check if we're in the right directory
const currentDir = process.cwd();
console.log('📁 Current directory:', currentDir);

if (!currentDir.includes('mobile')) {
  console.error('❌ Please run this from the mobile folder');
  console.log('💡 Run: cd mobile && node build-complete-apk.cjs');
  process.exit(1);
}

// Database configuration
const dbConfig = {
  host: '103.122.85.61',
  port: 9095,
  database: 'WIZONEIT_SUPPORT',
  user: 'postgres',
  password: 'ss123456'
};

console.log('🗄️ Database Configuration:');
console.log(`   Host: ${dbConfig.host}`);
console.log(`   Port: ${dbConfig.port}`);
console.log(`   Database: ${dbConfig.database}`);
console.log(`   User: ${dbConfig.user}`);
console.log('   Password: [CONFIGURED]');
console.log('');

// Step 1: Verify and update Capacitor configuration
console.log('🔧 Step 1: Configuring Capacitor for your database...');

const capacitorConfig = `import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wizoneit.taskmanager',
  appName: 'Wizone IT Support Portal',
  webDir: 'public',
  server: {
    cleartext: true,
    androidScheme: 'http'
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    loggingBehavior: 'debug',
    minWebViewVersion: 60,
    appendUserAgent: 'WizoneFieldApp/1.0 (Mobile APK)',
    backgroundColor: '#1e293b',
    // Database connection optimizations
    webViewPreserveContext: true,
    allowNavigationInWebview: true,
    mixedContentMode: 'always_allow'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#667eea",
      showSpinner: true,
      spinnerColor: "#22d3ee",
      androidSpinnerStyle: "large",
      splashFullScreen: true,
      splashImmersive: false
    },
    // Network plugin for database connectivity
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
`;

try {
  fs.writeFileSync('capacitor.config.ts', capacitorConfig);
  console.log('✅ Capacitor configuration updated with database settings');
} catch (error) {
  console.error('❌ Failed to update Capacitor config:', error.message);
}

// Step 2: Update Android permissions for network access
console.log('');
console.log('📱 Step 2: Configuring Android permissions...');

// Create or update AndroidManifest.xml permissions
const androidManifestPath = 'android/app/src/main/AndroidManifest.xml';
if (fs.existsSync(androidManifestPath)) {
  let manifest = fs.readFileSync(androidManifestPath, 'utf8');
  
  // Add network permissions if not present
  const permissions = [
    '<uses-permission android:name="android.permission.INTERNET" />',
    '<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />',
    '<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />',
    '<uses-permission android:name="android.permission.CAMERA" />',
    '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />',
    '<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />'
  ];
  
  permissions.forEach(permission => {
    if (!manifest.includes(permission)) {
      manifest = manifest.replace('<manifest', `<manifest\n    ${permission}`);
    }
  });
  
  // Enable cleartext traffic for HTTP connections
  if (!manifest.includes('android:usesCleartextTraffic="true"')) {
    manifest = manifest.replace(
      '<application',
      '<application\n        android:usesCleartextTraffic="true"'
    );
  }
  
  fs.writeFileSync(androidManifestPath, manifest);
  console.log('✅ Android permissions configured for database connectivity');
} else {
  console.log('⚠️ AndroidManifest.xml not found, will be created during sync');
}

// Step 3: Create production web assets
console.log('');
console.log('🌐 Step 3: Preparing web assets...');

// Copy the updated index.html to public folder
if (!fs.existsSync('public')) {
  fs.mkdirSync('public', { recursive: true });
}

try {
  fs.copyFileSync('index.html', 'public/index.html');
  
  // Copy manifest and other assets
  if (fs.existsSync('manifest.json')) {
    fs.copyFileSync('manifest.json', 'public/manifest.json');
  }
  
  if (fs.existsSync('sw.js')) {
    fs.copyFileSync('sw.js', 'public/sw.js');
  }
  
  // Copy icons if they exist
  if (fs.existsSync('icon.svg')) {
    fs.copyFileSync('icon.svg', 'public/icon.svg');
  }
  
  console.log('✅ Web assets prepared');
} catch (error) {
  console.error('❌ Failed to prepare web assets:', error.message);
}

// Step 4: Initialize/sync Capacitor
console.log('');
console.log('⚡ Step 4: Syncing Capacitor...');

try {
  // Add Android platform if not exists
  if (!fs.existsSync('android')) {
    console.log('📱 Adding Android platform...');
    execSync('npx cap add android', { stdio: 'inherit' });
  }
  
  // Sync web assets to native project
  console.log('🔄 Syncing web assets...');
  execSync('npx cap sync android', { stdio: 'inherit' });
  
  console.log('✅ Capacitor sync completed');
} catch (error) {
  console.error('⚠️ Capacitor sync warning:', error.message);
  console.log('Continuing with build process...');
}

// Step 5: Build APK
console.log('');
console.log('🏗️ Step 5: Building APK...');

try {
  // Change to android directory
  process.chdir('android');
  console.log('📂 Changed to android directory');
  
  // Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  if (process.platform === 'win32') {
    execSync('gradlew.bat clean', { stdio: 'inherit' });
  } else {
    execSync('chmod +x gradlew');
    execSync('./gradlew clean', { stdio: 'inherit' });
  }
  
  // Build debug APK
  console.log('🔨 Building debug APK...');
  if (process.platform === 'win32') {
    execSync('gradlew.bat assembleDebug', { stdio: 'inherit' });
  } else {
    execSync('./gradlew assembleDebug', { stdio: 'inherit' });
  }
  
  // Check if APK was created
  const apkPath = 'app/build/outputs/apk/debug/app-debug.apk';
  if (fs.existsSync(apkPath)) {
    const stats = fs.statSync(apkPath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log('');
    console.log('🎉 APK BUILD SUCCESSFUL!');
    console.log('');
    console.log('📱 APK Details:');
    console.log(`   Location: mobile/android/${apkPath}`);
    console.log(`   Size: ${sizeInMB} MB`);
    console.log(`   App ID: com.wizoneit.taskmanager`);
    console.log(`   App Name: Wizone IT Support Portal`);
    console.log('');
    console.log('🗄️ Database Connection:');
    console.log(`   Server: http://${dbConfig.host}:4000`);
    console.log(`   Database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log('   Admin: admin / admin123');
    console.log('   Field Engineers: case-insensitive login enabled');
    console.log('   - huzaifa, rohit, ravi, sachin (any case)');
    console.log('');
    console.log('📋 Installation:');
    console.log('1. Copy APK to Android device');
    console.log('2. Enable "Install from unknown sources"');
    console.log('3. Install the APK');
    console.log('4. Ensure device has internet connection');
    console.log('5. App will connect to your database automatically');
    console.log('');
    console.log('✅ Ready for deployment!');
    
    // Copy APK to root mobile folder for easy access
    try {
      const rootApkPath = '../wizone-it-support-portal.apk';
      fs.copyFileSync(apkPath, rootApkPath);
      console.log(`📋 APK also copied to: mobile/wizone-it-support-portal.apk`);
    } catch (copyError) {
      console.log('Note: Could not copy APK to root folder');
    }
    
  } else {
    console.log('❌ APK file not found after build');
  }
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.log('');
  console.log('🔧 Troubleshooting Options:');
  console.log('');
  console.log('1. Manual Android Studio Build:');
  console.log('   • Open mobile/android folder in Android Studio');
  console.log('   • File > Sync Project with Gradle Files');
  console.log('   • Build > Generate Signed Bundle / APK > APK');
  console.log('   • Choose debug build and finish');
  console.log('');
  console.log('2. Alternative Build Command:');
  console.log('   • cd mobile/android');
  console.log('   • gradlew assembleDebug --info');
  console.log('');
  console.log('3. Check Requirements:');
  console.log('   • Java JDK 8 or higher');
  console.log('   • Android SDK installed');
  console.log('   • Gradle configured properly');
  
  process.exit(1);
}