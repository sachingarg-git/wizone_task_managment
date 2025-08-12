import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/DebugAuthContext'
import { Layout } from './components/Layout'
import { LoginScreen } from './screens/LoginScreen'
import { DashboardScreen } from './screens/DashboardScreen'
import { TasksScreen } from './screens/TasksScreen'
import { CustomersScreen } from './screens/CustomersScreen'
import { UsersScreen } from './screens/UsersScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { LoadingSpinner } from './components/LoadingSpinner'

// Create a query client
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

  console.log('🎯 DEBUG: AppRoutes render - loading:', loading, 'user:', user ? 'LOGGED IN' : 'NOT LOGGED IN')

  // Force show login screen if loading for too long or no user
  if (loading) {
    console.log('⏳ DEBUG: Still loading, showing spinner')
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-500 to-blue-600 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Wizone Field Engineer</h2>
          <p className="text-blue-100">Loading...</p>
          <p className="text-xs text-blue-200 mt-4">Debug: loading={loading.toString()}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    console.log('👤 DEBUG: No user found, showing login screen')
    return (
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  console.log('✅ DEBUG: User authenticated, showing main app')

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