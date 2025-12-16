import postgres from 'postgres';

const sql = postgres('postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT', {
  ssl: 'prefer'
});

async function checkDetailedDatabase() {
  try {
    console.log('🔍 DETAILED DATABASE INVESTIGATION\n');
    
    // Get all tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('📋 ALL TABLES IN DATABASE:');
    tables.forEach(t => console.log('  •', t.table_name));
    
    // Get detailed counts
    console.log('\n📊 DETAILED ROW COUNTS:');
    const customerCount = await sql`SELECT COUNT(*) as count FROM customers`;
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    const taskCount = await sql`SELECT COUNT(*) as count FROM tasks`;
    
    console.log('  • Customers:', customerCount[0].count);
    console.log('  • Users:', userCount[0].count);
    console.log('  • Tasks:', taskCount[0].count);
    
    try {
      const taskUpdateCount = await sql`SELECT COUNT(*) as count FROM task_updates`;
      console.log('  • Task Updates:', taskUpdateCount[0].count);
    } catch(e) {
      console.log('  • Task Updates: Table not found');
    }
    
    try {
      const sessionCount = await sql`SELECT COUNT(*) as count FROM sessions`;
      console.log('  • Sessions:', sessionCount[0].count);
    } catch(e) {
      console.log('  • Sessions: Table not found');
    }
    
    // Get recent customers
    console.log('\n🕐 RECENT CUSTOMERS (Last 10):');
    const recentCustomers = await sql`
      SELECT customer_id, name, created_at 
      FROM customers 
      ORDER BY created_at DESC 
      LIMIT 10
    `;
    recentCustomers.forEach(c => console.log(`  • ${c.customer_id} - ${c.name} (Created: ${c.created_at})`));
    
    // Get all users
    console.log('\n👥 ALL USERS:');
    const allUsers = await sql`
      SELECT id, username, role, created_at 
      FROM users 
      ORDER BY created_at DESC
    `;
    allUsers.forEach(u => console.log(`  • ID:${u.id} - ${u.username} (${u.role}) - Created: ${u.created_at}`));
    
    // Database info
    console.log('\n🗄️ DATABASE INFO:');
    const dbInfo = await sql`SELECT current_database(), current_user, version()`;
    console.log('  • Current Database:', dbInfo[0].current_database);
    console.log('  • Current User:', dbInfo[0].current_user);
    console.log('  • PostgreSQL Version:', dbInfo[0].version.split(',')[0]);
    
    // Check if there are any other databases
    console.log('\n🗃️ ALL DATABASES ON THIS SERVER:');
    const databases = await sql`
      SELECT datname, pg_size_pretty(pg_database_size(datname)) as size
      FROM pg_database 
      WHERE datistemplate = false
      ORDER BY datname
    `;
    databases.forEach(db => console.log(`  • ${db.datname} (Size: ${db.size})`));
    
    await sql.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sql.end();
    process.exit(1);
  }
}

checkDetailedDatabase();
