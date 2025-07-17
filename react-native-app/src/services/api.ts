const API_BASE_URL = 'https://window.299f0612-89c3-4a4f-9a65-3dd9be12e804-00-3u4fqy7m2q8tl.picard.replit.dev/api';

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include',
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

export const endpoints = {
  // Auth endpoints
  login: '/auth/login',
  logout: '/auth/logout',
  user: '/auth/user',
  
  // Dashboard endpoints
  dashboardStats: '/dashboard/stats',
  recentTasks: '/dashboard/recent-tasks',
  
  // Tasks endpoints
  tasks: '/tasks',
  createTask: '/tasks',
  updateTask: (id: number) => `/tasks/${id}`,
  
  // Customers endpoints
  customers: '/customers',
  createCustomer: '/customers',
  
  // Users endpoints
  users: '/users',
  createUser: '/users',
  
  // Notifications endpoints
  notifications: '/notifications',
};