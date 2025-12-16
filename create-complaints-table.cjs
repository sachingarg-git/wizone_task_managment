const postgres = require('postgres');

const sql = postgres('postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT');

async function createComplaintsTable() {
  try {
    console.log('🔧 Creating complaints table...');
    
    // Drop existing table if it has old schema
    await sql`DROP TABLE IF EXISTS complaints CASCADE`;
    console.log('✅ Dropped old complaints table (if existed)');
    
    // Create new complaints table
    await sql`
      CREATE TABLE IF NOT EXISTS complaints (
        id SERIAL PRIMARY KEY,
        complaint_id VARCHAR NOT NULL UNIQUE,
        engineer_id INTEGER NOT NULL REFERENCES users(id),
        engineer_name VARCHAR NOT NULL,
        engineer_email VARCHAR,
        subject VARCHAR NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR,
        status VARCHAR NOT NULL DEFAULT 'pending',
        status_note TEXT,
        status_history JSONB DEFAULT '[]',
        is_locked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW(),
        resolved_at TIMESTAMP
      )
    `;
    console.log('✅ Created complaints table');
    
    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_complaints_engineer_id ON complaints(engineer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC)`;
    console.log('✅ Created indexes');
    
    console.log('\n✅ Complaints table created successfully!');
    console.log('\nTable columns:');
    console.log('- id (SERIAL PRIMARY KEY)');
    console.log('- complaint_id (VARCHAR UNIQUE) - Format: WIZ/DDMMYY/001');
    console.log('- engineer_id (INTEGER FK)');
    console.log('- engineer_name (VARCHAR)');
    console.log('- engineer_email (VARCHAR)');
    console.log('- subject (VARCHAR)');
    console.log('- description (TEXT)');
    console.log('- category (VARCHAR)');
    console.log('- status (VARCHAR) - pending/in_progress/under_investigation/review/resolved');
    console.log('- status_note (TEXT)');
    console.log('- status_history (JSONB)');
    console.log('- is_locked (BOOLEAN)');
    console.log('- created_at, updated_at, resolved_at (TIMESTAMPS)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sql.end();
  }
}

createComplaintsTable();
