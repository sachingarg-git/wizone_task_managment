import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3007';

async function testFormCreation() {
  console.log('🧪 TESTING FORM CREATION IN WEB APPLICATION\n');
  
  try {
    // Test 1: Create a User
    console.log('📝 Test 1: Creating a new user...');
    const userResponse = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        password: 'Test123!',
        email: 'testuser@wizone.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'engineer',
        active: true
      })
    });
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('✅ User created successfully!');
      console.log('   User ID:', userData.id);
      console.log('   Username:', userData.username);
    } else {
      const error = await userResponse.text();
      console.log('❌ User creation failed:', userResponse.status, error);
    }
    
    // Test 2: Create a Customer
    console.log('\n📝 Test 2: Creating a new customer...');
    const customerResponse = await fetch(`${BASE_URL}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId: 'TEST001',
        name: 'Test Customer Corp',
        contactPerson: 'John Test',
        email: 'test@customer.com',
        mobilePhone: '+91-1234567890',
        address: 'Test Address, Test City',
        city: 'Test City',
        state: 'Test State',
        status: 'active',
        servicePlan: 'Basic Plan - 100Mbps'
      })
    });
    
    if (customerResponse.ok) {
      const customerData = await customerResponse.json();
      console.log('✅ Customer created successfully!');
      console.log('   Customer ID:', customerData.customerId);
      console.log('   Name:', customerData.name);
    } else {
      const error = await customerResponse.text();
      console.log('❌ Customer creation failed:', customerResponse.status, error);
    }
    
    // Test 3: Create a Task
    console.log('\n📝 Test 3: Creating a new task...');
    const taskResponse = await fetch(`${BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Task - Network Issue',
        description: 'Test task description',
        priority: 'high',
        status: 'pending',
        category: 'network'
      })
    });
    
    if (taskResponse.ok) {
      const taskData = await taskResponse.json();
      console.log('✅ Task created successfully!');
      console.log('   Task ID:', taskData.id);
      console.log('   Title:', taskData.title);
      console.log('   Ticket Number:', taskData.ticketNumber);
    } else {
      const error = await taskResponse.text();
      console.log('❌ Task creation failed:', taskResponse.status, error);
    }
    
    // Test 4: Get all data to verify
    console.log('\n📊 Verification - Fetching all data...');
    
    const usersCheck = await fetch(`${BASE_URL}/api/users`);
    const customersCheck = await fetch(`${BASE_URL}/api/customers`);
    const tasksCheck = await fetch(`${BASE_URL}/api/tasks`);
    
    if (usersCheck.ok && customersCheck.ok && tasksCheck.ok) {
      const users = await usersCheck.json();
      const customers = await customersCheck.json();
      const tasks = await tasksCheck.json();
      
      console.log('✅ Database status:');
      console.log(`   Users: ${users.length} records`);
      console.log(`   Customers: ${customers.length} records`);
      console.log(`   Tasks: ${tasks.length} records`);
    }
    
    console.log('\n🎉 FORM CREATION TESTS COMPLETED!\n');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testFormCreation();
