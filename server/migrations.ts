import { sql } from 'drizzle-orm';
import * as mssql from 'mssql';

interface DatabaseConnection {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  connectionType: string;
  sslEnabled: boolean;
}

export async function createTablesInExternalDatabase(connection: DatabaseConnection): Promise<{ success: boolean; message: string; }> {
  try {
    let pool: any;
    
    if (connection.connectionType === 'mssql') {
      const config = {
        server: connection.host,
        port: connection.port,
        database: connection.database,
        user: connection.username,
        password: connection.password,
        options: {
          encrypt: connection.sslEnabled,
          trustServerCertificate: !connection.sslEnabled,
        },
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000
        }
      };
      
      pool = await mssql.connect(config);
      
      // Create tables with SQL Server syntax
      const createTablesSQL = `
        -- Users table
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
        );
        
        -- Customers table
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
        );
        
        -- Tasks table
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tasks' AND xtype='U')
        CREATE TABLE tasks (
          id INT IDENTITY(1,1) PRIMARY KEY,
          ticketNumber NVARCHAR(50) UNIQUE NOT NULL,
          title NVARCHAR(255) NOT NULL,
          description NVARCHAR(MAX),
          priority NVARCHAR(20) DEFAULT 'medium',
          status NVARCHAR(50) DEFAULT 'pending',
          issueType NVARCHAR(100),
          estimatedHours DECIMAL(5,2),
          actualHours DECIMAL(5,2),
          customerId INT,
          assignedUserId NVARCHAR(50),
          createdBy NVARCHAR(50),
          fieldEngineerId NVARCHAR(50),
          location NVARCHAR(255),
          scheduledDate DATETIME2,
          completedDate DATETIME2,
          resolution NVARCHAR(MAX),
          customerSatisfaction INT,
          createdAt DATETIME2 DEFAULT GETDATE(),
          updatedAt DATETIME2 DEFAULT GETDATE(),
          FOREIGN KEY (customerId) REFERENCES customers(id),
          FOREIGN KEY (assignedUserId) REFERENCES users(id),
          FOREIGN KEY (createdBy) REFERENCES users(id),
          FOREIGN KEY (fieldEngineerId) REFERENCES users(id)
        );
        
        -- Task Updates table
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='task_updates' AND xtype='U')
        CREATE TABLE task_updates (
          id INT IDENTITY(1,1) PRIMARY KEY,
          taskId INT NOT NULL,
          note NVARCHAR(MAX),
          status NVARCHAR(50),
          updatedBy NVARCHAR(50),
          files NVARCHAR(MAX), -- JSON array of file paths
          createdAt DATETIME2 DEFAULT GETDATE(),
          FOREIGN KEY (taskId) REFERENCES tasks(id),
          FOREIGN KEY (updatedBy) REFERENCES users(id)
        );
        
        -- Performance Metrics table
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='performance_metrics' AND xtype='U')
        CREATE TABLE performance_metrics (
          id INT IDENTITY(1,1) PRIMARY KEY,
          userId NVARCHAR(50) NOT NULL,
          month INT NOT NULL,
          year INT NOT NULL,
          tasksCompleted INT DEFAULT 0,
          avgResponseTime DECIMAL(10,2) DEFAULT 0,
          customerSatisfactionScore DECIMAL(3,2) DEFAULT 0,
          performanceScore DECIMAL(5,2) DEFAULT 0,
          createdAt DATETIME2 DEFAULT GETDATE(),
          updatedAt DATETIME2 DEFAULT GETDATE(),
          FOREIGN KEY (userId) REFERENCES users(id),
          UNIQUE(userId, month, year)
        );
        
        -- Domains table
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='domains' AND xtype='U')
        CREATE TABLE domains (
          id INT IDENTITY(1,1) PRIMARY KEY,
          domain NVARCHAR(255) UNIQUE NOT NULL,
          customDomain NVARCHAR(255),
          sslEnabled BIT DEFAULT 0,
          isActive BIT DEFAULT 1,
          ownerId NVARCHAR(50),
          createdAt DATETIME2 DEFAULT GETDATE(),
          updatedAt DATETIME2 DEFAULT GETDATE(),
          FOREIGN KEY (ownerId) REFERENCES users(id)
        );
        
        -- SQL Connections table
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='sql_connections' AND xtype='U')
        CREATE TABLE sql_connections (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(255) NOT NULL,
          description NVARCHAR(MAX),
          host NVARCHAR(255) NOT NULL,
          port INT DEFAULT 5432,
          database NVARCHAR(255) NOT NULL,
          username NVARCHAR(255) NOT NULL,
          password NVARCHAR(255) NOT NULL,
          connectionType NVARCHAR(50) DEFAULT 'postgresql',
          sslEnabled BIT DEFAULT 0,
          isActive BIT DEFAULT 1,
          createdBy NVARCHAR(50),
          lastTested DATETIME2,
          testStatus NVARCHAR(50) DEFAULT 'never_tested',
          testResult NVARCHAR(MAX),
          createdAt DATETIME2 DEFAULT GETDATE(),
          updatedAt DATETIME2 DEFAULT GETDATE(),
          FOREIGN KEY (createdBy) REFERENCES users(id)
        );
        
        -- Sessions table
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='sessions' AND xtype='U')
        CREATE TABLE sessions (
          sid NVARCHAR(255) PRIMARY KEY,
          sess NVARCHAR(MAX) NOT NULL,
          expire DATETIME2 NOT NULL
        );
      `;
      
      await pool.request().query(createTablesSQL);
      await pool.close();
      
      return { success: true, message: 'Tables created successfully in SQL Server database' };
      
    } else if (connection.connectionType === 'postgresql') {
      // PostgreSQL implementation would go here
      return { success: false, message: 'PostgreSQL migration not implemented yet' };
    } else if (connection.connectionType === 'mysql') {
      // MySQL implementation would go here
      return { success: false, message: 'MySQL migration not implemented yet' };
    } else {
      return { success: false, message: 'Unsupported database type' };
    }
    
  } catch (error: any) {
    console.error('Migration error:', error);
    return { 
      success: false, 
      message: `Migration failed: ${error.message}` 
    };
  }
}

