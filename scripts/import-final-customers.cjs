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

async function importAllCustomersFinal() {
  console.log('🚀 Starting FINAL Customer Import Process...');
  console.log('📋 Importing ALL customers with expanded schema');
  
  try {
    // Test database connection
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');

    // Clear existing customers table and recreate with larger field sizes
    try {
      await client.query('DROP TABLE if EXISTS customer_system_details CASCADE');
      await client.query('DROP TABLE if EXISTS customers CASCADE');
      console.log('🗑️ Cleared existing tables for final import');
    } catch (error) {
      console.log('ℹ️ Tables did not exist, continuing...');
    }

    // Create customers table with larger field sizes to accommodate all data
    await client.query(`
      CREATE TABLE customers (
        id SERIAL PRIMARY KEY,
        customer_id VARCHAR(100) UNIQUE,
        name VARCHAR(1000),
        email VARCHAR(500),
        contact_person VARCHAR(500),
        mobile_phone VARCHAR(100),
        address TEXT,
        city VARCHAR(200),
        state VARCHAR(200),
        country VARCHAR(200) DEFAULT 'India',
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        connection_type VARCHAR(100),
        plan_type VARCHAR(100),
        service_plan VARCHAR(500),
        monthly_fee DECIMAL(10, 2) DEFAULT 0,
        status VARCHAR(100) DEFAULT 'active',
        portal_access BOOLEAN DEFAULT false,
        portal_username VARCHAR(200),
        portal_password VARCHAR(500),
        -- Additional fields from CSV with generous sizes
        connected_tower VARCHAR(500),
        wireless_ip VARCHAR(200),
        wireless_ap_ip VARCHAR(200),
        port VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create system details table  
    await client.query(`
      CREATE TABLE customer_system_details (
        id SERIAL PRIMARY KEY,
        customer_id VARCHAR(100) REFERENCES customers(customer_id),
        emp_id VARCHAR(100),
        system_name VARCHAR(500),
        processor VARCHAR(500),
        ram VARCHAR(200),
        hard_disk VARCHAR(500),
        ssd VARCHAR(500),
        operating_system VARCHAR(500),
        antivirus VARCHAR(500),
        ms_office VARCHAR(500),
        other_software TEXT,
        configuration TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Created enhanced database tables with larger field sizes');

    client.release();

    // Use the FULL CSV file
    const csvPath = path.join(__dirname, '..', 'uploads', 'customers-data-full.csv');
    const customers = [];
    
    console.log(`📂 Reading CSV file: ${csvPath}`);

    // Read CSV file with better data cleaning
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          // Clean and prepare customer data with all available fields
          const customer = {
            customerId: (row.customerId || row['Customer ID'] || '').trim(),
            name: (row['Customer Name'] || row.name || '').trim(),
            address: (row['Customer Address'] || row.address || '').trim(),
            email: ((row.email === 'na' || row.email === 'N/A' || !row.email) ? null : row.email.trim()),
            contactPerson: ((row.contactPerson === 'NA' || row.contactPerson === 'na' || !row.contactPerson) ? null : row.contactPerson.trim()),
            phone: (row.mobilePhone || row['Mobile Phone'] || row.phone || '').trim() || null,
            city: (row.city || row.City || '').trim(),
            state: (row.state || row.State || '').trim(),
            status: 'active',
            servicePlan: (row['Service Plan'] || row.servicePlan || '').trim(),
            connectedTower: (row['Connected Tower'] || row.connectedTower || '').trim(),
            wirelessIP: (row['Wireless IP (Customer End)'] || row.wirelessIP || '').trim(),
            wirelessAPIP: (row['Wireless AP IP'] || row.wirelessAPIP || '').trim(),
            port: (row.Port || row.port || '').trim(),
            latitude: row.latitude || null,
            longitude: row.longitude || null,
            connectionType: (row.connectionType || 'wireless').trim(),
            planType: (row.planType || 'standard').trim(),
            monthlyFee: row.monthlyFee || 0
          };
          
          // Skip completely empty rows
          if (customer.customerId && customer.name) {
            customers.push(customer);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`📋 Found ${customers.length} valid customers to import`);

    // Insert customers into database
    let successCount = 0;
    let errorCount = 0;
    let errors = [];

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
        errors.push({ customerId: customer.customerId, error: error.message });
        console.error(`❌ Error importing customer ${customer.customerId}:`, error.message);
      }
    }

    console.log('\n🎉 FINAL Import Complete!');
    console.log(`✅ Successfully imported: ${successCount} customers`);
    console.log(`❌ Errors: ${errorCount} customers`);
    
    if (errors.length > 0 && errors.length <= 10) {
      console.log('\nError details:');
      errors.forEach(err => console.log(`  ${err.customerId}: ${err.error}`));
    }
    
    // Verify total count in database
    const result = await pool.query('SELECT COUNT(*) as total FROM customers');
    console.log(`📊 Total customers in database: ${result.rows[0].total}`);

    // Show statistics by state
    const stateStats = await pool.query(`
      SELECT state, COUNT(*) as count 
      FROM customers 
      WHERE state IS NOT NULL AND state != '' 
      GROUP BY state 
      ORDER BY count DESC 
      LIMIT 10
    `);
    
    console.log('\n📊 Top states by customer count:');
    stateStats.rows.forEach(stat => {
      console.log(`  ${stat.state}: ${stat.count} customers`);
    });

  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the import
importAllCustomersFinal().catch(console.error);