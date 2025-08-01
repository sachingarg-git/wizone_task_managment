// Test customer portal login functionality

const testCustomerPortalLogin = async () => {
  console.log('🔐 TESTING CUSTOMER PORTAL LOGIN FIX...\n');
  
  try {
    // Step 1: Admin login to set up customer portal access
    console.log('🔐 Step 1: Admin Login...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    const sessionCookie = loginResponse.headers.get('set-cookie')?.split(';')[0] || '';
    console.log('✅ Admin logged in');
    
    // Step 2: Get customers and set up portal access
    const customersResponse = await fetch('http://localhost:5000/api/customers', {
      headers: { 'Cookie': sessionCookie }
    });
    
    const customers = await customersResponse.json();
    const testCustomer = customers[0];
    console.log(`\n📋 Setting up portal access for: ${testCustomer.name}`);
    
    // Step 3: Enable portal access with credentials
    const portalCredentials = {
      username: 'customer_test_user',
      password: 'test123pass',
      portalAccess: true
    };
    
    console.log(`📤 Setting credentials: ${portalCredentials.username} / ${portalCredentials.password}`);
    
    const setupResponse = await fetch(`http://localhost:5000/api/customers/${testCustomer.id}/portal-access`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify(portalCredentials)
    });
    
    if (setupResponse.ok) {
      const setupResult = await setupResponse.json();
      console.log('✅ Portal access setup successful');
      console.log(`   Customer: ${setupResult.name}`);
      console.log(`   Username: ${setupResult.username}`);
      console.log(`   Portal Access: ${setupResult.portalAccess}`);
    } else {
      console.log('❌ Portal setup failed');
      return;
    }
    
    // Step 4: Test customer portal login with the new function
    console.log('\n🎯 Step 4: TESTING CUSTOMER PORTAL LOGIN...');
    
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
      console.log('🎉 CUSTOMER PORTAL LOGIN SUCCESS!');
      console.log(`   ✅ Customer ID: ${customerData.id}`);
      console.log(`   ✅ Customer Name: ${customerData.name}`);
      console.log(`   ✅ Username: ${customerData.username}`);
      console.log(`   ✅ Session established`);
    } else {
      const error = await customerLoginResponse.text();
      console.log('❌ CUSTOMER PORTAL LOGIN FAILED');
      console.log(`   Error: ${error}`);
      
      // Try alternative login endpoint
      console.log('\n🔄 Trying alternative endpoint...');
      const altLoginResponse = await fetch('http://localhost:5000/api/customer-portal/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: portalCredentials.username,
          password: portalCredentials.password
        })
      });
      
      if (altLoginResponse.ok) {
        console.log('✅ Alternative endpoint working');
      } else {
        const altError = await altLoginResponse.text();
        console.log(`❌ Alternative endpoint also failed: ${altError}`);
      }
    }
    
    // Step 5: Test with wrong credentials
    console.log('\n🚫 Step 5: TESTING WRONG CREDENTIALS...');
    
    const wrongLoginResponse = await fetch('http://localhost:5000/api/customer/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'wrong_user',
        password: 'wrong_pass'
      })
    });
    
    if (wrongLoginResponse.ok) {
      console.log('⚠️ SECURITY ISSUE: Wrong credentials accepted');
    } else {
      console.log('✅ SECURITY: Wrong credentials properly rejected');
      console.log(`   Status: ${wrongLoginResponse.status}`);
    }
    
    console.log('\n🏁 CUSTOMER PORTAL LOGIN TEST COMPLETE');
    console.log('===================================');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

// Run the test
testCustomerPortalLogin();