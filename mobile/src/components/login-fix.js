// Mobile APK Login Fix for Real Devices
class MobileLoginFix {
  constructor() {
    this.serverUrls = [
      // Current Replit deployment (working URL)
      'https://window.299f0612-89c3-4a4f-9a65-3dd9be12e804-00-3u4fqy7m2q8tl.picard.replit.dev',
      
      // Backup network URLs for local testing
      'http://172.31.126.2:5000',  // Update with your actual IP
      'http://192.168.1.100:5000',
      'http://10.0.0.100:5000',
      'http://127.0.0.1:5000'
    ];
    
    this.workingUrl = null;
  }
  
  // Find working server URL
  async findWorkingServer() {
    console.log('🔍 Mobile Login Fix: Finding working server...');
    
    for (const url of this.serverUrls) {
      try {
        console.log(`Testing: ${url}`);
        
        const response = await Promise.race([
          fetch(`${url}/api/health`, {
            method: 'GET',
            headers: {
              'User-Agent': 'WizoneFieldEngineerApp/1.0 (Mobile)',
              'Accept': 'application/json'
            }
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('timeout')), 3000)
          )
        ]);
        
        if (response && response.ok) {
          console.log(`✅ Server found: ${url}`);
          this.workingUrl = url;
          return url;
        }
        
      } catch (error) {
        console.log(`❌ Failed: ${url} - ${error.message}`);
        continue;
      }
    }
    
    // Use first URL as fallback
    this.workingUrl = this.serverUrls[0];
    console.log(`⚠️ Using fallback: ${this.workingUrl}`);
    return this.workingUrl;
  }
  
  // Mobile login with network fix
  async login(username, password) {
    try {
      const serverUrl = await this.findWorkingServer();
      console.log(`🔐 Login attempt: ${username} to ${serverUrl}`);
      
      const response = await fetch(`${serverUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'WizoneFieldEngineerApp/1.0 (Mobile)',
          'X-Requested-With': 'mobile'
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log(`✅ Login successful: ${userData.username}`);
        return { success: true, user: userData };
      } else {
        const errorText = await response.text();
        console.log(`❌ Login failed: ${response.status} - ${errorText}`);
        return { success: false, error: errorText };
      }
      
    } catch (error) {
      console.error('❌ Network error during login:', error);
      return { success: false, error: 'Network connection failed. Please check your internet connection.' };
    }
  }
  
  // Get current working server URL
  getServerUrl() {
    return this.workingUrl || this.serverUrls[0];
  }
}

// Export for use in mobile app
if (typeof window !== 'undefined') {
  window.MobileLoginFix = MobileLoginFix;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileLoginFix;
}