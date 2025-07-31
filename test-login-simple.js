// Simple login test
const testLogin = async () => {
  console.log('🔑 Testing simple login...');
  
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
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
      const user = await response.json();
      console.log('✅ Login successful:', user.username, user.role);
    } else {
      const error = await response.text();
      console.log('❌ Login failed:', response.status, error);
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

testLogin();