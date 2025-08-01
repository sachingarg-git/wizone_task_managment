#!/bin/bash

echo "🚀 Building Wizone Field Engineer APK"
echo "📱 Direct MS SQL Database Connection: 103.122.85.61, 1440"
echo ""

# Navigate to mobile directory
cd mobile

echo "🔄 Syncing mobile app with Android..."
npx cap sync android

echo "🔧 Building APK..."
cd android

# Build debug APK
echo "📦 Creating debug APK..."
./gradlew assembleDebug

echo ""
echo "✅ APK Build Complete!"
echo "📂 Location: mobile/android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "🔌 Database Connection Ready:"
echo "   Server: 103.122.85.61, 1440"
echo "   Database: WIZONE_TASK_MANAGER"
echo "   Login: admin / admin123"
echo ""
echo "📱 Install APK and test login with your SQL database!"