import { Client } from 'pg';

const client = new Client({
  connectionString: 'postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT'
});

async function checkTasks() {
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // First, let's see what columns exist
    const columnsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks'
      ORDER BY ordinal_position
    `);
    
    console.log('\n� COLUMNS IN TASKS TABLE:');
    columnsResult.rows.forEach(col => {
      console.log(`- ${col.column_name}`);
    });
    
    // Get all tasks with their assignments
    const tasksResult = await client.query('SELECT * FROM tasks ORDER BY id LIMIT 5');
    console.log('\n📝 SAMPLE TASKS IN DATABASE:');
    if (tasksResult.rows.length > 0) {
      console.log('First task structure:', JSON.stringify(tasksResult.rows[0], null, 2));
    }
    
    // Get user info for huzaifa
    const userResult = await client.query('SELECT id, username, role FROM users WHERE username = $1', ['huzaifa']);
    console.log('\n👤 HUZAIFA USER INFO:');
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log(`ID: ${user.id}, Username: ${user.username}, Role: ${user.role}`);
      
      // Find tasks assigned to huzaifa
      const huzaifaTasks = tasksResult.rows.filter(task => 
        task.fieldEngineerId === user.id || 
        task.assignedTo === user.id ||
        String(task.fieldEngineerId) === String(user.id) ||
        String(task.assignedTo) === String(user.id)
      );
      
      console.log(`\n🎯 TASKS THAT SHOULD BE VISIBLE TO HUZAIFA (ID: ${user.id}):`);
      if (huzaifaTasks.length === 0) {
        console.log('❌ NO TASKS ASSIGNED TO HUZAIFA');
        console.log('✅ This is correct - huzaifa should see 0 tasks, not 3');
      } else {
        huzaifaTasks.forEach(task => {
          console.log(`- Task ${task.id}: ${task.title} (FieldEngineerID: ${task.fieldEngineerId}, AssignedTo: ${task.assignedTo})`);
        });
      }
    } else {
      console.log('❌ Huzaifa user not found');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await client.end();
  }
}

checkTasks();