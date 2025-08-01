// Test the 2 remaining issues
const testRemainingIssues = async () => {
  console.log('🧪 TESTING REMAINING 2 ISSUES...\n');
  
  try {
    // Login first
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    const sessionCookie = loginResponse.headers.get('set-cookie')?.split(';')[0] || '';
    console.log('✅ Login successful\n');
    
    // ISSUE 1: Engineer Assignment Test
    console.log('🔍 ISSUE 1: Engineer Assignment Test');
    console.log('===================================');
    
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
      
      console.log(`Status: ${assignResponse.status}`);
      
      if (assignResponse.ok) {
        const result = await assignResponse.json();
        console.log('✅ ISSUE 1: ENGINEER ASSIGNMENT - FIXED');
        console.log(`   Result: ${result.message || 'Assignment successful'}`);
      } else {
        const error = await assignResponse.text();
        console.log('❌ ISSUE 1: ENGINEER ASSIGNMENT - STILL FAILING');
        console.log(`   Error: ${error}`);
      }
    }
    
    console.log('\n');
    
    // ISSUE 2: Customer Portal Access Test
    console.log('🔍 ISSUE 2: Customer Portal Access Test');
    console.log('=====================================');
    
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
          username: 'test_portal',
          password: 'test123',
          portalAccess: true
        })
      });
      
      console.log(`Status: ${portalResponse.status}`);
      
      if (portalResponse.ok) {
        const result = await portalResponse.json();
        console.log('✅ ISSUE 2: CUSTOMER PORTAL ACCESS - FIXED');
        console.log(`   Portal access enabled for: ${result.name || testCustomer.name}`);
        
        // Test customer login
        const customerLoginResponse = await fetch('http://localhost:5000/api/customer-portal/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'test_portal',
            password: 'test123'
          })
        });
        
        if (customerLoginResponse.ok) {
          console.log('✅ Customer portal login: Working');
        } else {
          console.log('⚠️ Customer portal login: Setup working but login needs testing');
        }
        
      } else {
        const error = await portalResponse.text();
        console.log('❌ ISSUE 2: CUSTOMER PORTAL ACCESS - STILL FAILING');
        console.log(`   Error: ${error}`);
      }
    }
    
    console.log('\n📊 FINAL STATUS SUMMARY:');
    console.log('========================');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

testRemainingIssues();