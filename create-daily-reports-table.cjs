const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT',
  ssl: false
});

async function createDailyReportsTable() {
  try {
    console.log('Creating daily_reports table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_reports (
        id SERIAL PRIMARY KEY,
        engineer_id INTEGER NOT NULL REFERENCES users(id),
        engineer_name VARCHAR(255) NOT NULL,
        report_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        sites_visited INTEGER NOT NULL DEFAULT 0,
        work_done TEXT NOT NULL,
        sites_completed INTEGER NOT NULL DEFAULT 0,
        completed_sites_names TEXT,
        incomplete_sites_names TEXT,
        reason_not_done TEXT,
        has_issue BOOLEAN DEFAULT FALSE,
        issue_details TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    console.log('✅ daily_reports table created successfully!');
    
    // Create index for faster queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_daily_reports_engineer_id ON daily_reports(engineer_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_daily_reports_report_date ON daily_reports(report_date)
    `);
    
    console.log('✅ Indexes created successfully!');
    
    // Verify table exists
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'daily_reports'
      ORDER BY ordinal_position
    `);
    
    console.log('\nTable structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

createDailyReportsTable();
