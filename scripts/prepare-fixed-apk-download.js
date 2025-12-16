#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const rootDir = path.resolve(__dirname);
const fixedApkDir = path.join(rootDir, 'wizone-fixed-apk');
const outputDir = path.join(rootDir, 'wizone-final-mobile-apk');

// Make sure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Generate a complete HTML file with the instructions
const instructionsHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wizone Fixed APK Download</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .container {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: #4a6cf7;
            margin-top: 0;
        }
        h2 {
            color: #444;
            margin-top: 30px;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }
        pre {
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            font-size: 14px;
            border: 1px solid #eee;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background-color: #4a6cf7;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 600;
            margin-top: 20px;
            transition: background-color 0.2s;
        }
        .btn:hover {
            background-color: #3a5cf0;
        }
        .step {
            background-color: #f5f9ff;
            border-left: 4px solid #4a6cf7;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 0 5px 5px 0;
        }
        .warning {
            background-color: #fff5f5;
            border-left: 4px solid #e53e3e;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 0 5px 5px 0;
        }
        code {
            background-color: #f0f0f0;
            padding: 2px 5px;
            border-radius: 3px;
            font-family: monospace;
            font-size: 90%;
        }
        .feature-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .feature-item {
            background: #f8faff;
            padding: 15px;
            border-radius: 5px;
            border: 1px solid #e6efff;
        }
        .feature-item h3 {
            margin-top: 0;
            color: #4a6cf7;
        }
        footer {
            margin-top: 40px;
            text-align: center;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Wizone IT Support - Fixed APK</h1>
        <p>This page provides access to the fixed version of the Wizone IT Support mobile application that resolves the APK parsing error.</p>

        <div class="warning">
            <strong>Important:</strong> Before installing the new APK, please uninstall any previous versions of the app to avoid conflicts.
        </div>

        <h2>Download the Fixed APK</h2>
        <p>Click the button below to download the fixed APK file:</p>
        <a href="wizone-fixed-apk.apk" class="btn" download>Download Fixed APK</a>

        <h2>Installation Instructions</h2>
        
        <div class="step">
            <strong>Step 1:</strong> Uninstall any previous versions of the Wizone IT Support app.
        </div>

        <div class="step">
            <strong>Step 2:</strong> Enable installation from unknown sources:
            <ul>
                <li>Go to <code>Settings > Security</code> (or <code>Settings > Apps & notifications > Advanced > Special app access > Install unknown apps</code> on newer Android versions)</li>
                <li>Enable "Unknown sources" or select your file manager app and toggle "Allow from this source"</li>
            </ul>
        </div>

        <div class="step">
            <strong>Step 3:</strong> Open the downloaded APK file and tap "Install"
        </div>

        <div class="step">
            <strong>Step 4:</strong> Once installed, open the app and verify it works correctly
        </div>

        <h2>What's Fixed</h2>
        <div class="feature-list">
            <div class="feature-item">
                <h3>Package Name Consistency</h3>
                <p>Standardized package name across all configurations to ensure proper installation</p>
            </div>
            
            <div class="feature-item">
                <h3>SDK Compatibility</h3>
                <p>Updated SDK versions to ensure compatibility with modern Android devices</p>
            </div>
            
            <div class="feature-item">
                <h3>Task Status Dropdown</h3>
                <p>Added dropdown menu for easily updating task status</p>
            </div>
            
            <div class="feature-item">
                <h3>Task Notes</h3>
                <p>Added notes field for recording details about task updates</p>
            </div>
            
            <div class="feature-item">
                <h3>Offline Support</h3>
                <p>App works without requiring constant internet connection</p>
            </div>
            
            <div class="feature-item">
                <h3>Enhanced UI</h3>
                <p>Improved interface optimized for mobile devices</p>
            </div>
        </div>

        <h2>Technical Details</h2>
        <pre>
Package Name: com.wizone.taskmanager
Version: 1.1.5 (Build 5)
Min SDK: 21 (Android 5.0+)
Target SDK: 33 (Android 13)
        </pre>

        <h2>Troubleshooting</h2>
        <p>If you encounter any issues during installation:</p>
        <ul>
            <li>Make sure all previous versions are completely uninstalled</li>
            <li>Verify that "Install from unknown sources" is enabled</li>
            <li>Check that your device is running Android 5.0 or higher</li>
            <li>Try restarting your device before installation</li>
        </ul>

        <footer>
            Wizone IT Support &copy; 2023 - Version 1.1.5 Enhanced
        </footer>
    </div>
</body>
</html>`;

// Write the instructions HTML file
fs.writeFileSync(path.join(outputDir, 'index.html'), instructionsHTML);

// Create an icon.svg file
const iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#667eea" />
      <stop offset="100%" stop-color="#764ba2" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#gradient)" />
  <path d="M256 128c-70.7 0-128 57.3-128 128s57.3 128 128 128 128-57.3 128-128-57.3-128-128-128zm64 144H256c-8.8 0-16-7.2-16-16V160c0-8.8 7.2-16 16-16s16 7.2 16 16v80h48c8.8 0 16 7.2 16 16s-7.2 16-16 16z" fill="white" />
</svg>`;

// Write the icon.svg file
fs.writeFileSync(path.join(outputDir, 'icon.svg'), iconSVG);

// Create a manifest.json file
const manifestJSON = {
    "name": "Wizone IT Support",
    "short_name": "Wizone Support",
    "start_url": "./index.html",
    "display": "standalone",
    "background_color": "#667eea",
    "theme_color": "#667eea",
    "icons": [
        {
            "src": "./icon.svg",
            "sizes": "512x512",
            "type": "image/svg+xml"
        }
    ],
    "version": "1.1.5"
};

// Write the manifest.json file
fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify(manifestJSON, null, 2));

// Create a README.md file
const readmeContent = `# Wizone IT Support - Fixed APK Download

This directory contains the fixed APK for the Wizone IT Support application, addressing the APK parsing error.

## Contents

- \`index.html\`: Web page for downloading the fixed APK
- \`manifest.json\`: Web app manifest
- \`icon.svg\`: App icon
- \`wizone-fixed-apk.apk\`: The fixed APK file (placeholder, needs to be replaced with actual built APK)

## How to Use

1. First, build the APK using Android Studio by opening the \`wizone-fixed-apk\` project
2. Copy the built APK from \`wizone-fixed-apk/app/build/outputs/apk/debug/app-debug.apk\` to this directory and rename it to \`wizone-fixed-apk.apk\`
3. The user can access the \`index.html\` file to download and install the APK

## APK Details

- **Package Name**: com.wizone.taskmanager
- **Version**: 1.1.5 (Build 5)
- **Min SDK**: 21 (Android 5.0+)
- **Target SDK**: 33 (Android 13)`;

// Write the README.md file
fs.writeFileSync(path.join(outputDir, 'README.md'), readmeContent);

console.log('✅ Download page created successfully in:', outputDir);
console.log('\n📋 Next Steps:');
console.log('1. Build the APK using Android Studio by opening the project in:', fixedApkDir);
console.log('2. Copy the built APK from:');
console.log('   [app/build/outputs/apk/debug/app-debug.apk]');
console.log('   to:');
console.log(`   [${outputDir}/wizone-fixed-apk.apk]`);
console.log('3. Share the entire folder with users for easy APK installation');