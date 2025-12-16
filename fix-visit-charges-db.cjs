const postgres = require('postgres');

// Use the same SSL configuration as the server
const sql = postgres('postgresql://wizoneit:wizone123@103.122.85.61:9095/WIZONEIT_SUPPORT', {
  ssl: false,
  max: 1
});

async function fixVisitCharges() {
  try {
    console.log('🔧 Updating estimated_cost column to allow larger values...');
    
    // Change from NUMERIC(5,2) to NUMERIC(10,2)
    // This allows values up to 99,999,999.99 instead of just 999.99
    await sql`
      ALTER TABLE tasks 
      ALTER COLUMN estimated_cost TYPE NUMERIC(10,2)
    `;
    
    console.log('✅ Successfully updated estimated_cost column!');
    console.log('📊 Old constraint: NUMERIC(5,2) - max value was 999.99');
    console.log('📊 New constraint: NUMERIC(10,2) - max value is now 99,999,999.99');
    console.log('');
    console.log('✅ You can now create tasks with visit charges like:');
    console.log('   - 2022');
    console.log('   - 5000');
    console.log('   - 15000');
    console.log('   - etc.');
    
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating column:', error.message);
    console.error('Full error:', error);
    await sql.end();
    process.exit(1);
  }
}

fixVisitCharges();
