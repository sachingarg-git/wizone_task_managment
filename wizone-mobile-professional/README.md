# Wizone Professional Mobile Task Manager

A comprehensive, professional mobile application for task management with real-time updates, file handling, camera integration, and direct PostgreSQL database connectivity.

## Features

### 🎯 Core Features
- **Professional Mobile Interface** - Modern, responsive design optimized for mobile devices
- **Real-time Task Management** - Live task updates and synchronization
- **Direct Database Integration** - Connects directly to PostgreSQL database at 103.122.85.61:4000
- **File Upload & Camera** - Upload files from gallery or capture photos directly
- **Offline Support** - Works offline with automatic sync when connection is restored
- **Professional UI/UX** - Clean, intuitive interface with smooth animations

### 📱 Mobile Capabilities
- **Camera Integration** - Take photos directly for task updates
- **File Management** - Upload, view, and manage task-related files
- **Touch Optimized** - Gesture support, pull-to-refresh, swipe actions
- **Responsive Design** - Works on all screen sizes and orientations
- **Haptic Feedback** - Touch feedback for better user experience
- **Offline Mode** - Continue working without internet connection

### 🔐 Security Features
- **Secure Authentication** - Token-based authentication with session management
- **Encrypted Storage** - Secure local data storage
- **Network Security** - HTTPS support and secure API communication
- **Session Management** - Automatic logout and session timeout handling

### ⚡ Performance Features
- **Fast Loading** - Optimized for quick startup and smooth performance
- **Caching System** - Intelligent caching for offline access
- **Background Sync** - Automatic data synchronization in background
- **Memory Management** - Efficient memory usage and cleanup

## Prerequisites

### System Requirements
- **Node.js** >= 14.0.0
- **npm** >= 6.0.0
- **Java Development Kit (JDK)** 8 or 11
- **Android SDK** with API Level 22+ (Android 5.1) to 33 (Android 13)
- **Gradle** 7.0+

### Development Tools
- **Android Studio** (recommended) or **Android SDK Tools**
- **Cordova CLI** >= 11.0.0
- **Git** (for version control)

## Installation & Setup

### 1. Clone and Setup Project
```bash
# Navigate to the project directory
cd "D:\Sachin Garg Profile\New folder\ppll11\TaskScoreTracker\wizone-mobile-professional"

# Install Node.js dependencies
npm install

# Install Cordova globally (if not already installed)
npm install -g cordova@latest

# Check if all requirements are met
cordova requirements
```

### 2. Android Platform Setup
```bash
# Add Android platform
cordova platform add android@latest

# Verify platform installation
cordova platform list
```

### 3. Install Required Plugins
```bash
# Install all plugins (already defined in config.xml)
cordova prepare

# Verify plugin installation
cordova plugin list
```

## Building the Application

### Development Build (Debug)
```bash
# Build debug APK
npm run dev-build
# OR
cordova build android --debug

# Run on connected device/emulator
npm run run-android
# OR
cordova run android --debug
```

### Production Build (Release)
```bash
# Build release APK (unsigned)
npm run prod-build
# OR
cordova build android --release

# The APK will be located at:
# platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk
```

### Signing the Release APK (for distribution)
```bash
# Generate a keystore (one-time setup)
keytool -genkey -v -keystore wizone-release-key.keystore -alias wizone-key -keyalg RSA -keysize 2048 -validity 10000

# Sign the APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore wizone-release-key.keystore platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk wizone-key

# Align the APK
zipalign -v 4 platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk wizone-mobile-professional-v1.0.0.apk
```

## Configuration

### Server Configuration
The app is configured to connect to your server at `http://103.122.85.61:4000`. Update the configuration in `www/js/config.js` if needed:

```javascript
SERVER: {
    BASE_URL: 'http://103.122.85.61:4000',
    // ... other server settings
}
```

### Database Connection
The app connects directly to your PostgreSQL database through the web API. Ensure your server at 103.122.85.61:4000 is running and accessible.

## Project Structure

