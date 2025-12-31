const postgres = require('postgres');

const sql = postgres('postgresql://appuser:jksdj%24%26%5E%26*YUG*%5E%25%26THJHIO4546GHG%26j@72.61.170.243:9095/WIZONEIT_SUPPORT', { ssl: false });

async function simulateFrontend() {
  try {
    console.log('Simulating frontend logic...\n');

    // Get users (like frontend does)
    const users = await sql`SELECT * FROM users`;
    console.log(`Total users: ${users.length}`);
    
    // Filter engineers (like frontend does)
    const engineers = users.filter(u => 
      u.role === 'field_engineer' || 
      u.role === 'engineer' || 
      u.role === 'manager' ||
      u.role === 'admin'
    );
    console.log(`Engineers (after filter): ${engineers.length}`);

    // Get tasks (like frontend does)
    const tasks = await sql`SELECT * FROM tasks`;
    console.log(`Total tasks: ${tasks.length}\n`);

    // Simulate engineer report calculation
    console.log('=== ENGINEER TASK COUNTS ===');
    engineers.forEach(engineer => {
      const engineerId = Number(engineer.id);
      const engineerTasks = tasks.filter(task => {
        const assignedTo = Number(task.assigned_to || 0);
        const fieldEngineerId = Number(task.field_engineer_id || 0);
        return assignedTo === engineerId || fieldEngineerId === engineerId;
      });
      
      if (engineerTasks.length > 0) {
        console.log(`${engineer.first_name} ${engineer.last_name} (${engineer.username}, ID: ${engineer.id}): ${engineerTasks.length} tasks`);
      }
    });

    // Show sample task with assignment info
    console.log('\n=== SAMPLE TASK DATA ===');
    const sampleTask = tasks.find(t => t.assigned_to || t.field_engineer_id);
    if (sampleTask) {
      console.log('Task:', {
        id: sampleTask.id,
        assigned_to: sampleTask.assigned_to,
        assigned_to_type: typeof sampleTask.assigned_to,
        field_engineer_id: sampleTask.field_engineer_id,
        field_engineer_id_type: typeof sampleTask.field_engineer_id
      });
    }

    await sql.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

simulateFrontend();
