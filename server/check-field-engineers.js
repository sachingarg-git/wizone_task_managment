// Check field engineer accounts and their authentication details
import postgres from 'postgres';

const db = postgres('postgres://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT');

async function checkFieldEngineers() {
  try {
    console.log('🔍 Checking field engineer accounts...');
    
    // Get all field engineers
    const fieldEngineers = await db`
      SELECT id, username, password_hash, email, first_name, last_name, role, active
      FROM users 
      WHERE role = 'field_engineer'
      ORDER BY username;
    `;
    
    console.log('📋 Field Engineers in database:');
    fieldEngineers.forEach((user, index) => {
      console.log(`\n${index + 1}. Username: "${user.username}"`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.first_name} ${user.last_name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Active: ${user.active}`);
      console.log(`   Password Hash: ${user.password_hash ? 'EXISTS (' + user.password_hash.substring(0, 20) + '...)' : 'NULL'}`);
    });
    
    // Check if any usernames have case variations
    console.log('\n🔍 Testing case sensitivity...');
    const testUsernames = ['huzaifa', 'Huzaifa', 'rohit', 'Rohit', 'ravi', 'Ravi', 'sachin', 'Sachin'];
    
    for (const testName of testUsernames) {
      const result = await db`
        SELECT username, id FROM users WHERE username = ${testName} AND role = 'field_engineer';
      `;
      if (result.length > 0) {
        console.log(`✅ Found: "${testName}" -> ID: ${result[0].id}`);
      } else {
        console.log(`❌ Not found: "${testName}"`);
      }
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await db.end();
  }
}

checkFieldEngineers();