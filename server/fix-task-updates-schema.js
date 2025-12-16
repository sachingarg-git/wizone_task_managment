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

async function fixTaskUpdatesSchema() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔧 Fixing task_updates table schema...');
    
    // Step 1: Add a new temporary column with TIMESTAMP type
    await pool.query(`
      ALTER TABLE task_updates 
      ADD COLUMN created_at_temp TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `);
    console.log('✅ Added temporary timestamp column');
    
    // Step 2: Copy existing data to the new column (converting time to today's date + time)
    await pool.query(`
      UPDATE task_updates 
      SET created_at_temp = CURRENT_DATE + created_at 
      WHERE created_at_temp IS NULL;
    `);
    console.log('✅ Copied existing data to temporary column');
    
    // Step 3: Drop the old column
    await pool.query(`
      ALTER TABLE task_updates 
      DROP COLUMN created_at;
    `);
    console.log('✅ Dropped old TIME column');
    
    // Step 4: Rename the temporary column to created_at
    await pool.query(`
      ALTER TABLE task_updates 
      RENAME COLUMN created_at_temp TO created_at;
    `);
    console.log('✅ Renamed temporary column to created_at');
    
    console.log('✅ Changed created_at column from TIME to TIMESTAMP');
    
    // Verify the change
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'task_updates'
      AND column_name = 'created_at';
    `);
    
    console.log('🔍 Verification:');
    console.log(`  created_at: ${columns.rows[0]?.data_type || 'NOT FOUND'}`);
    
    console.log('🎉 Schema fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Schema fix failed:', error);
  } finally {
    await pool.end();
  }
}

fixTaskUpdatesSchema();