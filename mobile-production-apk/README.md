# Wizone IT Support Portal - Mobile APK Package

## Production Server Configuration
**Server URL**: http://194.238.19.19:5000/
**Status**: ✅ AUTHENTICATION FIXED - Ready for mobile APK deployment
**Login**: Use your admin credentials (admin/admin123) or any valid user account

## APK Generation Options

### Option 1: Online APK Builder (Recommended)
1. **Website2APK**: https://website2apk.com/
   - Upload this entire folder as a ZIP file
   - Set App Name: "Wizone IT Support Portal"
   - Set Package Name: "com.wizoneit.taskmanager"
   - Download APK

2. **Appsgeyser**: https://appsgeyser.com/
   - Create new app → Progressive Web App
   - Upload the index.html file
   - Follow the wizard to generate APK

3. **APK Builder**: https://apk-builder.com/
   - Upload the manifest.json and index.html
   - Configure app settings
   - Generate APK

### Option 2: PWA Installation
1. Open http://194.238.19.19:5000/ on Android device
2. Chrome menu → "Add to Home Screen"
3. Install as Progressive Web App

### Option 3: Android Studio (Advanced)
1. Install Android Studio
2. Create new project with WebView
3. Replace WebView URL with: http://194.238.19.19:5000/
4. Build APK

## Mobile App Features

### Network Detection
- Automatically connects to production server
- Connection retry mechanism (3 attempts)
- Network status monitoring
- Error handling with user-friendly messages

### Server Configuration
- **Primary Server**: http://194.238.19.19:5000/
- **Health Check**: /api/health endpoint
- **Connection Timeout**: 10 seconds
- **Auto-retry**: Yes (3 attempts)

### Mobile Optimization
- Full-screen WebView experience
- Touch-optimized interface
- Offline detection
- Loading animations
- Error recovery

## Installation Instructions

1. **Download APK**: Generate using one of the options above
2. **Enable Unknown Sources**: 
   - Android Settings → Security → Unknown Sources → Enable
3. **Install APK**: Tap the downloaded APK file
4. **Launch App**: Find "Wizone IT Support Portal" in app drawer
5. **Login**: Use your existing credentials

## Network Requirements

- **Internet Connection**: Required
- **Server Access**: Must reach http://194.238.19.19:5000/
- **Ports**: Port 5000 must be accessible
- **Protocol**: HTTP (cleartext allowed)

## Troubleshooting

### Connection Issues
- Check internet connection
- Verify server is running at http://194.238.19.19:5000/
- Test in browser first: http://194.238.19.19:5000/api/health

### APK Installation Issues
- Enable "Install from Unknown Sources"
- Check device storage space
- Restart device if needed

### Performance Issues
- Close other apps to free memory
- Restart the Wizone app
- Clear app cache (if applicable)

## Technical Details

### App Configuration
- **App ID**: com.wizoneit.taskmanager
- **Version**: 1.0.0
- **Target SDK**: 30+
- **Min SDK**: 21 (Android 5.0+)

### Security
- HTTPS ready (when server supports it)
- Network security configuration included
- WebView security settings enabled

### Compatibility
- **Android**: 5.0+ (API 21+)
- **RAM**: 2GB minimum
- **Storage**: 50MB for app + cache
- **Network**: WiFi or Mobile Data

## File Structure
```
mobile-production-apk/
├── index.html          # Main app file
├── manifest.json       # PWA manifest
├── icon.svg           # App icon
└── README.md          # This file
```

## Server Status Verification

Test server connectivity:
```bash
curl http://194.238.19.19:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "server": "Wizone IT Support Portal",
  "mobile_supported": true
}
```

## Support

For technical support or issues:
1. Check server status at http://194.238.19.19:5000/
2. Verify network connectivity
3. Try browser version first
4. Check application logs

---

**Generated**: August 2, 2025
**Server**: http://194.238.19.19:5000/
**Status**: Production Ready ✅