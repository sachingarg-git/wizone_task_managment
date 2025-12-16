const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT',
  ssl: false
});

async function checkTasks() {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        ticket_number, 
        status, 
        field_engineer_id,
        CASE 
          WHEN status IN ('pending', 'in_progress') THEN 'Active'
          WHEN status IN ('completed', 'resolved', 'cancelled') AND status != 'approved' THEN 'Completed'
          WHEN status = 'approved' THEN 'Approved'
          WHEN status = 'rejected' THEN 'Rejected'
        END as section
      FROM tasks 
      ORDER BY id
    `);
    
    console.log('\n=== TASK SECTIONS BREAKDOWN ===\n');
    console.log('Total tasks:', result.rows.length);
    
    // Group by section
    const sections = {
      'Active': [],
      'Completed': [],
      'Approved': [],
      'Rejected': []
    };
    
    result.rows.forEach(task => {
      if (task.section) {
        sections[task.section].push(task);
      }
    });
    
    // Display each section
    Object.keys(sections).forEach(sectionName => {
      console.log(`\n--- ${sectionName} Tasks (${sections[sectionName].length}) ---`);
      sections[sectionName].forEach(task => {
        console.log(`  ID: ${task.id}, Ticket: ${task.ticket_number}, Status: ${task.status}, Field Engineer: ${task.field_engineer_id || 'none'}`);
      });
    });
    
    // Show which would be HIDDEN by field engineer filter
    console.log('\n=== FIELD ENGINEER FILTERING ===\n');
    const withFieldEngineer = result.rows.filter(t => t.field_engineer_id);
    const withoutFieldEngineer = result.rows.filter(t => !t.field_engineer_id);
    
    console.log(`Tasks WITH field_engineer_id (HIDDEN from web): ${withFieldEngineer.length}`);
    withFieldEngineer.forEach(task => {
      console.log(`  - ID: ${task.id}, Ticket: ${task.ticket_number}, Status: ${task.status}, Section: ${task.section}`);
    });
    
    console.log(`\nTasks WITHOUT field_engineer_id (VISIBLE on web): ${withoutFieldEngineer.length}`);
    withoutFieldEngineer.forEach(task => {
      console.log(`  - ID: ${task.id}, Ticket: ${task.ticket_number}, Status: ${task.status}, Section: ${task.section}`);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkTasks();
