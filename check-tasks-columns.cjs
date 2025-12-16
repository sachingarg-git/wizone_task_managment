const { Pool } = require('pg');

const pool = new Pool({
  host: '103.122.85.61',
  port: 9095,
  database: 'WIZONEIT_SUPPORT',
  user: 'postgres',
  password: 'ss123456'
});

async function checkColumns() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'tasks'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Tasks table columns:');
    console.log('━'.repeat(60));
    result.rows.forEach(row => {
      console.log(`  ${row.column_name.padEnd(25)} ${row.data_type.padEnd(20)} ${row.is_nullable}`);
    });
    console.log('━'.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkColumns();
