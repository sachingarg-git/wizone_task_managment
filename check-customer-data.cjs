const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT'
});

async function checkCustomerData() {
  await client.connect();
  
  console.log('\n🔍 Checking tasks with customer data...\n');
  
  const result = await client.query(`
    SELECT 
      t.id,
      t.ticket_number,
      t.customer_id,
      t.customer_name,
      c.id as customer_table_id,
      c.name as customer_table_name
    FROM tasks t
    LEFT JOIN customers c ON t.customer_id = c.id
    LIMIT 5
  `);
  
  console.log('Sample tasks with customer data:');
  console.table(result.rows);
  
  await client.end();
}

checkCustomerData().catch(console.error);
