const sql = require('mssql');

const config = {
  user: 'aboraborr',
  password: 'Aborabor@2025',
  server: '72.61.170.243',
  port: 9095,
  database: 'WIZONEIT_SUPPORT',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

async function debug() {
  try {
    await sql.connect(config);
    console.log('Connected to database\n');

    // Get sample tasks with assignment info
    const tasksResult = await sql.query`
      SELECT TOP 10 
        id, 
        ticket_number,
        title,
        status,
        assigned_to,
        field_engineer_id,
        customer_id
      FROM tasks 
      WHERE assigned_to IS NOT NULL OR field_engineer_id IS NOT NULL
    `;
    
    console.log('=== TASKS WITH ASSIGNMENTS ===');
    tasksResult.recordset.forEach(task => {
      console.log(`Task ID: ${task.id} (type: ${typeof task.id})`);
      console.log(`  assigned_to: ${task.assigned_to} (type: ${typeof task.assigned_to})`);
      console.log(`  field_engineer_id: ${task.field_engineer_id} (type: ${typeof task.field_engineer_id})`);
      console.log(`  status: ${task.status}`);
      console.log('');
    });

    // Get sample users
    const usersResult = await sql.query`
      SELECT TOP 10 
        id, 
        username,
        first_name,
        role
      FROM users 
      WHERE role = 'engineer' OR role = 'field_engineer'
    `;
    
    console.log('\n=== ENGINEERS ===');
    usersResult.recordset.forEach(user => {
      console.log(`User ID: ${user.id} (type: ${typeof user.id}), username: ${user.username}, role: ${user.role}`);
    });

    // Check if any tasks are actually assigned
    const countResult = await sql.query`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN assigned_to IS NOT NULL THEN 1 ELSE 0 END) as with_assigned_to,
        SUM(CASE WHEN field_engineer_id IS NOT NULL THEN 1 ELSE 0 END) as with_field_engineer
      FROM tasks
    `;
    
    console.log('\n=== TASK ASSIGNMENT STATS ===');
    console.log(countResult.recordset[0]);

    // Check if assigned_to values match user IDs
    const matchResult = await sql.query`
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
    `;
    
    console.log('\n=== TASK-USER MATCHES (sample) ===');
    matchResult.recordset.slice(0, 10).forEach(row => {
      console.log(`Task ${row.task_id}: assigned_to=${row.assigned_to} (${row.assigned_to_user || 'NO MATCH'}), field_engineer=${row.field_engineer_id} (${row.field_engineer_user || 'NO MATCH'})`);
    });

    await sql.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

debug();
