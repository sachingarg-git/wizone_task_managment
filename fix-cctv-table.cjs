const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT',
});

async function fixCctvTable() {
  const client = await pool.connect();
  try {
    console.log('Fixing CCTV table - removing foreign key constraint on updated_by...');
    
    // Drop the existing table and recreate without the FK constraint
    await client.query(`
      DROP TABLE IF EXISTS cctv_information CASCADE;
    `);
    console.log('Dropped existing cctv_information table');
    
    // Create the table without the updatedBy foreign key constraint
    await client.query(`
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
        updated_by INTEGER,
        updated_by_name VARCHAR,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('✅ Created cctv_information table successfully without FK on updated_by!');
    
  } catch (error) {
    console.error('Error fixing cctv table:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixCctvTable()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Failed:', err);
    process.exit(1);
  });
