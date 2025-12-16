#!/bin/bash

echo "🚀 Wizone Mobile APK Build Script"
echo "================================="

# Check if we're in the mobile directory
if [ ! -f "capacitor.config.ts" ]; then
    echo "❌ Error: Please run this script from the mobile directory"
    exit 1
fi

echo "📱 Step 1: Copying web assets to Android..."
npx cap copy android

echo "📱 Step 2: Syncing Capacitor..."
npx cap sync android

echo "🔧 Step 3: Building APK..."
cd android

# Try different build methods based on available tools
if command -v ./gradlew &> /dev/null; then
    echo "✅ Using Gradle Wrapper..."
    chmod +x gradlew
    ./gradlew assembleDebug --stacktrace
elif command -v gradle &> /dev/null; then
    echo "✅ Using system Gradle..."
    gradle assembleDebug
else
    echo "❌ Gradle not found. Trying alternative method..."
    
    # Check if we can use Android Studio tools
    if [ -d "$ANDROID_HOME" ]; then
        echo "✅ Using Android SDK tools..."
        $ANDROID_HOME/tools/gradle assembleDebug
    else
        echo "❌ No build tools available."
        echo "📋 Manual build instructions:"
        echo "1. Install Android Studio"
        echo "2. Open the android folder in Android Studio"
        echo "3. Click Build > Build Bundle(s) / APK(s) > Build APK(s)"
        echo "4. APK will be created in app/build/outputs/apk/debug/"
        exit 1
    fi
fi

echo ""
echo "🎉 APK Build Process Complete!"
echo "================================="

# Check if APK was created
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    echo "✅ SUCCESS: APK created at:"
    echo "   📱 $PWD/$APK_PATH"
    echo ""
    echo "📦 APK Details:"
    ls -lh "$APK_PATH"
    echo ""
    echo "🚀 Ready for Installation!"
    echo "   • Copy APK to Android device"
    echo "   • Enable 'Unknown sources' in device settings"
    echo "   • Install APK file"
    echo "   • Launch Wizone IT Support Portal"
else
    echo "❌ APK build failed. Check the build logs above."
    echo ""
    echo "🔍 Troubleshooting:"
    echo "   • Make sure Java/Android SDK is installed"
    echo "   • Check Android Studio is properly configured"
    echo "   • Verify all dependencies are installed"
    exit 1
fi

echo ""
echo "📋 Alternative APK Generation Methods:"
echo "   🌐 Online APK Builder: https://website2apk.com"
echo "   📱 PWA Installation: Enable in browser settings"
echo "   🔗 Direct URL: Use current deployment URL in WebView app"

echo ""
echo "✅ Wizone Mobile APK Ready for Distribution!"