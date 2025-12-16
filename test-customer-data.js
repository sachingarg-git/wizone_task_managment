import postgres from 'postgres';

const sql = postgres('postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT', {
  ssl: 'prefer'
});

async function testCustomerData() {
  try {
    console.log('🧪 TESTING CUSTOMER DATA FROM POSTGRESQL 🧪\n');
    
    // Get customer count
    const customerCount = await sql`SELECT COUNT(*) as count FROM customers`;
    console.log(`📊 Total customers in database: ${customerCount[0].count}`);
    
    // Get first 5 customers with all relevant columns
    console.log('\n🔍 First 5 customers from your database:');
    const customers = await sql`
      SELECT 
        id, 
        customer_id, 
        name, 
        email, 
        contact_person,
        mobile_phone,
        city,
        state,
        plan_type,
        status,
        created_at
      FROM customers 
      ORDER BY id 
      LIMIT 5
    `;
    
    customers.forEach((customer, index) => {
      console.log(`\n${index + 1}. ${customer.name}`);
      console.log(`   ID: ${customer.id} | Customer ID: ${customer.customer_id}`);
      console.log(`   Contact: ${customer.contact_person} (${customer.mobile_phone})`);
      console.log(`   Location: ${customer.city}, ${customer.state}`);
      console.log(`   Plan: ${customer.plan_type} | Status: ${customer.status}`);
      console.log(`   Email: ${customer.email || 'Not provided'}`);
    });
    
    console.log('\n✅ DATABASE TEST COMPLETED - Your data is ready!');
    console.log('🎯 Now you just need to login to see all 302 customers!');
    
    await sql.end();
  } catch (error) {
    console.error('❌ Error testing customer data:', error);
    await sql.end();
  }
}

testCustomerData();