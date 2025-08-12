import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/DirectAuthContext'
import { Layout } from './components/Layout'
import { LoginScreen } from './screens/LoginScreen'
import { DashboardScreen } from './screens/DashboardScreen'
import { TasksScreen } from './screens/TasksScreen'
import { CustomersScreen } from './screens/CustomersScreen'
import { UsersScreen } from './screens/UsersScreen'
import { ProfileScreen } from './screens/ProfileScreen'

// Create a query client with better error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 401 (unauthorized) errors
        if (error?.message?.includes('401')) return false
        return failureCount < 2
      },
    },
  },
})

function AppRoutes() {
  const { user, loading } = useAuth()

  console.log('🚀 MOBILE: AppRoutes render - loading:', loading, 'user:', user ? 'LOGGED IN' : 'NOT LOGGED IN')

  // Show loading only during actual login process
  if (loading) {
    console.log('⏳ MOBILE: Showing loading during login process')
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-500 to-blue-600 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Wizone Field Engineer</h2>
          <p className="text-blue-100">Logging in...</p>
        </div>
      </div>
    )
  }

  // Always show login screen if no user
  if (!user) {
    console.log('👤 MOBILE: No user, showing login screen')
    return (
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  console.log('✅ MOBILE: User authenticated, showing main app')

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardScreen />} />
        <Route path="/dashboard" element={<DashboardScreen />} />
        <Route path="/tasks" element={<TasksScreen />} />
        <Route path="/customers" element={<CustomersScreen />} />
        {user.role === 'admin' && (
          <Route path="/users" element={<UsersScreen />} />
        )}
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

function App() {
  console.log('🚀 MOBILE: App starting - React is working!')
  
  // Add global error handler
  React.useEffect(() => {
    const handleError = (event: any) => {
      console.error('🚨 MOBILE: Global error:', event.error)
    }
    
    const handleUnhandledRejection = (event: any) => {
      console.error('🚨 MOBILE: Unhandled promise rejection:', event.reason)
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <AppRoutes />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App