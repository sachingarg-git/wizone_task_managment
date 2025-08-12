import React from 'react'
import { TestApp } from './TestApp'

// Test mode - bypass all complex logic

function App() {
  console.log('🧪 TEST: App starting in test mode')
  
  // Add global error handler
  React.useEffect(() => {
    const handleError = (event: any) => {
      console.error('🚨 TEST: Global error:', event.error)
      alert('JavaScript Error: ' + event.error?.message)
    }
    
    const handleUnhandledRejection = (event: any) => {
      console.error('🚨 TEST: Unhandled promise rejection:', event.reason)
      alert('Promise Error: ' + event.reason)
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  // Return minimal test component
  return <TestApp />
}

export default App