// Test customer portal task update functionality

const testCustomerPortalUpdate = async () => {
  console.log('🔧 TESTING CUSTOMER PORTAL TASK UPDATE...\n');
  
  try {
    // Step 1: Customer login
    console.log('🔐 Step 1: Customer Login...');
    const loginResponse = await fetch('http://localhost:5000/api/customer/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'customer_test_user', password: 'test123pass' })
    });
    
    const sessionCookie = loginResponse.headers.get('set-cookie')?.split(';')[0] || '';
    const customerData = await loginResponse.json();
    console.log('✅ Customer logged in:', customerData.name);
    
    // Step 2: Get customer tasks
    console.log('\n📋 Step 2: Getting Customer Tasks...');
    const tasksResponse = await fetch('http://localhost:5000/api/customer-portal/tasks', {
      headers: { 'Cookie': sessionCookie }
    });
    
    const tasks = await tasksResponse.json();
    
    if (tasks.length === 0) {
      console.log('❌ No tasks found for customer');
      return;
    }
    
    const testTask = tasks[0];
    console.log(`✅ Testing with task: ${testTask.ticketNumber}`);
    console.log(`   Current status: ${testTask.status}`);
    console.log(`   Current priority: ${testTask.priority}`);
    
    // Step 3: Test POST update method
    console.log('\n🔄 Step 3: Testing POST Update Method...');
    
    const postUpdateData = {
      comment: 'Test comment from customer portal - POST method',
      status: 'pending',
      priority: 'high'
    };
    
    const postUpdateResponse = await fetch(`http://localhost:5000/api/customer-portal/tasks/${testTask.id}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify(postUpdateData)
    });
    
    console.log(`🔍 POST update response status: ${postUpdateResponse.status}`);
    
    if (postUpdateResponse.ok) {
      const result = await postUpdateResponse.json();
      console.log('✅ POST update successful:', result.message);
    } else {
      const error = await postUpdateResponse.text();
      console.log('❌ POST update failed:', error);
    }
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 4: Test PUT update method
    console.log('\n🔄 Step 4: Testing PUT Update Method...');
    
    const putUpdateData = {
      notes: 'Test notes from customer portal - PUT method',
      status: 'cancelled',
      priority: 'medium'
    };
    
    const putUpdateResponse = await fetch(`http://localhost:5000/api/customer-portal/tasks/${testTask.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify(putUpdateData)
    });
    
    console.log(`🔍 PUT update response status: ${putUpdateResponse.status}`);
    
    if (putUpdateResponse.ok) {
      const updatedTask = await putUpdateResponse.json();
      console.log('✅ PUT update successful');
      console.log(`   Updated status: ${updatedTask.status}`);
      console.log(`   Updated priority: ${updatedTask.priority}`);
      console.log(`   Customer name: ${updatedTask.customerName || 'Unknown Customer'}`);
    } else {
      const error = await putUpdateResponse.text();
      console.log('❌ PUT update failed:', error);
    }
    
    // Step 5: Verify updates were recorded
    console.log('\n📝 Step 5: Checking Task History...');
    
    const historyResponse = await fetch(`http://localhost:5000/api/customer-portal/tasks/${testTask.id}/history`, {
      headers: { 'Cookie': sessionCookie }
    });
    
    if (historyResponse.ok) {
      const history = await historyResponse.json();
      console.log(`✅ Found ${history.length} update records`);
      
      history.slice(0, 3).forEach((update, index) => {
        console.log(`   Update ${index + 1}: ${update.note || 'No note'}`);
      });
    } else {
      console.log('❌ Failed to fetch task history');
    }
    
    console.log('\n🏁 CUSTOMER PORTAL UPDATE TEST COMPLETE');
    console.log('=====================================');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

// Run the test
testCustomerPortalUpdate();