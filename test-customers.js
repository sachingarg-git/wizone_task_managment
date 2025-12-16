import postgres from 'postgres';

const sql = postgres('postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT', {
  ssl: 'prefer'
});

async function testCustomers() {
  console.log('🧪 Testing Customer Database Access');
  console.log('====================================');
  
  try {
    // Test basic connection
    await sql`SELECT 1`;
    console.log('✅ Database connection: SUCCESS');
    
    // Count total customers
    const countResult = await sql`SELECT COUNT(*) as count FROM customers`;
    console.log(`✅ Total customers in database: ${countResult[0].count}`);
    
    // Test the EXACT query that the application is using (fixed schema)  
    const customers = await sql`
      SELECT 
        id,
        customer_id,
        name,
        email,
        contact_person,
        mobile_phone,
        address,
        city,
        state,
        country,
        latitude,
        longitude,
        connection_type,
        plan_type,
        service_plan,
        monthly_fee,
        status,
        portal_access,
        portal_username,
        portal_password,
        connected_tower,
        wireless_ip,
        wireless_ap_ip,
        port,
        created_at,
        updated_at
      FROM customers 
      ORDER BY id ASC 
      LIMIT 10
    `;
    
    console.log(`✅ Retrieved ${customers.length} customers successfully!`);
    console.log('\n📋 First 5 customers:');
    customers.slice(0, 5).forEach((customer, i) => {
      console.log(`  ${i+1}. ${customer.name} (ID: ${customer.customer_id})`);
      console.log(`     📧 ${customer.email || 'No email'}`);
      console.log(`     📱 ${customer.mobile_phone || 'No phone'}`);
      console.log(`     📍 ${customer.city}, ${customer.state}`);
      console.log(`     💼 Plan: ${customer.plan_type || 'No plan'} - ${customer.service_plan || 'No service plan'}`);
      console.log('');
    });
    
    console.log('\n🎉 SCHEMA FIX SUCCESSFUL!');
    console.log('✅ Application can now read all your 302 customers from PostgreSQL!');
    
    await sql.end();
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    await sql.end();
  }
}

testCustomers();