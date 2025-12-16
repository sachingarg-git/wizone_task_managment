#!/bin/bash

echo ""
echo "🚀 Wizone Enhanced APK Builder with Task Status Dropdown and Notes"
echo "============================================================"
echo ""
echo "This script will build the enhanced version of the Wizone APK"
echo "that includes the task status dropdown and notes functionality."
echo ""

echo "📂 Using Android Studio project directory..."
cd android-studio-project

echo ""
echo "🔍 Checking if WizoneNativeActivity.java exists..."
if [ -f "app/src/main/java/com/wizone/mobile/WizoneNativeActivity.java" ]; then
    echo "✅ WizoneNativeActivity.java found!"
else
    echo "❌ WizoneNativeActivity.java not found! Aborting..."
    exit 1
fi

echo ""
echo "🔧 Making gradlew executable..."
chmod +x gradlew

echo ""
echo "🔨 Building APK..."
if [ -f "gradlew" ]; then
    echo "Using gradlew..."
    ./gradlew assembleDebug --stacktrace
else
    echo "Using system gradle..."
    gradle assembleDebug --stacktrace
fi

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Build failed! Check the logs above for errors."
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""
echo "📱 Your APK file is available at:"
echo "   app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "🚀 To install on your device, transfer this APK file to your Android device."

# Copy the APK to the root directory for easier access
echo ""
echo "📂 Copying APK file to root directory for easier access..."
cp app/build/outputs/apk/debug/app-debug.apk ../WizoneEnhanced-TaskDropdown-Notes.apk

echo ""
echo "✅ APK copied to: ../WizoneEnhanced-TaskDropdown-Notes.apk"
echo ""
echo "🎉 All done! The enhanced APK with task status dropdown and notes is ready!"

cd ..