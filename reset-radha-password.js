// Quick script to reset radha's password using web interface
const testReset = async () => {
  console.log('🔧 Testing password reset for radha...');
  
  try {
    // Reset password via API
    const response = await fetch('http://localhost:5000/api/users/radha/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'dummy=test' // Basic cookie
      },
      body: JSON.stringify({
        newPassword: 'admin123'
      })
    });
    
    if (response.ok) {
      const result = await response.text();
      console.log('✅ Password reset response:', result);
      
      // Test login immediately
      console.log('🧪 Testing login after reset...');
      const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'radha',
          password: 'admin123'
        })
      });
      
      const loginResult = await loginResponse.text();
      console.log('🔐 Login test result:', loginResponse.status, loginResult);
      
    } else {
      console.log('❌ Password reset failed:', response.status, await response.text());
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testReset();