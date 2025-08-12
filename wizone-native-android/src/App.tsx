import React, { useState } from 'react'

// Ultra-simple mobile app - just basic login form
function App() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  console.log('🚀 ULTRA-SIMPLE: App starting')

  const handleLogin = async () => {
    if (!username || !password) {
      setMessage('Please enter username and password')
      return
    }

    setLoading(true)
    setMessage('Connecting to server...')
    
    try {
      console.log('🔗 ULTRA-SIMPLE: Attempting login to http://194.238.19.19:5000')
      
      const response = await fetch('http://194.238.19.19:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      console.log('📡 ULTRA-SIMPLE: Server response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ ULTRA-SIMPLE: Login successful!', data)
        setMessage('✅ Login Successful!')
      } else {
        const errorData = await response.text()
        console.log('❌ ULTRA-SIMPLE: Login failed:', response.status, errorData)
        setMessage(`❌ Login failed: ${response.status}`)
      }
    } catch (error: any) {
      console.error('🚨 ULTRA-SIMPLE: Network error:', error)
      setMessage(`🚨 Network Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        width: '90%',
        maxWidth: '400px'
      }}>
        <h1 style={{
          textAlign: 'center',
          color: '#333',
          marginBottom: '30px',
          fontSize: '24px'
        }}>
          Wizone Field Engineer
        </h1>

        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '15px',
            background: loading ? '#ccc' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Connecting...' : 'Login'}
        </button>

        {message && (
          <div style={{
            marginTop: '20px',
            padding: '12px',
            background: message.includes('✅') ? '#d4edda' : '#f8d7da',
            color: message.includes('✅') ? '#155724' : '#721c24',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}

        <div style={{
          marginTop: '20px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#666'
        }}>
          Ultra-Simple Mobile Test Version
        </div>
      </div>
    </div>
  )
}

export default App