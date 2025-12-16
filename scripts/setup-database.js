const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: '103.122.85.61',
  port: 9095,
  database: 'WIZONEIT_SUPPORT',
  user: 'postgres',
  password: 'ss123456',
  ssl: false, // Set to true if your PostgreSQL server requires SSL
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 10000,
  query_timeout: 60000
};

async function createDatabaseSchema() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔌 Connecting to PostgreSQL database...');
    console.log(`📍 Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`📊 Database: ${dbConfig.database}`);
    
    await client.connect();
    console.log('✅ Connected to PostgreSQL database successfully!');
    
    // Read and execute schema creation script
    console.log('\n🏗️  Creating database schema...');
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'create-database-schema.sql'), 
      'utf8'
    );
    
    await client.query(schemaSQL);
    console.log('✅ Database schema created successfully!');
    
    // Read and execute sample data insertion script
    console.log('\n📊 Inserting sample data...');
    const dataSQL = fs.readFileSync(
      path.join(__dirname, 'insert-sample-data.sql'), 
      'utf8'
    );
    
    await client.query(dataSQL);
    console.log('✅ Sample data inserted successfully!');
    
    // Verify the data was inserted
    console.log('\n📋 Verifying data insertion...');
    
    const usersResult = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`👥 Users: ${usersResult.rows[0].count}`);
    
    const customersResult = await client.query('SELECT COUNT(*) as count FROM customers');
    console.log(`🏢 Customers: ${customersResult.rows[0].count}`);
    
    const tasksResult = await client.query('SELECT COUNT(*) as count FROM tasks');
    console.log(`📝 Tasks: ${tasksResult.rows[0].count}`);
    
    const systemsResult = await client.query('SELECT COUNT(*) as count FROM customer_system_details');
    console.log(`💻 System Details: ${systemsResult.rows[0].count}`);
    
    const updatesResult = await client.query('SELECT COUNT(*) as count FROM task_updates');
    console.log(`💬 Task Updates: ${updatesResult.rows[0].count}`);
    
    // Test some sample queries
    console.log('\n🧪 Testing sample queries...');
    
    const sampleCustomer = await client.query(`
      SELECT customer_id, name, city, status 
      FROM customers 
      WHERE status = 'active' 
      LIMIT 1
    `);
    
    if (sampleCustomer.rows.length > 0) {
      console.log('✅ Sample Customer:', sampleCustomer.rows[0]);
    }
    
    const sampleTask = await client.query(`
      SELECT id, title, status, priority 
      FROM tasks 
      WHERE status = 'in-progress' 
      LIMIT 1
    `);
    
    if (sampleTask.rows.length > 0) {
      console.log('✅ Sample Task:', sampleTask.rows[0]);
    }
    
    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\n📌 Next steps:');
    console.log('1. Update your application to use the PostgreSQL database');
    console.log('2. Test the application connectivity');
    console.log('3. Verify all features are working correctly');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Connection troubleshooting tips:');
      console.log('- Check if PostgreSQL server is running');
      console.log('- Verify the host and port are correct');
      console.log('- Ensure firewall allows connections on port 9095');
      console.log('- Check if the database user has proper permissions');
    }
    
    if (error.code === 'ENOTFOUND') {
      console.log('\n💡 DNS/Network troubleshooting tips:');
      console.log('- Verify the hostname/IP address is correct');
      console.log('- Check your internet connection');
      console.log('- Try using IP address instead of hostname');
    }
    
    if (error.code === '28P01') {
      console.log('\n💡 Authentication troubleshooting tips:');
      console.log('- Verify username and password are correct');
      console.log('- Check if the user exists in PostgreSQL');
      console.log('- Ensure the user has CONNECT privilege on the database');
    }
    
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed.');
  }
}

// Run the database initialization
if (require.main === module) {
  createDatabaseSchema()
    .then(() => {
      console.log('\n✨ Database setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Fatal error during database setup:', error);
      process.exit(1);
    });
}

module.exports = { createDatabaseSchema, dbConfig };