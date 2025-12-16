# Wizone Task Manager - WebView APK

This is a simple Android WebView application that loads the professional Wizone Task Management system.

## Features

- **Full WebView Integration**: Loads the complete task management system from http://103.122.85.61:4000/mobile
- **Professional UI**: Clean header with app branding and loading states
- **Connection Management**: Automatic retry on connection failures
- **Offline Detection**: Shows connection status and handles network changes
- **Mobile Optimized**: Prevents zoom, handles back button, includes pull-to-refresh
- **Loading States**: Spinner during load, error handling with retry button
- **Status Bar**: Shows connection status with auto-hide functionality

## Technical Details

- **WebView Target**: http://103.122.85.61:4000/mobile (Professional task management system)
- **Responsive Design**: Works on all Android screen sizes
- **Network Handling**: Automatic reconnection and offline detection
- **User Experience**: Native-like interactions with proper mobile gestures

## Build Instructions

1. Create new Android Studio project
2. Set up WebView permissions in AndroidManifest.xml
3. Add network security config for HTTP connections
4. Place this index.html in assets folder
5. Configure WebView to load local HTML file
6. Build and generate APK

## File Structure

```
wizone-webview-apk/
├── index.html          (This WebView interface)
├── README.md           (This documentation)
└── [Android project files to be added]
```

## Connection Details

- **Server**: 103.122.85.61:4000
- **Mobile Path**: /mobile
- **Protocol**: HTTP (requires network security config)
- **Timeout**: 15 seconds with retry functionality

This WebView approach bypasses the Java/Gradle compatibility issues encountered with Cordova while providing the same professional mobile experience.