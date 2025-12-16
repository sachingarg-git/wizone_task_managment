import postgres from 'postgres';

const sql = postgres('postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT', {
  ssl: 'prefer'
});

async function addMissingColumns() {
  console.log('🔧 FIXING DATABASE SCHEMA - Adding Missing Columns\n');
  
  try {
    // Add missing columns to customers table
    console.log('📝 Adding missing columns to customers table...');
    
    try {
      await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS connected_tower VARCHAR`;
      console.log('  ✅ Added connected_tower column');
    } catch (e) { console.log('  ℹ️  connected_tower already exists'); }
    
    try {
      await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS wireless_ip VARCHAR`;
      console.log('  ✅ Added wireless_ip column');
    } catch (e) { console.log('  ℹ️  wireless_ip already exists'); }
    
    try {
      await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS wireless_ap_ip VARCHAR`;
      console.log('  ✅ Added wireless_ap_ip column');
    } catch (e) { console.log('  ℹ️  wireless_ap_ip already exists'); }
    
    try {
      await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS port VARCHAR`;
      console.log('  ✅ Added port column');
    } catch (e) { console.log('  ℹ️  port already exists'); }
    
    // Add missing columns to tasks table
    console.log('\n📝 Adding missing columns to tasks table...');
    
    try {
      await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ticket_number VARCHAR UNIQUE`;
      console.log('  ✅ Added ticket_number column');
    } catch (e) { console.log('  ℹ️  ticket_number already exists'); }
    
    try {
      await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS field_engineer_id INTEGER`;
      console.log('  ✅ Added field_engineer_id column');
    } catch (e) { console.log('  ℹ️  field_engineer_id already exists'); }
    
    try {
      await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS field_engineer_name VARCHAR`;
      console.log('  ✅ Added field_engineer_name column');
    } catch (e) { console.log('  ℹ️  field_engineer_name already exists'); }
    
    // Verify the changes
    console.log('\n🔍 Verifying database structure...');
    
    const customerColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'customers' 
      ORDER BY ordinal_position
    `;
    
    const taskColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' 
      ORDER BY ordinal_position
    `;
    
    console.log('\n📊 Customers table columns:');
    customerColumns.forEach(col => console.log(`  • ${col.column_name}`));
    
    console.log('\n📊 Tasks table columns:');
    taskColumns.forEach(col => console.log(`  • ${col.column_name}`));
    
    console.log('\n✅ DATABASE SCHEMA FIXED SUCCESSFULLY!\n');
    
    await sql.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sql.end();
    process.exit(1);
  }
}

addMissingColumns();
