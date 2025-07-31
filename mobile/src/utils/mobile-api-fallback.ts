// Mobile API with fallback system for real devices
export class MobileAPIFallback {
  private serverUrls: string[] = [];
  private workingUrl: string | null = null;
  
  constructor() {
    this.initializeServerUrls();
  }
  
  private initializeServerUrls() {
    // Get current domain dynamically for mobile
    let currentUrl = '';
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      const hostname = window.location.hostname;
      
      if (hostname.includes('replit')) {
        currentUrl = `${protocol}//${hostname}`;
      }
    }
    
    this.serverUrls = [
      // Current deployment URL (highest priority)
      ...(currentUrl ? [currentUrl] : []),
      
      // User's local server (REPLACE WITH YOUR ACTUAL IP)
      'http://172.31.126.2:5000',  // Update this with your computer's IP
      
      // Common local network ranges
      'http://192.168.1.100:5000',
      'http://192.168.0.100:5000', 
      'http://10.0.0.100:5000',
      
      // Fallback URLs
      'http://10.0.2.2:5000',  // Android emulator
      'http://127.0.0.1:5000'  // Localhost
    ];
  }
  
  // Test server connectivity with timeout
  private async testServer(url: string): Promise<boolean> {
    try {
      console.log(`🔍 Testing server: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
      
      const response = await fetch(`${url}/api/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'WizoneFieldEngineerApp/1.0',
          'Accept': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`✅ Server working: ${url}`);
        return true;
      }
      
      console.log(`❌ Server not responding: ${url} (${response.status})`);
      return false;
      
    } catch (error) {
      console.log(`❌ Server connection failed: ${url} - ${(error as Error).message}`);
      return false;
    }
  }
  
  // Find working server URL
  async getWorkingServerUrl(): Promise<string> {
    if (this.workingUrl) {
      return this.workingUrl;
    }
    
    console.log('🔍 Searching for working server...');
    
    for (const url of this.serverUrls) {
      const isWorking = await this.testServer(url);
      if (isWorking) {
        this.workingUrl = url;
        console.log(`🎯 Using server: ${url}`);
        return url;
      }
    }
    
    // If no server works, use first URL as fallback
    console.log('⚠️ No server responding, using fallback');
    this.workingUrl = this.serverUrls[0];
    return this.workingUrl;
  }
  
  // Make API request with automatic server detection
  async apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const serverUrl = await this.getWorkingServerUrl();
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WizoneFieldEngineerApp/1.0 (Mobile)',
        'X-Requested-With': 'mobile',
        ...options.headers
      },
      credentials: 'include'
    };
    
    const fullUrl = `${serverUrl}${endpoint}`;
    console.log(`📡 API Request: ${options.method || 'GET'} ${fullUrl}`);
    
    try {
      const response = await fetch(fullUrl, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const responseText = await response.text();
      return responseText ? JSON.parse(responseText) : {};
      
    } catch (error) {
      console.error('API Request failed:', error);
      
      // Reset working URL on network error to trigger re-detection
      if ((error as Error).message.includes('network') || (error as Error).message.includes('fetch')) {
        this.workingUrl = null;
      }
      
      throw error;
    }
  }
  
  // Authentication methods
  async login(username: string, password: string) {
    return await this.apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  }
  
  async getUser() {
    return await this.apiRequest('/api/auth/user');
  }
  
  async getTasks() {
    return await this.apiRequest('/api/tasks');
  }
  
  // Reset server detection
  reset() {
    this.workingUrl = null;
    this.initializeServerUrls();
  }
}

// Export singleton instance
export const mobileAPI = new MobileAPIFallback();