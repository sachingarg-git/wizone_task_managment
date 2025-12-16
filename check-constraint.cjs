const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

const sql = postgres({
  host: '103.122.85.61',
  port: 9095,
  database: 'WIZONEIT_SUPPORT',
  username: 'WIZONEIT_SUPPORT_user',
  password: 'OTWjE8LWdV9yOKFi',
});

async function checkConstraintDefinition() {
  try {
    // Check the exact constraint definition
    const result = await sql`
      SELECT 
        con.conname,
        pg_get_constraintdef(con.oid) as definition
      FROM 
        pg_catalog.pg_constraint con
        INNER JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
        INNER JOIN pg_catalog.pg_namespace nsp ON nsp.oid = connamespace
      WHERE 
        nsp.nspname = 'public'
        AND rel.relname = 'users'
        AND con.contype = 'c'
        AND con.conname = 'users_role_check'
    `;
    
    console.log('Role constraint definition:', result);
    
    // Try to get all existing user roles
    const userRoles = await sql`
      SELECT DISTINCT role 
      FROM users 
      WHERE role IS NOT NULL
      ORDER BY role
    `;
    
    console.log('Existing user roles in database:', userRoles.map(r => r.role));
    
    // Try to update a specific user with the correct value
    console.log('Attempting to update user 17 role to backend_engineer...');
    
    try {
      const updateResult = await sql`
        UPDATE users 
        SET role = 'backend_engineer', "updatedAt" = NOW()
        WHERE id = 17
        RETURNING id, username, role
      `;
      
      console.log('Update successful:', updateResult);
    } catch (updateError) {
      console.log('Update failed:', updateError.message);
      console.log('Error code:', updateError.code);
      console.log('Error constraint:', updateError.constraint_name);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkConstraintDefinition();