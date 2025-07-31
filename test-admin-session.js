// Test admin session creation with proper authentication
const testAdminSession = async () => {
  console.log('👤 Testing admin session authentication...');
  
  try {
    // Step 1: Admin Login with proper cookies
    console.log('\n1️⃣ Admin login with session save...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Admin login failed');
      return;
    }
    
    const adminUser = await loginResponse.json();
    const rawCookies = loginResponse.headers.get('set-cookie');
    console.log(`✅ Admin login successful: ${adminUser.username}`);
    console.log(`🍪 Raw cookies: ${rawCookies}`);
    
    // Extract session cookie properly
    const sessionCookie = rawCookies ? rawCookies.split(';')[0] : '';
    console.log(`🍪 Session cookie: ${sessionCookie}`);
    
    // Step 2: Create field engineer with authenticated session
    console.log('\n2️⃣ Creating field engineer with authenticated session...');
    const createResponse = await fetch('http://localhost:5000/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      body: JSON.stringify({
        id: 'wizone124_001',
        username: 'wizone124',
        password: 'hari',
        firstName: 'Hari',
        lastName: 'Kumar',
        email: 'hari@wizoneit.com',
        phone: '9876543210',
        role: 'field_engineer',
        department: 'Field Operations',
        isActive: true
      })
    });
    
    if (createResponse.ok) {
      const newUser = await createResponse.json();
      console.log(`✅ Field engineer created: ${newUser.username} (ID: ${newUser.id})`);
    } else {
      const error = await createResponse.text();
      console.log(`❌ User creation failed: ${createResponse.status} - ${error}`);
    }
    
    // Step 3: Verify field engineers API
    console.log('\n3️⃣ Checking field engineers list...');
    const listResponse = await fetch('http://localhost:5000/api/field-engineers', {
      headers: {
        'Cookie': sessionCookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (listResponse.ok) {
      const engineers = await listResponse.json();
      console.log(`✅ Field engineers list: ${engineers.length} found`);
      engineers.forEach(eng => {
        console.log(`  • ${eng.firstName} ${eng.lastName} (${eng.username})`);
      });
    } else {
      console.log(`❌ Field engineers list failed: ${listResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Admin session test error:', error.message);
  }
  
  console.log('\n✅ Admin session test complete');
};

testAdminSession();