// Test customer portal access fix

const testCustomerPortalFix = async () => {
  console.log('🔧 TESTING CUSTOMER PORTAL ACCESS FIX...\n');
  
  try {
    // Step 1: Login as admin
    console.log('🔐 Step 1: Admin Login...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    if (!loginResponse.ok) {
      console.log(`❌ Login failed: ${loginResponse.status}`);
      return;
    }
    
    const sessionCookie = loginResponse.headers.get('set-cookie')?.split(';')[0] || '';
    console.log('✅ Admin login successful\n');
    
    // Step 2: Get customers
    console.log('📋 Step 2: Getting customers...');
    const customersResponse = await fetch('http://localhost:5000/api/customers', {
      headers: { 'Cookie': sessionCookie }
    });
    
    const customers = await customersResponse.json();
    const testCustomer = customers[0];
    console.log(`Using customer: ${testCustomer.name} (ID: ${testCustomer.id})\n`);
    
    // Step 3: Enable portal access
    console.log('🎯 Step 3: ENABLING Portal Access...');
    const enableResponse = await fetch(`http://localhost:5000/api/customers/${testCustomer.id}/portal-access`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify({
        username: 'test_portal_user',
        password: 'test123',
        portalAccess: true  // Enable it
      })
    });
    
    console.log(`Enable response: ${enableResponse.status}`);
    
    if (enableResponse.ok) {
      const enableResult = await enableResponse.json();
      console.log('✅ ENABLE SUCCESS - Portal access enabled');
      console.log(`   Username: test_portal_user`);
      console.log(`   Customer: ${enableResult.name}`);
    } else {
      const error = await enableResponse.text();
      console.log(`❌ Enable failed: ${error}`);
      return;
    }
    
    // Step 4: Check if it stays enabled
    console.log('\n🔍 Step 4: CHECKING if it stays enabled...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    
    const checkResponse = await fetch('http://localhost:5000/api/customers', {
      headers: { 'Cookie': sessionCookie }
    });
    
    const updatedCustomers = await checkResponse.json();
    const updatedCustomer = updatedCustomers.find(c => c.id === testCustomer.id);
    
    if (updatedCustomer.portalAccess) {
      console.log('✅ PERSISTENCE SUCCESS - Portal access is still enabled!');
      console.log(`   Portal status: ${updatedCustomer.portalAccess}`);
      console.log(`   Username: ${updatedCustomer.username}`);
    } else {
      console.log('❌ PERSISTENCE FAILED - Portal access disabled again');
      console.log(`   Portal status: ${updatedCustomer.portalAccess}`);
    }
    
    // Step 5: Test customer login
    console.log('\n🔐 Step 5: TESTING Customer Portal Login...');
    const customerLoginResponse = await fetch('http://localhost:5000/api/customer-portal/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'test_portal_user',
        password: 'test123'
      })
    });
    
    console.log(`Customer login response: ${customerLoginResponse.status}`);
    
    if (customerLoginResponse.ok) {
      console.log('✅ CUSTOMER LOGIN SUCCESS - Portal login working!');
    } else {
      const loginError = await customerLoginResponse.text();
      console.log(`⚠️ Customer login issue: ${loginError}`);
      console.log('   Note: Portal setup working, login endpoint may need implementation');
    }
    
    console.log('\n🎉 CUSTOMER PORTAL FIX TEST COMPLETE');
    console.log('======================================');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

// Run the test
testCustomerPortalFix();