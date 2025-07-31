// Test mobile login with different users and create new test user
const testMobileLogin = async () => {
  console.log('🧪 COMPREHENSIVE MOBILE LOGIN TEST');
  
  const testUsers = [
    { username: 'ashu', password: 'admin123' },
    { username: 'radha', password: 'admin123' },
    { username: 'testfield', password: 'admin123' } // New test user
  ];
  
  for (const user of testUsers) {
    console.log(`\n🔐 Testing mobile login: ${user.username}`);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 16; sdk_gphone64_x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.0 Mobile Safari/537.36 WizoneApp/1.0 (WebView)'
        },
        body: JSON.stringify(user)
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log(`✅ SUCCESS - ${user.username}:`, userData.username, userData.role);
        
        // Test field engineer tasks
        if (userData.role === 'field_engineer') {
          console.log(`  📋 Testing field engineer tasks for ${userData.id}...`);
          const tasksResponse = await fetch(`http://localhost:5000/api/field-engineers/${userData.id}/tasks`, {
            headers: {
              'User-Agent': 'WizoneApp/1.0 (WebView)'
            }
          });
          
          if (tasksResponse.ok) {
            const tasks = await tasksResponse.json();
            console.log(`  ✅ Found ${tasks.length} tasks for field engineer`);
          } else {
            console.log(`  ❌ Task fetch failed:`, tasksResponse.status);
          }
        }
        
      } else {
        const error = await response.text();
        console.log(`❌ FAILED - ${user.username}:`, response.status, error);
        
        // Try to create the user if it doesn't exist
        if (response.status === 401 && user.username === 'testfield') {
          console.log(`  📝 Creating new test user: ${user.username}`);
          
          // First login as admin to create user
          const adminLogin = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
          });
          
          if (adminLogin.ok) {
            const cookies = adminLogin.headers.get('set-cookie');
            
            const createResponse = await fetch('http://localhost:5000/api/users', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cookie': cookies
              },
              body: JSON.stringify({
                id: 'FIELD001',
                username: 'testfield',
                password: 'admin123',
                email: 'testfield@wizone.com',
                firstName: 'Test',
                lastName: 'Field',
                phone: '9876543210',
                role: 'field_engineer'
              })
            });
            
            if (createResponse.ok) {
              console.log(`  ✅ User created successfully`);
              
              // Test login again
              const retryResponse = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'User-Agent': 'WizoneApp/1.0 (WebView)'
                },
                body: JSON.stringify(user)
              });
              
              if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                console.log(`  ✅ RETRY SUCCESS:`, retryData.username, retryData.role);
              } else {
                console.log(`  ❌ RETRY FAILED:`, retryResponse.status);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(`❌ ERROR testing ${user.username}:`, error.message);
    }
  }
  
  console.log('\n✅ Mobile login test complete');
};

testMobileLogin();