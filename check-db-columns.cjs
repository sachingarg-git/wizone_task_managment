const postgres = require('postgres');
const sql = postgres('postgresql://appuser:jksdj%24%26%5E%26*YUG*%5E%25%26THJHIO4546GHG%26j@72.61.170.243:9095/WIZONEIT_SUPPORT');

async function checkColumns() {
  try {
    console.log('Checking network_devices table...');
    const deviceCols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'network_devices' 
      ORDER BY ordinal_position
    `;
    console.log('\nnetwork_devices columns:');
    deviceCols.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));

    console.log('\nChecking network_towers table...');
    const towerCols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'network_towers' 
      ORDER BY ordinal_position
    `;
    console.log('\nnetwork_towers columns:');
    towerCols.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));

    await sql.end();
  } catch (error) {
    console.error('Error:', error.message);
    await sql.end();
  }
}

checkColumns();
