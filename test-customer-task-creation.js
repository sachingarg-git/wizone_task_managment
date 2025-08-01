// Test customer portal task creation with proper customer name

const testCustomerTaskCreation = async () => {
  console.log('🎯 TESTING CUSTOMER TASK CREATION WITH CUSTOMER NAME...\n');
  
  try {
    // Step 1: Admin login for setup
    console.log('🔐 Step 1: Admin Login...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    const sessionCookie = loginResponse.headers.get('set-cookie')?.split(';')[0] || '';
    console.log('✅ Admin logged in');
    
    // Step 2: Set up customer portal access
    const customersResponse = await fetch('http://localhost:5000/api/customers', {
      headers: { 'Cookie': sessionCookie }
    });
    
    const customers = await customersResponse.json();
    const testCustomer = customers[0];
    
    console.log(`\n📋 Setting up portal for customer: ${testCustomer.name}`);
    
    const portalCredentials = {
      username: 'task_test_user',
      password: 'task123',
      portalAccess: true
    };
    
    const setupResponse = await fetch(`http://localhost:5000/api/customers/${testCustomer.id}/portal-access`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify(portalCredentials)
    });
    
    if (!setupResponse.ok) {
      console.log('❌ Portal setup failed');
      return;
    }
    
    console.log('✅ Portal credentials configured');
    
    // Step 3: Customer login
    console.log('\n🎯 Step 3: Customer Login...');
    
    const customerLoginResponse = await fetch('http://localhost:5000/api/customer/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: portalCredentials.username,
        password: portalCredentials.password
      })
    });
    
    if (!customerLoginResponse.ok) {
      console.log('❌ Customer login failed');
      return;
    }
    
    const customerData = await customerLoginResponse.json();
    const customerSessionCookie = customerLoginResponse.headers.get('set-cookie')?.split(';')[0] || '';
    console.log(`✅ Customer logged in: ${customerData.name}`);
    
    // Step 4: Create task from customer portal
    console.log('\n📝 Step 4: Creating Task from Customer Portal...');
    
    const taskData = {
      title: 'Network Issue - Customer Portal Test',
      description: 'Internet connection is slow and intermittent. Need technical assistance.',
      priority: 'high',
      issueType: 'technical'
    };
    
    console.log(`📤 Creating task with data:`, taskData);
    
    const createTaskResponse = await fetch('http://localhost:5000/api/customer-portal/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': customerSessionCookie
      },
      body: JSON.stringify(taskData)
    });
    
    console.log(`🔍 Task creation response status: ${createTaskResponse.status}`);
    
    if (createTaskResponse.ok) {
      const createdTask = await createTaskResponse.json();
      console.log('🎉 TASK CREATED SUCCESSFULLY!');
      console.log(`   ✅ Task ID: ${createdTask.id}`);
      console.log(`   ✅ Ticket Number: ${createdTask.ticketNumber}`);
      console.log(`   ✅ Title: ${createdTask.title}`);
      console.log(`   ✅ Customer ID: ${createdTask.customerId}`);
      console.log(`   ✅ Customer Name: ${createdTask.customerName || 'NOT SET'}`);
      console.log(`   ✅ Priority: ${createdTask.priority}`);
      console.log(`   ✅ Status: ${createdTask.status}`);
      
      // Step 5: Verify task in admin panel
      console.log('\n🔍 Step 5: Verifying Task in Admin Panel...');
      
      const adminTasksResponse = await fetch('http://localhost:5000/api/tasks', {
        headers: { 'Cookie': sessionCookie }
      });
      
      if (adminTasksResponse.ok) {
        const allTasks = await adminTasksResponse.json();
        const newTask = allTasks.find(t => t.id === createdTask.id);
        
        if (newTask) {
          console.log('✅ TASK VERIFICATION SUCCESS!');
          console.log(`   Task found in admin panel:`);
          console.log(`   📋 ID: ${newTask.id}`);
          console.log(`   📋 Ticket: ${newTask.ticketNumber}`);
          console.log(`   📋 Customer Name: ${newTask.customerName || 'STILL SHOWING UNKNOWN'}`);
          console.log(`   📋 Customer ID: ${newTask.customerId}`);
          
          if (newTask.customerName && newTask.customerName !== 'Unknown Customer') {
            console.log('🎉 SUCCESS: Customer name is properly set!');
          } else {
            console.log('❌ ISSUE: Customer name still showing as Unknown/null');
          }
        } else {
          console.log('❌ Task not found in admin panel');
        }
      } else {
        console.log('❌ Failed to fetch admin tasks');
      }
      
    } else {
      const error = await createTaskResponse.text();
      console.log('❌ TASK CREATION FAILED:', error);
    }
    
    console.log('\n🏁 CUSTOMER TASK CREATION TEST COMPLETE');
    console.log('=======================================');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

// Run the test
testCustomerTaskCreation();