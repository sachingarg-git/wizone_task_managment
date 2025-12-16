import pkg from 'pg';
const { Pool } = pkg;

// Database configuration
const dbConfig = {
  host: '103.122.85.61',
  port: 9095,
  database: 'WIZONEIT_SUPPORT',
  user: 'postgres',
  password: 'ss123456'
};

async function checkTaskUpdatesSchema() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔍 Checking task_updates table schema...');
    
    // Check if task_updates table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'task_updates'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ task_updates table does not exist');
      return;
    }
    
    // Get column information for task_updates table
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'task_updates'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 task_updates table columns:');
    columns.rows.forEach((col, index) => {
      console.log(`  ${index + 1}. ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // Check specifically for any 'time' type columns
    const timeColumns = columns.rows.filter(col => col.data_type === 'time without time zone' || col.data_type === 'time');
    if (timeColumns.length > 0) {
      console.log('⚠️ Found TIME columns (should be TIMESTAMP):');
      timeColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('✅ No TIME columns found');
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error);
  } finally {
    await pool.end();
  }
}

checkTaskUpdatesSchema();