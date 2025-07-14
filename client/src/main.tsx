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

// Add temporary loading indicator
rootElement.innerHTML = `
  <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);">
    <div style="text-align: center; color: white;">
      <div style="width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid white; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
      <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Wizone IT Support Portal</h1>
      <p style="margin: 10px 0; opacity: 0.8;">Loading application...</p>
    </div>
  </div>
  <style>
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
`;

try {
  const root = createRoot(rootElement);
  console.log("React root created successfully");
  
  // Render with error boundary
  root.render(
    <div style={{ minHeight: '100vh', background: 'white' }}>
      <App />
    </div>
  );
  console.log("Full app render successful");
} catch (error) {
  console.error("Failed to render app:", error);
  // Enhanced error display
  rootElement.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);">
      <div style="text-align: center; color: white; padding: 40px;">
        <h1>Wizone IT Support Portal</h1>
        <p>Application Error: ${error.message}</p>
        <pre style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 5px; margin: 20px 0; text-align: left; font-size: 12px; max-width: 500px;">${error.stack}</pre>
        <button onclick="window.location.reload()" style="margin-top: 16px; padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
          Reload Application
        </button>
      </div>
    </div>
  `;
}
