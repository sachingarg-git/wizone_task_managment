const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT'
});

async function checkTables() {
  try {
    // List all tables
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('All tables in database:');
    tables.rows.forEach(row => console.log('  -', row.table_name));
    
    // Check for bot-related tables
    const botTables = tables.rows.filter(row => 
      row.table_name.includes('bot') || 
      row.table_name.includes('telegram') || 
      row.table_name.includes('notification')
    );
    
    console.log('\nBot-related tables:');
    botTables.forEach(row => console.log('  -', row.table_name));
    
    // Check bot_configurations structure
    console.log('\nbot_configurations table structure:');
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'bot_configurations'
      ORDER BY ordinal_position
    `);
    columns.rows.forEach(row => console.log(`  - ${row.column_name}: ${row.data_type}`));
    
    // Check data in bot_configurations
    console.log('\nData in bot_configurations:');
    const data = await pool.query('SELECT * FROM bot_configurations');
    console.log('  Count:', data.rows.length);
    if (data.rows.length > 0) {
      console.log('  Data:', JSON.stringify(data.rows, null, 2));
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkTables();
