const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Database connection  
const { Pool } = require('pg');

// Database configuration
const dbConfig = {
  host: '103.122.85.61',
  port: 9095,
  database: 'WIZONEIT_SUPPORT',
  user: 'postgres',
  password: 'ss123456',
  ssl: false
};

const pool = new Pool(dbConfig);

async function importAllCustomers() {
  console.log('🚀 Starting FULL Customer Import Process...');
  console.log('📋 Importing ALL 300+ customers from complete CSV file');
  
  try {
    // Test database connection
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');

    // Clear existing customers table and recreate to ensure clean import
    try {
      await client.query('DROP TABLE if EXISTS customer_system_details CASCADE');
      await client.query('DROP TABLE if EXISTS customers CASCADE');
      console.log('🗑️ Cleared existing tables for fresh import');
    } catch (error) {
      console.log('ℹ️ Tables did not exist, continuing...');
    }

    // Create a simple customers table without constraints
    await client.query(`
      CREATE TABLE customers (
        id SERIAL PRIMARY KEY,
        customer_id VARCHAR(50) UNIQUE,
        name VARCHAR(500),
        email VARCHAR(200),
        contact_person VARCHAR(200),
        mobile_phone VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        country VARCHAR(100) DEFAULT 'India',
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        connection_type VARCHAR(50),
        plan_type VARCHAR(50),
        service_plan VARCHAR(200),
        monthly_fee DECIMAL(10, 2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        portal_access BOOLEAN DEFAULT false,
        portal_username VARCHAR(100),
        portal_password VARCHAR(255),
        -- Additional fields from CSV
        connected_tower VARCHAR(200),
        wireless_ip VARCHAR(100),
        wireless_ap_ip VARCHAR(100),
        port VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create system details table  
    await client.query(`
      CREATE TABLE customer_system_details (
        id SERIAL PRIMARY KEY,
        customer_id VARCHAR(50) REFERENCES customers(customer_id),
        emp_id VARCHAR(50),
        system_name VARCHAR(200),
        processor VARCHAR(200),
        ram VARCHAR(100),
        hard_disk VARCHAR(200),
        ssd VARCHAR(200),
        operating_system VARCHAR(200),
        antivirus VARCHAR(200),
        ms_office VARCHAR(200),
        other_software TEXT,
        configuration TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Created enhanced database tables');

    client.release();

    // Use the FULL CSV file
    const csvPath = path.join(__dirname, '..', 'uploads', 'customers-data-full.csv');
    const customers = [];
    
    console.log(`📂 Reading CSV file: ${csvPath}`);

    // Read CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          // Clean and prepare customer data with all available fields
          const customer = {
            customerId: row.customerId || row['Customer ID'] || '',
            name: row['Customer Name'] || row.name || '',
            address: row['Customer Address'] || row.address || '',
            email: (row.email === 'na' || row.email === 'N/A') ? null : row.email,
            contactPerson: (row.contactPerson === 'NA' || row.contactPerson === 'na') ? null : row.contactPerson,
            phone: row.mobilePhone || row['Mobile Phone'] || row.phone || null,
            city: row.city || row.City || '',
            state: row.state || row.State || '',
            status: 'active',
            servicePlan: row['Service Plan'] || row.servicePlan || '',
            connectedTower: row['Connected Tower'] || row.connectedTower || '',
            wirelessIP: row['Wireless IP (Customer End)'] || row.wirelessIP || '',
            wirelessAPIP: row['Wireless AP IP'] || row.wirelessAPIP || '',
            port: row.Port || row.port || '',
            latitude: row.latitude || null,
            longitude: row.longitude || null,
            connectionType: row.connectionType || 'wireless',
            planType: row.planType || 'standard',
            monthlyFee: row.monthlyFee || 0
          };
          
          // Skip empty customer IDs and invalid rows
          if (customer.customerId && customer.customerId.trim() && customer.name && customer.name.trim()) {
            customers.push(customer);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`📋 Found ${customers.length} valid customers to import`);
    console.log(`📊 First few customers: ${customers.slice(0, 3).map(c => c.customerId).join(', ')}`);

    // Insert customers into database
    let successCount = 0;
    let errorCount = 0;

    for (const customer of customers) {
      try {
        const query = `
          INSERT INTO customers (
            customer_id, name, address, email, contact_person, mobile_phone, 
            city, state, status, service_plan, connected_tower, wireless_ip,
            wireless_ap_ip, port, latitude, longitude, connection_type, 
            plan_type, monthly_fee, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW()
          ) ON CONFLICT (customer_id) DO UPDATE SET
            name = EXCLUDED.name,
            address = EXCLUDED.address,
            email = EXCLUDED.email,
            contact_person = EXCLUDED.contact_person,
            mobile_phone = EXCLUDED.mobile_phone,
            city = EXCLUDED.city,
            state = EXCLUDED.state,
            service_plan = EXCLUDED.service_plan,
            connected_tower = EXCLUDED.connected_tower,
            wireless_ip = EXCLUDED.wireless_ip,
            wireless_ap_ip = EXCLUDED.wireless_ap_ip,
            port = EXCLUDED.port,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            connection_type = EXCLUDED.connection_type,
            plan_type = EXCLUDED.plan_type,
            monthly_fee = EXCLUDED.monthly_fee,
            updated_at = NOW()
        `;

        const values = [
          customer.customerId,
          customer.name,
          customer.address,
          customer.email,
          customer.contactPerson,
          customer.phone,
          customer.city,
          customer.state,
          customer.status,
          customer.servicePlan,
          customer.connectedTower,
          customer.wirelessIP,
          customer.wirelessAPIP,
          customer.port,
          customer.latitude ? parseFloat(customer.latitude) : null,
          customer.longitude ? parseFloat(customer.longitude) : null,
          customer.connectionType,
          customer.planType,
          customer.monthlyFee ? parseFloat(customer.monthlyFee) : 0
        ];

        await pool.query(query, values);
        successCount++;
        
        if (successCount % 25 === 0) {
          console.log(`✅ Imported ${successCount} customers...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error importing customer ${customer.customerId}:`, error.message);
        
        // Stop after too many errors
        if (errorCount > 10) {
          console.log('⚠️ Too many errors, stopping import...');
          break;
        }
      }
    }

    console.log('\n🎉 FULL Import Complete!');
    console.log(`✅ Successfully imported: ${successCount} customers`);
    console.log(`❌ Errors: ${errorCount} customers`);
    
    // Verify total count in database
    const result = await pool.query('SELECT COUNT(*) as total FROM customers');
    console.log(`📊 Total customers in database: ${result.rows[0].total}`);

    // Show some sample data
    const sampleResult = await pool.query('SELECT customer_id, name, city, state FROM customers ORDER BY id LIMIT 5');
    console.log('\n📋 Sample imported customers:');
    sampleResult.rows.forEach(customer => {
      console.log(`  ${customer.customer_id}: ${customer.name} (${customer.city}, ${customer.state})`);
    });

  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the import
importAllCustomers().catch(console.error);