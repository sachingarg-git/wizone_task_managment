# 🔧 DIAGNOSTIC APK - Connection Troubleshooting v10

## 📱 NEW APK: `wizone-mobile-DIAGNOSTIC-v10.apk`

This APK has enhanced diagnostics to show exactly what's happening during connection attempts.

## 🔍 WHAT THE DIAGNOSTIC APK SHOWS:
- ✅ Internet connectivity test
- 🌐 Server connection attempts with detailed status
- ❌ Specific error messages for each server
- ⚠️ Health check results before login attempts

## 🧪 STEP-BY-STEP TROUBLESHOOTING:

### Step 1: Install and Test Diagnostic APK
1. Install `wizone-mobile-DIAGNOSTIC-v10.apk`
2. Try to login with `admin` / `admin123`
3. **Watch the status messages** - they will show exactly which servers are being tested

### Step 2: Test Server Connectivity Manually
Run the simple test server to isolate the issue:

```powershell
# Stop the main server first (Ctrl+C in the terminal where npm run dev is running)
cd "d:\Sachin Garg Profile\New folder\ppll11\TaskScoreTracker"
node simple-test-server.js
```

This will show:
- All available IP addresses on your computer
- Real-time connection attempts from mobile devices
- Simple endpoints to test connectivity

### Step 3: Test from Mobile Browser
Once the test server is running, try these URLs from your mobile browser:

1. `http://192.168.11.9:3001/api/health`
2. `http://192.168.5.254:3001/api/health`
3. `http://103.122.85.61:3001/api/health`

**Expected Response:**
```json
{
  "status": "ok",
  "message": "Server is running!",
  "timestamp": "2025-10-12T...",
  "clientIp": "your-mobile-ip"
}
```

### Step 4: Common Issues and Solutions

**🔥 Issue: Mobile browser can't reach any IP**
**Solution:** 
- Ensure mobile device is on the same WiFi network
- Check WiFi network allows device-to-device communication
- Some corporate/public WiFi networks block device connections

**🔥 Issue: "Connection refused" or "Network error"**
**Solution:**
- Windows Firewall is blocking the connection
- Run PowerShell as Administrator and execute:
```powershell
netsh advfirewall firewall add rule name="Node.js Server" dir=in action=allow protocol=TCP localport=3001
```

**🔥 Issue: Server not showing connection attempts**
**Solution:**
- Server might not be listening on 0.0.0.0
- Check if server is actually running: `netstat -an | findstr :3001`

### Step 5: Advanced Diagnostics

**Check if server is listening on all interfaces:**
```powershell
netstat -an | findstr :3001
```
**Expected:** `0.0.0.0:3001` or `[::]:3001` (not just `127.0.0.1:3001`)

**Test from same computer:**
```powershell
curl http://192.168.11.9:3001/api/health
```

## 🎯 EXPECTED DIAGNOSTIC APK BEHAVIOR:

When working correctly, you should see these messages in sequence:
1. `🔍 Testing network connectivity...`
2. `✅ Internet connection OK. Testing local servers...`
3. `🌐 Server 1: 192.168.11.9:3001`
4. `✅ Server 1 responding! Logging in...`
5. `🎉 Connected to server 1!`
6. Dashboard loads with real data

## 🚨 WHAT TO REPORT:

After testing the diagnostic APK, tell me:
1. **Which servers show "responding" vs "unreachable"**
2. **What error messages appear**
3. **Results of mobile browser test** (which IPs work)
4. **Server logs** (what the simple test server shows)

This will help identify if it's a network issue, firewall issue, or server configuration issue.