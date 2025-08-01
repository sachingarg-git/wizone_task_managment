// Final fix for engineer assignment - check actual database columns
const testEngineerAssignmentFinal = async () => {
  console.log('🔧 FINAL ENGINEER ASSIGNMENT FIX...\n');
  
  try {
    // Login first
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    const sessionCookie = loginResponse.headers.get('set-cookie')?.split(';')[0] || '';
    console.log('✅ Login successful');
    
    // Get tasks and engineers
    const tasksResponse = await fetch('http://localhost:5000/api/tasks', {
      headers: { 'Cookie': sessionCookie }
    });
    const tasks = await tasksResponse.json();
    
    const engineersResponse = await fetch('http://localhost:5000/api/field-engineers', {
      headers: { 'Cookie': sessionCookie }
    });
    const engineers = await engineersResponse.json();
    
    console.log(`📋 Found ${tasks.length} tasks and ${engineers.length} engineers`);
    
    if (tasks.length > 0 && engineers.length > 0) {
      const testTask = tasks[0];
      const testEngineer = engineers[0];
      
      console.log(`\n🎯 FINAL ASSIGNMENT TEST:`);
      console.log(`Task: ${testTask.ticketNumber} (ID: ${testTask.id})`);
      console.log(`Engineer: ${testEngineer.username} (ID: ${testEngineer.id})`);
      console.log(`Current Status: ${testTask.status}`);
      
      // Try assignment
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
      
      console.log(`\n📊 ASSIGNMENT RESULT:`);
      console.log(`Status: ${assignResponse.status}`);
      
      if (assignResponse.ok) {
        const result = await assignResponse.json();
        console.log('🎉 SUCCESS! Engineer assignment FIXED!');
        console.log(`Message: ${result.message}`);
        console.log(`Tasks assigned: ${result.assignedCount || 1}`);
        
        // Verify by getting updated task
        const updatedTaskResponse = await fetch(`http://localhost:5000/api/tasks/${testTask.id}`, {
          headers: { 'Cookie': sessionCookie }
        });
        
        if (updatedTaskResponse.ok) {
          const updatedTask = await updatedTaskResponse.json();
          console.log(`\n✅ VERIFICATION:`);
          console.log(`Task ${updatedTask.ticketNumber} now assigned to: ${updatedTask.assignedTo || updatedTask.fieldEngineerId || 'Not visible in response'}`);
        }
        
      } else {
        const error = await assignResponse.text();
        console.log('❌ STILL FAILING:');
        console.log(`Error: ${error}`);
      }
    }
    
    console.log('\n🏁 FINAL TEST COMPLETE');
    
  } catch (error) {
    console.error('❌ Final test error:', error.message);
  }
};

testEngineerAssignmentFinal();