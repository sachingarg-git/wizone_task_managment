const { Pool } = require('pg');

const pool = new Pool({
  user: 'WIZONEIT_SUPPORT_user',
  host: '103.122.85.61',
  database: 'WIZONEIT_SUPPORT',
  password: 'OTWjE8LWdV9yOKFi',
  port: 9095,
});

async function checkRoleConstraints() {
  try {
    const client = await pool.connect();
    
    // Check table schema and constraints for role column
    const result = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default,
        character_maximum_length
      FROM 
        information_schema.columns 
      WHERE 
        table_name = 'users' 
        AND column_name = 'role'
        AND table_schema = 'public'
    `);
    
    console.log('Role column info:', result.rows);
    
    // Check for check constraints on users table
    const constraintResult = await client.query(`
      SELECT 
        con.conname,
        con.contype,
        pg_get_constraintdef(con.oid) as definition
      FROM 
        pg_catalog.pg_constraint con
        INNER JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
        INNER JOIN pg_catalog.pg_namespace nsp ON nsp.oid = connamespace
      WHERE 
        nsp.nspname = 'public'
        AND rel.relname = 'users'
        AND con.contype = 'c'
    `);
    
    console.log('Check constraints on users table:', constraintResult.rows);
    
    // Test role update with current value
    try {
      const updateResult = await client.query('UPDATE users SET role = $1 WHERE id = 1', ['backend engineer']);
      console.log('Role update result:', updateResult.rowCount);
    } catch (updateErr) {
      console.log('Role update error:', updateErr.message);
      console.log('Error code:', updateErr.code);
    }
    
    client.release();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkRoleConstraints();