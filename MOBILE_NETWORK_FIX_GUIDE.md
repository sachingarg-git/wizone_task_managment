# 🔧 Mobile APK Network Fix Guide

## Problem: APK works in emulator but not on real device

**Issue**: Android Studio emulator can access `localhost:5000` but real mobile devices cannot.

**Solution**: Configure mobile app to connect to your computer's actual IP address.

## 🚀 Quick Fix Steps

### Step 1: Find Your Computer's IP Address

**Windows:**
```cmd
# Open Command Prompt and run:
ipconfig

# Look for "IPv4 Address" under your network adapter
# Example: 192.168.1.105
```

**Mac/Linux:**
```bash
# Open Terminal and run:
ifconfig

# Look for "inet" under your network interface (usually en0 or wlan0)
# Example: 192.168.1.105
```

### Step 2: Update Mobile App Configuration

Edit `mobile/src/utils/mobile-network.ts`:

```typescript
// Replace this line:
'http://YOUR_ACTUAL_SERVER_IP:5000',

// With your actual IP:
'http://192.168.1.105:5000',  // Use your actual IP here
```

### Step 3: Test Server Accessibility

1. Start your server:
```bash
npm run dev
```

2. Test from another device on same network:
```
http://YOUR_IP:5000
```

3. Make sure you can see the login page from your phone's browser

### Step 4: Rebuild APK

After updating the IP address, rebuild your APK:

```bash
cd mobile
npx cap sync android
npx cap build android
```

## 🔍 Advanced Network Detection

The mobile app now includes **automatic network detection**:

1. **Dynamic URL Detection**: Automatically detects current deployment URL
2. **Multiple Server Support**: Tests multiple server addresses
3. **Timeout Handling**: 3-second timeout per server attempt
4. **Fallback System**: Uses working server or fallback to first URL

## 📱 Mobile App Network Flow

```
Mobile APK Starts
       ↓
Detect WebView Environment
       ↓
Test Multiple Server URLs:
  1. Current deployment URL
  2. Your configured server IP
  3. Common network ranges
  4. Localhost fallback
       ↓
Use First Working Server
       ↓
Login & Database Operations
```

## 🌐 Production Deployment

For production use:

1. **Deploy to Cloud Server** (AWS, Google Cloud, etc.)
2. **Get Public IP/Domain** (e.g., `https://your-domain.com`)
3. **Update Server Configuration**:
   ```typescript
   'https://your-domain.com',  // Add your production server
   ```
4. **Use HTTPS** for secure connections
5. **Configure SSL Certificate**

## 🔧 Troubleshooting

### Network Issues
- **Firewall**: Make sure port 5000 is allowed
- **Same Network**: Phone and computer must be on same WiFi
- **Router Settings**: Check if router blocks internal connections

### APK Issues
- **WebView Configuration**: Ensure WebView has internet permission
- **CORS Settings**: Server allows mobile app requests
- **User Agent**: Mobile app sends proper user agent header

### Testing
- **Browser Test**: First test `http://YOUR_IP:5000` in phone browser
- **Network Monitor**: Check browser developer tools for network errors
- **Server Logs**: Check server console for incoming mobile requests

## ✅ Success Indicators

When working properly, you should see:

**Server Console:**
```
📱 Mobile APK request: POST /api/auth/login - UA: WizoneFieldEngineerApp/1.0...
✅ MOBILE LOGIN SUCCESS for: username
```

**Mobile Console:**
```
🌐 Using API base URL: http://192.168.1.105:5000
✅ Found working server: http://192.168.1.105:5000
📡 API Request: POST http://192.168.1.105:5000/api/auth/login
```

## 🎯 Final Result

After following this guide:
- ✅ Mobile APK works on real devices
- ✅ Field engineers can login from anywhere on your network
- ✅ Real-time task synchronization between web and mobile
- ✅ Production-ready for deployment with proper server configuration