// MS SQL Server table creation schemas

export const TABLE_SCHEMAS = {
  users: `
    CREATE TABLE users (
      id NVARCHAR(50) PRIMARY KEY,
      username NVARCHAR(50) UNIQUE NOT NULL,
      password NVARCHAR(255) NOT NULL,
      email NVARCHAR(255),
      firstName NVARCHAR(100),
      lastName NVARCHAR(100),
      phone NVARCHAR(20),
      profileImageUrl NVARCHAR(500),
      role NVARCHAR(20) DEFAULT 'field_engineer',
      department NVARCHAR(100),
      isActive BIT DEFAULT 1,
      createdAt DATETIME2 DEFAULT GETDATE(),
      updatedAt DATETIME2 DEFAULT GETDATE()
    );
  `,

  customers: `
    CREATE TABLE customers (
      id INT IDENTITY(1,1) PRIMARY KEY,
      customerId NVARCHAR(50) UNIQUE NOT NULL,
      name NVARCHAR(255) NOT NULL,
      email NVARCHAR(255),
      phone NVARCHAR(20),
      address NTEXT,
      serviceType NVARCHAR(100),
      connectionStatus NVARCHAR(50) DEFAULT 'active',
      installationDate DATETIME2,
      monthlyCharge DECIMAL(10,2),
      lastPaymentDate DATETIME2,
      createdAt DATETIME2 DEFAULT GETDATE(),
      updatedAt DATETIME2 DEFAULT GETDATE()
    );
  `,

  tasks: `
    CREATE TABLE tasks (
      id INT IDENTITY(1,1) PRIMARY KEY,
      ticketNumber NVARCHAR(50) UNIQUE NOT NULL,
      title NVARCHAR(255) NOT NULL,
      description NTEXT,
      customerId INT,
      customerName NVARCHAR(255),
      status NVARCHAR(50) DEFAULT 'pending',
      priority NVARCHAR(20) DEFAULT 'medium',
      issueType NVARCHAR(100),
      assignedTo NVARCHAR(50),
      fieldEngineerId NVARCHAR(50),
      backendEngineerId NVARCHAR(50),
      createdAt DATETIME2 DEFAULT GETDATE(),
      updatedAt DATETIME2 DEFAULT GETDATE(),
      resolvedAt DATETIME2,
      FOREIGN KEY (customerId) REFERENCES customers(id)
    );
  `,

  task_updates: `
    CREATE TABLE task_updates (
      id INT IDENTITY(1,1) PRIMARY KEY,
      taskId INT NOT NULL,
      status NVARCHAR(50),
      note NTEXT,
      updatedBy NVARCHAR(50),
      filePath NVARCHAR(500),
      fileName NVARCHAR(255),
      fileType NVARCHAR(50),
      createdAt DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (taskId) REFERENCES tasks(id)
    );
  `,

  performance_metrics: `
    CREATE TABLE performance_metrics (
      id INT IDENTITY(1,1) PRIMARY KEY,
      userId NVARCHAR(50) NOT NULL,
      tasksCompleted INT DEFAULT 0,
      averageResolutionTime DECIMAL(10,2),
      customerSatisfactionScore DECIMAL(3,2),
      month INT NOT NULL,
      year INT NOT NULL,
      createdAt DATETIME2 DEFAULT GETDATE(),
      updatedAt DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (userId) REFERENCES users(id)
    );
  `,

  sessions: `
    CREATE TABLE sessions (
      sid NVARCHAR(255) PRIMARY KEY,
      sess NTEXT NOT NULL,
      expire DATETIME2 NOT NULL
    );
    CREATE INDEX IDX_session_expire ON sessions(expire);
  `,

  chat_rooms: `
    CREATE TABLE chat_rooms (
      id INT IDENTITY(1,1) PRIMARY KEY,
      name NVARCHAR(255) NOT NULL,
      description NTEXT,
      isActive BIT DEFAULT 1,
      createdBy NVARCHAR(50),
      createdAt DATETIME2 DEFAULT GETDATE(),
      updatedAt DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (createdBy) REFERENCES users(id)
    );
  `,

  chat_messages: `
    CREATE TABLE chat_messages (
      id INT IDENTITY(1,1) PRIMARY KEY,
      roomId INT NOT NULL,
      senderId NVARCHAR(50) NOT NULL,
      content NTEXT NOT NULL,
      messageType NVARCHAR(20) DEFAULT 'text',
      createdAt DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (roomId) REFERENCES chat_rooms(id),
      FOREIGN KEY (senderId) REFERENCES users(id)
    );
  `,

  chat_participants: `
    CREATE TABLE chat_participants (
      id INT IDENTITY(1,1) PRIMARY KEY,
      roomId INT NOT NULL,
      userId NVARCHAR(50) NOT NULL,
      joinedAt DATETIME2 DEFAULT GETDATE(),
      isActive BIT DEFAULT 1,
      FOREIGN KEY (roomId) REFERENCES chat_rooms(id),
      FOREIGN KEY (userId) REFERENCES users(id),
      UNIQUE(roomId, userId)
    );
  `,

  bot_configurations: `
    CREATE TABLE bot_configurations (
      id INT IDENTITY(1,1) PRIMARY KEY,
      name NVARCHAR(255) NOT NULL,
      botToken NVARCHAR(500) NOT NULL,
      chatId NVARCHAR(100) NOT NULL,
      isActive BIT DEFAULT 1,
      notifyOnTaskCreate BIT DEFAULT 1,
      notifyOnTaskUpdate BIT DEFAULT 1,
      notifyOnTaskComplete BIT DEFAULT 1,
      createdAt DATETIME2 DEFAULT GETDATE(),
      updatedAt DATETIME2 DEFAULT GETDATE()
    );
  `,

  notification_logs: `
    CREATE TABLE notification_logs (
      id INT IDENTITY(1,1) PRIMARY KEY,
      eventType NVARCHAR(50) NOT NULL,
      messageText NTEXT NOT NULL,
      userId NVARCHAR(50),
      customerId INT,
      taskId INT,
      status NVARCHAR(20) DEFAULT 'pending',
      sentAt DATETIME2,
      createdAt DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (customerId) REFERENCES customers(id),
      FOREIGN KEY (taskId) REFERENCES tasks(id)
    );
  `,

  domains: `
    CREATE TABLE domains (
      id INT IDENTITY(1,1) PRIMARY KEY,
      domain NVARCHAR(255) UNIQUE NOT NULL,
      isActive BIT DEFAULT 1,
      sslEnabled BIT DEFAULT 0,
      certificatePath NVARCHAR(500),
      description NTEXT,
      ownerId NVARCHAR(50),
      createdAt DATETIME2 DEFAULT GETDATE(),
      updatedAt DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (ownerId) REFERENCES users(id)
    );
  `,

  sql_connections: `
    CREATE TABLE sql_connections (
      id INT IDENTITY(1,1) PRIMARY KEY,
      name NVARCHAR(255) NOT NULL,
      host NVARCHAR(255) NOT NULL,
      port INT NOT NULL,
      database NVARCHAR(255) NOT NULL,
      username NVARCHAR(255) NOT NULL,
      password NVARCHAR(500) NOT NULL,
      type NVARCHAR(50) NOT NULL,
      sslEnabled BIT DEFAULT 0,
      isActive BIT DEFAULT 1,
      lastTested DATETIME2,
      testStatus NVARCHAR(20) DEFAULT 'never_tested',
      createdBy NVARCHAR(50),
      createdAt DATETIME2 DEFAULT GETDATE(),
      updatedAt DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (createdBy) REFERENCES users(id)
    );
  `,

  customer_system_details: `
    CREATE TABLE customer_system_details (
      id INT IDENTITY(1,1) PRIMARY KEY,
      customerId INT NOT NULL,
      deviceType NVARCHAR(100),
      ipAddress NVARCHAR(45),
      macAddress NVARCHAR(17),
      routerModel NVARCHAR(100),
      firmwareVersion NVARCHAR(50),
      signalStrength DECIMAL(5,2),
      bandwidth NVARCHAR(20),
      lastSpeedTest DECIMAL(10,2),
      notes NTEXT,
      createdAt DATETIME2 DEFAULT GETDATE(),
      updatedAt DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (customerId) REFERENCES customers(id)
    );
  `,

  customer_comments: `
    CREATE TABLE customer_comments (
      id INT IDENTITY(1,1) PRIMARY KEY,
      customerId INT NOT NULL,
      userId NVARCHAR(50) NOT NULL,
      comment NTEXT NOT NULL,
      isInternal BIT DEFAULT 0,
      createdAt DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (customerId) REFERENCES customers(id),
      FOREIGN KEY (userId) REFERENCES users(id)
    );
  `
};

export const TABLE_ORDER = [
  'users',
  'customers', 
  'tasks',
  'task_updates',
  'performance_metrics',
  'sessions',
  'chat_rooms',
  'chat_messages', 
  'chat_participants',
  'bot_configurations',
  'notification_logs',
  'domains',
  'sql_connections',
  'customer_system_details',
  'customer_comments'
];

export function getCreateTableSQL(tableName: string): string {
  return TABLE_SCHEMAS[tableName as keyof typeof TABLE_SCHEMAS];
}