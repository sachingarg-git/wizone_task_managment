import postgres from 'postgres';

// Updated database connection using the provided credentials
const sql = postgres('postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT', {
  ssl: false,
  connect_timeout: 30,
  max_connections: 20,
  debug: false
});

async function addFieldEngineerColumns() {
  try {
    console.log('🔗 Connecting to PostgreSQL database...');
    
    // Check if columns already exist
    const checkColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' 
      AND column_name IN ('field_engineer_id', 'field_engineer_name')
    `;
    
    const existingColumns = checkColumns.map(row => row.column_name);
    console.log('📋 Existing field engineer columns:', existingColumns);
    
    // Add field_engineer_id column if it doesn't exist
    if (!existingColumns.includes('field_engineer_id')) {
      console.log('➕ Adding field_engineer_id column...');
      await sql`
        ALTER TABLE tasks 
        ADD COLUMN field_engineer_id INTEGER REFERENCES users(id)
      `;
      console.log('✅ field_engineer_id column added successfully');
    } else {
      console.log('⚠️ field_engineer_id column already exists');
    }
    
    // Add field_engineer_name column if it doesn't exist
    if (!existingColumns.includes('field_engineer_name')) {
      console.log('➕ Adding field_engineer_name column...');
      await sql`
        ALTER TABLE tasks 
        ADD COLUMN field_engineer_name VARCHAR(255)
      `;
      console.log('✅ field_engineer_name column added successfully');
    } else {
      console.log('⚠️ field_engineer_name column already exists');
    }
    
    // Verify the columns were added
    const updatedColumns = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' 
      AND column_name IN ('field_engineer_id', 'field_engineer_name')
      ORDER BY column_name
    `;
    
    console.log('📊 Updated field engineer columns:');
    updatedColumns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    console.log('🎉 Migration completed successfully!');
    
    await sql.end();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    await sql.end();
    process.exit(1);
  }
}

// Run the migration
addFieldEngineerColumns();