/**
 * Migration script to add new columns to customer_system_details table
 * Run this once to update the database schema
 */

const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT';

async function migrate() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Add new columns to customer_system_details table
    const alterTableSQL = `
      -- Add new columns if they don't exist
      DO $$ 
      BEGIN 
        -- Customer and employee info
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_system_details' AND column_name='customer_name') THEN
          ALTER TABLE customer_system_details ADD COLUMN customer_name VARCHAR(255);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_system_details' AND column_name='emp_name') THEN
          ALTER TABLE customer_system_details ADD COLUMN emp_name VARCHAR(255);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_system_details' AND column_name='system_type') THEN
          ALTER TABLE customer_system_details ADD COLUMN system_type VARCHAR(50);
        END IF;
        
        -- Processor details
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_system_details' AND column_name='processor_cores') THEN
          ALTER TABLE customer_system_details ADD COLUMN processor_cores VARCHAR(20);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_system_details' AND column_name='processor_speed') THEN
          ALTER TABLE customer_system_details ADD COLUMN processor_speed VARCHAR(50);
        END IF;
        
        -- RAM details
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_system_details' AND column_name='ram_type') THEN
          ALTER TABLE customer_system_details ADD COLUMN ram_type VARCHAR(20);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_system_details' AND column_name='ram_frequency') THEN
          ALTER TABLE customer_system_details ADD COLUMN ram_frequency VARCHAR(50);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_system_details' AND column_name='ram_slots') THEN
          ALTER TABLE customer_system_details ADD COLUMN ram_slots VARCHAR(20);
        END IF;
        
        -- Motherboard details
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_system_details' AND column_name='motherboard') THEN
          ALTER TABLE customer_system_details ADD COLUMN motherboard VARCHAR(255);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_system_details' AND column_name='motherboard_manufacturer') THEN
          ALTER TABLE customer_system_details ADD COLUMN motherboard_manufacturer VARCHAR(255);
        END IF;
        
        -- Storage details
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_system_details' AND column_name='hdd_capacity') THEN
          ALTER TABLE customer_system_details ADD COLUMN hdd_capacity VARCHAR(50);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_system_details' AND column_name='ssd_capacity') THEN
          ALTER TABLE customer_system_details ADD COLUMN ssd_capacity VARCHAR(50);
        END IF;
        
        -- Graphics details
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_system_details' AND column_name='graphics_card') THEN
          ALTER TABLE customer_system_details ADD COLUMN graphics_card VARCHAR(255);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_system_details' AND column_name='graphics_memory') THEN
          ALTER TABLE customer_system_details ADD COLUMN graphics_memory VARCHAR(50);
        END IF;
        
        -- OS details
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_system_details' AND column_name='os_version') THEN
          ALTER TABLE customer_system_details ADD COLUMN os_version VARCHAR(100);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_system_details' AND column_name='os_architecture') THEN
          ALTER TABLE customer_system_details ADD COLUMN os_architecture VARCHAR(20);
        END IF;
        
        -- Network details
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_system_details' AND column_name='mac_address') THEN
          ALTER TABLE customer_system_details ADD COLUMN mac_address VARCHAR(50);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_system_details' AND column_name='ip_address') THEN
          ALTER TABLE customer_system_details ADD COLUMN ip_address VARCHAR(50);
        END IF;
        
        -- Hardware identifiers
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_system_details' AND column_name='serial_number') THEN
          ALTER TABLE customer_system_details ADD COLUMN serial_number VARCHAR(100);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_system_details' AND column_name='bios_version') THEN
          ALTER TABLE customer_system_details ADD COLUMN bios_version VARCHAR(100);
        END IF;
        
        -- Timestamp
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_system_details' AND column_name='collected_at') THEN
          ALTER TABLE customer_system_details ADD COLUMN collected_at TIMESTAMP DEFAULT NOW();
        END IF;
        
        -- Rename columns if needed (processor_name -> processor)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_system_details' AND column_name='processor_name') THEN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_system_details' AND column_name='processor') THEN
            ALTER TABLE customer_system_details RENAME COLUMN processor_name TO processor;
          END IF;
        END IF;
        
        -- Rename hard_disk if needed
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_system_details' AND column_name='hard_disk') THEN
          -- Column exists, good
          NULL;
        ELSE
          ALTER TABLE customer_system_details ADD COLUMN hard_disk VARCHAR(255);
        END IF;
        
        -- Make customer_id nullable (for systems without linked customers)
        ALTER TABLE customer_system_details ALTER COLUMN customer_id DROP NOT NULL;
        
      END $$;
    `;
    
    await client.query(alterTableSQL);
    console.log('✅ Table schema updated successfully');
    
    // Verify columns
    const columnsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'customer_system_details'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Current table columns:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.end();
  }
}

migrate();
