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

async function importCustomers() {
  console.log('🚀 Starting Customer Import Process...');
  
  try {
    // Test database connection
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    client.release();

    const csvPath = path.join(__dirname, '..', 'uploads', 'customers-data.csv');
    const customers = [];
    
    // Read CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          // Clean and prepare customer data
          const customer = {
            customerId: row.customerId || '',
            name: row['Customer Name'] || '',
            address: row['Customer Address'] || '',
            email: row.email === 'na' ? null : row.email,
            contactPerson: row.contactPerson === 'NA' ? null : row.contactPerson,
            phone: row.mobilePhone || null,
            city: row.city || '',
            state: row.state || '',
            status: 'active',
            servicePlan: row['Service Plan'] || '',
            connectedTower: row['Connected Tower'] || '',
            wirelessIP: row['Wireless IP (Customer End)'] || '',
            wirelessAPIP: row['Wireless AP IP'] || '',
            port: row.Port || '',
            latitude: row.latitude || null,
            longitude: row.longitude || null,
            connectionType: 'wireless',
            planType: 'standard',
            monthlyFee: 0
          };
          
          customers.push(customer);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`📋 Found ${customers.length} customers to import`);

    // Insert customers into database
    let successCount = 0;
    let errorCount = 0;

    for (const customer of customers) {
      try {
        const query = `
          INSERT INTO customers (
            customer_id, name, address, email, contact_person, mobile_phone, 
            city, state, status, service_plan, latitude, longitude,
            connection_type, plan_type, monthly_fee, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()
          ) ON CONFLICT (customer_id) DO UPDATE SET
            name = EXCLUDED.name,
            address = EXCLUDED.address,
            email = EXCLUDED.email,
            contact_person = EXCLUDED.contact_person,
            mobile_phone = EXCLUDED.mobile_phone,
            city = EXCLUDED.city,
            state = EXCLUDED.state,
            service_plan = EXCLUDED.service_plan,
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
          customer.latitude ? parseFloat(customer.latitude) : null,
          customer.longitude ? parseFloat(customer.longitude) : null,
          customer.connectionType,
          customer.planType,
          customer.monthlyFee ? parseFloat(customer.monthlyFee) : 0
        ];

        await pool.query(query, values);
        successCount++;
        
        if (successCount % 10 === 0) {
          console.log(`✅ Imported ${successCount} customers...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error importing customer ${customer.customerId}:`, error.message);
      }
    }

    console.log('\n🎉 Import Complete!');
    console.log(`✅ Successfully imported: ${successCount} customers`);
    console.log(`❌ Errors: ${errorCount} customers`);
    
    // Verify total count in database
    const result = await pool.query('SELECT COUNT(*) as total FROM customers');
    console.log(`📊 Total customers in database: ${result.rows[0].total}`);

  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the import
importCustomers().catch(console.error);