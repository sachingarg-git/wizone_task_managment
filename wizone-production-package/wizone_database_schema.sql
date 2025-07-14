
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
