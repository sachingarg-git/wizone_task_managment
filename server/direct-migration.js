// Direct migration script for SQL Server with hardcoded credentials
import mssql from 'mssql';

async function createTables() {
  try {
    const config = {
      server: '14.102.70.90',
      port: 1433,
      database: 'master',
      user: 'sa',
      password: 'ss123456',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
      },
      connectionTimeout: 30000,
      requestTimeout: 30000,
    };

    console.log('Connecting to SQL Server...');
    const pool = new mssql.ConnectionPool(config);
    await pool.connect();
    
    // Create database
    console.log('Creating database wizone_production...');
    await pool.request().query(`
      IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'wizone_production')
      BEGIN
        CREATE DATABASE [wizone_production]
      END
    `);
    
    await pool.close();
    
    // Connect to new database
    const dbConfig = { ...config, database: 'wizone_production' };
    const dbPool = new mssql.ConnectionPool(dbConfig);
    await dbPool.connect();
    
    console.log('Creating tables...');
    
    // Create users table
    await dbPool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
      CREATE TABLE users (
        id NVARCHAR(50) PRIMARY KEY,
        username NVARCHAR(100),
        password NVARCHAR(255),
        email NVARCHAR(255),
        firstName NVARCHAR(100),
        lastName NVARCHAR(100),
        phone NVARCHAR(20),
        profileImageUrl NVARCHAR(500),
        role NVARCHAR(50) DEFAULT 'user',
        department NVARCHAR(100),
        isActive BIT DEFAULT 1,
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE()
      )
    `);
    
    // Create customers table
    await dbPool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='customers' AND xtype='U')
      CREATE TABLE customers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        customerId NVARCHAR(50) UNIQUE NOT NULL,
        name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255),
        phone NVARCHAR(20),
        address NVARCHAR(500),
        city NVARCHAR(100),
        state NVARCHAR(100),
        zipCode NVARCHAR(20),
        country NVARCHAR(100),
        serviceType NVARCHAR(100),
        contractStartDate DATETIME2,
        contractEndDate DATETIME2,
        monthlyFee DECIMAL(10,2),
        isActive BIT DEFAULT 1,
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE()
      )
    `);
    
    // Create tasks table
    await dbPool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tasks' AND xtype='U')
      CREATE TABLE tasks (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(255) NOT NULL,
        description NTEXT,
        status NVARCHAR(50) DEFAULT 'pending',
        priority NVARCHAR(20) DEFAULT 'medium',
        assignedTo NVARCHAR(50),
        customerId INT,
        createdBy NVARCHAR(50),
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        resolvedAt DATETIME2,
        FOREIGN KEY (assignedTo) REFERENCES users(id),
        FOREIGN KEY (customerId) REFERENCES customers(id),
        FOREIGN KEY (createdBy) REFERENCES users(id)
      )
    `);
    
    console.log('Inserting sample data...');
    
    // Insert admin user
    await dbPool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin')
      INSERT INTO users (id, username, password, email, firstName, lastName, role, department, isActive)
      VALUES ('admin001', 'admin', '32dc874d83f8e3829e47123a59ed94f270e6b284fea685496f1fada378a02c1d51464b035595d1bd7872c55355a59f3dc9516a19a096daf5d3485803d09826c4.8e1fabfbd18012c505718f32b41244e1', 'admin@wizoneit.com', 'Admin', 'User', 'admin', 'WIZONE HELP DESK', 1)
    `);
    
    // Insert sample customers
    await dbPool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM customers WHERE customerId = 'C001')
      INSERT INTO customers (customerId, name, email, phone, address, city, state, zipCode, country, serviceType, monthlyFee, isActive)
      VALUES ('C001', 'TechCorp Solutions', 'contact@techcorp.com', '+1-555-0123', '123 Business Ave', 'New York', 'NY', '10001', 'USA', 'Enterprise Internet', 299.99, 1)
    `);
    
    await dbPool.close();
    console.log('✅ Database and tables created successfully!');
    return { success: true, message: 'Database created successfully' };
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return { success: false, message: error.message };
  }
}

// Run if called directly
if (process.argv[1].endsWith('direct-migration.js')) {
  createTables().then(result => {
    console.log('Result:', result);
    process.exit(result.success ? 0 : 1);
  });
}

export { createTables };