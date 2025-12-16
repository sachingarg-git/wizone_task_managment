const { Pool } = require('pg');

const pool = new Pool({
  host: '103.122.85.61',
  port: 9095,
  database: 'WIZONEIT_SUPPORT',
  user: 'postgres',
  password: 'ss123456'
});

async function checkTasks() {
  try {
    const result = await pool.query(`
      SELECT id, ticket_number, customer_name, title, status, priority, 
             field_engineer_id, field_engineer_name, created_at 
      FROM tasks 
      ORDER BY created_at DESC
      LIMIT 20
    `);
    
    console.log('\n=== ACTUAL TASKS IN DATABASE ===\n');
    console.log(`Total Tasks: ${result.rows.length}\n`);
    
    result.rows.forEach(task => {
      console.log(`Task ID: ${task.ticket_number}`);
      console.log(`Title: ${task.title}`);
      console.log(`Customer: ${task.customer_name}`);
      console.log(`Status: ${task.status}`);
      console.log(`Priority: ${task.priority}`);
      console.log(`Assigned to: ${task.field_engineer_name} (ID: ${task.field_engineer_id})`);
      console.log(`Created: ${task.created_at}`);
      console.log('---');
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkTasks();
