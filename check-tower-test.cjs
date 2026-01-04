const sql = require('postgres')('postgres://appuser:Wizonedev420243@72.61.170.243:9095/WIZONEIT_SUPPORT');

async function checkTestTower() {
  try {
    const towers = await sql`
      SELECT id, name, target_ip, status, created_at 
      FROM network_towers 
      WHERE name ILIKE '%test%' 
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    
    console.log('Test towers:');
    towers.forEach(t => {
      console.log(`ID: ${t.id}, Name: ${t.name}, IP: ${t.target_ip}, Status: ${t.status}, Created: ${t.created_at}`);
    });
    
    await sql.end();
  } catch (e) {
    console.error('Error:', e);
    await sql.end();
  }
}

checkTestTower();
