const postgres = require('postgres');
const sql = postgres('postgresql://appuser:jksdj%24%26%5E%26*YUG*%5E%25%26THJHIO4546GHG%26j@72.61.170.243:9095/WIZONEIT_SUPPORT');

async function check() {
  try {
    // Get all devices
    const devices = await sql`SELECT id, name, tower_id, ip_address, type FROM network_devices`;
    console.log('=== ALL DEVICES ===');
    devices.forEach(d => console.log(`ID: ${d.id}, Name: ${d.name}, tower_id: ${d.tower_id}, IP: ${d.ip_address}, Type: ${d.type}`));
    
    // Get MANGLOR TOWER
    const towers = await sql`SELECT id, name FROM network_towers WHERE name ILIKE '%MANGLOR%'`;
    console.log('\n=== MANGLOR TOWER ===');
    towers.forEach(t => console.log(`ID: ${t.id}, Name: ${t.name}`));
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
