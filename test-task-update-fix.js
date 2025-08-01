// Test task update functionality with status validation

const testTaskUpdate = async () => {
  console.log('🔧 TESTING TASK UPDATE WITH STATUS VALIDATION...\n');
  
  try {
    // Step 1: Admin login
    console.log('🔐 Step 1: Admin Login...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    const sessionCookie = loginResponse.headers.get('set-cookie')?.split(';')[0] || '';
    console.log('✅ Admin logged in');
    
    // Step 2: Get latest task to update
    console.log('\n📋 Step 2: Getting Latest Task...');
    const tasksResponse = await fetch('http://localhost:5000/api/tasks', {
      headers: { 'Cookie': sessionCookie }
    });
    
    const tasks = await tasksResponse.json();
    const testTask = tasks[0]; // Get the latest task
    
    if (!testTask) {
      console.log('❌ No tasks found to test');
      return;
    }
    
    console.log(`✅ Testing with task: ${testTask.ticketNumber}`);
    console.log(`   Current status: ${testTask.status}`);
    
    // Step 3: Test different status updates
    const statusesToTest = [
      'pending',
      'in_progress', 
      'assigned',
      'completed'
    ];
    
    for (const status of statusesToTest) {
      console.log(`\n🔄 Step 3.${statusesToTest.indexOf(status) + 1}: Testing status "${status}"...`);
      
      const updateData = {
        status: status,
        notes: `Status updated to ${status} - Test at ${new Date().toLocaleTimeString()}`
      };
      
      const updateResponse = await fetch(`http://localhost:5000/api/tasks/${testTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionCookie
        },
        body: JSON.stringify(updateData)
      });
      
      console.log(`🔍 Update response status: ${updateResponse.status}`);
      
      if (updateResponse.ok) {
        const updatedTask = await updateResponse.json();
        console.log(`✅ SUCCESS: Status updated to "${updatedTask.status}"`);
      } else {
        const error = await updateResponse.text();
        console.log(`❌ FAILED: ${error}`);
      }
      
      // Wait a moment between updates
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Step 4: Test invalid status (should fallback to pending)
    console.log('\n🧪 Step 4: Testing Invalid Status...');
    
    const invalidUpdateData = {
      status: 'invalid_status_test',
      notes: 'Testing invalid status handling'
    };
    
    const invalidUpdateResponse = await fetch(`http://localhost:5000/api/tasks/${testTask.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify(invalidUpdateData)
    });
    
    console.log(`🔍 Invalid status response: ${invalidUpdateResponse.status}`);
    
    if (invalidUpdateResponse.ok) {
      const result = await invalidUpdateResponse.json();
      console.log(`✅ Invalid status handled properly: ${result.status}`);
    } else {
      const error = await invalidUpdateResponse.text();
      console.log(`❌ Error handling invalid status: ${error}`);
    }
    
    console.log('\n🏁 TASK UPDATE TEST COMPLETE');
    console.log('============================');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

// Run the test
testTaskUpdate();