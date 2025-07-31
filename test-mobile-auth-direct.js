// Direct mobile authentication and field engineer test
const testMobileAuthDirect = async () => {
  console.log('📱 DIRECT MOBILE AUTHENTICATION TEST');
  
  try {
    // Test mobile login with different users
    const testUsers = ['ashu', 'ravi', 'vivek', 'sachin'];
    
    for (const username of testUsers) {
      console.log(`\n🔐 Testing mobile login: ${username}`);
      
      const response = await fetch('http://localhost:5000/api/mobile/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 16; sdk_gphone64_x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.0 Mobile Safari/537.36 WizoneApp/1.0 (WebView)',
          'X-Requested-With': 'mobile'
        },
        body: JSON.stringify({
          username: username,
          password: 'admin123'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ SUCCESS: ${username} → ${result.user.role} (ID: ${result.user.id})`);
        
        // Test field engineer tasks for this user
        if (result.user.role === 'field_engineer') {
          const tasksResponse = await fetch(`http://localhost:5000/api/mobile/field-engineers/${result.user.id}/tasks`, {
            headers: {
              'Cookie': response.headers.get('set-cookie') || '',
              'User-Agent': 'Mozilla/5.0 (Linux; Android 16; sdk_gphone64_x86_64) AppleWebKit/537.36 WizoneApp/1.0 (WebView)',
              'X-Requested-With': 'mobile'
            }
          });
          
          if (tasksResponse.ok) {
            const tasks = await tasksResponse.json();
            console.log(`  📋 Found ${tasks.length} tasks assigned to ${username}`);
          } else {
            console.log(`  ❌ Tasks fetch failed: ${tasksResponse.status}`);
          }
        }
      } else {
        const error = await response.text();
        console.log(`❌ FAILED: ${username} → ${response.status} ${error}`);
      }
    }
    
    // Test mobile user info endpoint
    console.log('\n📱 Testing mobile user info endpoint...');
    const userInfoResponse = await fetch('http://localhost:5000/api/mobile/auth/user', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 16; sdk_gphone64_x86_64) AppleWebKit/537.36 WizoneApp/1.0 (WebView)',
        'X-Requested-With': 'mobile'
      }
    });
    
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json();
      console.log('✅ Mobile user info successful:', userInfo.username);
    } else {
      console.log('❌ Mobile user info failed:', userInfoResponse.status, await userInfoResponse.text());
    }
    
  } catch (error) {
    console.error('❌ Mobile auth test error:', error.message);
  }
  
  console.log('\n✅ Mobile authentication test complete');
};

testMobileAuthDirect();