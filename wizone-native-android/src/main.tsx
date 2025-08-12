import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Capacitor imports
import { Capacitor } from '@capacitor/core'

console.log('🔥 main.tsx loaded - starting React app')
console.log('🔥 Running on platform:', Capacitor.getPlatform())

try {
  const rootElement = document.getElementById('root')
  console.log('🔥 Root element:', rootElement)
  
  if (rootElement) {
    console.log('🔥 Creating React root...')
    const root = ReactDOM.createRoot(rootElement)
    
    console.log('🔥 Rendering App component...')
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
    console.log('🔥 React app rendered successfully!')
  } else {
    console.error('🚨 Root element not found!')
    alert('Root element not found - cannot start React app')
  }
} catch (error) {
  console.error('🚨 Error starting React app:', error)
  alert('Error starting React: ' + error)
}