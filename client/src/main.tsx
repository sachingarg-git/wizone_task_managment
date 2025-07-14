import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("=== MAIN.TSX EXECUTION START ===");

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

console.log("Creating React root and rendering App...");
const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

console.log("React application mounted successfully");
    if (reactTestDiv) {
      console.log("Creating React root...");
      const root = createRoot(reactTestDiv);
      console.log("React root created, attempting render...");
      
      // Use createElement instead of JSX for this test
      const React = await import("react");
      const testElement = React.createElement('div', {
        style: {
          padding: '10px',
          background: '#ffffff',
          color: '#059669',
          borderRadius: '5px',
          textAlign: 'center',
          fontWeight: 'bold'
        }
      }, '🎉 REACT IS WORKING! 🎉');
      
      root.render(testElement);
      
      console.log("React render successful!");
    }
  } catch (error) {
    console.error("React error:", error);
    const reactTestDiv = document.getElementById("react-test");
    if (reactTestDiv) {
      reactTestDiv.innerHTML = `
        <div style="padding: 10px; background: #dc2626; color: white; border-radius: 5px;">
          ❌ React Error: ${error.message}
        </div>
      `;
    }
  }
})();

console.log("=== MAIN.TSX EXECUTION COMPLETE ===");
