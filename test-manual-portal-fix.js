// Manual test for portal access - exactly like user workflow

const testManualPortalFlow = async () => {
  console.log('🎯 MANUAL PORTAL ACCESS TEST (User Workflow)\n');
  
  try {
    // Step 1: Admin login
    console.log('🔐 Step 1: Admin Login...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    const sessionCookie = loginResponse.headers.get('set-cookie')?.split(';')[0] || '';
    console.log('✅ Admin logged in\n');
    
    // Step 2: Get customer list
    const customersResponse = await fetch('http://localhost:5000/api/customers', {
      headers: { 'Cookie': sessionCookie }
    });
    
    const customers = await customersResponse.json();
    const testCustomer = customers[0];
    console.log(`📋 Selected customer: ${testCustomer.name} (ID: ${testCustomer.id})`);
    console.log(`📊 Initial portal status: ${testCustomer.portalAccess || false}\n`);
    
    // Step 3: Enable portal access (exactly like UI workflow)
    console.log('🎯 Step 3: ENABLING portal access with username/password...');
    
    const portalUpdateData = {
      username: 'testuser123',
      password: 'testpass123',
      portalAccess: true  // User enables toggle
    };
    
    console.log('📤 Sending data:', portalUpdateData);
    
    const updateResponse = await fetch(`http://localhost:5000/api/customers/${testCustomer.id}/portal-access`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify(portalUpdateData)
    });
    
    console.log(`📡 Response status: ${updateResponse.status}`);
    
    if (updateResponse.ok) {
      const updateResult = await updateResponse.json();
      console.log('✅ UPDATE SUCCESS');
      console.log(`   Portal Access: ${updateResult.portalAccess}`);
      console.log(`   Username: ${updateResult.username}`);
      console.log(`   Customer: ${updateResult.name}`);
    } else {
      const error = await updateResponse.text();
      console.log(`❌ Update failed: ${error}`);
      return;
    }
    
    // Step 4: Verify by fetching fresh data (simulate UI refresh)
    console.log('\n🔄 Step 4: VERIFYING persistence (like UI refresh)...');
    
    const verifyResponse = await fetch('http://localhost:5000/api/customers', {
      headers: { 'Cookie': sessionCookie }
    });
    
    const updatedCustomers = await verifyResponse.json();
    const verifiedCustomer = updatedCustomers.find(c => c.id === testCustomer.id);
    
    console.log('📊 VERIFICATION RESULTS:');
    console.log(`   Portal Access: ${verifiedCustomer.portalAccess}`);
    console.log(`   Username: ${verifiedCustomer.username}`);
    console.log(`   Password Set: ${verifiedCustomer.password ? 'Yes' : 'No'}`);
    
    if (verifiedCustomer.portalAccess && verifiedCustomer.username) {
      console.log('\n🎉 SUCCESS: Portal access STAYS ENABLED with credentials!');
      console.log('✅ No auto-disable issue detected');
    } else {
      console.log('\n❌ ISSUE: Portal access not persisting correctly');
      console.log(`   Expected: portalAccess=true, username=testuser123`);
      console.log(`   Got: portalAccess=${verifiedCustomer.portalAccess}, username=${verifiedCustomer.username}`);
    }
    
    // Step 5: Test one more time with different data
    console.log('\n🔄 Step 5: SECOND TEST with different credentials...');
    
    const secondUpdate = {
      username: 'finaluser456', 
      password: 'finalpass456',
      portalAccess: true
    };
    
    const secondResponse = await fetch(`http://localhost:5000/api/customers/${testCustomer.id}/portal-access`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json', 
        'Cookie': sessionCookie
      },
      body: JSON.stringify(secondUpdate)
    });
    
    if (secondResponse.ok) {
      const secondResult = await secondResponse.json();
      console.log('✅ SECOND UPDATE SUCCESS');
      console.log(`   New Username: ${secondResult.username}`);
      console.log(`   Portal Access: ${secondResult.portalAccess}`);
    }
    
    console.log('\n🏁 MANUAL PORTAL TEST COMPLETE');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

// Run the test
testManualPortalFlow();