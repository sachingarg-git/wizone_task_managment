const https = require('https');
const http = require('http');

console.log('🔍 Testing server connectivity...');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/user',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`✅ Server responding with status: ${res.statusCode}`);
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📄 Response:', data);
    testLogin();
  });
});

req.on('error', (error) => {
  console.log('❌ Connection failed:', error.message);
});

req.end();

function testLogin() {
  console.log('\n🔐 Testing login endpoint...');
  
  const loginData = JSON.stringify({
    username: 'admin',
    password: 'admin123'
  });
  
  const loginOptions = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData),
      'User-Agent': 'WizoneFieldApp/1.0 (Mobile Test)'
    }
  };
  
  const loginReq = http.request(loginOptions, (res) => {
    console.log(`✅ Login response status: ${res.statusCode}`);
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📄 Login response:', data);
    });
  });
  
  loginReq.on('error', (error) => {
    console.log('❌ Login request failed:', error.message);
  });
  
  loginReq.write(loginData);
  loginReq.end();
}