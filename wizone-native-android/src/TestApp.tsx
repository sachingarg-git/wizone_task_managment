import React from 'react'

// Minimal test component to bypass all complex logic
export function TestApp() {
  console.log('🧪 TEST: TestApp component rendered')
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #3b82f6, #1d4ed8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>
          Wizone Field Engineer
        </h1>
        <p style={{ fontSize: '16px', marginBottom: '30px' }}>
          Test Mode - React is Working!
        </p>
        
        <div style={{
          background: 'rgba(255,255,255,0.2)',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>Login</h2>
          <input 
            type="text" 
            placeholder="Username"
            style={{
              width: '100%',
              padding: '10px',
              margin: '5px 0',
              borderRadius: '5px',
              border: 'none'
            }}
          />
          <input 
            type="password" 
            placeholder="Password"
            style={{
              width: '100%',
              padding: '10px',
              margin: '5px 0',
              borderRadius: '5px',
              border: 'none'
            }}
          />
          <button 
            onClick={() => alert('Login clicked! React is working.')}
            style={{
              width: '100%',
              padding: '12px',
              marginTop: '10px',
              backgroundColor: '#1d4ed8',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px'
            }}
          >
            Login
          </button>
        </div>
        
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
          If you can see this, React is working correctly
        </p>
      </div>
    </div>
  )
}