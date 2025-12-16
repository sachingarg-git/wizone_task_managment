const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkAndFixProfileColumn() {
  try {
    // Check if column exists
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'profile_image_url'
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Column profile_image_url not found, creating...');
      await pool.query('ALTER TABLE users ADD COLUMN profile_image_url TEXT');
      console.log('✅ Column created!');
    } else {
      console.log('✅ Column profile_image_url exists');
    }
    
    // Check a sample user
    const users = await pool.query('SELECT id, username, profile_image_url FROM users LIMIT 3');
    console.log('Sample users:', users.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAndFixProfileColumn();
