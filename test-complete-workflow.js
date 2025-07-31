// Complete field engineer workflow test with proper session handling
const testCompleteWorkflow = async () => {
  console.log('🧪 COMPLETE FIELD ENGINEER WORKFLOW TEST');
  
  try {
    // Step 1: Admin Login
    console.log('\n1️⃣ Admin Login Test...');
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
      console.log('❌ Admin login failed:', loginResponse.status);
      return;
    }
    
    const adminUser = await loginResponse.json();
    const adminCookies = loginResponse.headers.get('set-cookie') || '';
    console.log('✅ Admin login successful:', adminUser.username, adminUser.role);
    
    // Step 2: Get Field Engineers
    console.log('\n2️⃣ Field Engineers API Test...');
    const engineersResponse = await fetch('http://localhost:5000/api/field-engineers', {
      headers: {
        'Cookie': adminCookies,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (engineersResponse.ok) {
      const engineers = await engineersResponse.json();
      console.log(`✅ Found ${engineers.length} field engineers`);
      engineers.forEach(eng => {
        console.log(`  • ${eng.firstName} ${eng.lastName} (${eng.username}) - ${eng.status}`);
      });
    } else {
      console.log('❌ Field engineers API failed:', engineersResponse.status, await engineersResponse.text());
    }
    
    // Step 3: Mobile Authentication Test
    console.log('\n3️⃣ Mobile Authentication Test...');
    const mobileLoginResponse = await fetch('http://localhost:5000/api/mobile/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 16; sdk_gphone64_x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.0 Mobile Safari/537.36 WizoneApp/1.0 (WebView)'
      },
      body: JSON.stringify({
        username: 'ashu',
        password: 'admin123'
      })
    });
    
    if (mobileLoginResponse.ok) {
      const mobileUser = await mobileLoginResponse.json();
      const mobileCookies = mobileLoginResponse.headers.get('set-cookie') || '';
      console.log('✅ Mobile login successful:', mobileUser.user.username, mobileUser.user.role);
      
      // Step 4: Mobile Field Engineer Tasks
      console.log('\n4️⃣ Mobile Field Engineer Tasks Test...');
      const tasksResponse = await fetch(`http://localhost:5000/api/mobile/field-engineers/${mobileUser.user.id}/tasks`, {
        headers: {
          'Cookie': mobileCookies,
          'User-Agent': 'Mozilla/5.0 (Linux; Android 16; sdk_gphone64_x86_64) AppleWebKit/537.36 WizoneApp/1.0 (WebView)'
        }
      });
      
      if (tasksResponse.ok) {
        const tasks = await tasksResponse.json();
        console.log(`✅ Found ${tasks.length} tasks for field engineer ${mobileUser.user.id}`);
        if (tasks.length > 0) {
          console.log(`  • First task: ${tasks[0].title} (${tasks[0].status})`);
        }
      } else {
        console.log('❌ Mobile tasks failed:', tasksResponse.status, await tasksResponse.text());
      }
    } else {
      console.log('❌ Mobile login failed:', mobileLoginResponse.status, await mobileLoginResponse.text());
    }
    
    // Step 5: Test Regular Auth User Info
    console.log('\n5️⃣ Regular Auth User Info Test...');
    const userInfoResponse = await fetch('http://localhost:5000/api/auth/user', {
      headers: {
        'Cookie': adminCookies,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json();
      console.log('✅ User info successful:', userInfo.username, userInfo.role);
    } else {
      console.log('❌ User info failed:', userInfoResponse.status, await userInfoResponse.text());
    }
    
    // Step 6: Test Dashboard Stats
    console.log('\n6️⃣ Dashboard Stats Test...');
    const statsResponse = await fetch('http://localhost:5000/api/dashboard/stats', {
      headers: {
        'Cookie': adminCookies,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log('✅ Dashboard stats successful:', stats);
    } else {
      console.log('❌ Dashboard stats failed:', statsResponse.status, await statsResponse.text());
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
  
  console.log('\n✅ Complete workflow test finished');
};

testCompleteWorkflow();