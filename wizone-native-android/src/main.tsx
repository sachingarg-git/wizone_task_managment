import React from 'react'
import { createRoot } from 'react-dom/client'

console.log('🔥 MOBILE WEBVIEW: Starting mobile app...')

// Simple App component inline to avoid import issues
function MobileApp() {
  console.log('🔥 MOBILE WEBVIEW: App component rendering...')
  
  return React.createElement('div', {
    style: {
      background: 'linear-gradient(to bottom, #3b82f6, #1d4ed8)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      color: 'white',
      padding: '20px'
    }
  }, [
    React.createElement('div', {
      key: 'container',
      style: {
        background: 'white',
        borderRadius: '15px',
        padding: '30px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px',
        color: '#333'
      }
    }, [
      React.createElement('h1', {
        key: 'title',
        style: { textAlign: 'center', marginBottom: '20px', color: '#333' }
      }, '✅ MOBILE APP WORKING!'),
      
      React.createElement('div', {
        key: 'success',
        style: {
          background: '#e8f5e8',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#2d5a2d',
          marginBottom: '20px'
        }
      }, [
        React.createElement('div', { key: 'check' }, '✅ React Successfully Loaded'),
        React.createElement('div', { key: 'time' }, 'Time: ' + new Date().toLocaleTimeString())
      ]),
      
      React.createElement('button', {
        key: 'button',
        style: {
          width: '100%',
          padding: '15px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          cursor: 'pointer'
        },
        onClick: () => alert('Mobile app working perfectly!')
      }, 'Test Mobile App')
    ])
  ])
}

// Start the app
function startApp() {
  console.log('🔥 MOBILE WEBVIEW: Looking for root element...')
  
  const rootElement = document.getElementById('root')
  
  if (rootElement) {
    console.log('🔥 MOBILE WEBVIEW: Root found, creating React root...')
    
    try {
      const root = createRoot(rootElement)
      console.log('🔥 MOBILE WEBVIEW: React root created, rendering app...')
      
      root.render(React.createElement(MobileApp))
      console.log('✅ MOBILE WEBVIEW: App rendered successfully!')
      
      // Clear the loading message
      setTimeout(() => {
        const loadingDiv = rootElement.querySelector('.fallback-loading')
        if (loadingDiv) {
          loadingDiv.style.display = 'none'
        }
      }, 100)
      
    } catch (error) {
      console.error('❌ MOBILE WEBVIEW: Error creating React root:', error)
      throw error
    }
  } else {
    console.error('❌ MOBILE WEBVIEW: Root element not found!')
    throw new Error('Root element not found')
  }
}

// Try to start immediately
try {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp)
  } else {
    startApp()
  }
} catch (error) {
  console.error('❌ MOBILE WEBVIEW: Critical error:', error)
  
  // Fallback: show simple success message
  setTimeout(() => {
    const rootElement = document.getElementById('root')
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="
          background: linear-gradient(to bottom, #3b82f6, #1d4ed8);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-family: system-ui;
          text-align: center;
          padding: 20px;
        ">
          <div style="background: white; color: #333; padding: 30px; border-radius: 15px; max-width: 400px;">
            <h2>✅ MOBILE APP LOADED!</h2>
            <p>React is working in mobile WebView</p>
            <p>Time: ${new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      `
    }
  }, 500)
}