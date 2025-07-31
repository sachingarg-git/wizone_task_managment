// Mobile Network Configuration for Real Device APK
export class MobileNetworkConfig {
  private static instance: MobileNetworkConfig;
  private baseUrls: string[] = [];
  private currentUrl: string | null = null;

  private constructor() {
    this.initializeNetworkUrls();
  }

  public static getInstance(): MobileNetworkConfig {
    if (!MobileNetworkConfig.instance) {
      MobileNetworkConfig.instance = new MobileNetworkConfig();
    }
    return MobileNetworkConfig.instance;
  }

  private initializeNetworkUrls() {
    // Get current deployment URL dynamically
    let currentDeploymentUrl = '';
    if (typeof window !== 'undefined') {
      if (window.location.hostname.includes('replit')) {
        currentDeploymentUrl = window.location.origin;
      }
    }
    
    // Multiple network configurations for mobile APK - FIXED FOR REAL DEVICES
    this.baseUrls = [
      // ✅ WORKING DEPLOYMENT URL - HIGHEST PRIORITY
      'https://window.299f0612-89c3-4a4f-9a65-3dd9be12e804-00-3u4fqy7m2q8tl.picard.replit.dev',
      
      // Current deployment URL detection (if on Replit)
      ...(currentDeploymentUrl ? [currentDeploymentUrl] : []),
      
      // Local network IPs for development (update with your actual IP)
      'http://192.168.1.100:5000',
      'http://192.168.0.100:5000',
      'http://10.0.0.100:5000',
      'http://172.16.0.100:5000',
      
      // Android emulator specific (works in emulator only)
      'http://10.0.2.2:5000',
      
      // Localhost fallback (emulator only - will fail on real device)
      'http://127.0.0.1:5000',
      'http://localhost:5000'
    ];
  }

  // Auto-detect working server URL
  public async detectWorkingUrl(): Promise<string> {
    console.log('🔍 Mobile APK: Detecting working server URL...');
    
    for (const url of this.baseUrls) {
      try {
        console.log(`📡 Testing connection: ${url}`);
        
        // Create a promise with timeout
        const fetchPromise = fetch(`${url}/api/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'WizoneFieldEngineerApp/1.0 (Mobile)',
            'X-Requested-With': 'mobile'
          }
        });
        
        const timeoutPromise = new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 3000)
        );
        
        const response = await Promise.race([fetchPromise, timeoutPromise]);

        if (response.ok) {
          console.log(`✅ Found working server: ${url}`);
          this.currentUrl = url;
          return url;
        }
      } catch (error) {
        console.log(`❌ Failed to connect: ${url} - ${(error as Error).message}`);
        continue;
      }
    }

    // If no server responds, use the first URL as fallback
    console.log('⚠️ No server responded, using fallback URL');
    this.currentUrl = this.baseUrls[0];
    return this.currentUrl;
  }

  public async getApiBaseUrl(): Promise<string> {
    if (this.currentUrl) {
      return this.currentUrl;
    }
    
    return await this.detectWorkingUrl();
  }

  // Get local network IP for server configuration
  public static async getLocalNetworkIP(): Promise<string> {
    try {
      // This would work in a React Native environment
      // For WebView, we'll use a different approach
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Failed to get network IP:', error);
      return '192.168.1.100'; // Fallback
    }
  }

  // Add custom server URL (for user configuration)
  public addCustomServerUrl(url: string) {
    if (!this.baseUrls.includes(url)) {
      this.baseUrls.unshift(url); // Add to beginning for priority
    }
  }

  // Reset network configuration
  public reset() {
    this.currentUrl = null;
    this.initializeNetworkUrls();
  }
}

// Export singleton instance
export const mobileNetworkConfig = MobileNetworkConfig.getInstance();