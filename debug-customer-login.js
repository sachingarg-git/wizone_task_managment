// Debug customer login with detailed logging

const debugCustomerLogin = async () => {
  console.log('🔍 DEBUGGING CUSTOMER LOGIN...\n');
  
  try {
    // Step 1: Set up portal access first
    console.log('🔐 Step 1: Admin login...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    const sessionCookie = loginResponse.headers.get('set-cookie')?.split(';')[0] || '';
    console.log('✅ Admin logged in');
    
    // Step 2: Get customer and check structure
    const customersResponse = await fetch('http://localhost:5000/api/customers', {
      headers: { 'Cookie': sessionCookie }
    });
    
    const customers = await customersResponse.json();
    const testCustomer = customers[0];
    console.log('\n📋 Customer structure:', {
      id: testCustomer.id,
      name: testCustomer.name,
      username: testCustomer.username,
      password: testCustomer.password,  
      portalAccess: testCustomer.portalAccess
    });
    
    // Step 3: Set up portal credentials  
    console.log('\n🔧 Step 3: Setting up portal credentials...');
    const portalCredentials = {
      username: 'debug_user',
      password: 'debug123',
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
    
    if (setupResponse.ok) {
      const setupResult = await setupResponse.json();
      console.log('✅ Portal setup result:', {
        name: setupResult.name,
        username: setupResult.username,
        portalAccess: setupResult.portalAccess
      });
    } else {
      console.log('❌ Portal setup failed');
      return;
    }
    
    // Step 4: Wait a moment for the database update
    console.log('\n⏳ Waiting for database update...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 5: Check updated customer
    const updatedCustomersResponse = await fetch('http://localhost:5000/api/customers', {
      headers: { 'Cookie': sessionCookie }
    });
    
    const updatedCustomers = await updatedCustomersResponse.json();
    const updatedCustomer = updatedCustomers.find(c => c.id === testCustomer.id);
    console.log('\n📊 Updated customer:', {
      id: updatedCustomer.id,
      name: updatedCustomer.name,
      username: updatedCustomer.username,
      password: updatedCustomer.password ? '***SET***' : 'NOT_SET',
      portalAccess: updatedCustomer.portalAccess
    });
    
    // Step 6: Test direct database query  
    console.log('\n🔍 Step 6: Testing direct database query...');
    const testQueryResponse = await fetch('http://localhost:5000/api/test/customer-query', {
      method: 'POST',
      headers: {  
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify({
        username: portalCredentials.username
      })
    });
    
    if (testQueryResponse.ok) {
      const queryResult = await testQueryResponse.json();
      console.log('✅ Direct query result:', queryResult);
    } else {
      console.log('⚠️ Direct query endpoint not available');
    }
    
    // Step 7: Test customer login with detailed logging
    console.log('\n🎯 Step 7: Testing customer login...');
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
      console.log('🎉 SUCCESS! Customer login worked:', customerData);
    } else {
      const errorText = await customerLoginResponse.text();
      console.log('❌ FAILED! Error:', errorText);
      
      // Try to get more details from headers
      console.log('📋 Response headers:');
      for (const [key, value] of customerLoginResponse.headers.entries()) {
        console.log(`  ${key}: ${value}`);
      }
    }
    
    console.log('\n🏁 DEBUG COMPLETE');
    console.log('==================');
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  }
};

// Run the debug
debugCustomerLogin();