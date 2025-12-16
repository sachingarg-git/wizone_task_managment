import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL || 'postgresql://postgres:wizone123@localhost:5432/tasktracker');

async function checkTaskUpdatesSchema() {
  try {
    const result = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'task_updates' 
      ORDER BY ordinal_position
    `;
    
    console.log('task_updates table columns:');
    result.forEach(row => console.log(' -', row.column_name));
    
    // Also check if the table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'task_updates'
      )
    `;
    
    console.log('\nTable exists:', tableExists[0].exists);
    
  } catch (error) {
    console.error('Error checking schema:', error.message);
  } finally {
    await sql.end();
  }
}

checkTaskUpdatesSchema();