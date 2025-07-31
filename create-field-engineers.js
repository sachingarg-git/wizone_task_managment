// Create missing field engineer users
const createFieldEngineers = async () => {
  console.log('👨‍💻 Creating field engineer users...');
  
  const fieldEngineers = [
    { username: 'wizone124', password: 'hari', firstName: 'Hari', lastName: 'Kumar', email: 'hari@wizoneit.com', phone: '9876543210' },
    { username: 'ravi', password: 'admin123', firstName: 'Ravi', lastName: 'Singh', email: 'ravi@wizoneit.com', phone: '9876543211' },
    { username: 'vivek', password: 'admin123', firstName: 'Vivek', lastName: 'Sharma', email: 'vivek@wizoneit.com', phone: '9876543212' },
    { username: 'sachin', password: 'admin123', firstName: 'Sachin', lastName: 'Gupta', email: 'sachin@wizoneit.com', phone: '9876543213' },
    { username: 'ashu', password: 'admin123', firstName: 'Ashutosh', lastName: 'Verma', email: 'ashu@wizoneit.com', phone: '9876543214' }
  ];
  
  for (const engineer of fieldEngineers) {
    try {
      console.log(`Creating field engineer: ${engineer.username}`);
      
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: engineer.username,
          password: engineer.password,
          firstName: engineer.firstName,
          lastName: engineer.lastName,
          email: engineer.email,
          phone: engineer.phone,
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
        console.log(`❌ Failed to create ${engineer.username}:`, error);
      }
    } catch (error) {
      console.error(`❌ Error creating ${engineer.username}:`, error.message);
    }
  }
  
  console.log('\n✅ Field engineer creation complete');
};

createFieldEngineers();