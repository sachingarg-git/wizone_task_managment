const https = require('https');
const http = require('http');

async function testFieldEngineerLogin() {
  console.log('🧪 Testing field engineer authentication after case-insensitive fix...\n');
  
  const testCredentials = [
    // Test cases that should now work with case-insensitive fix
    { username: 'rohit', password: 'rohit123', expected: 'SUCCESS' },
    { username: 'ROHIT', password: 'rohit123', expected: 'SUCCESS' },
    { username: 'Rohit', password: 'rohit123', expected: 'SUCCESS' },
    { username: 'ravi', password: 'ravi123', expected: 'SUCCESS' },
    { username: 'RAVI', password: 'ravi123', expected: 'SUCCESS' },
    { username: 'Ravi', password: 'ravi123', expected: 'SUCCESS' },
    { username: 'huzaifa', password: 'huzaifa123', expected: 'SUCCESS' },
    { username: 'HUZAIFA', password: 'huzaifa123', expected: 'SUCCESS' },
    { username: 'sachin', password: 'sachin123', expected: 'SUCCESS' },
    { username: 'SACHIN', password: 'sachin123', expected: 'SUCCESS' },
    // Invalid credentials
    { username: 'invalid', password: 'invalid', expected: 'FAIL' }
  ];
  
  for (const cred of testCredentials) {
    try {
      console.log(`🔐 Testing: ${cred.username} / ${cred.password}`);
      
      const result = await makeLoginRequest(cred.username, cred.password);
      
      if (result.success && cred.expected === 'SUCCESS') {
        console.log(`✅ SUCCESS: ${cred.username} logged in successfully - ${result.user?.firstName} ${result.user?.lastName} (${result.user?.role})`);
      } else if (!result.success && cred.expected === 'FAIL') {
        console.log(`✅ EXPECTED FAIL: ${cred.username} correctly rejected`);
      } else if (!result.success && cred.expected === 'SUCCESS') {
        console.log(`❌ UNEXPECTED FAIL: ${cred.username} should have succeeded - ${result.error}`);
      } else {
        console.log(`⚠️ UNEXPECTED SUCCESS: ${cred.username} should have failed`);
      }
      
    } catch (error) {
      console.log(`❌ ERROR testing ${cred.username}: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('🎉 Field engineer authentication test completed!');
}

function makeLoginRequest(username, password) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      username: username,
      password: password
    });
    
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'WizoneFieldApp/1.0'
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200) {
            resolve({ success: true, user: response });
          } else {
            resolve({ success: false, error: response.error || response.message || 'Login failed' });
          }
        } catch (error) {
          resolve({ success: false, error: 'Invalid response format' });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });
    
    req.write(postData);
    req.end();
  });
}

testFieldEngineerLogin();