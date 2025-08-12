// Use localStorage fallback for web compatibility
const storage = {
  async get(options: { key: string }) {
    try {
      if (typeof window !== 'undefined') {
        const value = localStorage.getItem(options.key)
        return { value }
      }
    } catch (e) {
      console.warn('Storage error:', e)
    }
    return { value: null }
  },
  async set(options: { key: string; value: string }) {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(options.key, options.value)
      }
    } catch (e) {
      console.warn('Storage error:', e)
    }
  },
  async remove(options: { key: string }) {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(options.key)
      }
    } catch (e) {
      console.warn('Storage error:', e)
    }
  }
}
import { API_CONFIG } from '../config/api'

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: any
}

class ApiService {
  private baseURL = API_CONFIG.BASE_URL

  async request<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    const { method = 'GET', headers = {}, body } = options
    
    // Get authentication token if available
    const { value: token } = await storage.get({ key: 'authToken' })
    
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Mobile-App': 'true',
        'User-Agent': 'WizoneFieldApp/1.0',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...headers,
      },
      credentials: 'include', // Include cookies for session management
    }

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config)
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('API Request Error:', error)
      throw error
    }
  }

  // Authentication methods
  async login(credentials: { username: string; password: string }) {
    const data = await this.request(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: credentials,
    })
    
    // Store auth token if provided
    if (data.token) {
      await storage.set({ key: 'authToken', value: data.token })
    }
    
    return data
  }

  async getCurrentUser() {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.USER)
  }

  async logout() {
    await this.request(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, { method: 'POST' })
    await storage.remove({ key: 'authToken' })
  }

  // Dynamic entity methods
  async getEntities(entityType: string, params?: Record<string, any>) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : ''
    return this.request(`/api/${entityType}${queryString}`)
  }

  async getEntity(entityType: string, id: string) {
    return this.request(`/api/${entityType}/${id}`)
  }

  async createEntity(entityType: string, data: any) {
    return this.request(`/api/${entityType}`, {
      method: 'POST',
      body: data,
    })
  }

  async updateEntity(entityType: string, id: string, data: any) {
    return this.request(`/api/${entityType}/${id}`, {
      method: 'PUT',
      body: data,
    })
  }

  async deleteEntity(entityType: string, id: string) {
    return this.request(`/api/${entityType}/${id}`, {
      method: 'DELETE',
    })
  }

  // Dashboard and analytics
  async getDashboardStats() {
    return this.request(API_CONFIG.ENDPOINTS.DASHBOARD.STATS)
  }

  async getAnalytics(params?: Record<string, any>) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : ''
    return this.request(`${API_CONFIG.ENDPOINTS.DASHBOARD.ANALYTICS}${queryString}`)
  }
}

export const apiService = new ApiService()
export default apiService