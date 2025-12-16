// Test authentication by making a request to check current user
const http = require('http');

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

console.log('Testing login and session...');

const req = http.request(loginOptions, (res) => {
  console.log(`Login status: ${res.statusCode}`);
  console.log('Login headers:', res.headers);
  
  let loginData = '';
  res.on('data', (chunk) => {
    loginData += chunk;
  });
  
  res.on('end', () => {
    console.log('Login response:', loginData);
    
    // Extract session cookie
    const setCookieHeader = res.headers['set-cookie'];
    let sessionCookie = '';
    if (setCookieHeader) {
      const cookieMatch = setCookieHeader[0].match(/connect\.sid=([^;]+)/);
      if (cookieMatch) {
        sessionCookie = `connect.sid=${cookieMatch[1]}`;
        console.log('Session cookie:', sessionCookie);
        
        // Now test authentication status
        const authCheckOptions = {
          hostname: 'localhost',
          port: 4000,
          path: '/api/auth/user',
          method: 'GET',
          headers: {
            'Cookie': sessionCookie
          }
        };
        
        const authReq = http.request(authCheckOptions, (authRes) => {
          console.log(`Auth check status: ${authRes.statusCode}`);
          let authData = '';
          authRes.on('data', (chunk) => {
            authData += chunk;
          });
          authRes.on('end', () => {
            console.log('Auth check response:', authData);
            
            // Now test role update
            if (authRes.statusCode === 200) {
              const roleUpdateData = JSON.stringify({
                role: 'backend engineer'
              });
              
              const roleUpdateOptions = {
                hostname: 'localhost',
                port: 4000,
                path: '/api/users/1/role',
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
                  console.log('Role update response:', roleData);
                  process.exit(0);
                });
              });
              
              roleReq.on('error', (err) => {
                console.error('Role update error:', err);
                process.exit(1);
              });
              
              roleReq.write(roleUpdateData);
              roleReq.end();
            } else {
              console.log('Authentication failed, cannot test role update');
              process.exit(1);
            }
          });
        });
        
        authReq.on('error', (err) => {
          console.error('Auth check error:', err);
          process.exit(1);
        });
        
        authReq.end();
      } else {
        console.log('No session cookie found');
        process.exit(1);
      }
    } else {
      console.log('No set-cookie header found');
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error('Login error:', err);
  process.exit(1);
});

req.write(postData);
req.end();