import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Force loading to false after 3 seconds maximum
  useEffect(() => {
    console.log('🚀 DEBUG: AuthProvider mounted, starting 3-second timeout')
    const timeout = setTimeout(() => {
      console.log('⏰ DEBUG: 3-second timeout reached, forcing loading = false')
      setLoading(false)
    }, 3000)

    return () => {
      console.log('🧹 DEBUG: Cleaning up timeout')
      clearTimeout(timeout)
    }
  }, [])

  const checkAuthStatus = async () => {
    console.log('🔍 DEBUG: Starting auth check...')
    
    try {
      setLoading(true)
      console.log('📡 DEBUG: Making API call to getCurrentUser...')
      const currentUser = await apiService.getCurrentUser()
      console.log('✅ DEBUG: Auth check successful:', currentUser)
      setUser(currentUser as User)
    } catch (error: any) {
      console.log('❌ DEBUG: Auth check failed (expected for logged out users):', error.message)
      setUser(null)
      
      // Clear stored token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken')
      }
    }
    
    console.log('✅ DEBUG: Setting loading = false')
    setLoading(false)
  }

  const login = async (username: string, password: string) => {
    console.log('🔐 DEBUG: Login attempt for:', username)
    setLoading(true)
    setError(null)

    try {
      const response = await apiService.login({ username, password })
      console.log('✅ DEBUG: Login successful')
      
      // Fetch user details
      await checkAuthStatus()
    } catch (error: any) {
      console.error('❌ DEBUG: Login failed:', error)
      setError(error.message || 'Login failed')
      setLoading(false)
      throw error
    }
  }

  const logout = async () => {
    console.log('🚪 DEBUG: Logging out')
    setLoading(true)
    
    try {
      await apiService.logout()
    } catch (error: any) {
      console.warn('⚠️ DEBUG: Logout API failed:', error.message)
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

  // Run auth check on mount
  useEffect(() => {
    console.log('🎯 DEBUG: Running initial auth check')
    checkAuthStatus()
  }, [])

  // Debug logging for state changes
  useEffect(() => {
    console.log('🔄 DEBUG: State changed - loading:', loading, 'user:', user ? 'authenticated' : 'not authenticated', 'error:', error)
  }, [loading, user, error])

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}