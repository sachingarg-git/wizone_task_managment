const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT'
});

async function test() {
  try {
    // Check table columns
    console.log('=== Checking customer_system_details table columns ===\n');
    const colResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'customer_system_details'
      ORDER BY ordinal_position
    `);
    
    console.log('Columns in table:');
    colResult.rows.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));
    
    // Check existing records
    console.log('\n=== Checking existing records ===\n');
    const dataResult = await pool.query(`
      SELECT id, customer_name, emp_name, system_name, processor, ram, created_at
      FROM customer_system_details
      ORDER BY id DESC LIMIT 5
    `);
    
    if (dataResult.rows.length > 0) {
      console.log('Recent records:');
      dataResult.rows.forEach(r => {
        console.log(`  ID: ${r.id}, Customer: ${r.customer_name}, Emp: ${r.emp_name}, System: ${r.system_name}`);
      });
    } else {
      console.log('No records found in table');
    }
    
    // Check users table for "ravi" user
    console.log('\n=== Checking users table ===\n');
    const userResult = await pool.query(`
      SELECT id, username, first_name, last_name, role 
      FROM users 
      WHERE LOWER(username) LIKE '%ravi%' OR LOWER(first_name) LIKE '%ravi%'
    `);
    
    if (userResult.rows.length > 0) {
      console.log('Users matching "ravi":');
      userResult.rows.forEach(u => {
        console.log(`  ID: ${u.id}, Username: ${u.username}, Name: ${u.first_name} ${u.last_name}, Role: ${u.role}`);
      });
    } else {
      console.log('No users found matching "ravi"');
    }

    // Check users table for "sachin" user
    const sachinResult = await pool.query(`
      SELECT id, username, first_name, last_name, role 
      FROM users 
      WHERE LOWER(username) LIKE '%sachin%' OR LOWER(first_name) LIKE '%sachin%'
    `);
    
    if (sachinResult.rows.length > 0) {
      console.log('\nUsers matching "sachin":');
      sachinResult.rows.forEach(u => {
        console.log(`  ID: ${u.id}, Username: ${u.username}, Name: ${u.first_name} ${u.last_name}, Role: ${u.role}`);
      });
    } else {
      console.log('\nNo users found matching "sachin"');
    }

    // Check customers table for "multani"
    console.log('\n=== Checking customers table ===\n');
    const custResult = await pool.query(`
      SELECT id, name, email 
      FROM customers 
      WHERE LOWER(name) LIKE '%multani%'
    `);
    
    if (custResult.rows.length > 0) {
      console.log('Customers matching "multani":');
      custResult.rows.forEach(c => {
        console.log(`  ID: ${c.id}, Name: ${c.name}, Email: ${c.email}`);
      });
    } else {
      console.log('No customers found matching "multani"');
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

test();
