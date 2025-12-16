import postgres from 'postgres';

const sql = postgres('postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT', {
  ssl: 'prefer'
});

async function clearAllData() {
  try {
    console.log('🗑️  CLEARING ALL DATA FROM WIZONEIT_SUPPORT DATABASE\n');
    
    // Get all tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    console.log('📋 Found tables:', tables.map(t => t.table_name).join(', '));
    console.log('\n🔄 Starting data deletion...\n');
    
    // Disable foreign key checks temporarily
    await sql`SET session_replication_role = 'replica'`;
    
    // Delete data from each table
    for (const table of tables) {
      const tableName = table.table_name;
      
      try {
        // Get count before deletion
        const beforeCount = await sql`SELECT COUNT(*) as count FROM ${sql(tableName)}`;
        
        // Delete all rows
        await sql`DELETE FROM ${sql(tableName)}`;
        
        console.log(`  ✅ Cleared ${tableName} (${beforeCount[0].count} rows deleted)`);
      } catch (err) {
        console.log(`  ⚠️  Error clearing ${tableName}: ${err.message}`);
      }
    }
    
    // Re-enable foreign key checks
    await sql`SET session_replication_role = 'origin'`;
    
    console.log('\n✅ ALL DATA CLEARED SUCCESSFULLY!\n');
    
    // Verify deletion
    console.log('🔍 Verification - Current row counts:');
    for (const table of tables) {
      const tableName = table.table_name;
      try {
        const count = await sql`SELECT COUNT(*) as count FROM ${sql(tableName)}`;
        console.log(`  • ${tableName}: ${count[0].count} rows`);
      } catch (err) {
        console.log(`  • ${tableName}: Error checking`);
      }
    }
    
    await sql.end();
    console.log('\n🎉 Database cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sql.end();
    process.exit(1);
  }
}

clearAllData();
