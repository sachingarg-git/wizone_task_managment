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

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if user is already authenticated on app start
  const checkAuthStatus = async () => {
    console.log('🔍 Checking authentication status...')
    setLoading(true)
    setError(null)
    
    try {
      const currentUser = await apiService.getCurrentUser()
      console.log('✅ Authentication check successful:', currentUser)
      setUser(currentUser as User)
    } catch (error: any) {
      console.log('❌ Authentication check failed (this is normal for logged out users):', error.message)
      setUser(null)
      // Clear any stored token if auth fails
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken')
      }
    }
    
    console.log('✅ Authentication check complete - setting loading to false')
    setLoading(false)
  }

  const login = async (username: string, password: string) => {
    console.log('🔐 Attempting login for user:', username)
    setLoading(true)
    setError(null)

    try {
      const response = await apiService.login({ username, password })
      console.log('✅ Login successful:', response)
      
      // Fetch user details after successful login
      await checkAuthStatus()
    } catch (error: any) {
      console.error('❌ Login failed:', error)
      setError(error.message || 'Login failed. Please check your credentials.')
      setLoading(false)
      throw error
    }
  }

  const logout = async () => {
    console.log('🚪 Logging out user')
    setLoading(true)
    
    try {
      await apiService.logout()
    } catch (error: any) {
      console.warn('⚠️ Logout API call failed:', error.message)
    }
    
    // Always clear user state and token regardless of API response
    setUser(null)
    setError(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken')
    }
    
    console.log('✅ Logout complete')
    setLoading(false)
  }

  const clearError = () => {
    setError(null)
  }

  // Run authentication check on mount
  useEffect(() => {
    console.log('📱 App starting - running initial auth check')
    checkAuthStatus()
  }, [])

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    clearError,
  }

  console.log('🔄 AuthProvider render - loading:', loading, 'user:', user ? 'authenticated' : 'not authenticated')

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}