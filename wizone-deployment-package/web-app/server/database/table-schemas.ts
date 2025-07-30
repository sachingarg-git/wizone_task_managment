// MS SQL Server table creation schemas for Wizone IT Support Portal

export const tableSchemas = {
  users: `
    CREATE TABLE users (
      id NVARCHAR(255) PRIMARY KEY DEFAULT NEWID(),
      username NVARCHAR(100) UNIQUE NOT NULL,
      password NVARCHAR(255) NOT NULL,
      email NVARCHAR(255) UNIQUE,
      firstName NVARCHAR(100),
      lastName NVARCHAR(100),
      phone NVARCHAR(50),
      profileImageUrl NVARCHAR(500),
      role NVARCHAR(50) DEFAULT 'field_engineer' CHECK (role IN ('admin', 'manager', 'backend_engineer', 'field_engineer')),
      department NVARCHAR(100),
      isActive BIT DEFAULT 1,
      createdAt DATETIME2 DEFAULT GETDATE(),
      updatedAt DATETIME2 DEFAULT GETDATE()
    )
  `,

  customers: `
    CREATE TABLE customers (
      id INT IDENTITY(1,1) PRIMARY KEY,
      customerId NVARCHAR(100) UNIQUE NOT NULL,
      name NVARCHAR(255) NOT NULL,
      email NVARCHAR(255),
      phone NVARCHAR(50),
      address NVARCHAR(500),
      serviceType NVARCHAR(100),
      connectionStatus NVARCHAR(50) DEFAULT 'active' CHECK (connectionStatus IN ('active', 'inactive', 'suspended', 'pending')),
      installationDate DATE,
      monthlyCharge DECIMAL(10,2),
      lastPaymentDate DATE,
      createdAt DATETIME2 DEFAULT GETDATE(),
      updatedAt DATETIME2 DEFAULT GETDATE()
    )
  `,

  tasks: `
    CREATE TABLE tasks (
      id INT IDENTITY(1,1) PRIMARY KEY,
      ticketNumber NVARCHAR(100) UNIQUE NOT NULL,
      title NVARCHAR(255) NOT NULL,
      description NTEXT,
      customerId INT,
      customerName NVARCHAR(255),
      status NVARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'on_hold', 'completed', 'cancelled')),
      priority NVARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
      issueType NVARCHAR(100),
      assignedTo NVARCHAR(255),
      fieldEngineerId NVARCHAR(255),
      backendEngineerId NVARCHAR(255),
      createdAt DATETIME2 DEFAULT GETDATE(),
      updatedAt DATETIME2 DEFAULT GETDATE(),
      resolvedAt DATETIME2,
      FOREIGN KEY (customerId) REFERENCES customers(id),
      FOREIGN KEY (fieldEngineerId) REFERENCES users(id),
      FOREIGN KEY (backendEngineerId) REFERENCES users(id)
    )
  `,

  task_updates: `
    CREATE TABLE task_updates (
      id INT IDENTITY(1,1) PRIMARY KEY,
      taskId INT NOT NULL,
      status NVARCHAR(50),
      note NTEXT,
      updatedBy NVARCHAR(255),
      filePath NVARCHAR(500),
      fileName NVARCHAR(255),
      fileType NVARCHAR(100),
      createdAt DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (updatedBy) REFERENCES users(id)
    )
  `,

  performance_metrics: `
    CREATE TABLE performance_metrics (
      id INT IDENTITY(1,1) PRIMARY KEY,
      userId NVARCHAR(255) NOT NULL,
      tasksCompleted INT DEFAULT 0,
      averageResolutionTime DECIMAL(10,2),
      customerSatisfactionScore DECIMAL(3,2),
      month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
      year INT NOT NULL,
      createdAt DATETIME2 DEFAULT GETDATE(),
      updatedAt DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (userId) REFERENCES users(id),
      UNIQUE (userId, month, year)
    )
  `,

  sessions: `
    CREATE TABLE sessions (
      sid NVARCHAR(255) PRIMARY KEY,
      sess NTEXT NOT NULL,
      expire DATETIME2 NOT NULL
    )
  `,

  bot_configurations: `
    CREATE TABLE bot_configurations (
      id INT IDENTITY(1,1) PRIMARY KEY,
      name NVARCHAR(255) NOT NULL,
      botToken NVARCHAR(500) NOT NULL,
      chatId NVARCHAR(255) NOT NULL,
      isActive BIT DEFAULT 1,
      notifyOnTaskCreate BIT DEFAULT 1,
      notifyOnTaskUpdate BIT DEFAULT 1,
      notifyOnTaskComplete BIT DEFAULT 1,
      createdAt DATETIME2 DEFAULT GETDATE(),
      updatedAt DATETIME2 DEFAULT GETDATE()
    )
  `,

  notification_logs: `
    CREATE TABLE notification_logs (
      id INT IDENTITY(1,1) PRIMARY KEY,
      eventType NVARCHAR(100) NOT NULL,
      messageText NTEXT NOT NULL,
      userId NVARCHAR(255),
      customerId INT,
      taskId INT,
      status NVARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
      sentAt DATETIME2,
      createdAt DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (customerId) REFERENCES customers(id),
      FOREIGN KEY (taskId) REFERENCES tasks(id)
    )
  `,

  sql_connections: `
    CREATE TABLE sql_connections (
      id INT IDENTITY(1,1) PRIMARY KEY,
      name NVARCHAR(255) NOT NULL,
      host NVARCHAR(255) NOT NULL,
      port INT NOT NULL,
      database_name NVARCHAR(255) NOT NULL,
      username NVARCHAR(255) NOT NULL,
      password NVARCHAR(500) NOT NULL,
      ssl BIT DEFAULT 0,
      testStatus NVARCHAR(50) DEFAULT 'never_tested' CHECK (testStatus IN ('success', 'failed', 'pending', 'never_tested')),
      lastTested DATETIME2,
      createdAt DATETIME2 DEFAULT GETDATE(),
      updatedAt DATETIME2 DEFAULT GETDATE()
    )
  `,

  customer_system_details: `
    CREATE TABLE customer_system_details (
      id INT IDENTITY(1,1) PRIMARY KEY,
      customer_id INT NOT NULL,
      systemType NVARCHAR(100),
      operatingSystem NVARCHAR(100),
      ipAddress NVARCHAR(50),
      macAddress NVARCHAR(50),
      deviceModel NVARCHAR(100),
      installationNotes NTEXT,
      lastMaintenanceDate DATE,
      warrantyExpiry DATE,
      createdAt DATETIME2 DEFAULT GETDATE(),
      updatedAt DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )
  `,

  chat_rooms: `
    CREATE TABLE chat_rooms (
      id INT IDENTITY(1,1) PRIMARY KEY,
      name NVARCHAR(255) NOT NULL,
      description NTEXT,
      isActive BIT DEFAULT 1,
      createdBy NVARCHAR(255),
      createdAt DATETIME2 DEFAULT GETDATE(),
      updatedAt DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (createdBy) REFERENCES users(id)
    )
  `,

  chat_participants: `
    CREATE TABLE chat_participants (
      id INT IDENTITY(1,1) PRIMARY KEY,
      roomId INT NOT NULL,
      userId NVARCHAR(255) NOT NULL,
      joinedAt DATETIME2 DEFAULT GETDATE(),
      lastSeen DATETIME2,
      FOREIGN KEY (roomId) REFERENCES chat_rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id),
      UNIQUE (roomId, userId)
    )
  `,

  chat_messages: `
    CREATE TABLE chat_messages (
      id INT IDENTITY(1,1) PRIMARY KEY,
      roomId INT NOT NULL,
      senderId NVARCHAR(255) NOT NULL,
      content NTEXT NOT NULL,
      messageType NVARCHAR(50) DEFAULT 'text' CHECK (messageType IN ('text', 'image', 'file')),
      createdAt DATETIME2 DEFAULT GETDATE(),
      editedAt DATETIME2,
      FOREIGN KEY (roomId) REFERENCES chat_rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (senderId) REFERENCES users(id)
    )
  `,

  domain_management: `
    CREATE TABLE domain_management (
      id INT IDENTITY(1,1) PRIMARY KEY,
      domain NVARCHAR(255) UNIQUE NOT NULL,
      status NVARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
      sslEnabled BIT DEFAULT 0,
      sslCertificate NTEXT,
      ownerId NVARCHAR(255),
      createdAt DATETIME2 DEFAULT GETDATE(),
      updatedAt DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (ownerId) REFERENCES users(id)
    )
  `,

  analytics_data: `
    CREATE TABLE analytics_data (
      id INT IDENTITY(1,1) PRIMARY KEY,
      eventType NVARCHAR(100) NOT NULL,
      eventData NTEXT,
      userId NVARCHAR(255),
      sessionId NVARCHAR(255),
      ipAddress NVARCHAR(50),
      userAgent NVARCHAR(500),
      createdAt DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `
};

