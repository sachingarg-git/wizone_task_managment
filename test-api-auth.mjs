import fetch from 'node-fetch';

const API_URL = 'http://103.122.85.61:3001/api/auth/login';

const testCredentials = [
  { username: 'admin', password: 'admin123' },
  { username: 'sachin', password: 'admin123' },
  { username: 'vikash', password: 'admin123' }
];

async function testAuth() {
  console.log('🔐 Testing API authentication...');
  console.log('📡 API URL:', API_URL);
  console.log();
  
  for (const cred of testCredentials) {
    console.log(`🔍 Testing: ${cred.username} / ${cred.password}`);
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: cred.username,
          password: cred.password
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Authentication successful!');
        console.log('📄 Response:', JSON.stringify(data, null, 2));
      } else {
        console.log('❌ Authentication failed');
        console.log('📄 Error:', JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.log('❌ Request failed:', error.message);
    }
    console.log();
  }
}

testAuth().catch(console.error);