import { db } from './db.js';
import { storage } from './storage.js';
import mssql from 'mssql';

// SQL Server Configuration
const sqlServerConfig = {
  server: "14.102.70.90",
  port: 1433,
  database: "TASK_SCORE_WIZONE", 
  user: "sa",
  password: "ss123456",
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  connectionTimeout: 30000,
  requestTimeout: 30000,
};

export class MSSQLMigration {
  private pool: mssql.ConnectionPool;

  constructor() {
    this.pool = new mssql.ConnectionPool(sqlServerConfig);
  }

  async connect() {
    try {
      await this.pool.connect();
      console.log('✅ Connected to SQL Server for migration');
    } catch (error) {
      console.error('❌ SQL Server connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.pool.close();
      console.log('✅ SQL Server connection closed');
    } catch (error) {
      console.error('❌ Error closing SQL Server connection:', error);
    }
  }

  // Create all tables with proper SQL Server syntax
  async createAllTables() {
    const tableCreationQueries = [
      // 1. Sessions table (required for authentication)
      `CREATE TABLE IF NOT EXISTS sessions (
        sid NVARCHAR(255) PRIMARY KEY,
        sess NVARCHAR(MAX) NOT NULL,
        expire DATETIME2 NOT NULL
      )`,

      // 2. Users table
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
       CREATE TABLE users (
        id NVARCHAR(255) PRIMARY KEY,
        username NVARCHAR(255) UNIQUE,
        password NVARCHAR(512),
        email NVARCHAR(255) UNIQUE,
        firstName NVARCHAR(255),
        lastName NVARCHAR(255),
        phone NVARCHAR(50),
        profileImageUrl NVARCHAR(500),
        role NVARCHAR(100) DEFAULT 'engineer',
        department NVARCHAR(255),
        isActive BIT DEFAULT 1,
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE()
      )`,

      // 3. Customers table
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='customers' AND xtype='U')
       CREATE TABLE customers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        customerId NVARCHAR(255) UNIQUE NOT NULL,
        name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255),
        contactPerson NVARCHAR(255),
        mobilePhone NVARCHAR(50),
        address NVARCHAR(MAX),
        city NVARCHAR(255),
        state NVARCHAR(255),
        pincode NVARCHAR(20),
        serviceType NVARCHAR(255),
        connectionDate DATETIME2,
        status NVARCHAR(100) DEFAULT 'active',
        username NVARCHAR(255),
        password NVARCHAR(255),
        hasPortalAccess BIT DEFAULT 0,
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE()
      )`,

      // 4. Tasks table
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tasks' AND xtype='U')
       CREATE TABLE tasks (
        id INT IDENTITY(1,1) PRIMARY KEY,
        ticketNumber NVARCHAR(255) UNIQUE NOT NULL,
        title NVARCHAR(500) NOT NULL,
        description NVARCHAR(MAX),
        customerId INT,
        assignedTo NVARCHAR(255),
        fieldEngineerId NVARCHAR(255),
        status NVARCHAR(100) DEFAULT 'pending',
        priority NVARCHAR(50) DEFAULT 'medium',
        issueType NVARCHAR(255),
        resolution NVARCHAR(MAX),
        estimatedHours DECIMAL(10,2),
        actualHours DECIMAL(10,2),
        createdBy NVARCHAR(255),
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        resolvedAt DATETIME2,
        FOREIGN KEY (customerId) REFERENCES customers(id),
        FOREIGN KEY (assignedTo) REFERENCES users(id),
        FOREIGN KEY (fieldEngineerId) REFERENCES users(id),
        FOREIGN KEY (createdBy) REFERENCES users(id)
      )`,

      // 5. Task Updates table
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='task_updates' AND xtype='U') 
       CREATE TABLE task_updates (
        id INT IDENTITY(1,1) PRIMARY KEY,
        taskId INT NOT NULL,
        updatedBy NVARCHAR(255) NOT NULL,
        updateType NVARCHAR(100) NOT NULL,
        previousStatus NVARCHAR(100),
        newStatus NVARCHAR(100),
        note NVARCHAR(MAX),
        attachmentPath NVARCHAR(500),
        attachmentOriginalName NVARCHAR(255),
        createdAt DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (taskId) REFERENCES tasks(id),
        FOREIGN KEY (updatedBy) REFERENCES users(id)
      )`,

      // 6. Performance Metrics table
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='performance_metrics' AND xtype='U')
       CREATE TABLE performance_metrics (
        id INT IDENTITY(1,1) PRIMARY KEY,
        userId NVARCHAR(255) NOT NULL,
        tasksCompleted INT DEFAULT 0,
        averageResolutionTime DECIMAL(10,2),
        customerSatisfactionScore DECIMAL(3,2),
        month INT NOT NULL,
        year INT NOT NULL,
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (userId) REFERENCES users(id)
      )`,

      // 7. Domains table
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='domains' AND xtype='U')
       CREATE TABLE domains (
        id INT IDENTITY(1,1) PRIMARY KEY,
        domain NVARCHAR(255) UNIQUE NOT NULL,
        isActive BIT DEFAULT 1,
        sslEnabled BIT DEFAULT 0,
        sslCertPath NVARCHAR(500),
        createdBy NVARCHAR(255),
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (createdBy) REFERENCES users(id)
      )`,

      // 8. SQL Connections table
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='sql_connections' AND xtype='U')
       CREATE TABLE sql_connections (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        host NVARCHAR(255) NOT NULL,
        port INT DEFAULT 1433,
        username NVARCHAR(255) NOT NULL,
        password NVARCHAR(255) NOT NULL,
        database_name NVARCHAR(255) NOT NULL,
        database_type NVARCHAR(50) DEFAULT 'mssql',
        ssl_enabled BIT DEFAULT 0,
        connection_timeout INT DEFAULT 30000,
        last_tested_at DATETIME2,
        test_status NVARCHAR(50) DEFAULT 'never_tested',
        test_error NVARCHAR(MAX),
        created_by NVARCHAR(255),
        is_active BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )`,

      // 9. Chat Rooms table
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='chat_rooms' AND xtype='U')
       CREATE TABLE chat_rooms (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        room_type NVARCHAR(50) DEFAULT 'general',
        created_by NVARCHAR(255) NOT NULL,
        is_active BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )`,

      // 10. Chat Messages table
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='chat_messages' AND xtype='U')
       CREATE TABLE chat_messages (
        id INT IDENTITY(1,1) PRIMARY KEY,
        room_id INT NOT NULL,
        sender_id NVARCHAR(255) NOT NULL,
        content NVARCHAR(MAX) NOT NULL,
        message_type NVARCHAR(50) DEFAULT 'text',
        created_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (room_id) REFERENCES chat_rooms(id),
        FOREIGN KEY (sender_id) REFERENCES users(id)
      )`,

      // 11. Chat Participants table
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='chat_participants' AND xtype='U')
       CREATE TABLE chat_participants (
        id INT IDENTITY(1,1) PRIMARY KEY,
        room_id INT NOT NULL,
        user_id NVARCHAR(255) NOT NULL,
        role NVARCHAR(50) DEFAULT 'member',
        joined_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (room_id) REFERENCES chat_rooms(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,

      // 12. Customer Comments table
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='customer_comments' AND xtype='U')
       CREATE TABLE customer_comments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        task_id INT NOT NULL,
        customer_id INT NOT NULL,
        comment NVARCHAR(MAX) NOT NULL,
        attachments NVARCHAR(MAX),
        is_internal BIT DEFAULT 0,
        responded_by NVARCHAR(255),
        created_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (task_id) REFERENCES tasks(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (responded_by) REFERENCES users(id)
      )`,

