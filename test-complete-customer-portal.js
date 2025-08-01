// Complete customer portal functionality test

const testCompleteCustomerPortal = async () => {
  console.log('🔐 COMPLETE CUSTOMER PORTAL TEST...\n');
  
  try {
    // Step 1: Admin setup
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
    
    console.log(`\n📋 Setting up portal for: ${testCustomer.name}`);
    
    const portalCredentials = {
      username: 'final_test_user',
      password: 'final123',
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
    
    // Step 3: Test customer login
    console.log('\n🎯 Step 3: Testing Customer Login...');
    
    const customerLoginResponse = await fetch('http://localhost:5000/api/customer/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: portalCredentials.username,
        password: portalCredentials.password
      })
    });
    
    console.log(`🔍 Login response status: ${customerLoginResponse.status}`);
    
    if (customerLoginResponse.ok) {
      const customerData = await customerLoginResponse.json();
      console.log('🎉 CUSTOMER LOGIN SUCCESS!');
      console.log(`   ✅ Customer: ${customerData.name}`);
      console.log(`   ✅ Username: ${customerData.username}`);
      
      // Get session cookie for customer
      const customerSessionCookie = customerLoginResponse.headers.get('set-cookie')?.split(';')[0] || '';
      
      // Step 4: Test customer tasks endpoint
      console.log('\n📋 Step 4: Testing Customer Tasks...');
      
      const tasksResponse = await fetch('http://localhost:5000/api/customer-portal/tasks', {
        headers: { 'Cookie': customerSessionCookie }
      });
      
      console.log(`🔍 Tasks response status: ${tasksResponse.status}`);
      
      if (tasksResponse.ok) {
        const tasks = await tasksResponse.json();
        console.log('✅ CUSTOMER TASKS SUCCESS!');
        console.log(`   Found ${tasks.length} tasks for customer`);
        
        if (tasks.length > 0) {
          console.log(`   Latest task: ${tasks[0].ticketNumber} - ${tasks[0].title}`);
        }
      } else {
        const tasksError = await tasksResponse.text();
        console.log('❌ Customer tasks failed:', tasksError);
      }
      
      // Step 5: Test customer logout
      console.log('\n🚪 Step 5: Testing Customer Logout...');
      
      const logoutResponse = await fetch('http://localhost:5000/api/customer-portal/auth/logout', {
        method: 'POST',
        headers: { 'Cookie': customerSessionCookie }
      });
      
      if (logoutResponse.ok) {
        console.log('✅ Customer logout successful');
        
        // Test access after logout
        const testAfterLogout = await fetch('http://localhost:5000/api/customer-portal/tasks', {
          headers: { 'Cookie': customerSessionCookie }
        });
        
        if (testAfterLogout.status === 401) {
          console.log('✅ Access properly blocked after logout');
        } else {
          console.log('⚠️ Security issue: Access still allowed after logout');
        }
      } else {
        console.log('❌ Logout failed');
      }
      
    } else {
      const loginError = await customerLoginResponse.text();
      console.log('❌ CUSTOMER LOGIN FAILED:', loginError);
    }
    
    console.log('\n🏁 COMPLETE CUSTOMER PORTAL TEST FINISHED');
    console.log('====================================');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

// Run the complete test
testCompleteCustomerPortal();