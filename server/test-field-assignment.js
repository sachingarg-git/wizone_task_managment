import postgres from 'postgres';

// Test field engineer assignment
const sql = postgres('postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT', {
  ssl: false,
  connect_timeout: 30,
  max_connections: 20,
  debug: false
});

async function testFieldEngineerAssignment() {
  try {
    console.log('🔗 Testing field engineer assignment...');
    
    // Check the current task assignment
    const taskCheck = await sql`
      SELECT 
        id, 
        title, 
        assigned_to, 
        field_engineer_id, 
        field_engineer_name, 
        status,
        created_at,
        updated_at
      FROM tasks 
      WHERE id = 13
    `;
    
    console.log('📊 Current task assignment:', taskCheck[0]);
    
    // Check huzaifa user details
    const userCheck = await sql`
      SELECT id, username, first_name, last_name, role, active
      FROM users 
      WHERE id = 10
    `;
    
    console.log('👤 Huzaifa user details:', userCheck[0]);
    
    // Test the my-tasks filtering logic
    const allTasks = await sql`
      SELECT 
        id,
        title,
        assigned_to,
        field_engineer_id,
        field_engineer_name,
        status
      FROM tasks
    `;
    
    console.log('📋 All tasks in database:');
    allTasks.forEach(task => {
      console.log(`   - Task ${task.id}: "${task.title}"`);
      console.log(`     assigned_to: ${task.assigned_to}`);
      console.log(`     field_engineer_id: ${task.field_engineer_id}`);
      console.log(`     field_engineer_name: ${task.field_engineer_name}`);
      console.log(`     status: ${task.status}`);
      console.log('');
    });
    
    // Filter tasks for huzaifa (ID: 10)
    const huzaifaTasks = allTasks.filter(task => 
      task.assigned_to === 10 || task.field_engineer_id === 10
    );
    
    console.log(`🎯 Tasks for huzaifa (ID: 10): ${huzaifaTasks.length} found`);
    huzaifaTasks.forEach(task => {
      console.log(`   - Task ${task.id}: "${task.title}" (Status: ${task.status})`);
    });
    
    await sql.end();
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await sql.end();
    process.exit(1);
  }
}

// Run the test
testFieldEngineerAssignment();