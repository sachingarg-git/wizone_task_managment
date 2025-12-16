/**
 * Direct Database Test - Insert System Info
 * Tests inserting into customer_system_details table directly
 */

const postgres = require('postgres');

const connectionString = 'postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT';

async function testInsert() {
  const client = postgres(connectionString);
  
  try {
    console.log('🔌 Connecting to database...');
    
    // Test connection
    const version = await client`SELECT version()`;
    console.log('✅ Connected to:', version[0].version.split(' ').slice(0,2).join(' '));
    
    // Check table structure
    console.log('\n📋 Checking customer_system_details table columns...');
    const columns = await client`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'customer_system_details'
      ORDER BY ordinal_position
    `;
    console.log('Columns found:', columns.length);
    columns.forEach(c => {
      console.log(`  - ${c.column_name} (${c.data_type}, ${c.is_nullable === 'YES' ? 'nullable' : 'required'})`);
    });
    
    // Check if Multani customer exists
    console.log('\n🔍 Looking for Multani customer...');
    const customer = await client`
      SELECT id, name, portal_username, portal_password
      FROM customers 
      WHERE portal_username = 'multani'
      LIMIT 1
    `;
    
    if (customer.length === 0) {
      console.log('❌ Customer with username "multani" not found');
      await client.end();
      return;
    }
    
    console.log('✅ Found customer:', customer[0].name, '(ID:', customer[0].id, ')');
    
    // Try to insert a test record
    console.log('\n💾 Inserting test system record...');
    const result = await client`
      INSERT INTO customer_system_details (
        customer_id, customer_name, emp_id, emp_name, system_name, system_type,
        processor, processor_cores, processor_speed, ram, ram_type, ram_frequency, ram_slots,
        motherboard, motherboard_manufacturer, hard_disk, hdd_capacity, ssd, ssd_capacity,
        graphics_card, graphics_memory, operating_system, os_version, os_architecture,
        mac_address, ip_address, serial_number, bios_version, antivirus, ms_office,
        other_software, collected_at, created_at, updated_at
      ) VALUES (
        ${customer[0].id}, ${customer[0].name}, ${'1'}, ${'Test Engineer'},
        ${'TEST-PC-DIRECT'}, ${'Desktop'},
        ${'Intel Core i5-10400'}, ${'6 Cores'}, ${'2900 MHz'},
        ${'16 GB'}, ${'DDR4'}, ${'2666 MHz'}, ${'2'},
        ${'ASUS PRIME B460'}, ${'ASUSTeK'},
        ${'WD Blue 1TB'}, ${'1000 GB'},
        ${'Samsung 860 EVO'}, ${'500 GB'},
        ${'NVIDIA GTX 1650'}, ${'4096 MB'},
        ${'Microsoft Windows 10 Pro'}, ${'10.0.19045'}, ${'64-bit'},
        ${'00-1A-2B-3C-4D-5E'}, ${'192.168.1.100'},
        ${'TEST-SN-123456'}, ${'American Megatrends F10'},
        ${'Windows Defender'}, ${'Microsoft Office 365'},
        ${'System User: Test User'},
        NOW(), NOW(), NOW()
      ) RETURNING id
    `;
    
    console.log('✅ Insert successful! Record ID:', result[0].id);
    
    // Verify the record
    console.log('\n🔍 Verifying inserted record...');
    const verify = await client`
      SELECT id, customer_name, system_name, created_at
      FROM customer_system_details
      WHERE id = ${result[0].id}
    `;
    console.log('✅ Record verified:', verify[0]);
    
    // Count total records
    const count = await client`
      SELECT COUNT(*) as total FROM customer_system_details
    `;
    console.log('\n📊 Total records in table:', count[0].total);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

testInsert();
