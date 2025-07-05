import fs from 'fs';
import path from 'path';

// Create a simple APK manifest for the web app
const apkManifest = {
  name: "Wizone IT Support Portal",
  short_name: "Wizone",
  description: "Mobile app for IT support professionals",
  version: "1.0.0",
  package_name: "com.wizone.itsupport",
  orientation: "portrait",
  theme_color: "#22d3ee",
  background_color: "#ffffff",
  start_url: "/",
  display: "standalone",
  icons: [
    {
      src: "/mobile/assets/icon.png",
      sizes: "512x512",
      type: "image/png"
    }
  ]
};

// Create a Progressive Web App that can be installed as APK
const pwaFiles = {
  manifest: JSON.stringify(apkManifest, null, 2),
  serviceWorker: `
// Wizone Mobile Service Worker
const CACHE_NAME = 'wizone-mobile-v1.0.0';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/mobile/assets/icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
`,
  html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wizone IT Support Portal</title>
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#22d3ee">
    <link rel="icon" href="/mobile/assets/icon.png">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #22d3ee, #0891b2);
            color: white;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        .container { 
            text-align: center; 
            max-width: 400px;
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        .logo { 
            width: 100px; 
            height: 100px; 
            margin: 0 auto 20px;
            background: white;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            color: #0891b2;
        }
        .install-btn {
            background: white;
            color: #0891b2;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            margin: 20px 0;
            display: none;
        }
        .install-btn:hover {
            background: #f0f9ff;
        }
        .features {
            text-align: left;
            margin: 20px 0;
        }
        .features li {
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">W</div>
        <h1>Wizone IT Support Portal</h1>
        <p>Professional mobile app for IT support teams</p>
        
        <button class="install-btn" id="installBtn">Install App</button>
        
        <div class="features">
            <h3>Features:</h3>
            <ul>
                <li>📋 Task Management</li>
                <li>👥 Customer Support</li>
                <li>📊 Performance Analytics</li>
                <li>💬 Team Communication</li>
                <li>📱 Mobile Optimized</li>
            </ul>
        </div>
        
        <p><small>Ready to install on Android devices</small></p>
    </div>

    <script>
        let deferredPrompt;
        const installBtn = document.getElementById('installBtn');

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            installBtn.style.display = 'block';
        });

        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                deferredPrompt = null;
                installBtn.style.display = 'none';
            }
        });

        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js');
        }
    </script>
</body>
</html>
`
};

// Write the files
fs.writeFileSync('mobile-app-manifest.json', pwaFiles.manifest);
fs.writeFileSync('mobile-app-sw.js', pwaFiles.serviceWorker);
fs.writeFileSync('mobile-app.html', pwaFiles.html);

console.log('✅ Mobile app files created successfully!');
console.log('📱 Files created:');
console.log('  - mobile-app-manifest.json (App manifest)');
console.log('  - mobile-app-sw.js (Service worker)');
console.log('  - mobile-app.html (Installation page)');
console.log('');
console.log('🚀 To create installable APK:');
console.log('1. Host these files on your web server');
console.log('2. Access mobile-app.html on Android device');
console.log('3. Browser will prompt to "Add to Home Screen"');
console.log('4. App will install like a native APK');
console.log('');
console.log('📋 Next steps:');
console.log('- Copy files to your web server');
console.log('- Configure HTTPS (required for PWA)');
console.log('- Test installation on Android device');