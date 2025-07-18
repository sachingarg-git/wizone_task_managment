#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Wizone Mobile App...\n');

// Step 1: Build client app
console.log('📦 Building client application...');
try {
  execSync('cd ../client && npm run build', { stdio: 'inherit' });
  console.log('✅ Client build completed\n');
} catch (error) {
  console.error('❌ Client build failed:', error.message);
  process.exit(1);
}

// Step 2: Check if client dist exists
const clientDistPath = path.join(__dirname, '../client/dist');
if (!fs.existsSync(clientDistPath)) {
  console.error('❌ Client dist directory not found at:', clientDistPath);
  process.exit(1);
}

// Step 3: Copy web assets to mobile
console.log('📱 Copying web assets to mobile...');
try {
  execSync('npx cap copy android', { stdio: 'inherit' });
  console.log('✅ Web assets copied\n');
} catch (error) {
  console.error('❌ Copy failed:', error.message);
  process.exit(1);
}

// Step 4: Sync mobile project
console.log('🔄 Syncing mobile project...');
try {
  execSync('npx cap sync android', { stdio: 'inherit' });
  console.log('✅ Mobile project synced\n');
} catch (error) {
  console.error('❌ Sync failed:', error.message);
  process.exit(1);
}

// Step 5: Open Android Studio
console.log('🔧 Opening Android Studio...');
try {
  execSync('npx cap open android', { stdio: 'inherit' });
  console.log('✅ Android Studio opened\n');
} catch (error) {
  console.error('❌ Failed to open Android Studio:', error.message);
  console.log('💡 You can manually open: mobile/android/ in Android Studio');
}

console.log('🎉 Mobile app build process completed!');
console.log('📱 Next steps:');
console.log('   1. In Android Studio, click Build > Generate Signed Bundle/APK');
console.log('   2. Select APK and follow the signing process');
console.log('   3. Install the APK on your device');