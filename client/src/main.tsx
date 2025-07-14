import { createRoot } from "react-dom/client";
import "./index.css";

console.log("Starting application initialization...");

// Basic test without App component first
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Root element not found!");
  throw new Error("Root element not found");
}

console.log("Root element found:", rootElement);

try {
  // Simple test render
  rootElement.innerHTML = `
    <div style="min-height: 100vh; background: linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%); color: white; padding: 20px; font-family: system-ui;">
      <h1 style="margin-bottom: 20px;">React Test - Step 1</h1>
      <p>If you see this, HTML is loading correctly.</p>
      <p>Now testing React rendering...</p>
    </div>
  `;
  
  console.log("Basic HTML loaded, now testing React...");
  
  // Test React rendering
  const root = createRoot(rootElement);
  console.log("React root created successfully");
  
  root.render(
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
      color: 'white', 
      padding: '20px', 
      fontFamily: 'system-ui' 
    }}>
      <h1 style={{ marginBottom: '20px' }}>React Test - Step 2</h1>
      <p>✅ React is rendering successfully!</p>
      <p>This confirms React and createRoot are working.</p>
      <button 
        onClick={() => window.location.reload()} 
        style={{ 
          marginTop: '20px', 
          padding: '10px 20px', 
          background: '#ffffff', 
          color: '#dc2626', 
          border: 'none', 
          borderRadius: '5px', 
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        Reload to Test Again
      </button>
    </div>
  );
  
  console.log("React render completed successfully");
} catch (error) {
  console.error("Failed to render:", error);
  // Fallback render
  rootElement.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #dc2626; color: white;">
      <div style="text-align: center;">
        <h1>Error Detected</h1>
        <p>Error: ${error.message}</p>
        <button onclick="window.location.reload()" style="margin-top: 16px; padding: 8px 16px; background: white; color: #dc2626; border: none; border-radius: 4px; cursor: pointer;">
          Reload
        </button>
      </div>
    </div>
  `;
}
