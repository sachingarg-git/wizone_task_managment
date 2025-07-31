// Find your computer's IP address for mobile APK connection
import os from 'os';

function getLocalIPAddress() {
    const interfaces = os.networkInterfaces();
    
    console.log('🌐 Available Network Interfaces:');
    console.log('================================');
    
    for (const name of Object.keys(interfaces)) {
        for (const net of interfaces[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                console.log(`✅ Interface: ${name}`);
                console.log(`   IP Address: ${net.address}`);
                console.log(`   Use this in mobile: http://${net.address}:5000`);
                console.log('');
                return net.address;
            }
        }
    }
    
    console.log('❌ No external IPv4 address found');
    return null;
}

const ip = getLocalIPAddress();

if (ip) {
    console.log('📱 MOBILE APK CONFIGURATION:');
    console.log('============================');
    console.log(`1. Your Computer IP: ${ip}`);
    console.log(`2. Mobile should connect to: http://${ip}:5000`);
    console.log(`3. Test URL in mobile browser: http://${ip}:5000`);
    console.log('');
    console.log('⚠️  IMPORTANT: Mobile device and computer must be on same WiFi network!');
} else {
    console.log('Please check your network connection and try again.');
}