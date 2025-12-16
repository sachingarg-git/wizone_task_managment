import postgres from 'postgres';

const sql = postgres('postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT', {
  ssl: 'prefer'
});

async function checkPerformanceMetrics() {
  try {
    console.log('📊 CHECKING PERFORMANCE_METRICS TABLE\n');
    
    const cols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'performance_metrics' 
      ORDER BY ordinal_position
    `;
    
    console.log('Columns in performance_metrics table:');
    cols.forEach(c => console.log(`  • ${c.column_name} (${c.data_type})`));
    
    await sql.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sql.end();
    process.exit(1);
  }
}

checkPerformanceMetrics();
