import mssql from "mssql";

// MS SQL Server Configuration
const config = {
  server: '14.102.70.90',
  port: 1433,
  database: 'TASK_SCORE_WIZONE',
  user: 'sa',
  password: 'ss123456',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
};

async function createTables() {
  const pool = new mssql.ConnectionPool(config);
  
  try {
    await pool.connect();
    console.log('Connected to MS SQL Server');

    // Create Users table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
      CREATE TABLE users (
        id NVARCHAR(50) PRIMARY KEY DEFAULT NEWID(),
        username NVARCHAR(100) UNIQUE NOT NULL,
        password NVARCHAR(255),
        email NVARCHAR(255) UNIQUE,
        firstName NVARCHAR(100),
        lastName NVARCHAR(100),
        role NVARCHAR(50) DEFAULT 'engineer',
        department NVARCHAR(100),
        profileImageUrl NVARCHAR(500),
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE()
      );
    `);
    console.log('✅ Users table created/verified');

    // Create Customers table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='customers' AND xtype='U')
      CREATE TABLE customers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255),
        phone NVARCHAR(50),
        address NTEXT,
        serviceType NVARCHAR(100),
        connectionStatus NVARCHAR(50) DEFAULT 'active',
        username NVARCHAR(100) UNIQUE,
        password NVARCHAR(255),
        portalAccess BIT DEFAULT 0,
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE()
      );
    `);
    console.log('✅ Customers table created/verified');

    // Create Tasks table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tasks' AND xtype='U')
      CREATE TABLE tasks (
        id INT IDENTITY(1,1) PRIMARY KEY,
        ticketNumber NVARCHAR(20) UNIQUE NOT NULL,
        title NVARCHAR(255) NOT NULL,
        description NTEXT,
        priority NVARCHAR(20) DEFAULT 'medium',
        status NVARCHAR(50) DEFAULT 'pending',
        customerId INT NOT NULL,
        assignedTo NVARCHAR(50),
        fieldEngineerId NVARCHAR(50),
        issueType NVARCHAR(100),
        location NVARCHAR(255),
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        resolvedAt DATETIME2,
        FOREIGN KEY (customerId) REFERENCES customers(id),
        FOREIGN KEY (assignedTo) REFERENCES users(id),
        FOREIGN KEY (fieldEngineerId) REFERENCES users(id)
      );
    `);
    console.log('✅ Tasks table created/verified');

    // Create Task Updates table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='task_updates' AND xtype='U')
      CREATE TABLE task_updates (
        id INT IDENTITY(1,1) PRIMARY KEY,
        taskId INT NOT NULL,
        userId NVARCHAR(50),
        updateType NVARCHAR(50),
        oldValue NVARCHAR(255),
        newValue NVARCHAR(255),
        note NTEXT,
        fileUrl NVARCHAR(500),
        fileName NVARCHAR(255),
        createdAt DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (taskId) REFERENCES tasks(id),
        FOREIGN KEY (userId) REFERENCES users(id)
      );
    `);
    console.log('✅ Task Updates table created/verified');

    // Create Performance Metrics table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='performance_metrics' AND xtype='U')
      CREATE TABLE performance_metrics (
        id INT IDENTITY(1,1) PRIMARY KEY,
        userId NVARCHAR(50) NOT NULL,
        metric NVARCHAR(100) NOT NULL,
        value DECIMAL(10,2) NOT NULL,
        period NVARCHAR(50),
        createdAt DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (userId) REFERENCES users(id)
      );
    `);
    console.log('✅ Performance Metrics table created/verified');

    // Create Sessions table for authentication
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='sessions' AND xtype='U')
      CREATE TABLE sessions (
        sid NVARCHAR(255) PRIMARY KEY,
        sess NTEXT NOT NULL,
        expire DATETIME2 NOT NULL
      );
    `);
    console.log('✅ Sessions table created/verified');

    // Create default admin user if not exists
    const existingAdmin = await pool.request()
      .input('username', mssql.VarChar, 'admin')
      .query('SELECT * FROM users WHERE username = @username');

    if (existingAdmin.recordset.length === 0) {
      await pool.request()
        .input('id', mssql.VarChar, 'admin-001')
        .input('username', mssql.VarChar, 'admin')
        .input('password', mssql.VarChar, 'admin123')
        .input('email', mssql.VarChar, 'admin@wizoneit.com')
        .input('firstName', mssql.VarChar, 'System')
        .input('lastName', mssql.VarChar, 'Administrator')
        .input('role', mssql.VarChar, 'admin')
        .input('department', mssql.VarChar, 'IT')
        .query(`
          INSERT INTO users (id, username, password, email, firstName, lastName, role, department, createdAt, updatedAt)
          VALUES (@id, @username, @password, @email, @firstName, @lastName, @role, @department, GETDATE(), GETDATE())
        `);
      console.log('✅ Admin user created');
    }

    // Create RAVI field engineer user if not exists
    const existingRavi = await pool.request()
      .input('username', mssql.VarChar, 'RAVI')
      .query('SELECT * FROM users WHERE username = @username');

    if (existingRavi.recordset.length === 0) {
      await pool.request()
        .input('id', mssql.VarChar, 'ravi-001')
        .input('username', mssql.VarChar, 'RAVI')
        .input('password', mssql.VarChar, 'admin123')
        .input('email', mssql.VarChar, 'ravi@wizoneit.com')
        .input('firstName', mssql.VarChar, 'Ravi')
        .input('lastName', mssql.VarChar, 'Kumar')
        .input('role', mssql.VarChar, 'field_engineer')
        .input('department', mssql.VarChar, 'Field Operations')
        .query(`
          INSERT INTO users (id, username, password, email, firstName, lastName, role, department, createdAt, updatedAt)
          VALUES (@id, @username, @password, @email, @firstName, @lastName, @role, @department, GETDATE(), GETDATE())
        `);
      console.log('✅ RAVI field engineer user created');
    }

    console.log('🎉 All MS SQL tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    await pool.close();
  }
}

// Auto-run if this file is executed directly
createTables();

export { createTables };