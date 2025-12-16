const postgres = require('postgres');

const DATABASE_URL = "postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT";

async function createCctvTable() {
  const sql = postgres(DATABASE_URL);
  
  try {
    console.log('🔄 Creating CCTV Information table...');
    
    // Create the cctv_information table
    await sql`
      CREATE TABLE IF NOT EXISTS cctv_information (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        customer_name VARCHAR NOT NULL,
        serial_number VARCHAR,
        camera_ip VARCHAR,
        added_in VARCHAR,
        port VARCHAR,
        http_port VARCHAR,
        model_no VARCHAR,
        location_name VARCHAR,
        uplink VARCHAR,
        rack_photo TEXT,
        nvr_camera_photo TEXT,
        device_serial_no VARCHAR,
        mac_address VARCHAR,
        updated_by INTEGER REFERENCES users(id),
        updated_by_name VARCHAR,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    console.log('✅ CCTV Information table created successfully!');
    
    // Verify table exists
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'cctv_information'
    `;
    
    if (tables.length > 0) {
      console.log('✅ Verified: cctv_information table exists');
      
      // Show table structure
      const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'cctv_information'
        ORDER BY ordinal_position
      `;
      
      console.log('\n📋 Table Structure:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error creating CCTV table:', error.message);
  } finally {
    await sql.end();
    console.log('\n🔌 Database connection closed');
  }
}

createCctvTable();
