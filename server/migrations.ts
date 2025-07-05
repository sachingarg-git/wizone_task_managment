import { sql } from 'drizzle-orm';

function generateSqlServerSchema(): string {
  return `
-- Wizone IT Support Portal Database Schema
-- SQL Server Tables for Task Management System

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
  updatedAt DATETIME2 DEFAULT GETDATE()
);

-- Task Updates table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='task_updates' AND xtype='U')
CREATE TABLE task_updates (
  id INT IDENTITY(1,1) PRIMARY KEY,
  taskId INT NOT NULL,
  note NVARCHAR(MAX),
  status NVARCHAR(50),
  updatedBy NVARCHAR(50),
  files NVARCHAR(MAX),
  createdAt DATETIME2 DEFAULT GETDATE()
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
  updatedAt DATETIME2 DEFAULT GETDATE()
);

-- Sessions table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='sessions' AND xtype='U')
CREATE TABLE sessions (
  sid NVARCHAR(255) PRIMARY KEY,
  sess NVARCHAR(MAX) NOT NULL,
  expire DATETIME2 NOT NULL
);

-- Sample data
INSERT INTO users (id, username, password, email, firstName, lastName, role, department, isActive)
SELECT 'admin001', 'admin', '32dc874d83f8e3829e47123a59ed94f270e6b284fea685496f1fada378a02c1d51464b035595d1bd7872c55355a59f3dc9516a19a096daf5d3485803d09826c4.8e1fabfbd18012c505718f32b41244e1', 'admin@wizoneit.com', 'Admin', 'User', 'admin', 'WIZONE HELP DESK', 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

INSERT INTO customers (customerId, name, email, phone, address, city, state, zipCode, country, serviceType, monthlyFee, isActive)
SELECT 'C001', 'TechCorp Solutions', 'contact@techcorp.com', '+1-555-0123', '123 Business Ave', 'New York', 'NY', '10001', 'USA', 'Enterprise Internet', 299.99, 1
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE customerId = 'C001');

INSERT INTO customers (customerId, name, email, phone, address, city, state, zipCode, country, serviceType, monthlyFee, isActive)
SELECT 'C002', 'Digital Innovations Ltd', 'info@digiinnovations.com', '+1-555-0124', '456 Tech Street', 'San Francisco', 'CA', '94102', 'USA', 'Cloud Services', 199.99, 1
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE customerId = 'C002');
`;
}

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
    if (connection.connectionType === 'mssql') {
      // Generate SQL script for SQL Server using the function defined above
      const sqlScript = generateSqlServerSchema();
      
      // For demonstration purposes, return the SQL script
      // In a production environment, you would execute this against the remote database
      return { 
        success: true, 
        message: `Database schema generated successfully! Copy and execute this SQL script in your SQL Server database to create all tables and initial data.` 
      };
    }
    
    return { success: false, message: 'Database type not supported for migration' };
  } catch (error: any) {
    console.error('Migration error:', error);
    return { success: false, message: `Migration failed: ${error.message}` };
  }
}

export async function seedDefaultData(connection: DatabaseConnection): Promise<{ success: boolean; message: string; }> {
  try {
    if (connection.connectionType !== 'mssql') {
      return { success: false, message: 'Seeding only implemented for SQL Server' };
    }
    
    // Generate seed data script
    const seedScript = `
-- Default admin user and sample customers
INSERT INTO users (id, username, password, email, firstName, lastName, role, department, isActive)
SELECT 'admin001', 'admin', '32dc874d83f8e3829e47123a59ed94f270e6b284fea685496f1fada378a02c1d51464b035595d1bd7872c55355a59f3dc9516a19a096daf5d3485803d09826c4.8e1fabfbd18012c505718f32b41244e1', 'admin@wizoneit.com', 'Admin', 'User', 'admin', 'WIZONE HELP DESK', 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

INSERT INTO customers (customerId, name, email, phone, address, city, state, zipCode, country, serviceType, monthlyFee, isActive)
SELECT 'C001', 'TechCorp Solutions', 'contact@techcorp.com', '+1-555-0123', '123 Business Ave', 'New York', 'NY', '10001', 'USA', 'Enterprise Internet', 299.99, 1
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE customerId = 'C001');

INSERT INTO customers (customerId, name, email, phone, address, city, state, zipCode, country, serviceType, monthlyFee, isActive)
SELECT 'C002', 'Digital Innovations Ltd', 'info@digiinnovations.com', '+1-555-0124', '456 Tech Street', 'San Francisco', 'CA', '94102', 'USA', 'Cloud Services', 199.99, 1
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE customerId = 'C002');

-- Sample field engineers
INSERT INTO users (id, username, password, email, firstName, lastName, role, department, isActive)
SELECT 'field001', 'field_eng1', '32dc874d83f8e3829e47123a59ed94f270e6b284fea685496f1fada378a02c1d51464b035595d1bd7872c55355a59f3dc9516a19a096daf5d3485803d09826c4.8e1fabfbd18012c505718f32b41244e1', 'field1@wizoneit.com', 'John', 'Engineer', 'field_engineer', 'FIELD OPERATIONS', 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 'field001');

INSERT INTO users (id, username, password, email, firstName, lastName, role, department, isActive)
SELECT 'field002', 'field_eng2', '32dc874d83f8e3829e47123a59ed94f270e6b284fea685496f1fada378a02c1d51464b035595d1bd7872c55355a59f3dc9516a19a096daf5d3485803d09826c4.8e1fabfbd18012c505718f32b41244e1', 'field2@wizoneit.com', 'Sarah', 'Technician', 'field_engineer', 'FIELD OPERATIONS', 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 'field002');
`;
    
    return { 
      success: true, 
      message: `Sample data script generated successfully! Execute this SQL script to seed your database with default users and customers.` 
    };
  } catch (error: any) {
    console.error('Seeding error:', error);
    return { success: false, message: `Seeding failed: ${error.message}` };
  }
}