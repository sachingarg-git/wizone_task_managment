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

async function checkCustomerData() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔍 Checking customer data for IP fields...');
    
    // Get a few customers to see what data exists
    const result = await pool.query(`
      SELECT 
        id, name, wireless_ip, wireless_ap_ip, 
        address, city, service_plan, connected_tower
      FROM customers 
      WHERE name ILIKE '%GULMOHAR%' OR name ILIKE '%SOCIETY%'
      LIMIT 5;
    `);
    
    console.log('📊 Customer data found:');
    result.rows.forEach((customer, index) => {
      console.log(`\n${index + 1}. Customer: ${customer.name}`);
      console.log(`   ID: ${customer.id}`);
      console.log(`   Address: ${customer.address}`);
      console.log(`   City: ${customer.city}`);
      console.log(`   Service Plan: ${customer.service_plan}`);
      console.log(`   Connected Tower: ${customer.connected_tower}`);
      console.log(`   Wireless IP: ${customer.wireless_ip || 'NULL/EMPTY'}`);
      console.log(`   Wireless AP IP: ${customer.wireless_ap_ip || 'NULL/EMPTY'}`);
    });

    // Also check if any customers have these IP fields populated
    const ipCheck = await pool.query(`
      SELECT COUNT(*) as total_customers,
             COUNT(wireless_ip) as customers_with_wireless_ip,
             COUNT(wireless_ap_ip) as customers_with_ap_ip
      FROM customers;
    `);
    
    console.log('\n📈 IP Field Statistics:');
    console.log(`   Total customers: ${ipCheck.rows[0].total_customers}`);
    console.log(`   Customers with Wireless IP: ${ipCheck.rows[0].customers_with_wireless_ip}`);
    console.log(`   Customers with AP IP: ${ipCheck.rows[0].customers_with_ap_ip}`);
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await pool.end();
  }
}

checkCustomerData();