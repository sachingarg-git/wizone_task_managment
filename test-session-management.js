// Test session management with cookies
const testSessionManagement = async () => {
  console.log('🍪 Testing session management...');
  
  try {
    // Step 1: Login and get cookies
    console.log('\n1️⃣ Login and capture session...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed');
      return;
    }
    
    const user = await loginResponse.json();
    const cookies = loginResponse.headers.get('set-cookie');
    console.log(`✅ Login successful: ${user.username}`);
    console.log(`🍪 Cookies received: ${cookies ? 'YES' : 'NO'}`);
    
    // Step 2: Test protected endpoint with cookies
    console.log('\n2️⃣ Testing protected endpoint with cookies...');
    const protectedResponse = await fetch('http://localhost:5000/api/auth/user', {
      headers: {
        'Cookie': cookies || '',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (protectedResponse.ok) {
      const userData = await protectedResponse.json();
      console.log(`✅ Protected endpoint success: ${userData.username}`);
    } else {
      console.log(`❌ Protected endpoint failed: ${protectedResponse.status}`);
    }
    
    // Step 3: Test field engineers API with cookies
    console.log('\n3️⃣ Testing field engineers API...');
    const engineersResponse = await fetch('http://localhost:5000/api/field-engineers', {
      headers: {
        'Cookie': cookies || '',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (engineersResponse.ok) {
      const engineers = await engineersResponse.json();
      console.log(`✅ Field engineers API success: Found ${engineers.length} engineers`);
    } else {
      console.log(`❌ Field engineers API failed: ${engineersResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Session test error:', error.message);
  }
  
  console.log('\n✅ Session management test complete');
};

testSessionManagement();