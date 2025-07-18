#!/bin/bash

echo "🚀 Building Wizone Mobile APK - Complete Process"

# Step 1: Clean and build the web application
echo "1️⃣ Building web application..."
cd client
npm run build
cd ..

# Step 2: Fix HTML paths for mobile compatibility
echo "2️⃣ Fixing HTML paths for mobile..."
sed -i 's|="/assets/|="./assets/|g' dist/public/index.html
sed -i 's|="/manifest.json|="./manifest.json|g' dist/public/index.html
sed -i 's|="/mobile/|="./mobile/|g' dist/public/index.html
sed -i 's|type="module" ||g' dist/public/index.html
sed -i '/replit-dev-banner.js/d' dist/public/index.html

# Step 3: Copy to mobile project
echo "3️⃣ Copying assets to mobile project..."
cd mobile
npx cap copy android
npx cap sync android

# Step 4: Build APK
echo "4️⃣ Building APK..."
cd android
./gradlew assembleDebug

echo "✅ APK build complete!"
echo "📱 APK location: mobile/android/app/build/outputs/apk/debug/app-debug.apk"