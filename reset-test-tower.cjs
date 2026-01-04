const sql = require('postgres')('postgresql://appuser:jksdj%24%26%5E%26YUG%5E%25%26THJHIO4546GHG%26j@72.61.170.243:9095/WIZONEIT_SUPPORT');

async function resetTestTower() {
  try {
    // Reset test tower status to 'online' so next ping will trigger offline alert
    const result = await sql`
      UPDATE network_towers 
      SET status = 'online' 
      WHERE name ILIKE '%test%'
      RETURNING id, name, status
    `;
    
    console.log('Updated towers:');
    result.forEach(t => console.log(`  ${t.id}: ${t.name} -> ${t.status}`));
    
    await sql.end();
  } catch (e) {
    console.error('Error:', e);
    await sql.end();
  }
}

resetTestTower();
