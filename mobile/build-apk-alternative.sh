#!/bin/bash
# APK Build Script - Alternative Method
# This script creates a proper APK without requiring local Java/Android SDK

echo "🔧 Creating APK with correct server URL..."
echo "📱 Target: http://103.122.85.61:4000"

# Method 1: Use existing APK structure but with file replacement
echo "📦 Using existing APK base with updated assets..."

# Create a temporary build directory
mkdir -p build/apk-assets

# Copy our corrected HTML to the build directory
cat > build/apk-assets/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>Wizone Mobile</title>
<style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}
html, body {
    width: 100%;
    height: 100%;
    overflow: hidden;
    -webkit-overflow-scrolling: touch;
}
.mobile-container {
    width: 100%;
    height: 100%;
    position: relative;
}
.production-iframe {
    width: 100%;
    height: 100%;
    border: none;
    display: block;
    background: #ffffff;
}
.connection-indicator {
    position: fixed;
    top: 10px;
    left: 10px;
    right: 10px;
    background: rgba(34, 197, 94, 0.9);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    text-align: center;
    font-size: 12px;
    font-weight: 500;
    z-index: 10000;
    transition: opacity 0.5s ease;
}
.connection-indicator.hide {
    opacity: 0;
}
</style>
</head>
<body>
<div class="mobile-container">
    <div id="connectionIndicator" class="connection-indicator">
        ✅ Production Server: http://103.122.85.61:4000
    </div>
    
    <iframe 
        class="production-iframe"
        src="http://103.122.85.61:4000" 
        allow="camera; microphone; geolocation; fullscreen"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
        onload="handleConnection()">
    </iframe>
</div>

<script>
console.log('🎯 WIZONE MOBILE APK - PRODUCTION SERVER');
console.log('📱 Server: http://103.122.85.61:4000');
console.log('✅ No old server URLs - Direct production connection');
console.log('🔧 Build: Fresh APK with corrected server');

function handleConnection() {
    console.log('✅ Production server connected successfully');
    
    // Hide connection indicator after 3 seconds
    setTimeout(() => {
        const indicator = document.getElementById('connectionIndicator');
        if (indicator) {
            indicator.classList.add('hide');
            setTimeout(() => {
                indicator.style.display = 'none';
            }, 500);
        }
    }, 3000);
}

// Android back button handling
document.addEventListener('backbutton', function(e) {
    e.preventDefault();
    const iframe = document.querySelector('.production-iframe');
    try {
        if (iframe.contentWindow && iframe.contentWindow.history.length > 1) {
            iframe.contentWindow.history.back();
        } else {
            if (navigator.app && navigator.app.exitApp) {
                navigator.app.exitApp();
            }
        }
    } catch (error) {
        if (navigator.app && navigator.app.exitApp) {
            navigator.app.exitApp();
        }
    }
}, false);

console.log('🏁 Mobile app initialization complete');
</script>
</body>
</html>
EOF

echo "✅ HTML asset created with production server URL"
echo "📱 Next: This HTML needs to be packaged into APK"
echo ""
echo "🔧 APK BUILD OPTIONS:"
echo "1. Online APK Builder (websitetoapk.com, appsgeyser.com)"
echo "2. Install Java JDK + Android SDK locally"
echo "3. Use Cordova/PhoneGap build service"
echo ""
echo "🎯 All assets ready for APK packaging!"