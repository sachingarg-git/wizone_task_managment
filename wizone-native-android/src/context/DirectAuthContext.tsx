import React, { createContext, useContext, useState, ReactNode } from 'react'
import { apiService } from '../services/apiService'

interface User {
  id: string
  username: string
  email?: string
  firstName?: string
  lastName?: string
  role: 'admin' | 'manager' | 'engineer'
  profileImageUrl?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false) // Start with loading = false
  const [error, setError] = useState<string | null>(null)

  console.log('🚀 DIRECT AUTH: Context created with loading=false, user=null')

  const login = async (username: string, password: string) => {
    console.log('🔐 DIRECT AUTH: Login attempt for:', username)
    setLoading(true)
    setError(null)

    try {
      const response = await apiService.login({ username, password })
      console.log('✅ DIRECT AUTH: Login successful')
      
      // Get user data
      const currentUser = await apiService.getCurrentUser()
      setUser(currentUser as User)
      console.log('✅ DIRECT AUTH: User data loaded:', currentUser)
    } catch (error: any) {
      console.error('❌ DIRECT AUTH: Login failed:', error)
      setError(error.message || 'Login failed')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    console.log('🚪 DIRECT AUTH: Logging out')
    setLoading(true)
    
    try {
      await apiService.logout()
    } catch (error: any) {
      console.warn('⚠️ DIRECT AUTH: Logout API failed:', error.message)
    }
    
    setUser(null)
    setError(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken')
    }
    
    setLoading(false)
  }

  const clearError = () => {
    setError(null)
  }

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    clearError,
  }

  console.log('🔄 DIRECT AUTH: Render - loading:', loading, 'user:', user ? 'authenticated' : 'not authenticated')

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}