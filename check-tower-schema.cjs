const postgres = require('postgres');
const sql = postgres('postgresql://appuser:jksdj%24%26%5E%26*YUG*%5E%25%26THJHIO4546GHG%26j@72.61.170.243:9095/WIZONEIT_SUPPORT');

async function checkSchema() {
  try {
    // Check constraint definition
    const constraints = await sql`
      SELECT pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conname = 'network_towers_status_check'
    `;
    console.log('Status constraint:', constraints);
    
    // Also try to alter client_assignments to allow NULL tower_id
    try {
      await sql`ALTER TABLE client_assignments ALTER COLUMN tower_id DROP NOT NULL`;
      console.log('SUCCESS: tower_id is now nullable');
    } catch (e) {
      console.log('tower_id alteration error:', e.message);
    }
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

checkSchema();
