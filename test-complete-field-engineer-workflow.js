// Test complete field engineer workflow - task creation to assignment
const testCompleteWorkflow = async () => {
  console.log('🚀 Testing complete field engineer workflow...');
  
  try {
    // Step 1: Admin Login
    console.log('\n🔐 Admin authentication...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    const adminUser = await loginResponse.json();
    const sessionCookie = loginResponse.headers.get('set-cookie')?.split(';')[0] || '';
    console.log(`✅ Admin authenticated: ${adminUser.username}`);
    
    // Step 2: Create test customer if needed
    console.log('\n👤 Creating test customer...');
    const customerResponse = await fetch('http://localhost:5000/api/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify({
        name: 'Test Customer for Field Engineer',
        email: 'testcustomer@wizoneit.com',
        phone: '9876543999',
        address: 'Test Address for Field Assignment',
        serviceType: 'Field Service'
      })
    });
    
    let customerId = null;
    if (customerResponse.ok) {
      const customer = await customerResponse.json();
      customerId = customer.id;
      console.log(`✅ Customer created: ${customer.name} (ID: ${customerId})`);
    }
    
    // Step 3: Create task and assign to field engineer
    console.log('\n📋 Creating task for field engineer assignment...');
    const taskResponse = await fetch('http://localhost:5000/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify({
        title: 'Field Engineer Test Task',
        description: 'Test task for field engineer mobile app workflow',
        customerId: customerId,
        priority: 'high',
        issueType: 'installation',
        assignedTo: 'admin',
        status: 'pending'
      })
    });
    
    let taskId = null;
    if (taskResponse.ok) {
      const task = await taskResponse.json();
      taskId = task.id;
      console.log(`✅ Task created: ${task.title} (ID: TSK${taskId})`);
    }
    
    // Step 4: Get available field engineers
    console.log('\n👨‍💻 Getting available field engineers...');
    const engineersResponse = await fetch('http://localhost:5000/api/field-engineers', {
      headers: {
        'Cookie': sessionCookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (engineersResponse.ok) {
      const engineers = await engineersResponse.json();
      console.log(`✅ Available field engineers: ${engineers.length}`);
      
      if (engineers.length > 0 && taskId) {
        // Step 5: Assign field engineer to task
        const fieldEngineerId = engineers[0].id;
        console.log(`\n🎯 Assigning task to field engineer: ${engineers[0].firstName} ${engineers[0].lastName}`);
        
        const assignResponse = await fetch(`http://localhost:5000/api/tasks/${taskId}/field-engineer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': sessionCookie,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          body: JSON.stringify({
            fieldEngineerId: fieldEngineerId
          })
        });
        
        if (assignResponse.ok) {
          const updatedTask = await assignResponse.json();
          console.log(`✅ Task assigned successfully to field engineer: ${fieldEngineerId}`);
          console.log(`✅ Task status: ${updatedTask.status}`);
          
          // Step 6: Test field engineer login
          console.log(`\n🔐 Testing field engineer login: ${engineers[0].username}`);
          const fieldLoginResponse = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'WizoneFieldEngineerApp/1.0 (Mobile)'
            },
            body: JSON.stringify({
              username: engineers[0].username,
              password: 'admin123'
            })
          });
          
          if (fieldLoginResponse.ok) {
            const fieldUser = await fieldLoginResponse.json();
            console.log(`✅ Field engineer login successful: ${fieldUser.username}`);
            console.log(`✅ User role: ${fieldUser.role}`);
            console.log(`✅ User department: ${fieldUser.department}`);
          } else {
            console.log(`❌ Field engineer login failed`);
          }
        }
      }
    }
    
    console.log('\n🎉 Complete workflow test finished!');
    
  } catch (error) {
    console.error('❌ Workflow test error:', error.message);
  }
};

testCompleteWorkflow();