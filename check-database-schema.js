import postgres from 'postgres';

const sql = postgres('postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT', {
  ssl: 'prefer'
});

async function checkTables() {
  console.log('📊 CHECKING YOUR POSTGRESQL DATABASE STRUCTURE 📊\n');
  
  try {
    // Check customers table
    console.log('🔍 CUSTOMERS TABLE COLUMNS:');
    const customersColumns = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'customers' 
      ORDER BY ordinal_position;
    `;
    customersColumns.forEach(col => console.log(`  • ${col.column_name} (${col.data_type})`));
    
    console.log('\n🔍 TASKS TABLE COLUMNS:');
    const tasksColumns = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' 
      ORDER BY ordinal_position;
    `;
    tasksColumns.forEach(col => console.log(`  • ${col.column_name} (${col.data_type})`));
    
    console.log('\n🔍 USERS TABLE COLUMNS:');
    const usersColumns = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `;
    usersColumns.forEach(col => console.log(`  • ${col.column_name} (${col.data_type})`));
    
    console.log('\n📈 TOTAL ROWS COUNT:');
    const customersCount = await sql`SELECT COUNT(*) as count FROM customers`;
    const tasksCount = await sql`SELECT COUNT(*) as count FROM tasks`;
    const usersCount = await sql`SELECT COUNT(*) as count FROM users`;
    
    console.log(`  • Customers: ${customersCount[0].count} rows`);
    console.log(`  • Tasks: ${tasksCount[0].count} rows`);
    console.log(`  • Users: ${usersCount[0].count} rows`);
    
    await sql.end();
  } catch (error) {
    console.error('Error:', error.message);
    await sql.end();
  }
}

checkTables();