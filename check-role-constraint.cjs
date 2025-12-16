// Check what values are allowed by the users_role_check constraint
const { Pool } = require('pg');
require('dotenv').config();

async function checkConstraint() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔍 Checking users_role_check constraint...');
    
    // Get the constraint definition
    const constraintQuery = `
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint 
      WHERE conname = 'users_role_check';
    `;
    
    const result = await pool.query(constraintQuery);
    
    if (result.rows.length > 0) {
      console.log('\n📋 Constraint Details:');
      console.log('Name:', result.rows[0].constraint_name);
      console.log('Definition:', result.rows[0].constraint_definition);
    } else {
      console.log('❌ Constraint not found');
    }
    
    // Also check what roles currently exist in the database
    console.log('\n🔍 Current roles in database:');
    const rolesQuery = 'SELECT DISTINCT role FROM users ORDER BY role;';
    const rolesResult = await pool.query(rolesQuery);
    
    console.log('Existing roles:');
    rolesResult.rows.forEach(row => {
      console.log(`  - "${row.role}"`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkConstraint();