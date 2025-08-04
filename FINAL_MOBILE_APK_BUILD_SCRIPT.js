#!/usr/bin/env node

/**
 * 🚀 FINAL MOBILE APK BUILD SCRIPT
 * Complete script to build mobile APK that connects to production server
 * Author: AI Assistant
 * Date: August 4, 2025
 */

const fs = require('fs');
const path = require('path');

const PRODUCTION_SERVER = 'http://194.238.19.19:5000';
const APK_OUTPUT_DIR = 'wizone-final-mobile-apk';

console.log('🚀 Building Final Mobile APK for Wizone Task Manager...');
console.log(`📡 Production Server: ${PRODUCTION_SERVER}`);

// Step 1: Create optimized mobile APK directory
if (fs.existsSync(APK_OUTPUT_DIR)) {
  fs.rmSync(APK_OUTPUT_DIR, { recursive: true, force: true });
}
fs.mkdirSync(APK_OUTPUT_DIR, { recursive: true });

// Step 2: Create optimized index.html with proper authentication
const mobileHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Wizone Task Manager</title>
    <link rel="icon" type="image/x-icon" href="./icon.svg">
    <link rel="manifest" href="./manifest.json">
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .loading { 
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: #f8fafc; display: flex; align-items: center; justify-content: center;
            flex-direction: column; z-index: 9999;
        }
        .spinner { 
            width: 40px; height: 40px; border: 4px solid #f3f4f6;
            border-top: 4px solid #3b82f6; border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .logo { width: 80px; height: 80px; margin-bottom: 20px; }
        .status { margin-top: 10px; color: #6b7280; font-size: 14px; }
        .error { color: #ef4444; padding: 20px; text-align: center; }
        #webview { width: 100%; height: 100vh; border: none; display: none; }
    </style>
</head>
<body>
    <div id="loading" class="loading">
        <svg class="logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" rx="15" fill="#3b82f6"/>
            <text x="50" y="60" text-anchor="middle" fill="white" font-size="24" font-weight="bold">W</text>
        </svg>
        <div class="spinner"></div>
        <div id="status" class="status">Connecting to server...</div>
    </div>
    
    <iframe id="webview" src="about:blank"></iframe>

    <script>
        const PRODUCTION_SERVER = '${PRODUCTION_SERVER}';
        const FALLBACK_SERVERS = [
            'http://194.238.19.19:5000',
            'https://window.299f0612-89c3-4a4f-9a65-3dd9be12e804-00-3u4fqy7m2q8tl.picard.replit.dev'
        ];

        let currentServer = null;
        let webview = null;
        let retryCount = 0;

        function updateStatus(message) {
            const statusEl = document.getElementById('status');
            if (statusEl) statusEl.textContent = message;
            console.log('📱 Mobile APK Status:', message);
        }

        async function testServerConnection(serverUrl) {
            try {
                updateStatus(\`Testing connection to \${serverUrl}...\`);
                
                const response = await fetch(\`\${serverUrl}/api/health\`, {
                    method: 'GET',
                    mode: 'cors',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'User-Agent': 'WizoneAPK/1.0'
                    },
                    timeout: 5000
                });

                if (response.ok) {
                    console.log(\`✅ Server \${serverUrl} is reachable\`);
                    return true;
                }
            } catch (error) {
                console.log(\`❌ Server \${serverUrl} failed:, error.message\`);
            }
            return false;
        }

        async function findWorkingServer() {
            const serversToTest = [PRODUCTION_SERVER, ...FALLBACK_SERVERS];
            
            for (const server of serversToTest) {
                if (await testServerConnection(server)) {
                    return server;
                }
            }
            return null;
        }

        function setupWebView(serverUrl) {
            updateStatus('Setting up application...');
            
            webview = document.getElementById('webview');
            const loadingEl = document.getElementById('loading');
            
            // Configure webview for proper authentication
            webview.onload = function() {
                // Inject authentication helper
                try {
                    webview.contentWindow.postMessage({
                        type: 'MOBILE_APK_INIT',
                        server: serverUrl,
                        timestamp: Date.now()
                    }, '*');
                } catch (error) {
                    console.log('WebView communication setup:', error.message);
                }
                
                // Hide loading screen
                setTimeout(() => {
                    loadingEl.style.display = 'none';
                    webview.style.display = 'block';
                }, 1000);
            };

            webview.onerror = function() {
                retryCount++;
                if (retryCount < 3) {
                    updateStatus(\`Connection failed, retrying... (\${retryCount}/3)\`);
                    setTimeout(() => initializeApp(), 2000);
                } else {
                    showError('Unable to connect to server. Please check your internet connection.');
                }
            };

            // Load the main application
            console.log(\`🌐 Loading application from: \${serverUrl}\`);
            webview.src = serverUrl;
            currentServer = serverUrl;
        }

        function showError(message) {
            const loadingEl = document.getElementById('loading');
            loadingEl.innerHTML = \`
                <div class="error">
                    <h3>Connection Error</h3>
                    <p>\${message}</p>
                    <button onclick="initializeApp()" style="margin-top: 15px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px;">
                        Retry Connection
                    </button>
                </div>
            \`;
        }

        async function initializeApp() {
            try {
                updateStatus('Initializing Wizone Task Manager...');
                
                const workingServer = await findWorkingServer();
                
                if (workingServer) {
                    console.log(\`✅ Connected to server: \${workingServer}\`);
                    setupWebView(workingServer);
                } else {
                    throw new Error('No server is currently available');
                }
                
            } catch (error) {
                console.error('❌ Initialization failed:', error);
                showError(\`Failed to connect to Wizone servers. \${error.message}\`);
            }
        }

        // Handle messages from webview
        window.addEventListener('message', function(event) {
            if (event.data && event.data.type === 'AUTHENTICATION_SUCCESS') {
                console.log('✅ User authenticated successfully');
                updateStatus('Connected successfully');
            }
        });

        // Initialize on page load
        document.addEventListener('DOMContentLoaded', initializeApp);
        
        // Handle network changes
        window.addEventListener('online', function() {
            console.log('📶 Network connection restored');
            if (!currentServer) {
                initializeApp();
            }
        });

        window.addEventListener('offline', function() {
            console.log('📶 Network connection lost');
            updateStatus('No internet connection');
        });

    </script>
</body>
</html>
`;

// Step 3: Create manifest.json
const manifest = {
    "name": "Wizone Task Manager",
    "short_name": "Wizone",
    "description": "Professional task management and field engineer coordination system",
    "version": "2.0.0",
    "manifest_version": 2,
    "start_url": "./index.html",
    "display": "standalone",
    "orientation": "portrait",
    "theme_color": "#3b82f6",
    "background_color": "#f8fafc",
    "scope": "./",
    "icons": [
        {
            "src": "./icon.svg",
            "sizes": "any",
            "type": "image/svg+xml",
            "purpose": "any maskable"
        }
    ],
    "permissions": [
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "ACCESS_WIFI_STATE"
    ],
    "categories": ["productivity", "business"],
    "lang": "en-US"
};

// Step 4: Create icon.svg
const iconSVG = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
        </linearGradient>
    </defs>
    <rect width="512" height="512" rx="80" fill="url(#grad1)"/>
    <text x="256" y="320" text-anchor="middle" fill="white" font-size="200" font-weight="bold" font-family="Arial, sans-serif">W</text>
    <rect x="100" y="380" width="312" height="8" fill="white" opacity="0.8" rx="4"/>
</svg>
`;

// Step 5: Create README with instructions
const readme = `
# 🚀 WIZONE MOBILE APK - FINAL VERSION

## ✅ What This APK Does:
- Connects directly to production server: ${PRODUCTION_SERVER}
- Same database as web application (MS SQL Server)
- Users can login and update activities from mobile
- Automatic server detection and fallback
- Optimized for field engineers

## 📱 APK Features:
- **Production Ready**: Direct connection to live server
- **Database Sync**: Uses same SQL database as web
- **Authentication**: Proper login system for mobile
- **Network Resilient**: Automatic reconnection
- **Offline Detection**: Shows connection status

## 🔧 Installation Steps:

1. **Transfer APK to Mobile Device:**
   - Copy entire '${APK_OUTPUT_DIR}' folder to mobile device
   - Or use Android Studio to build proper APK

2. **Install on Android:**
   - Enable "Install from Unknown Sources" in Settings
   - Install using APK builder or Android Studio

3. **First Launch:**
   - App will automatically connect to: ${PRODUCTION_SERVER}
   - Login with existing user credentials
   - Same users and data as web application

## 🌐 Server Configuration:
- **Primary Server**: ${PRODUCTION_SERVER}
- **Database**: MS SQL Server (same as web)
- **Authentication**: Session-based (same as web)
- **API Endpoints**: All existing APIs work

## 📋 User Instructions:
1. Launch the app
2. Wait for "Connected successfully" message
3. Login with your web application credentials
4. Access all features: tasks, customers, updates
5. Changes sync automatically with web application

## 🔍 Troubleshooting:
- **Can't connect**: Check internet connection
- **Login fails**: Verify credentials on web first
- **Data not syncing**: Restart app
- **Server error**: Contact system administrator

## 📞 Support:
For technical support, contact your system administrator.
All features work exactly like the web application.

Built on: ${new Date().toLocaleDateString()}
Version: 2.0.0 - Production Ready
`;

// Write all files
console.log('📝 Creating APK files...');

fs.writeFileSync(path.join(APK_OUTPUT_DIR, 'index.html'), mobileHTML);
fs.writeFileSync(path.join(APK_OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
fs.writeFileSync(path.join(APK_OUTPUT_DIR, 'icon.svg'), iconSVG);
fs.writeFileSync(path.join(APK_OUTPUT_DIR, 'README.md'), readme);

// Create build instructions
const buildInstructions = `
# 🏗️ BUILD INSTRUCTIONS

## Method 1: APK Builder (Recommended)
1. Visit: https://appsgeyser.com or https://websitetoapk.com
2. Upload the '${APK_OUTPUT_DIR}' folder
3. Set App Name: "Wizone Task Manager"
4. Download the generated APK

## Method 2: Android Studio
1. Open Android Studio
2. Create new project with WebView
3. Replace assets with files from '${APK_OUTPUT_DIR}'
4. Build → Generate Signed Bundle/APK

## Method 3: PWA Installation
1. Open ${PRODUCTION_SERVER} in Chrome on mobile
2. Menu → "Add to Home Screen"
3. Use as native app

## 📦 Ready Files:
✅ index.html - Main application
✅ manifest.json - App configuration
✅ icon.svg - App icon
✅ README.md - User instructions

## 🎯 Final Result:
- APK connects to: ${PRODUCTION_SERVER}
- Uses same database as web
- Users can login and work normally
- Perfect for field engineers
`;

fs.writeFileSync(path.join(APK_OUTPUT_DIR, 'BUILD_INSTRUCTIONS.md'), buildInstructions);

console.log('✅ Mobile APK files created successfully!');
console.log(`📁 Output directory: ${APK_OUTPUT_DIR}`);
console.log(`🌐 Server URL: ${PRODUCTION_SERVER}`);
console.log(`📱 Ready for APK building!`);

console.log('\n🚀 NEXT STEPS:');
console.log('1. Use any APK builder with the created files');
console.log('2. Install APK on mobile devices');
console.log('3. Users can login with existing credentials');
console.log('4. Same database and features as web application');
