import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for API - dynamically detect the backend URL
const getApiBaseUrl = () => {
  // Check if running in production deployment
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Development environment
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    
    // Production environment - use same origin as web app
    return window.location.origin;
  }
  
  // Fallback for server-side rendering
  return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

interface ApiResponse {
  [key: string]: any;
}

export async function apiRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any
): Promise<ApiResponse> {
  try {
    const token = await AsyncStorage.getItem('authToken');
    
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      credentials: 'include', // Important for cookie-based sessions
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    // Handle empty responses
    const responseText = await response.text();
    if (!responseText) {
      return {};
    }

    return JSON.parse(responseText);
  } catch (error) {
    console.error('API Request Error:', error);
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