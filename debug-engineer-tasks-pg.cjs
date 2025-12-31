const postgres = require('postgres');

// Use the same connection string as debug-reports.cjs
const sql = postgres('postgresql://appuser:jksdj%24%26%5E%26*YUG*%5E%25%26THJHIO4546GHG%26j@72.61.170.243:9095/WIZONEIT_SUPPORT', { ssl: false });

async function debug() {
  try {
    console.log('Connected to database\n');

    // Get sample tasks with assignment info
    const tasksResult = await sql`
      SELECT 
        id, 
        ticket_number,
        title,
        status,
        assigned_to,
        field_engineer_id,
        customer_id
      FROM tasks 
      WHERE assigned_to IS NOT NULL OR field_engineer_id IS NOT NULL
      LIMIT 10
    `;
    
    console.log('=== TASKS WITH ASSIGNMENTS ===');
    tasksResult.forEach(task => {
      console.log(`Task ID: ${task.id} (type: ${typeof task.id})`);
      console.log(`  assigned_to: ${task.assigned_to} (type: ${typeof task.assigned_to})`);
      console.log(`  field_engineer_id: ${task.field_engineer_id} (type: ${typeof task.field_engineer_id})`);
      console.log(`  status: ${task.status}`);
      console.log('');
    });

    // Get sample users (engineers)
    const usersResult = await sql`
      SELECT 
        id, 
        username,
        first_name,
        role
      FROM users 
      WHERE role = 'engineer' OR role = 'field_engineer'
      LIMIT 10
    `;
    
    console.log('\n=== ENGINEERS ===');
    usersResult.forEach(user => {
      console.log(`User ID: ${user.id} (type: ${typeof user.id}), username: ${user.username}, role: ${user.role}`);
    });

    // Check if any tasks are actually assigned
    const countResult = await sql`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN assigned_to IS NOT NULL THEN 1 ELSE 0 END) as with_assigned_to,
        SUM(CASE WHEN field_engineer_id IS NOT NULL THEN 1 ELSE 0 END) as with_field_engineer
      FROM tasks
    `;
    
    console.log('\n=== TASK ASSIGNMENT STATS ===');
    console.log(countResult[0]);

    // Check if assigned_to values match user IDs
    const matchResult = await sql`
      SELECT 
        t.id as task_id,
        t.assigned_to,
        t.field_engineer_id,
        u1.username as assigned_to_user,
        u2.username as field_engineer_user
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.field_engineer_id = u2.id
      WHERE t.assigned_to IS NOT NULL OR t.field_engineer_id IS NOT NULL
      LIMIT 10
    `;
    
    console.log('\n=== TASK-USER MATCHES (sample) ===');
    matchResult.forEach(row => {
      console.log(`Task ${row.task_id}: assigned_to=${row.assigned_to} (${row.assigned_to_user || 'NO MATCH'}), field_engineer=${row.field_engineer_id} (${row.field_engineer_user || 'NO MATCH'})`);
    });

    // Also check what engineers exist
    const allUsersResult = await sql`
      SELECT id, username, first_name, last_name, role 
      FROM users 
      ORDER BY id
    `;
    
    console.log('\n=== ALL USERS ===');
    allUsersResult.forEach(user => {
      console.log(`ID: ${user.id}, ${user.first_name} ${user.last_name} (${user.username}), role: ${user.role}`);
    });

    await sql.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

debug();
