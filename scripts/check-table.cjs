const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT'
});

async function checkTableStructure() {
  try {
    // Check if network_towers table exists
    const tableCheckResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'network_towers'
    `);
    
    console.log('📋 Table exists:', tableCheckResult.rows.length > 0);
    
    if (tableCheckResult.rows.length > 0) {
      // Get table structure
      const structureResult = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'network_towers'
        ORDER BY ordinal_position
      `);
      
      console.log('\n📊 Table Structure:');
      structureResult.rows.forEach(column => {
        console.log(`  ${column.column_name}: ${column.data_type} ${column.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${column.column_default ? `DEFAULT ${column.column_default}` : ''}`);
      });
    }
    
    // Try to select any data
    try {
      const dataResult = await pool.query('SELECT COUNT(*) as count FROM network_towers');
      console.log(`\n📊 Total towers in database: ${dataResult.rows[0].count}`);
    } catch (error) {
      console.error('Error querying table data:', error.message);
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error checking table structure:', error);
    await pool.end();
  }
}

checkTableStructure();