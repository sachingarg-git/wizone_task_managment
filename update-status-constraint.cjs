const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT',
  ssl: false
});

async function updateStatusConstraint() {
  try {
    console.log('🔧 Updating task status constraint...');
    
    // Drop the existing constraint
    await pool.query(`
      ALTER TABLE tasks 
      DROP CONSTRAINT IF EXISTS tasks_status_check;
    `);
    console.log('✅ Dropped old status constraint');
    
    // Add new constraint with approved and rejected
    await pool.query(`
      ALTER TABLE tasks 
      ADD CONSTRAINT tasks_status_check 
      CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled', 'resolved', 'approved', 'rejected'));
    `);
    console.log('✅ Added new status constraint with approved and rejected');
    
    // Verify the constraint
    const result = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conname = 'tasks_status_check';
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Constraint verified:');
      console.log('   Name:', result.rows[0].conname);
      console.log('   Definition:', result.rows[0].definition);
    }
    
    console.log('🎉 Status constraint update completed successfully!');
  } catch (error) {
    console.error('❌ Error updating status constraint:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

updateStatusConstraint();
