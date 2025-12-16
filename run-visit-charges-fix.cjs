const http = require('http');

// Admin login credentials
const admin = {
  username: 'sachin',
  password: 'admin123'
};

async function fixVisitCharges() {
  console.log('🔐 Step 1: Logging in as admin...');
  
  // Login to get session cookie
  const loginData = JSON.stringify(admin);
  const loginOptions = {
    hostname: '103.122.85.61',
    port: 3007,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };
  
  return new Promise((resolve, reject) => {
    const loginReq = http.request(loginOptions, (loginRes) => {
      let loginBody = '';
      const cookies = loginRes.headers['set-cookie'] || [];
      
      loginRes.on('data', chunk => { loginBody += chunk; });
      loginRes.on('end', () => {
        if (loginRes.statusCode === 200) {
          console.log('✅ Logged in successfully');
          
          // Extract session cookie
          const sessionCookie = cookies.find(c => c.startsWith('connect.sid='));
          
          console.log('🔧 Step 2: Running database fix...');
          
          // Call the fix endpoint
          const fixOptions = {
            hostname: '103.122.85.61',
            port: 3007,
            path: '/api/admin/fix-visit-charges',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': sessionCookie
            }
          };
          
          const fixReq = http.request(fixOptions, (fixRes) => {
            let fixBody = '';
            fixRes.on('data', chunk => { fixBody += chunk; });
            fixRes.on('end', () => {
              const result = JSON.parse(fixBody);
              
              if (fixRes.statusCode === 200 && result.success) {
                console.log('');
                console.log('✅ SUCCESS! Visit charges field has been fixed!');
                console.log('');
                console.log('📊 Details:');
                console.log(`   Old: ${result.details.oldConstraint}`);
                console.log(`   New: ${result.details.newConstraint}`);
                console.log('');
                console.log('✅ You can now create tasks with visit charges like 2022, 5000, etc.');
                console.log('');
                resolve(result);
              } else {
                console.error('❌ Failed:', result.message || fixBody);
                reject(new Error(result.message || fixBody));
              }
            });
          });
          
          fixReq.on('error', (error) => {
            console.error('❌ Error calling fix endpoint:', error.message);
            reject(error);
          });
          
          fixReq.end();
        } else {
          console.error('❌ Login failed:', loginBody);
          reject(new Error('Login failed'));
        }
      });
    });
    
    loginReq.on('error', (error) => {
      console.error('❌ Error logging in:', error.message);
      reject(error);
    });
    
    loginReq.write(loginData);
    loginReq.end();
  });
}

// Run the fix
fixVisitCharges()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('');
    console.error('❌ Failed to fix visit charges:', error.message);
    process.exit(1);
  });
