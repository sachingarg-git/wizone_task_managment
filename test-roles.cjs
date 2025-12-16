// Simple HTTP test to find working role values
const http = require('http');

const roles = [
  'admin',
  'manager', 
  'backend_engineer',
  'field_engineer',
  'backend engineer',
  'field engineer',
  'engineer'
];

const postData = JSON.stringify({
  username: 'admin',
  password: 'admin123'
});

const loginOptions = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Testing role values...');

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
  console.log('Session cookie acquired');
  
  // Test each role value
  let currentTest = 0;
  
  function testNextRole() {
    if (currentTest >= roles.length) {
      console.log('All role tests completed');
      process.exit(0);
      return;
    }
    
    const role = roles[currentTest];
    console.log(`\nTesting role: "${role}"`);
    
    const roleUpdateData = JSON.stringify({ role });
    
    const roleUpdateOptions = {
      hostname: 'localhost',
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
      console.log(`  Status: ${roleRes.statusCode}`);
      
      let roleData = '';
      roleRes.on('data', (chunk) => {
        roleData += chunk;
      });
      
      roleRes.on('end', () => {
        if (roleRes.statusCode === 200) {
          console.log(`  ✅ SUCCESS: Role "${role}" accepted`);
        } else {
          console.log(`  ❌ FAILED: Role "${role}" rejected`);
          console.log(`  Response: ${roleData.substring(0, 100)}`);
        }
        
        currentTest++;
        setTimeout(testNextRole, 500); // Small delay between tests
      });
    });
    
    roleReq.on('error', (err) => {
      console.error(`  Error testing role "${role}":`, err.message);
      currentTest++;
      setTimeout(testNextRole, 500);
    });
    
    roleReq.write(roleUpdateData);
    roleReq.end();
  }
  
  // Start testing roles
  setTimeout(testNextRole, 1000);
});

req.on('error', (err) => {
  console.error('Login error:', err);
  process.exit(1);
});

req.write(postData);
req.end();