const postgres = require('postgres');

const sql = postgres('postgresql://wizoneit:wizone123@103.122.85.61:9095/WIZONEIT_SUPPORT', {
  ssl: false,
  max: 1
});

async function checkStats() {
  try {
    console.log('📊 Checking task statistics from database...\n');
    
    // Get all tasks with their status
    const allTasks = await sql`
      SELECT id, ticket_number, status, customer_name, assigned_to_name, field_engineer_name
      FROM tasks
      ORDER BY created_at DESC
    `;
    
    console.log(`Total tasks in database: ${allTasks.length}`);
    console.log('\nTask breakdown by status:');
    
    const statusCounts = {};
    allTasks.forEach(task => {
      const status = task.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    Object.keys(statusCounts).forEach(status => {
      console.log(`  ${status}: ${statusCounts[status]}`);
    });
    
    console.log('\nAll tasks:');
    allTasks.forEach(task => {
      console.log(`  - ${task.ticket_number}: ${task.status} (${task.customer_name})`);
    });
    
    // Now test the query used by getDashboardStats
    console.log('\n📈 Testing dashboard stats query...');
    const stats = await sql`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_tasks,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_tasks
      FROM tasks
    `;
    
    console.log('\nDashboard stats result:');
    console.log(stats[0]);
    
    await sql.end();
    console.log('\n✅ Check complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

checkStats();
