const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT'
});

async function checkTowers() {
  try {
    const result = await pool.query('SELECT * FROM network_towers ORDER BY created_at DESC');
    console.log('📡 Network Towers in Database:');
    console.log('Count:', result.rows.length);
    
    if (result.rows.length > 0) {
      result.rows.forEach((tower, index) => {
        console.log(`\n🏗️ Tower ${index + 1}:`);
        console.log(`  ID: ${tower.id}`);
        console.log(`  Name: ${tower.name}`);
        console.log(`  Location: ${tower.location}`);
        console.log(`  IP Address: ${tower.ip_address}`);
        console.log(`  Type: ${tower.tower_type}`);
        console.log(`  Status: ${tower.status}`);
        console.log(`  Created: ${tower.created_at}`);
      });
    } else {
      console.log('❌ No towers found in database');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error checking towers:', error);
    await pool.end();
  }
}

checkTowers();