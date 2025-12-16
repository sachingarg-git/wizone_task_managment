#!/bin/bash

# Wizone APK Build Script - Enhanced Authentication v4.0
echo "🔨 Building Wizone APK - Enhanced Authentication v4.0"
echo "======================================================"

# Set the APK output name with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
APK_NAME="wizone-mobile-database-connected-v4-${TIMESTAMP}.apk"

echo "📱 APK Name: $APK_NAME"
echo "🏗️ Starting Gradle build..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
./gradlew clean

# Build the APK
echo "🔨 Building APK..."
./gradlew assembleRelease

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Copy the APK to the root directory with our custom name
    if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
        cp "app/build/outputs/apk/release/app-release.apk" "$APK_NAME"
        echo "📱 APK created: $APK_NAME"
        
        # Show APK details
        APK_SIZE=$(ls -lh "$APK_NAME" | awk '{print $5}')
        echo "📊 APK Size: $APK_SIZE"
        echo "📅 Build Date: $(date)"
        echo ""
        echo "🎉 SUCCESS! APK is ready for testing"
        echo "===================================="
        echo "📱 File: $APK_NAME"
        echo "🔐 Login: ravi / ravi@123 or admin / admin123"
        echo "🌐 Server: http://localhost:8050 (Ultra Stable Server)"
        echo "💾 Database: PostgreSQL (103.122.85.61:9095)"
        echo "===================================="
        
    else
        echo "❌ APK file not found after build"
        exit 1
    fi
else
    echo "❌ Build failed!"
    exit 1
fi