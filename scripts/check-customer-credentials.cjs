const { Pool } = require('pg');

const pool = new Pool({
  host: '103.122.85.61',
  port: 9095,
  database: 'WIZONEIT_SUPPORT',
  user: 'postgres',
  password: 'ss123456'
});

async function check() {
  try {
    // Check Multani customer portal credentials
    console.log('=== Multani Customer Portal Credentials ===\n');
    const result = await pool.query(`
      SELECT id, name, portal_username, portal_password 
      FROM customers 
      WHERE LOWER(name) LIKE '%multani%' 
      LIMIT 5
    `);
    
    if (result.rows.length > 0) {
      result.rows.forEach(c => {
        console.log(`ID: ${c.id}`);
        console.log(`  Name: ${c.name}`);
        console.log(`  Username: ${c.portal_username}`);
        console.log(`  Password: ${c.portal_password}`);
        console.log('');
      });
    } else {
      console.log('No Multani customers found');
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

check();
