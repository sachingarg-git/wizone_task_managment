const postgres = require('postgres');

const sql = postgres('postgresql://wizoneit:wizone123@103.122.85.61:9095/WIZONEIT_SUPPORT', {
  ssl: false
});

async function fixVisitCharges() {
  try {
    console.log('🔧 Updating estimated_cost column to allow larger values...');
    
    await sql`
      ALTER TABLE tasks 
      ALTER COLUMN estimated_cost TYPE NUMERIC(10,2)
    `;
    
    console.log('✅ Successfully updated estimated_cost column!');
    console.log('📊 New constraint: NUMERIC(10,2) - allows values up to 99,999,999.99');
    console.log('✅ You can now create tasks with visit charges like 2022, 5000, etc.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating column:', error.message);
    process.exit(1);
  }
}

fixVisitCharges();
