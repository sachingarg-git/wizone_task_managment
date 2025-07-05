# Wizone IT Support Portal - Mobile App

A comprehensive React Native mobile application for IT support professionals built with Expo.

## Features

- 📱 Cross-platform (Android & iOS)
- 🔐 Secure authentication
- 📋 Task management and tracking
- 👥 Customer management
- 📊 Performance analytics
- 💬 Real-time communication
- 🎨 Material Design UI with React Native Paper

## Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Expo CLI
- Android Studio (for Android builds)
- Xcode (for iOS builds, macOS only)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on Android device/emulator
npm run android

# Run on iOS device/simulator (macOS only)
npm run ios
```

## Building APK

### Method 1: Automated Build Script

```bash
# Run the automated build script
npm run build:apk
```

This script will:
- Check required dependencies
- Install missing packages
- Attempt local build first
- Fallback to EAS Build if needed

### Method 2: Manual EAS Build

```bash
# Install EAS CLI globally
npm install -g @expo/cli

# Login to Expo (create account at expo.dev)
npx expo login

# Build APK for testing
npm run build:android

# Build production AAB
npm run build:android:production
```

### Method 3: Local Build (Android Studio)

1. **Eject to bare React Native:**
   ```bash
   npx expo eject
   ```

2. **Open Android project:**
   - Open `android/` folder in Android Studio
   - Wait for Gradle sync to complete

3. **Build APK:**
   - Go to `Build` → `Generate Signed Bundle / APK`
   - Choose APK and follow the signing process
   - APK will be generated in `android/app/build/outputs/apk/`

## Project Structure

```
mobile/
├── assets/           # App icons and splash screens
├── src/
│   ├── components/   # Reusable UI components
│   ├── context/      # React Context providers
│   ├── screens/      # App screens/pages
│   └── utils/        # Utility functions
├── App.tsx           # Main app component
├── app.json          # Expo configuration
├── eas.json          # EAS Build configuration
└── package.json      # Dependencies and scripts
```

## Configuration

### Environment Variables

The app connects to your backend server. Update the API base URL in:
- `src/utils/api.ts`

### App Configuration

Customize app settings in:
- `app.json` - App metadata, icons, splash screen
- `eas.json` - Build profiles and configurations

## Distribution

### Android

1. **Development Testing:**
   - Use preview build profile for APK generation
   - Share APK file directly

2. **Production Release:**
   - Use production build profile for AAB
   - Upload to Google Play Console

### iOS (macOS required)

1. **Development Testing:**
   - Use TestFlight for beta testing
   - Requires Apple Developer account

2. **Production Release:**
   - Submit to App Store through App Store Connect

## Dependencies

### Core
- **React Native 0.72.6** - Mobile framework
- **Expo ~49.0.0** - Development platform
- **React Navigation 6.x** - Navigation library
- **React Native Paper 5.x** - Material Design components

### State Management
- **TanStack Query 5.x** - Server state management
- **React Context** - Local state management

### Authentication
- **AsyncStorage** - Secure credential storage
- **Custom authentication** - Integration with backend

## Build Profiles

### Preview (APK)
- **Purpose:** Testing and development
- **Output:** APK file for direct installation
- **Signing:** Debug signing

### Production (AAB)
- **Purpose:** Play Store distribution
- **Output:** Android App Bundle
- **Signing:** Release signing (requires keystore)

## Troubleshooting

### Common Issues

1. **Build Failures:**
   - Clear Expo cache: `expo start -c`
   - Reset dependencies: `rm -rf node_modules && npm install`

2. **Asset Loading Issues:**
   - Check file paths in `assets/` folder
   - Ensure all referenced assets exist

3. **Authentication Problems:**
   - Verify backend API endpoints
   - Check network connectivity
   - Validate API response format

### Getting Help

- Check [Expo Documentation](https://docs.expo.dev/)
- Review [React Native Paper](https://reactnativepaper.com/)
- Visit [React Navigation](https://reactnavigation.org/)

## Version History

- **v1.0.0** - Initial release with full feature parity to web app

---

**Built with ❤️ for Wizone IT Support Portal**