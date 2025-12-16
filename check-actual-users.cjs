const { Pool } = require('pg');

const pool = new Pool({
  host: '103.122.85.61',
  port: 9095,
  database: 'WIZONEIT_SUPPORT',
  user: 'postgres',
  password: 'ss123456'
});

async function checkUsers() {
  try {
    const result = await pool.query(`
      SELECT id, username, email, role, first_name, last_name, active 
      FROM users 
      ORDER BY id
    `);
    
    console.log('\n=== ACTUAL USERS IN DATABASE ===\n');
    console.log(`Total Users: ${result.rows.length}\n`);
    
    result.rows.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`Username: ${user.username}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Name: ${user.first_name} ${user.last_name}`);
      console.log(`Active: ${user.active}`);
      console.log('---');
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkUsers();
