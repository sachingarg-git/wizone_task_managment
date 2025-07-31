// Direct storage verification test
const testStorageDirect = async () => {
  console.log('🔍 Testing storage verification directly...');
  
  try {
    // Test connection to storage API directly
    const response = await fetch('http://localhost:5000/api/test-storage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Storage test successful:', result);
    } else {
      const error = await response.text();
      console.log('❌ Storage test failed:', response.status, error);
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

testStorageDirect();