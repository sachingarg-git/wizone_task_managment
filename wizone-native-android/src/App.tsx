import React from 'react'
import { TestApp } from './TestApp'

// Test mode - bypass all complex logic

function App() {
  console.log('🧪 TEST: App starting in test mode')
  
  // Add global error handler
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      console.error('🚨 TEST: Global error:', event.error)
      alert('JavaScript Error: ' + event.error?.message)
    })
    
    window.addEventListener('unhandledrejection', (event) => {
      console.error('🚨 TEST: Unhandled promise rejection:', event.reason)
      alert('Promise Error: ' + event.reason)
    })
  }

  // Return minimal test component
  return <TestApp />
}

export default App