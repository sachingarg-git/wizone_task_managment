const { Pool } = require('pg');

// Load environment variables
require('dotenv').config();

// Database configuration from .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT',
  ssl: false
});

async function fixCaseInsensitiveAuth() {
  try {
    console.log('🔧 Creating case-insensitive authentication fix...');
    
    // First, let's check current field engineers
    console.log('\n📋 Current field engineers:');
    const usersResult = await pool.query(`
      SELECT id, username, first_name, last_name, role, active 
      FROM users 
      WHERE role = 'field_engineer' 
      ORDER BY username
    `);
    
    console.log('Field engineers found:');
    usersResult.rows.forEach(user => {
      console.log(`- ID: ${user.id}, Username: "${user.username}", Name: ${user.first_name} ${user.last_name}, Active: ${user.active}`);
    });
    
    // Test case-insensitive query
    console.log('\n🔍 Testing case-insensitive username lookup...');
    const testUsernames = ['huzaifa', 'HUZAIFA', 'rohit', 'ROHIT', 'Rohit', 'ravi', 'RAVI', 'Ravi', 'sachin', 'SACHIN', 'Sachin'];
    
    for (const testUsername of testUsernames) {
      const result = await pool.query(`
        SELECT id, username, first_name, last_name, role 
        FROM users 
        WHERE LOWER(username) = LOWER($1)
        LIMIT 1
      `, [testUsername]);
      
      if (result.rows.length > 0) {
        const user = result.rows[0];
        console.log(`✅ "${testUsername}" -> Found: "${user.username}" (${user.first_name} ${user.last_name})`);
      } else {
        console.log(`❌ "${testUsername}" -> Not found`);
      }
    }
    
    console.log('\n✅ Case-insensitive authentication fix analysis complete!');
    console.log('📝 Next step: Update storage.ts to use LOWER() for case-insensitive username matching');
    
  } catch (error) {
    console.error('❌ Error during case-insensitive auth fix:', error);
  } finally {
    await pool.end();
  }
}

fixCaseInsensitiveAuth();