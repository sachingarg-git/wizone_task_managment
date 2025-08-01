// Test specific failing issues
const testSpecificIssues = async () => {
  console.log('🔍 TESTING SPECIFIC FAILING ISSUES...\n');
  
  try {
    // Login first
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed');
      return;
    }
    
    const sessionCookie = loginResponse.headers.get('set-cookie')?.split(';')[0] || '';
    console.log('✅ Login successful\n');
    
    // Test 1: Engineer Assignment Detailed Debug
    console.log('🔍 TEST 1: Engineer Assignment Debug...');
    const tasksResponse = await fetch('http://localhost:5000/api/tasks', {
      headers: { 'Cookie': sessionCookie }
    });
    const tasks = await tasksResponse.json();
    
    const engineersResponse = await fetch('http://localhost:5000/api/field-engineers', {
      headers: { 'Cookie': sessionCookie }
    });
    const engineers = await engineersResponse.json();
    
    if (tasks.length > 0 && engineers.length > 0) {
      const testTask = tasks[0];
      const testEngineer = engineers[0];
      
      console.log(`Task: ${testTask.ticketNumber} (ID: ${testTask.id})`);
      console.log(`Engineer: ${testEngineer.username} (ID: ${testEngineer.id})`);
      
      const assignResponse = await fetch(`http://localhost:5000/api/tasks/${testTask.id}/assign-field-engineers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionCookie
        },
        body: JSON.stringify({
          fieldEngineerIds: [testEngineer.id]
        })
      });
      
      console.log(`Assignment Response Status: ${assignResponse.status}`);
      const assignText = await assignResponse.text();
      console.log(`Assignment Response: ${assignText}`);
      
      if (assignResponse.ok) {
        console.log('✅ Engineer assignment: SUCCESS');
      } else {
        console.log('❌ Engineer assignment: FAILED');
        console.log('Response body:', assignText);
      }
    }
    
    // Test 2: Customer Portal Access Detailed Debug
    console.log('\n🔍 TEST 2: Customer Portal Access Debug...');
    const customersResponse = await fetch('http://localhost:5000/api/customers', {
      headers: { 'Cookie': sessionCookie }
    });
    const customers = await customersResponse.json();
    
    if (customers.length > 0) {
      const testCustomer = customers[0];
      console.log(`Customer: ${testCustomer.name} (ID: ${testCustomer.id})`);
      
      const portalResponse = await fetch(`http://localhost:5000/api/customers/${testCustomer.id}/portal-access`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionCookie
        },
        body: JSON.stringify({
          username: 'test_portal_user',
          password: 'portal123',
          portalAccess: true
        })
      });
      
      console.log(`Portal Access Response Status: ${portalResponse.status}`);
      const portalText = await portalResponse.text();
      console.log(`Portal Access Response: ${portalText}`);
      
      if (portalResponse.ok) {
        console.log('✅ Customer portal access: SUCCESS');
        
        // Test customer login
        const customerLoginResponse = await fetch('http://localhost:5000/api/customer-portal/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'test_portal_user',
            password: 'portal123'
          })
        });
        
        console.log(`Customer Login Status: ${customerLoginResponse.status}`);
        const loginText = await customerLoginResponse.text();
        console.log(`Customer Login Response: ${loginText.substring(0, 100)}...`);
        
      } else {
        console.log('❌ Customer portal access: FAILED');
        console.log('Response body:', portalText);
      }
    }
    
    console.log('\n📊 DETAILED DEBUG COMPLETE');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

// Run specific tests
testSpecificIssues();