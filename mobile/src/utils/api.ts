// PRODUCTION DIRECT - NO DETECTION
const PRODUCTION_SERVER = 'http://103.122.85.61:4000';

// Simple direct API base URL - no detection logic
const getApiBaseUrl = async (): Promise<string> => {
  console.log('🎯 DIRECT CONNECTION: http://103.122.85.61:4000');
  return PRODUCTION_SERVER;
};

// Cache the API base URL
let API_BASE_URL: string | null = null;

interface ApiResponse {
  [key: string]: any;
}

export async function apiRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any
): Promise<ApiResponse> {
  try {
    // Get the production API base URL directly
    if (!API_BASE_URL) {
      API_BASE_URL = await getApiBaseUrl();
      console.log(`🌐 Mobile APK using API base URL: ${API_BASE_URL}`);
    }
    
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'WizoneFieldEngineerApp/1.0 (Mobile)',
        'X-Requested-With': 'mobile',
        'X-Mobile-App': 'true', // Mobile identification
      },
      credentials: 'include', // Essential for session cookies
      mode: 'cors', // Explicit CORS mode
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    console.log(`📡 Mobile APK Request: ${method} ${API_BASE_URL}${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    console.log(`📡 Mobile APK Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      console.error(`❌ API Error ${response.status}:`, errorData);
      throw new Error(errorData.message || `HTTP ${response.status}: Authentication failed`);
    }

    // Handle empty responses (like logout)
    const responseText = await response.text();
    if (!responseText) {
      return {};
    }

    const responseData = JSON.parse(responseText);
    console.log('✅ Mobile APK Response data received');
    return responseData;
  } catch (error) {
    console.error('❌ Mobile APK API Request Error:', error);
    
    // If network error, just reset for next request
    const errorMessage = (error as Error).message || '';
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
      console.log('🔄 Network error, will retry...');
      API_BASE_URL = null; // Reset for next request
    }
    
    throw error;
  }
}

// Helper functions for common API calls
export const authApi = {
  login: (username: string, password: string) =>
    apiRequest('POST', '/api/auth/login', { username, password }),
  
  logout: () =>
    apiRequest('POST', '/api/auth/logout'),
  
  getUser: () =>
    apiRequest('GET', '/api/auth/user'),
};

export const tasksApi = {
  getAll: () =>
    apiRequest('GET', '/api/tasks'),
  
  getById: (id: string) =>
    apiRequest('GET', `/api/tasks/${id}`),
  
  create: (taskData: any) =>
    apiRequest('POST', '/api/tasks', taskData),
  
  update: (id: string, taskData: any) =>
    apiRequest('PUT', `/api/tasks/${id}`, taskData),
  
  delete: (id: string) =>
    apiRequest('DELETE', `/api/tasks/${id}`),
  
  getStats: () =>
    apiRequest('GET', '/api/tasks/stats'),
};

export const customersApi = {
  getAll: () =>
    apiRequest('GET', '/api/customers'),
  
  getById: (id: string) =>
    apiRequest('GET', `/api/customers/${id}`),
  
  create: (customerData: any) =>
    apiRequest('POST', '/api/customers', customerData),
  
  update: (id: string, customerData: any) =>
    apiRequest('PUT', `/api/customers/${id}`, customerData),
  
  delete: (id: string) =>
    apiRequest('DELETE', `/api/customers/${id}`),
};

export const usersApi = {
  getAll: () =>
    apiRequest('GET', '/api/users'),
  
  getById: (id: string) =>
    apiRequest('GET', `/api/users/${id}`),
  
  create: (userData: any) =>
    apiRequest('POST', '/api/users', userData),
  
  update: (id: string, userData: any) =>
    apiRequest('PUT', `/api/users/${id}`, userData),
  
  delete: (id: string) =>
    apiRequest('DELETE', `/api/users/${id}`),
};

export const dashboardApi = {
  getStats: () =>
    apiRequest('GET', '/api/dashboard/stats'),
  
  getRecentTasks: () =>
    apiRequest('GET', '/api/dashboard/recent-tasks'),
};