// Server configuration for mobile APK
export const SERVER_CONFIG = {
  // Replace these with your actual server details
  PRODUCTION_SERVERS: [
    // Production server (PRIMARY)
    'http://194.238.19.19:5000',
    
    // Your actual server IP address (backup)
    'http://YOUR_ACTUAL_SERVER_IP:5000',
    
    // Replit deployment URL (fallback)
    'https://window.299f0612-89c3-4a4f-9a65-3dd9be12e804-00-3u4fqy7m2q8tl.picard.replit.dev',
    
    // Local network IPs (common ranges)
    'http://192.168.1.100:5000',
    'http://192.168.0.100:5000',
    'http://10.0.0.100:5000',
    
    // Development fallbacks
    'http://127.0.0.1:5000',
    'http://localhost:5000'
  ],
  
  // Network detection settings
  CONNECTION_TIMEOUT: 3000,
  RETRY_ATTEMPTS: 3,
  HEALTH_CHECK_PATH: '/api/health'
};

// Helper function to get current network IP
export async function getCurrentServerURL(): Promise<string> {
  // Check if we're running on Replit deployment
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // If we're on a Replit domain, use the full origin
    if (hostname.includes('replit.dev') || hostname.includes('replit.app')) {
      return window.location.origin;
    }
    
    // If localhost, use with port
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${window.location.protocol}//${hostname}:5000`;
    }
  }
  
  // Return first production server as fallback
  return SERVER_CONFIG.PRODUCTION_SERVERS[0];
}

// Instructions for user to update server URL
export const MOBILE_SETUP_INSTRUCTIONS = `
🔧 MOBILE APK SETUP INSTRUCTIONS:

To make your mobile APK work on real devices, you need to:

1. Find your computer's IP address:
   - Windows: Open Command Prompt, type: ipconfig
   - Mac/Linux: Open Terminal, type: ifconfig
   - Look for your local network IP (usually 192.168.x.x or 10.0.x.x)

2. Update server IP in mobile/src/utils/server-config.ts:
   - Replace 'YOUR_ACTUAL_SERVER_IP' with your computer's IP
   - Example: 'http://192.168.1.105:5000'

3. Make sure your server is accessible:
   - Start the server: npm run dev
   - Test from browser: http://YOUR_IP:5000
   - Ensure firewall allows port 5000

4. Rebuild the APK after updating the IP address

5. For production deployment:
   - Deploy to a cloud server (AWS, Google Cloud, etc.)
   - Update the production server URL in the config
   - Use HTTPS for secure connections
`;