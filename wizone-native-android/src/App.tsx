import React, { useState } from 'react'
import { LoginScreen } from './screens/LoginScreen'

// Simple test app - direct login screen, no auth complexity

function App() {
  console.log('🚀 MOBILE: Simple test app starting')
  
  return (
    <div className="min-h-screen bg-background">
      <LoginScreen />
    </div>
  )
}

export default App