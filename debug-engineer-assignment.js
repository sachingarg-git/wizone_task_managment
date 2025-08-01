// Debug engineer assignment issue
const debugEngineerAssignment = async () => {
  console.log('🔍 DEBUGGING ENGINEER ASSIGNMENT...\n');
  
  try {
    // Login first
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    const sessionCookie = loginResponse.headers.get('set-cookie')?.split(';')[0] || '';
    console.log('✅ Login successful');
    console.log('🍪 Session cookie:', sessionCookie.substring(0, 50) + '...');
    
    // Get tasks and engineers
    const tasksResponse = await fetch('http://localhost:5000/api/tasks', {
      headers: { 'Cookie': sessionCookie }
    });
    const tasks = await tasksResponse.json();
    
    const engineersResponse = await fetch('http://localhost:5000/api/field-engineers', {
      headers: { 'Cookie': sessionCookie }
    });
    const engineers = await engineersResponse.json();
    
    console.log(`\n📋 Found ${tasks.length} tasks and ${engineers.length} engineers`);
    
    if (tasks.length > 0 && engineers.length > 0) {
      const testTask = tasks[0];
      const testEngineer = engineers[0];
      
      console.log(`\n🎯 Testing assignment:`);
      console.log(`Task: ${testTask.ticketNumber} (ID: ${testTask.id})`);
      console.log(`Engineer: ${testEngineer.username} (ID: ${testEngineer.id})`);
      console.log(`Task Status: ${testTask.status}`);
      console.log(`Task Customer: ${testTask.customerId}`);
      
      // Try assignment with detailed headers
      const assignResponse = await fetch(`http://localhost:5000/api/tasks/${testTask.id}/assign-field-engineers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionCookie,
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          fieldEngineerIds: [testEngineer.id]
        })
      });
      
      console.log(`\n📊 Assignment Response:`);
      console.log(`Status: ${assignResponse.status}`);
      console.log(`Status Text: ${assignResponse.statusText}`);
      
      const responseHeaders = {};
      assignResponse.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      console.log(`Headers:`, responseHeaders);
      
      const responseText = await assignResponse.text();
      console.log(`Body: ${responseText}`);
      
      if (assignResponse.ok) {
        console.log('\n✅ ENGINEER ASSIGNMENT: SUCCESS!');
      } else {
        console.log('\n❌ ENGINEER ASSIGNMENT: FAILED');
        console.log('Response details:', responseText);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  }
};

debugEngineerAssignment();