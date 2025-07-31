// Check user data in database directly
const testUserDataCheck = async () => {
  console.log('🔍 Testing user data directly...');
  
  try {
    // Test if we can get user from database
    const response = await fetch('http://localhost:5000/api/debug-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin'
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ User data retrieved:', result);
    } else {
      const error = await response.text();
      console.log('❌ User data check failed:', response.status, error);
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

testUserDataCheck();