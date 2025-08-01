// Test mobile task status update functionality
const testMobileTaskUpdate = async () => {
  console.log('🔧 Testing mobile task status update...');
  
  try {
    // Step 1: Login as field engineer first
    console.log('\n🔐 Step 1: Mobile field engineer login...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WizoneFieldEngineerApp/1.0 (Mobile)',
        'X-Requested-With': 'mobile'
      },
      body: JSON.stringify({
        username: 'admin',  // Try admin first, then test field engineer
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      console.log(`❌ Login failed: ${loginResponse.status}`);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log(`✅ Login successful: ${loginData.username} (${loginData.role})`);
    
    // Get session cookie
    const sessionCookie = loginResponse.headers.get('set-cookie')?.split(';')[0] || '';
    console.log(`🍪 Session cookie: ${sessionCookie ? 'Received' : 'Missing'}`);
    
    // Step 2: Get all tasks (since admin can see all tasks)
    console.log('\n📋 Step 2: Getting all available tasks...');
    const tasksResponse = await fetch(`http://localhost:5000/api/tasks`, {
      headers: {
        'User-Agent': 'WizoneFieldEngineerApp/1.0 (Mobile)',
        'X-Requested-With': 'mobile',
        'Cookie': sessionCookie
      }
    });
    
    if (!tasksResponse.ok) {
      console.log(`❌ Tasks fetch failed: ${tasksResponse.status}`);
      return;
    }
    
    const tasks = await tasksResponse.json();
    console.log(`✅ Found ${tasks.length} total tasks in system`);
    
    if (tasks.length === 0) {
      console.log('⚠️ No tasks found in system');
      return;
    }
    
    // Show task details
    const testTask = tasks[0];
    console.log(`📝 Test task: ${testTask.ticketNumber} - Current status: ${testTask.status}`);
    
    // Step 3: Test mobile task status update
    console.log('\n🔄 Step 3: Testing mobile task status update...');
    
    // Try different status values
    const newStatus = testTask.status === 'pending' ? 'in_progress' : 'pending';
    console.log(`📱 Updating task ${testTask.id} status: ${testTask.status} → ${newStatus}`);
    
    // Test main task status update endpoint
    const updateResponse1 = await fetch(`http://localhost:5000/api/tasks/${testTask.id}/field-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WizoneFieldEngineerApp/1.0 (Mobile)',
        'X-Requested-With': 'mobile',
        'Cookie': sessionCookie
      },
      body: JSON.stringify({
        status: newStatus,
        note: 'Status updated from mobile APK test'
      })
    });
    
    console.log(`📡 Main endpoint response: ${updateResponse1.status}`);
    
    if (updateResponse1.ok) {
      const updateData1 = await updateResponse1.json();
      console.log(`✅ Main endpoint success: ${updateData1.ticketNumber} → ${updateData1.status}`);
    } else {
      const error1 = await updateResponse1.text();
      console.log(`❌ Main endpoint failed: ${error1}`);
    }
    
    // Test mobile-specific endpoint
    const updateResponse2 = await fetch(`http://localhost:5000/api/mobile/tasks/${testTask.id}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WizoneFieldEngineerApp/1.0 (Mobile)',
        'X-Requested-With': 'mobile',
        'Cookie': sessionCookie
      },
      body: JSON.stringify({
        status: 'completed',
        note: 'Task completed via mobile APK'
      })
    });
    
    console.log(`📡 Mobile endpoint response: ${updateResponse2.status}`);
    
    if (updateResponse2.ok) {
      const updateData2 = await updateResponse2.json();
      console.log(`✅ Mobile endpoint success: ${updateData2.ticketNumber} → ${updateData2.status}`);
    } else {
      const error2 = await updateResponse2.text();
      console.log(`❌ Mobile endpoint failed: ${error2}`);
    }
    
    // Step 4: Verify update in task list
    console.log('\n🔍 Step 4: Verifying task status in database...');
    const verifyResponse = await fetch(`http://localhost:5000/api/tasks/${testTask.id}`, {
      headers: {
        'User-Agent': 'WizoneFieldEngineerApp/1.0 (Mobile)',
        'X-Requested-With': 'mobile',
        'Cookie': sessionCookie
      }
    });
    
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log(`✅ Final task status: ${verifyData.ticketNumber} - ${verifyData.status}`);
      
      if (verifyData.status !== testTask.status) {
        console.log(`🎉 SUCCESS: Task status successfully updated from mobile!`);
        console.log(`   Original: ${testTask.status}`);
        console.log(`   Updated:  ${verifyData.status}`);
      } else {
        console.log(`⚠️ Task status unchanged - update may not have worked`);
      }
    } else {
      console.log(`❌ Could not verify task status: ${verifyResponse.status}`);
    }
    
    console.log('\n📊 Test Summary:');
    console.log('- Mobile login: ✅ Working');
    console.log('- Task fetch: ✅ Working');
    console.log('- Main update endpoint: ' + (updateResponse1.ok ? '✅ Working' : '❌ Failed'));
    console.log('- Mobile update endpoint: ' + (updateResponse2.ok ? '✅ Working' : '❌ Failed'));
    
  } catch (error) {
    console.error('❌ Mobile task update test error:', error.message);
  }
};

// Run the test
testMobileTaskUpdate();