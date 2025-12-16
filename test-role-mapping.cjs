// Test the updated role mapping functionality
const http = require('http');

const postData = JSON.stringify({
  username: 'admin',
  password: 'admin123'
});

const loginOptions = {
  hostname: '103.122.85.61',  // Use the external IP instead of localhost
  port: 4000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Testing role update with mapping...');

const req = http.request(loginOptions, (res) => {
  console.log(`Login status: ${res.statusCode}`);
  
  const setCookieHeader = res.headers['set-cookie'];
  if (!setCookieHeader || res.statusCode !== 200) {
    console.log('Login failed');
    return;
  }
  
  const cookieMatch = setCookieHeader[0].match(/connect\.sid=([^;]+)/);
  if (!cookieMatch) {
    console.log('No session cookie found');
    return;
  }
  
  const sessionCookie = `connect.sid=${cookieMatch[1]}`;
  console.log('✅ Login successful, testing role update...');
  
  // Test role update with backend_engineer (should be mapped to engineer)
  const roleUpdateData = JSON.stringify({ role: 'backend_engineer' });
  
  const roleUpdateOptions = {
    hostname: '103.122.85.61',
    port: 4000,
    path: '/api/users/17/role',
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(roleUpdateData),
      'Cookie': sessionCookie
    }
  };
  
  const roleReq = http.request(roleUpdateOptions, (roleRes) => {
    console.log(`Role update status: ${roleRes.statusCode}`);
    
    let roleData = '';
    roleRes.on('data', (chunk) => {
      roleData += chunk;
    });
    
    roleRes.on('end', () => {
      if (roleRes.statusCode === 200) {
        console.log('✅ SUCCESS: Role update worked!');
        console.log('Response:', roleData);
      } else {
        console.log('❌ FAILED: Role update still failing');
        console.log('Response:', roleData);
      }
      process.exit(0);
    });
  });
  
  roleReq.on('error', (err) => {
    console.error('Role update error:', err.message);
    process.exit(1);
  });
  
  roleReq.write(roleUpdateData);
  roleReq.end();
});

req.on('error', (err) => {
  console.error('Login error:', err);
  process.exit(1);
});

req.write(postData);
req.end();