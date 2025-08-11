# Wizone Field Engineer - Native Android App

A comprehensive native Android application built in Kotlin for field engineers, featuring complete integration with the Wizone IT Support Portal server at `http://194.238.19.19:5000`.

## 🚀 Features

### ✅ Core Functionality
- **Authentication**: Secure login with session management and auto-login
- **Task Management**: View, update, and manage assigned field tasks
- **File Attachments**: Camera integration and file uploads for task documentation
- **Location Tracking**: Real-time GPS tracking with background service
- **Offline Support**: Local data storage with sync when network available
- **Background Sync**: Automatic data synchronization using WorkManager

### 📱 User Interface
- **Modern Material 3 Design**: Clean, intuitive interface optimized for field use
- **Multi-Fragment Architecture**: Tasks, Upload Status, and Activity monitoring
- **Real-time Updates**: Live task status and progress tracking
- **Pull-to-Refresh**: Easy data refresh functionality
- **Status Indicators**: Visual task priorities and status badges

### 🔧 Technical Features
- **Security**: EncryptedSharedPreferences for credential storage
- **Database**: Room database for offline data persistence
- **Networking**: Retrofit with OkHttp for robust API communication
- **Background Work**: WorkManager for reliable background operations
- **Camera Integration**: CameraX for photo capture and processing
- **Permissions**: Runtime permission handling with user-friendly explanations

## 🏗️ Architecture

### Project Structure
```
wizone-native-android/
├── android/                    # Android Studio project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── java/com/wizoneit/fieldapp/
│   │   │   │   ├── data/       # Data layer (API, Database, Repository)
│   │   │   │   ├── ui/         # UI layer (Activities, Fragments, ViewModels)
│   │   │   │   ├── service/    # Background services
│   │   │   │   ├── worker/     # WorkManager background tasks
│   │   │   │   └── util/       # Utility classes
│   │   │   └── res/            # Android resources
│   │   └── build.gradle        # App-level build configuration
│   └── build.gradle            # Project-level build configuration
├── capacitor.config.ts         # Capacitor configuration
└── package.json               # Node.js dependencies
```

### Tech Stack
- **Language**: Kotlin
- **Architecture**: MVVM with Repository pattern
- **Database**: Room (SQLite) for local storage
- **Networking**: Retrofit + OkHttp + Gson
- **Background Tasks**: WorkManager
- **Location**: Google Play Services FusedLocationProvider
- **Camera**: CameraX
- **Security**: EncryptedSharedPreferences
- **UI**: Material 3 Design Components
- **Capacitor**: Integration-ready for hybrid capabilities

## 📋 Prerequisites

### Development Environment
- **Android Studio**: Arctic Fox or newer
- **JDK**: 11 or higher
- **Android SDK**: API 23+ (Android 6.0) minimum, API 34 target
- **Gradle**: 8.4+ (included in wrapper)

### Server Configuration
- **Server URL**: `http://194.238.19.19:5000` (hardcoded for build/testing)
- **Network Config**: Cleartext HTTP allowed for this domain
- **API Endpoints**: Compatible with existing Wizone IT Support Portal

## 🛠️ Build Instructions

### 1. Open in Android Studio
```bash
# Clone or extract the project
cd wizone-native-android/android

# Open in Android Studio
# File > Open > Select the 'android' folder
```

### 2. Sync Dependencies
```bash
# In Android Studio Terminal or Command Line
./gradlew clean
./gradlew build
```

### 3. Configure Capacitor (Optional)
```bash
# Install Node.js dependencies
npm install

# Sync Capacitor
npx cap sync android
```

### 4. Build APK
```bash
# Debug build
./gradlew assembleDebug

# Release build (requires signing configuration)
./gradlew assembleRelease
```

### 5. Install on Device
```bash
# Install debug APK
./gradlew installDebug

# Or use Android Studio's Run button
```

## 🔧 Configuration

### Server Connection
The app is configured to connect to:
- **Base URL**: `http://194.238.19.19:5000`
- **Network Security**: Cleartext traffic allowed for this domain
- **Timeout**: 30 seconds for all network operations

### Permissions Required
The app requests these permissions at runtime:
- **INTERNET**: Network communication
- **ACCESS_FINE_LOCATION**: GPS tracking
- **ACCESS_BACKGROUND_LOCATION**: Background location tracking
- **CAMERA**: Photo capture
- **READ_EXTERNAL_STORAGE**: File access
- **WRITE_EXTERNAL_STORAGE**: File storage

### Key Features Configuration
- **Auto-login**: Enabled by default
- **Location tracking**: Enabled by default
- **Sync interval**: 15 minutes
- **Background constraints**: Network required, battery not low

## 🚦 Usage

### First Launch
1. **Test Connection**: Use "Test Connection" button to verify server accessibility
2. **Login**: Enter field engineer credentials (e.g., `admin`/`admin123`)
3. **Permissions**: Grant required permissions when prompted
4. **Sync**: App automatically syncs tasks and data

### Daily Operations
1. **View Tasks**: Browse assigned tasks in the main list
2. **Update Tasks**: Tap task to view details and update status
3. **Add Photos**: Use camera integration to document work
4. **Track Location**: Location automatically shared with server
5. **Offline Work**: Tasks cached locally, sync when online

### Settings & Management
- **Location Tracking**: Toggle in Settings
- **Auto-login**: Configure in Settings
- **Manual Sync**: Use sync button or Settings
- **Connection Test**: Verify server connectivity
- **Logout**: Clear all local data

## 🏃‍♂️ Quick Start

### Immediate Testing
1. Open project in Android Studio
2. Run on emulator or connected device
3. Test connection to `http://194.238.19.19:5000`
4. Login with existing credentials
5. Verify task loading and camera functionality

### Production Deployment
1. Configure signing keys in `app/build.gradle`
2. Update `applicationId` if needed
3. Build release APK: `./gradlew assembleRelease`
4. Distribute signed APK to field engineers

## 🔍 Troubleshooting

### Common Issues
- **Connection Failed**: Verify server URL and network connectivity
- **Login Issues**: Check credentials and server authentication endpoint
- **Location Not Working**: Ensure permissions granted and GPS enabled
- **Camera Problems**: Verify camera permission and device compatibility
- **Sync Issues**: Check network constraints and WorkManager status

### Debug Tools
- **Connection Test**: Built-in connectivity testing
- **Settings Screen**: Sync status and configuration options
- **Upload Status**: View pending uploads and retry failed operations
- **Activity Tab**: Monitor real-time system status

## 🔗 Integration

### API Compatibility
The app is designed to work with the existing Wizone IT Support Portal:
- **Authentication**: Username/password or session-based
- **Task Management**: Full CRUD operations
- **File Uploads**: Multipart form data
- **Location Updates**: Real-time GPS data
- **Activity Publishing**: System events and user actions

### Capacitor Integration
The project includes Capacitor configuration for:
- **Hybrid Capabilities**: Web view integration if needed
- **Plugin System**: Easy addition of native plugins
- **Cross-platform**: Potential iOS development
- **Hot Reload**: Development efficiency

## 📝 License

This project is developed for Wizone IT Support Portal field engineer operations.

## 🆘 Support

For technical support or issues:
1. Check server connectivity at `http://194.238.19.19:5000/api/health`
2. Verify API endpoints match server implementation
3. Test authentication with known credentials
4. Review Android logs for detailed error information

---

**Ready-to-Build Android Studio Project**  
Complete native Android application with Capacitor integration for Wizone Field Engineer operations.