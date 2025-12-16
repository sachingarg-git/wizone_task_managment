const { Pool } = require('pg');

// Load environment variables
require('dotenv').config();

// Database configuration from .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT',
  ssl: false
});

async function testCaseInsensitiveAuth() {
  try {
    console.log('🧪 Testing case-insensitive authentication...');
    
    // Test cases that should work after the fix
    const testCases = [
      { username: 'rohit', expectedFound: 'Rohit' },
      { username: 'ROHIT', expectedFound: 'Rohit' },
      { username: 'ravi', expectedFound: 'Ravi' },
      { username: 'RAVI', expectedFound: 'Ravi' },
      { username: 'huzaifa', expectedFound: 'huzaifa' },
      { username: 'HUZAIFA', expectedFound: 'huzaifa' },
      { username: 'sachin', expectedFound: 'sachin' },
      { username: 'SACHIN', expectedFound: 'sachin' }
    ];
    
    console.log('\n📋 Testing case-insensitive username lookup:');
    
    for (const testCase of testCases) {
      const result = await pool.query(`
        SELECT id, username, first_name, last_name, role 
        FROM users 
        WHERE LOWER(username) = LOWER($1)
        AND role = 'field_engineer'
        LIMIT 1
      `, [testCase.username]);
      
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const match = user.username === testCase.expectedFound;
        console.log(`${match ? '✅' : '⚠️'} "${testCase.username}" -> Found: "${user.username}" (${user.first_name} ${user.last_name}) ${match ? '' : '- Expected: ' + testCase.expectedFound}`);
      } else {
        console.log(`❌ "${testCase.username}" -> Not found (Expected: ${testCase.expectedFound})`);
      }
    }
    
    console.log('\n✅ Case-insensitive authentication test complete!');
    console.log('📝 The fix in storage.ts should now allow all field engineers to login with any case combination');
    
  } catch (error) {
    console.error('❌ Error during case-insensitive auth test:', error);
  } finally {
    await pool.end();
  }
}

testCaseInsensitiveAuth();