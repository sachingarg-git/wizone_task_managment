const { Pool } = require('pg');

// Load environment variables
require('dotenv').config();

// Database configuration from .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT',
  ssl: false
});

async function checkFieldEngineerPasswords() {
  try {
    console.log('🔍 Checking field engineer password setup...\n');
    
    // Get field engineers with their password info
    const result = await pool.query(`
      SELECT id, username, first_name, last_name, role, active, password_hash,
             CASE 
               WHEN password_hash IS NULL THEN 'NO PASSWORD'
               WHEN password_hash = '' THEN 'EMPTY PASSWORD'
               ELSE 'HAS PASSWORD'
             END as password_status
      FROM users 
      WHERE role = 'field_engineer' 
      ORDER BY username
    `);
    
    console.log('Field engineers password status:');
    result.rows.forEach(user => {
      console.log(`- ${user.username} (${user.first_name} ${user.last_name})`);
      console.log(`  ID: ${user.id}, Active: ${user.active}`);
      console.log(`  Password Status: ${user.password_status}`);
      if (user.password_hash) {
        console.log(`  Password Hash (first 30 chars): ${user.password_hash.substring(0, 30)}...`);
      }
      console.log('');
    });
    
    console.log('📝 NOTE: If users show "NO PASSWORD" or "EMPTY PASSWORD", they need passwords set.');
    console.log('💡 For field engineers to login, they need proper password hashes in the database.');
    
  } catch (error) {
    console.error('❌ Error checking field engineer passwords:', error);
  } finally {
    await pool.end();
  }
}

checkFieldEngineerPasswords();