export async function seedDefaultData(connection: DatabaseConnection): Promise<{ success: boolean; message: string; }> {
  try {
    if (connection.connectionType !== 'mssql') {
      return { success: false, message: 'Seeding only implemented for SQL Server' };
    }
    
    const config = {
      server: connection.host,
      port: connection.port,
      database: connection.database,
      user: connection.username,
      password: connection.password,
      options: {
        encrypt: connection.sslEnabled,
        trustServerCertificate: !connection.sslEnabled,
      }
    };
    
    const pool = await mssql.connect(config);
    
    // Insert default admin user
    const seedSQL = `
      -- Insert default admin user if not exists
      IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin')
      INSERT INTO users (id, username, password, email, firstName, lastName, role, department, isActive)
      VALUES ('admin001', 'admin', '32dc874d83f8e3829e47123a59ed94f270e6b284fea685496f1fada378a02c1d51464b035595d1bd7872c55355a59f3dc9516a19a096daf5d3485803d09826c4.8e1fabfbd18012c505718f32b41244e1', 'admin@wizoneit.com', 'Admin', 'User', 'admin', 'WIZONE HELP DESK', 1);
      
      -- Insert some sample customers if not exists
      IF NOT EXISTS (SELECT 1 FROM customers WHERE customerId = 'C001')
      INSERT INTO customers (customerId, name, email, phone, address, city, state, zipCode, country, serviceType, monthlyFee, isActive)
      VALUES 
      ('C001', 'TechCorp Solutions', 'contact@techcorp.com', '+1-555-0123', '123 Business Ave', 'New York', 'NY', '10001', 'USA', 'Enterprise Internet', 299.99, 1),
      ('C002', 'Digital Innovations Ltd', 'info@digiinnovations.com', '+1-555-0124', '456 Tech Street', 'San Francisco', 'CA', '94102', 'USA', 'Cloud Services', 199.99, 1),
      ('C003', 'Global Networks Inc', 'support@globalnetworks.com', '+1-555-0125', '789 Network Blvd', 'Chicago', 'IL', '60601', 'USA', 'Managed Services', 399.99, 1);
    `;
    
    await pool.request().query(seedSQL);
    await pool.close();
    
    return { success: true, message: 'Default data seeded successfully' };
    
  } catch (error: any) {
    console.error('Seeding error:', error);
    return { 
      success: false, 
      message: `Seeding failed: ${error.message}` 
    };
  }
}