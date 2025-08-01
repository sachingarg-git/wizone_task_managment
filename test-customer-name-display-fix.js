// Test customer name display fix

const testCustomerNameDisplay = async () => {
  console.log('🔧 TESTING CUSTOMER NAME DISPLAY FIX...\n');
  
  try {
    // Step 1: Admin login
    console.log('🔐 Step 1: Admin Login...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    const sessionCookie = loginResponse.headers.get('set-cookie')?.split(';')[0] || '';
    console.log('✅ Admin logged in');
    
    // Step 2: Get all tasks to check customer names
    console.log('\n📋 Step 2: Getting All Tasks...');
    const tasksResponse = await fetch('http://localhost:5000/api/tasks', {
      headers: { 'Cookie': sessionCookie }
    });
    
    const tasks = await tasksResponse.json();
    console.log(`✅ Retrieved ${tasks.length} tasks`);
    
    // Step 3: Check customer names in tasks
    console.log('\n👥 Step 3: Checking Customer Names...');
    tasks.forEach((task, index) => {
      const customerName = task.customerName || 'Unknown Customer';
      const customerId = task.customerId || 'No Customer ID';
      
      console.log(`   Task ${index + 1}: ${task.ticketNumber}`);
      console.log(`   Customer ID: ${customerId}`);
      console.log(`   Customer Name: ${customerName}`);
      
      if (customerName === 'Unknown Customer' || !customerName) {
        console.log('   ❌ Customer name not showing properly');
      } else {
        console.log('   ✅ Customer name displaying correctly');
      }
      console.log('   ---');
    });
    
    // Step 4: Test individual task retrieval
    if (tasks.length > 0) {
      const firstTask = tasks[0];
      console.log(`\n🔍 Step 4: Testing Individual Task Retrieval (${firstTask.ticketNumber})...`);
      
      const taskResponse = await fetch(`http://localhost:5000/api/tasks/${firstTask.id}`, {
        headers: { 'Cookie': sessionCookie }
      });
      
      const taskDetail = await taskResponse.json();
      console.log(`   Task ID: ${taskDetail.id}`);
      console.log(`   Customer Name: ${taskDetail.customerName || 'Unknown Customer'}`);
      console.log(`   Customer ID: ${taskDetail.customerId || 'No Customer ID'}`);
      
      if (taskDetail.customerName && taskDetail.customerName !== 'Unknown Customer') {
        console.log('   ✅ Individual task customer name working');
      } else {
        console.log('   ❌ Individual task customer name not working');
      }
    }
    
    console.log('\n🏁 CUSTOMER NAME DISPLAY TEST COMPLETE');
    console.log('====================================');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

// Run the test
testCustomerNameDisplay();