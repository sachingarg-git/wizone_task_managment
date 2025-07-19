#!/bin/bash

echo "🚀 Quick APK Build Script"
echo "========================="

# Find Java installation
JAVA_PATH=$(find /nix/store -name "java" -type f 2>/dev/null | grep openjdk | head -1)
if [ -n "$JAVA_PATH" ]; then
    export JAVA_HOME=$(dirname $(dirname $JAVA_PATH))
    export PATH=$JAVA_HOME/bin:$PATH
    echo "✅ Java found: $JAVA_HOME"
else
    echo "❌ Java not found. Installing..."
    # Try alternative approach
    export JAVA_HOME="/usr/lib/jvm/default-java"
    export PATH="/usr/lib/jvm/default-java/bin:$PATH"
fi

echo ""
echo "📦 Building Android APK..."
echo "Location: android-studio-project"
echo ""

cd android-studio-project

# Make gradlew executable
chmod +x gradlew

# Build APK
echo "🔨 Running Gradle build..."
./gradlew assembleDebug --no-daemon --stacktrace

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ APK BUILD SUCCESSFUL!"
    echo "📱 APK Location: android-studio-project/app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    
    # Check if APK exists
    if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
        APK_SIZE=$(du -h app/build/outputs/apk/debug/app-debug.apk | cut -f1)
        echo "📊 APK Size: $APK_SIZE"
        echo "📋 APK Details:"
        ls -la app/build/outputs/apk/debug/app-debug.apk
    else
        echo "⚠️  APK file not found in expected location"
        echo "🔍 Searching for APK files..."
        find . -name "*.apk" -type f
    fi
else
    echo ""
    echo "❌ BUILD FAILED"
    echo "🔧 Troubleshooting tips:"
    echo "1. Check Java installation: java -version"
    echo "2. Verify Android SDK setup"
    echo "3. Try: ./gradlew clean assembleDebug"
fi

echo ""
echo "🎯 Alternative: Use online APK generators for instant results"
echo "📄 Check: generate-instant-apk.html"