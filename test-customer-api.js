import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3007';

async function testCustomerCreation() {
  console.log('🧪 TESTING CUSTOMER CREATION API\n');
  
  try {
    // First, let's check if we need to login
    console.log('1️⃣ Logging in as admin...');
    const loginResponse = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('   Login status:', loginResponse.status);
    console.log('   Cookies:', cookies ? 'Received' : 'None');
    
    // Now try to create a customer
    console.log('\n2️⃣ Creating a customer...');
    const customerData = {
      name: 'Test Customer',
      contactPerson: 'John Doe',
      email: 'test@customer.com',
      mobilePhone: '+91-9876543210',
      address: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      country: 'India',
      servicePlan: 'Basic - 100Mbps',
      status: 'active',
      latitude: '12.9716',
      longitude: '77.5946'
    };
    
    const customerResponse = await fetch(`${BASE_URL}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || ''
      },
      body: JSON.stringify(customerData)
    });
    
    console.log('   Response status:', customerResponse.status);
    
    if (customerResponse.ok) {
      const result = await customerResponse.json();
      console.log('   ✅ SUCCESS! Customer created:');
      console.log('   Customer ID:', result.customerId);
      console.log('   Name:', result.name);
    } else {
      const error = await customerResponse.text();
      console.log('   ❌ FAILED:', error);
    }
    
    // Verify by fetching all customers
    console.log('\n3️⃣ Fetching all customers...');
    const fetchResponse = await fetch(`${BASE_URL}/api/customers`, {
      headers: {
        'Cookie': cookies || ''
      }
    });
    
    if (fetchResponse.ok) {
      const customers = await fetchResponse.json();
      console.log(`   ✅ Found ${customers.length} customers in database`);
    } else {
      console.log('   ❌ Failed to fetch customers');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testCustomerCreation();