      // 13. Customer System Details table
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='customer_system_details' AND xtype='U')
       CREATE TABLE customer_system_details (
        id INT IDENTITY(1,1) PRIMARY KEY,
        customer_id INT NOT NULL,
        system_name NVARCHAR(255) NOT NULL,
        system_type NVARCHAR(255),
        ip_address NVARCHAR(50),
        mac_address NVARCHAR(50),
        operating_system NVARCHAR(255),
        specifications NVARCHAR(MAX),
        installation_date DATETIME2,
        last_maintenance DATETIME2,
        status NVARCHAR(100) DEFAULT 'active',
        notes NVARCHAR(MAX),
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      )`,

      // 14. Bot Configurations table
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='bot_configurations' AND xtype='U')
       CREATE TABLE bot_configurations (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        type NVARCHAR(100) NOT NULL,
        webhook_url NVARCHAR(500),
        bot_token NVARCHAR(500),
        chat_id NVARCHAR(255),
        is_active BIT DEFAULT 1,
        event_types NVARCHAR(500),
        created_by NVARCHAR(255) NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )`,

      // 15. Notification Logs table
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='notification_logs' AND xtype='U')
       CREATE TABLE notification_logs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        config_id INT NOT NULL,
        event_type NVARCHAR(100) NOT NULL,
        task_id INT,
        customer_id INT,
        user_id NVARCHAR(255),
        message_text NVARCHAR(MAX) NOT NULL,
        message_template_used NVARCHAR(255),
        status NVARCHAR(50) NOT NULL,
        response_data NVARCHAR(MAX),
        error_message NVARCHAR(MAX),
        sent_at DATETIME2,
        created_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (config_id) REFERENCES bot_configurations(id),
        FOREIGN KEY (task_id) REFERENCES tasks(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`
    ];

    console.log('🔄 Creating all tables in SQL Server...');
    
    for (let i = 0; i < tableCreationQueries.length; i++) {
      try {
        const request = this.pool.request();
        await request.query(tableCreationQueries[i]);
        console.log(`✅ Table ${i + 1}/15 created successfully`);
      } catch (error) {
        console.error(`❌ Error creating table ${i + 1}:`, error);
        throw error;
      }
    }

    console.log('🎉 All 15 tables created successfully in SQL Server');
  }

  // Migrate all data from PostgreSQL to SQL Server
  async migrateData() {
    console.log('🔄 Starting data migration from PostgreSQL to SQL Server...');

    try {
      // 1. Migrate Users
      console.log('📤 Migrating users...');
      const users = await storage.getAllUsers();
      
      for (const user of users) {
        try {
          const request = this.pool.request();
          await request
            .input('id', user.id)
            .input('username', user.username)
            .input('password', user.password)
            .input('email', user.email)
            .input('firstName', user.firstName)
            .input('lastName', user.lastName)
            .input('phone', user.phone)
            .input('profileImageUrl', user.profileImageUrl)
            .input('role', user.role)
            .input('department', user.department)
            .input('isActive', user.isActive)
            .input('createdAt', user.createdAt)
            .input('updatedAt', user.updatedAt)
            .query(`
              IF NOT EXISTS (SELECT 1 FROM users WHERE id = @id)
              INSERT INTO users (id, username, password, email, firstName, lastName, phone, profileImageUrl, role, department, isActive, createdAt, updatedAt)
              VALUES (@id, @username, @password, @email, @firstName, @lastName, @phone, @profileImageUrl, @role, @department, @isActive, @createdAt, @updatedAt)
            `);
        } catch (error) {
          console.log(`⚠️ User ${user.username} might already exist, skipping...`);
        }
      }
      console.log(`✅ ${users.length} users migrated`);

      // 2. Migrate Customers
      console.log('📤 Migrating customers...');
      const customers = await storage.getAllCustomers();
      
      for (const customer of customers) {
        try {
          const request = this.pool.request();
          await request
            .input('customerId', customer.customerId)
            .input('name', customer.name)
            .input('email', customer.email)
            .input('contactPerson', customer.contactPerson)
            .input('mobilePhone', customer.mobilePhone)
            .input('address', customer.address)
            .input('city', customer.city)
            .input('state', customer.state)
            .input('pincode', customer.pincode)
            .input('serviceType', customer.serviceType)
            .input('connectionDate', customer.connectionDate)
            .input('status', customer.status)
            .input('username', customer.username)
            .input('password', customer.password)
            .input('hasPortalAccess', customer.hasPortalAccess)
            .input('createdAt', customer.createdAt)
            .input('updatedAt', customer.updatedAt)
            .query(`
              IF NOT EXISTS (SELECT 1 FROM customers WHERE customerId = @customerId)
              INSERT INTO customers (customerId, name, email, contactPerson, mobilePhone, address, city, state, pincode, serviceType, connectionDate, status, username, password, hasPortalAccess, createdAt, updatedAt)
              VALUES (@customerId, @name, @email, @contactPerson, @mobilePhone, @address, @city, @state, @pincode, @serviceType, @connectionDate, @status, @username, @password, @hasPortalAccess, @createdAt, @updatedAt)
            `);
        } catch (error) {
          console.log(`⚠️ Customer ${customer.customerId} might already exist, skipping...`);
        }
      }
      console.log(`✅ ${customers.length} customers migrated`);

      // 3. Migrate Tasks
      console.log('📤 Migrating tasks...');
      const tasks = await storage.getAllTasks();
      
      for (const task of tasks) {
        try {
          const request = this.pool.request();
          await request
            .input('ticketNumber', task.ticketNumber)
            .input('title', task.title)
            .input('description', task.description)
            .input('customerId', task.customerId)
            .input('assignedTo', task.assignedTo)
            .input('fieldEngineerId', task.fieldEngineerId)
            .input('status', task.status)
            .input('priority', task.priority)
            .input('issueType', task.issueType)
            .input('resolution', task.resolution)
            .input('estimatedHours', task.estimatedHours)
            .input('actualHours', task.actualHours)
            .input('createdBy', task.createdBy)
            .input('createdAt', task.createdAt)
            .input('updatedAt', task.updatedAt)
            .input('resolvedAt', task.resolvedAt)
            .query(`
              IF NOT EXISTS (SELECT 1 FROM tasks WHERE ticketNumber = @ticketNumber)
              INSERT INTO tasks (ticketNumber, title, description, customerId, assignedTo, fieldEngineerId, status, priority, issueType, resolution, estimatedHours, actualHours, createdBy, createdAt, updatedAt, resolvedAt)
              VALUES (@ticketNumber, @title, @description, @customerId, @assignedTo, @fieldEngineerId, @status, @priority, @issueType, @resolution, @estimatedHours, @actualHours, @createdBy, @createdAt, @updatedAt, @resolvedAt)
            `);
        } catch (error) {
          console.log(`⚠️ Task ${task.ticketNumber} might already exist, skipping...`);
        }
      }
      console.log(`✅ ${tasks.length} tasks migrated`);

      console.log('🎉 Data migration completed successfully!');
      
    } catch (error) {
      console.error('❌ Data migration failed:', error);
      throw error;
    }
  }

  // Complete migration process
  async runFullMigration() {
    try {
      await this.connect();
      await this.createAllTables();
      await this.migrateData();
      await this.disconnect();
      
      console.log('🚀 FULL MIGRATION COMPLETED SUCCESSFULLY!');
      console.log('📊 SQL Server is now ready with all tables and data');
      
      return {
        success: true,
        message: 'All tables created and data migrated successfully',
        tables: 15,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      await this.disconnect();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }
}