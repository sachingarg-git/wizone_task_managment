import postgres from 'postgres';

// Updated database connection using the provided credentials
const sql = postgres('postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT', {
  ssl: false,
  connect_timeout: 30,
  max_connections: 20,
  debug: false
});

async function assignTaskToFieldEngineer() {
  try {
    console.log('🔗 Connecting to PostgreSQL database...');
    
    // Update task 13 to assign it to huzaifa (ID: 10)
    const result = await sql`
      UPDATE tasks 
      SET 
        field_engineer_id = 10,
        field_engineer_name = 'HUZAIFA RAO',
        status = 'in-progress',
        updated_at = NOW()
      WHERE id = 13
      RETURNING id, title, field_engineer_id, field_engineer_name, status
    `;
    
    console.log('✅ Task assignment result:', result);
    
    // Verify the assignment
    const taskCheck = await sql`
      SELECT id, title, assigned_to, field_engineer_id, field_engineer_name, status 
      FROM tasks 
      WHERE id = 13
    `;
    
    console.log('📊 Task verification:', taskCheck);
    
    console.log('🎉 Field engineer assignment completed successfully!');
    
    await sql.end();
  } catch (error) {
    console.error('❌ Assignment failed:', error.message);
    console.error(error);
    await sql.end();
    process.exit(1);
  }
}

// Run the assignment
assignTaskToFieldEngineer();