import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

console.log('🚀 ULTRA-SIMPLE: Starting ultra-simple Wizone mobile app')

try {
  const rootElement = document.getElementById('root')
  
  if (rootElement) {
    console.log('✅ ULTRA-SIMPLE: Root element found, creating React app...')
    const root = ReactDOM.createRoot(rootElement)
    
    root.render(<App />)
    console.log('✅ ULTRA-SIMPLE: React app started successfully!')
  } else {
    console.error('❌ ULTRA-SIMPLE: Root element not found!')
  }
} catch (error) {
  console.error('❌ ULTRA-SIMPLE: Error starting app:', error)
}