#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting Wizone Mobile APK Build Process...');

// Check if necessary files exist
const requiredFiles = [
  'app.json',
  'eas.json',
  'assets/icon.svg',
  'assets/adaptive-icon.png',
  'assets/splash.png'
];

console.log('✅ Checking required files...');
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`❌ Missing required file: ${file}`);
    process.exit(1);
  }
}

// Install dependencies if needed
console.log('📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Check if Expo CLI is available
console.log('🔧 Checking Expo CLI...');
try {
  execSync('npx expo --version', { stdio: 'pipe' });
} catch (error) {
  console.log('📥 Installing Expo CLI...');
  try {
    execSync('npm install -g @expo/cli@latest', { stdio: 'inherit' });
  } catch (installError) {
    console.error('❌ Failed to install Expo CLI:', installError.message);
    process.exit(1);
  }
}

// Build configuration
const buildConfig = {
  platform: 'android',
  profile: 'preview',
  local: true // Try local build first
};

console.log('🔨 Building APK...');
console.log(`Platform: ${buildConfig.platform}`);
console.log(`Profile: ${buildConfig.profile}`);

try {
  // First try to build locally
  console.log('🔧 Attempting local build...');
  const buildCommand = `npx expo build:android --type apk --release-channel default`;
  
  execSync(buildCommand, { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('✅ APK build completed successfully!');
  console.log('📱 Your APK file should be available in the build output directory.');
  
} catch (error) {
  console.log('⚠️  Local build failed, trying EAS Build...');
  
  try {
    // Fallback to EAS Build
    const easCommand = `npx eas build --platform android --profile preview --non-interactive`;
    execSync(easCommand, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('✅ EAS Build initiated successfully!');
    console.log('🔗 Check your EAS dashboard for build progress and download link.');
    
  } catch (easError) {
    console.error('❌ Both local and EAS builds failed.');
    console.log('\n📋 Manual build instructions:');
    console.log('1. Install Expo CLI: npm install -g @expo/cli');
    console.log('2. Login to Expo: npx expo login');
    console.log('3. Build APK: npx eas build --platform android --profile preview');
    console.log('\nOr use Android Studio:');
    console.log('1. Run: npx expo eject');
    console.log('2. Open android/ folder in Android Studio');
    console.log('3. Build > Generate Signed Bundle / APK');
    
    process.exit(1);
  }
}