import pkg from 'pg';
const { Pool } = pkg;

// Database configuration - using the same as the main application
const dbConfig = {
  host: '103.122.85.61',
  port: 9095,
  database: 'WIZONEIT_SUPPORT',
  user: 'postgres',
  password: 'ss123456'
};

async function updateGulmoharSocietyIPs() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔄 Updating GULMOHAR SOCIETY IP addresses...');
    
    // Update GULMOHAR SOCIETY with sample IP addresses
    const result = await pool.query(`
      UPDATE customers 
      SET 
        wireless_ip = '192.168.1.100',
        wireless_ap_ip = '192.168.1.1'
      WHERE name ILIKE '%GULMOHAR%SOCIETY%'
      RETURNING id, name, wireless_ip, wireless_ap_ip;
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Updated GULMOHAR SOCIETY IP addresses:');
      result.rows.forEach(customer => {
        console.log(`   Customer: ${customer.name}`);
        console.log(`   Wireless IP: ${customer.wireless_ip}`);
        console.log(`   AP IP: ${customer.wireless_ap_ip}`);
      });
    } else {
      console.log('❌ No GULMOHAR SOCIETY customer found to update');
    }
    
  } catch (error) {
    console.error('❌ Database update failed:', error);
  } finally {
    await pool.end();
  }
}

updateGulmoharSocietyIPs();