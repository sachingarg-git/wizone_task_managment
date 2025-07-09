import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Root element not found!");
  throw new Error("Root element not found");
}

console.log("Starting Wizone IT Support Portal...");
console.log("Root element found:", rootElement);

try {
  const root = createRoot(rootElement);
  console.log("React root created successfully");
  
  // Simple test render first
  root.render(
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1>Wizone IT Support Portal</h1>
        <p>System is initializing...</p>
        <div style={{ marginTop: '20px' }}>
          <button 
            onClick={() => {
              console.log("Loading full app...");
              root.render(<App />);
            }}
            style={{
              padding: '10px 20px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Load Application
          </button>
        </div>
      </div>
    </div>
  );
  console.log("Initial render successful");
} catch (error) {
  console.error("Failed to render app:", error);
  // Fallback render
  rootElement.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
      <div style="text-align: center; color: white;">
        <h1>Wizone IT Support Portal</h1>
        <p>Application Error: ${error.message}</p>
        <button onclick="window.location.reload()" style="margin-top: 16px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Reload
        </button>
      </div>
    </div>
  `;
}