```
wizone-mobile-professional/
├── www/                          # Web application files
│   ├── index.html               # Main HTML file with complete mobile interface
│   ├── css/                     # Stylesheets
│   │   ├── app.css             # Main application styles
│   │   ├── components.css      # Component-specific styles
│   │   └── mobile.css          # Mobile-specific optimizations
│   ├── js/                     # JavaScript modules
│   │   ├── config.js           # Application configuration
│   │   ├── database.js         # Database connection and API management
│   │   ├── auth.js             # Authentication system
│   │   ├── tasks.js            # Task management functionality
│   │   ├── ui.js               # UI manager and interactions
│   │   └── app.js              # Main application controller
│   └── img/                    # Images and icons
├── config.xml                  # Cordova configuration
├── package.json               # Node.js dependencies and scripts
└── README.md                  # This file
```

## Application Architecture

### Core Modules
1. **Config Manager** - Centralized configuration management
2. **Database Manager** - API communication and offline sync
3. **Auth Manager** - User authentication and session management
4. **Task Manager** - Task CRUD operations and real-time updates
5. **UI Manager** - User interface interactions and animations
6. **App Controller** - Main application lifecycle management

### Key Features Implementation
- **Offline Support**: Automatic caching and sync queue management
- **Real-time Updates**: WebSocket integration for live task updates
- **File Upload**: Camera integration and file management
- **Professional UI**: Modern CSS with animations and responsive design
- **Error Handling**: Comprehensive error management and user feedback

## API Endpoints

The application connects to the following endpoints on your server:

- `POST /api/auth/login` - User authentication
- `GET /api/tasks/my` - Fetch user tasks
- `PUT /api/tasks/{id}` - Update task status
- `GET /api/tasks/{id}/updates` - Get task history
- `POST /api/tasks/{id}/files` - Upload task files
- `POST /api/sync` - Synchronize data

## Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clean build cache
cordova clean

# Remove and re-add platform
cordova platform remove android
cordova platform add android@latest

# Reinstall plugins
cordova plugin remove --all
cordova prepare
```

#### Android SDK Issues
- Ensure `ANDROID_HOME` environment variable is set
- Update Android SDK tools to latest version
- Install required API levels (22-33)

#### Network Issues
- Verify server at 103.122.85.61:4000 is accessible
- Check firewall settings
- Ensure HTTPS certificates are valid (if using HTTPS)

### Debug Mode
Enable debug mode by setting `CONFIG.DEV.ENABLED = true` in `www/js/config.js` for detailed logging.

## Performance Optimization

### Tips for Better Performance
1. **Enable Minification** - Minify CSS and JavaScript for production
2. **Optimize Images** - Compress images and use appropriate formats
3. **Cache Management** - Configure appropriate cache durations
4. **Bundle Size** - Remove unused plugins and dependencies

## Security Considerations

### Production Security
1. **Remove Debug Code** - Set `CONFIG.DEV.ENABLED = false`
2. **Use HTTPS** - Configure server for HTTPS in production
3. **Secure Storage** - Enable secure storage for sensitive data
4. **App Signing** - Always sign release APKs

## Deployment

### Internal Distribution
1. Build signed release APK
2. Test on various devices
3. Distribute APK file directly

### Google Play Store (Future)
1. Create signed release bundle
2. Follow Google Play Store guidelines
3. Submit for review

## Support & Maintenance

### Regular Updates
- Update Cordova and plugins regularly
- Monitor for security patches
- Test on new Android versions

### Monitoring
- Check application logs for errors
- Monitor server API performance  
- Track user feedback and issues

## License

This project is proprietary software developed for Wizone. All rights reserved.

## Contact

For support or questions:
- **Email**: support@wizone.com
- **Website**: https://wizone.com

---

## Quick Start Commands

```bash
# Install dependencies
npm install

# Check requirements
cordova requirements

# Build debug APK
npm run dev-build

# Run on device
npm run run-android

# Build production APK
npm run prod-build
```

The final APK will be a professional mobile application with full task management functionality, direct database connectivity, camera integration, and offline support - exactly matching your requirements for the 103.122.85.61:4000/mobile interface.