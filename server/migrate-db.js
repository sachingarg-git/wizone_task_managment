import pkg from 'pg';
const { Pool } = pkg;

// Database configuration - using the same as the main application
const dbConfig = {
  host: '103.122.85.61',
  port: 9095,
  database: 'WIZONEIT_SUPPORT',
  user: 'postgres',
  password: 'ss123456'
};

async function addMissingColumns() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔄 Checking and adding missing columns...');
    
    // Add ticketNumber column to tasks table if it doesn't exist
    await pool.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS ticket_number VARCHAR UNIQUE;
    `);
    console.log('✅ Added ticket_number column to tasks table');
    
    // Add customerName column if it doesn't exist
    await pool.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS customer_name VARCHAR;
    `);
    console.log('✅ Added customer_name column to tasks table');
    
    // Add assignedToName column if it doesn't exist
    await pool.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS assigned_to_name VARCHAR;
    `);
    console.log('✅ Added assigned_to_name column to tasks table');
    
    // Add createdByName column if it doesn't exist
    await pool.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS created_by_name VARCHAR;
    `);
    console.log('✅ Added created_by_name column to tasks table');
    
    // Add category column if it doesn't exist
    await pool.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS category VARCHAR;
    `);
    console.log('✅ Added category column to tasks table');
    
    // Add estimatedHours column if it doesn't exist
    await pool.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(8,2);
    `);
    console.log('✅ Added estimated_hours column to tasks table');
    
    // Add actualHours column if it doesn't exist
    await pool.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(8,2);
    `);
    console.log('✅ Added actual_hours column to tasks table');
    
    // Add dueDate column if it doesn't exist
    await pool.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;
    `);
    console.log('✅ Added due_date column to tasks table');
    
    console.log('🎉 Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Database migration failed:', error);
  } finally {
    await pool.end();
  }
}

addMissingColumns();