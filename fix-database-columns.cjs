const { Pool } = require('pg');

const pool = new Pool({
  host: '103.122.85.61',
  port: 9095,
  database: 'WIZONEIT_SUPPORT',
  user: 'postgres',
  password: 'ss123456'
});

async function fixDatabase() {
  try {
    console.log('🔧 Starting database column fixes...\n');

    // Step 1: Add completion_time column if it doesn't exist
    console.log('➡️  Adding completion_time column...');
    await pool.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS completion_time timestamp with time zone
    `);
    console.log('✅ completion_time column added\n');

    // Step 2: Convert timestamp columns to timestamptz
    console.log('➡️  Converting timestamp columns to timestamptz...');
    
    await pool.query(`
      ALTER TABLE tasks 
      ALTER COLUMN created_at TYPE timestamp with time zone USING created_at AT TIME ZONE 'UTC'
    `);
    console.log('✅ created_at converted to timestamptz');
    
    await pool.query(`
      ALTER TABLE tasks 
      ALTER COLUMN updated_at TYPE timestamp with time zone USING updated_at AT TIME ZONE 'UTC'
    `);
    console.log('✅ updated_at converted to timestamptz');
    
    await pool.query(`
      ALTER TABLE tasks 
      ALTER COLUMN due_date TYPE timestamp with time zone USING due_date AT TIME ZONE 'UTC'
    `);
    console.log('✅ due_date converted to timestamptz');

    // Step 3: Verify the changes
    console.log('\n➡️  Verifying column changes...');
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'tasks' 
        AND column_name IN ('created_at', 'updated_at', 'due_date', 'completion_time')
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Updated columns:');
    console.log('━'.repeat(70));
    result.rows.forEach(row => {
      console.log(`  ${row.column_name.padEnd(25)} ${row.data_type.padEnd(35)} ${row.is_nullable}`);
    });
    console.log('━'.repeat(70));

    // Step 4: Check tasks data
    console.log('\n➡️  Checking tasks data...');
    const tasksResult = await pool.query('SELECT id, ticket_number, title, created_at FROM tasks ORDER BY id');
    console.log(`\n📊 Found ${tasksResult.rows.length} tasks in database:`);
    tasksResult.rows.forEach(task => {
      console.log(`  ID: ${task.id}, Ticket: ${task.ticket_number}, Title: ${task.title}`);
    });

    console.log('\n✅ Database migration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error during migration:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

fixDatabase();