export const indexStatements = [
  'CREATE INDEX IX_tasks_status ON tasks(status)',
  'CREATE INDEX IX_tasks_assignedTo ON tasks(assignedTo)',
  'CREATE INDEX IX_tasks_customerId ON tasks(customerId)',
  'CREATE INDEX IX_tasks_createdAt ON tasks(createdAt)',
  'CREATE INDEX IX_task_updates_taskId ON task_updates(taskId)',
  'CREATE INDEX IX_task_updates_createdAt ON task_updates(createdAt)',
  'CREATE INDEX IX_customers_customerId ON customers(customerId)',
  'CREATE INDEX IX_customers_phone ON customers(phone)',
  'CREATE INDEX IX_users_username ON users(username)',
  'CREATE INDEX IX_users_email ON users(email)',
  'CREATE INDEX IX_users_role ON users(role)',
  'CREATE INDEX IX_sessions_expire ON sessions(expire)',
  'CREATE INDEX IX_chat_messages_roomId ON chat_messages(roomId)',
  'CREATE INDEX IX_chat_messages_createdAt ON chat_messages(createdAt)',
  'CREATE INDEX IX_notification_logs_createdAt ON notification_logs(createdAt)',
  'CREATE INDEX IX_performance_metrics_userId_date ON performance_metrics(userId, year, month)'
];

export const tableOrder = [
  'users',
  'customers', 
  'tasks',
  'task_updates',
  'performance_metrics',
  'sessions',
  'bot_configurations',
  'notification_logs',
  'sql_connections',
  'customer_system_details',
  'chat_rooms',
  'chat_participants', 
  'chat_messages',
  'domain_management',
  'analytics_data'
];