console.log("=== MAIN.TSX EXECUTION START ===");

// Test 1: Can we access DOM?
const rootElement = document.getElementById("root");
console.log("Root element:", rootElement);

if (!rootElement) {
  console.error("Root element not found!");
  document.body.innerHTML = `
    <div style="background: red; color: white; padding: 20px; font-family: Arial;">
      <h1>CRITICAL ERROR: Root element not found</h1>
      <p>The #root div is missing from the HTML</p>
    </div>
  `;
  throw new Error("Root element not found");
}

// Test 2: Basic DOM manipulation
console.log("Testing basic DOM manipulation...");
rootElement.innerHTML = `
  <div style="
    min-height: 100vh; 
    background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
    color: white; 
    padding: 20px; 
    font-family: Arial, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  ">
    <h1 style="margin-bottom: 20px; font-size: 2rem;">✅ DOM Access Working</h1>
    <p style="margin-bottom: 10px;">Basic HTML and JavaScript are functioning.</p>
    <p style="margin-bottom: 20px;">Testing React import next...</p>
    <div id="react-test" style="margin-top: 20px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 5px;">
      React test pending...
    </div>
  </div>
`;

console.log("Basic DOM test completed, now testing React...");

// Test 3: React import and rendering
(async () => {
  try {
    console.log("Importing React...");
    const { createRoot } = await import("react-dom/client");
    console.log("React imported successfully");
    
    const reactTestDiv = document.getElementById("react-test");
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
