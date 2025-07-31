// Test field engineer API with proper authentication
const testFieldEngineers = async () => {
  console.log('🧪 Testing field engineer API...');
  
  try {
    // First login
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginResponse.status);
      return;
    }
    
    // Get cookies from login response
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    const cookies = setCookieHeader ? setCookieHeader.split(',').map(c => c.split(';')[0]).join('; ') : '';
    
    console.log('✅ Login successful, testing field engineers API...');
    
    // Test field engineers API with authentication
    const engineersResponse = await fetch('http://localhost:5000/api/field-engineers', {
      headers: {
        'Cookie': cookies
      }
    });
    
    if (engineersResponse.ok) {
      const engineers = await engineersResponse.json();
      console.log('✅ Field engineers API working:');
      console.log(`- Found ${engineers.length} field engineers`);
      engineers.forEach(eng => {
        console.log(`  • ${eng.firstName} ${eng.lastName} (${eng.username}) - ${eng.status}`);
      });
    } else {
      console.log('❌ Field engineers API failed:', engineersResponse.status, await engineersResponse.text());
    }
    
    // Test task assignment
    console.log('\n🔧 Testing task assignment...');
    const assignResponse = await fetch('http://localhost:5000/api/tasks/1/assign-field-engineer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        fieldEngineerId: '2025' // ashu's ID
      })
    });
    
    if (assignResponse.ok) {
      const result = await assignResponse.json();
      console.log('✅ Task assignment successful:', result.ticketNumber);
    } else {
      console.log('❌ Task assignment failed:', assignResponse.status, await assignResponse.text());
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

testFieldEngineers();