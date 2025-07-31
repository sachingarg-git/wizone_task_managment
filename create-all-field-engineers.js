// Create all field engineer users with authenticated session
const createAllFieldEngineers = async () => {
  console.log('👨‍💻 Creating all field engineers with authenticated session...');
  
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
    
    if (!loginResponse.ok) {
      console.log('❌ Admin login failed');
      return;
    }
    
    const adminUser = await loginResponse.json();
    const sessionCookie = loginResponse.headers.get('set-cookie')?.split(';')[0] || '';
    console.log(`✅ Admin authenticated: ${adminUser.username}`);
    
    // Step 2: Create all field engineers
    const fieldEngineers = [
      { id: 'ravi_001', username: 'ravi', password: 'admin123', firstName: 'Ravi', lastName: 'Singh', email: 'ravi@wizoneit.com', phone: '9876543211' },
      { id: 'vivek_001', username: 'vivek', password: 'admin123', firstName: 'Vivek', lastName: 'Sharma', email: 'vivek@wizoneit.com', phone: '9876543212' },
      { id: 'sachin_001', username: 'sachin', password: 'admin123', firstName: 'Sachin', lastName: 'Gupta', email: 'sachin@wizoneit.com', phone: '9876543213' },
      { id: 'ashu_001', username: 'ashu', password: 'admin123', firstName: 'Ashutosh', lastName: 'Verma', email: 'ashu@wizoneit.com', phone: '9876543214' }
    ];
    
    console.log('\n👨‍💻 Creating field engineers...');
    for (const engineer of fieldEngineers) {
      try {
        const response = await fetch('http://localhost:5000/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': sessionCookie,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          body: JSON.stringify({
            ...engineer,
            role: 'field_engineer',
            department: 'Field Operations',
            isActive: true
          })
        });
        
        if (response.ok) {
          const user = await response.json();
          console.log(`✅ Created: ${engineer.username} (ID: ${user.id})`);
        } else {
          const error = await response.text();
          console.log(`❌ Failed to create ${engineer.username}: ${error}`);
        }
      } catch (error) {
        console.log(`❌ Error creating ${engineer.username}: ${error.message}`);
      }
    }
    
    // Step 3: Verify field engineers list
    console.log('\n📋 Checking field engineers list...');
    const listResponse = await fetch('http://localhost:5000/api/field-engineers', {
      headers: {
        'Cookie': sessionCookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (listResponse.ok) {
      const engineers = await listResponse.json();
      console.log(`✅ Total field engineers found: ${engineers.length}`);
      engineers.forEach(eng => {
        console.log(`  • ${eng.firstName} ${eng.lastName} (${eng.username}) - Status: ${eng.status || 'Available'}`);
      });
    } else {
      console.log(`❌ Field engineers list failed: ${listResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n✅ Field engineer creation complete');
};

createAllFieldEngineers();