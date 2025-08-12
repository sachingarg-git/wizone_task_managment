// API Configuration for Wizone Mobile App
export const API_CONFIG = {
  BASE_URL: 'http://194.238.19.19:5000',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      USER: '/api/auth/user',
      LOGOUT: '/api/auth/logout'
    },
    TASKS: {
      LIST: '/api/tasks',
      CREATE: '/api/tasks',
      UPDATE: '/api/tasks',
      DELETE: '/api/tasks'
    },
    CUSTOMERS: {
      LIST: '/api/customers',
      CREATE: '/api/customers',
      UPDATE: '/api/customers'
    },
    DASHBOARD: {
      STATS: '/api/dashboard/stats',
      ANALYTICS: '/api/analytics'
    },
    USERS: {
      LIST: '/api/users',
      CREATE: '/api/users',
      UPDATE: '/api/users'
    }
  }
};

// Device breakpoints for responsive design
export const BREAKPOINTS = {
  SMALL: 480,
  MEDIUM: 768,
  LARGE: 1024
};

// Theme configuration
export const THEME_CONFIG = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};