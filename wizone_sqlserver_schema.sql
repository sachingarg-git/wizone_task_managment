-- Wizone IT Support Portal - SQL Server Database Schema
-- Complete table structure for SQL Server

USE wizone_db;
GO

-- Users table
CREATE TABLE users (
    id NVARCHAR(255) PRIMARY KEY,
    username NVARCHAR(255) UNIQUE,
    password NVARCHAR(512),
    email NVARCHAR(255) UNIQUE NOT NULL,
    firstName NVARCHAR(255) NOT NULL,
    lastName NVARCHAR(255) NOT NULL,
    phone NVARCHAR(50),
    profileImageUrl NVARCHAR(512),
    role NVARCHAR(50) DEFAULT 'engineer' CHECK (role IN ('admin', 'manager', 'engineer', 'field_engineer')),
    department NVARCHAR(255),
    isActive BIT DEFAULT 1,
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE()
);

-- Customers table
CREATE TABLE customers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    customerId NVARCHAR(255) UNIQUE,
    name NVARCHAR(255) NOT NULL,
    contactPerson NVARCHAR(255),
    address NVARCHAR(512),
    city NVARCHAR(255),
    state NVARCHAR(255),
    mobilePhone NVARCHAR(50),
    email NVARCHAR(255),
    servicePlan NVARCHAR(255),
    connectedTower NVARCHAR(255),
    wirelessIp NVARCHAR(45),
    wirelessApIp NVARCHAR(45),
    port NVARCHAR(50),
    plan NVARCHAR(255),
    installationDate DATE,
    status NVARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    username NVARCHAR(255),
    password NVARCHAR(512),
    portalAccess BIT DEFAULT 0,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    locationNotes NVARCHAR(MAX),
    locationVerified BIT DEFAULT 0,
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE()
);

-- Tasks table
CREATE TABLE tasks (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ticketNumber NVARCHAR(255) UNIQUE NOT NULL,
    title NVARCHAR(255) NOT NULL,
    customerId INT NOT NULL,
    assignedTo NVARCHAR(255),
    fieldEngineerId NVARCHAR(255),
    createdBy NVARCHAR(255) NOT NULL,
    priority NVARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    issueType NVARCHAR(255),
    status NVARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'field_visit', 'waiting_customer', 'completed', 'cancelled')),
    description NVARCHAR(MAX),
    resolution NVARCHAR(MAX),
    completionNote NVARCHAR(MAX),
    resolvedBy NVARCHAR(255),
    fieldStartTime DATETIME2,
    fieldWaitingTime INT,
    fieldWaitingReason NVARCHAR(MAX),
    startTime DATETIME2,
    completionTime DATETIME2,
    estimatedTime INT,
    actualTime INT,
    visitCharges DECIMAL(10,2),
    contactPerson NVARCHAR(255),
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (customerId) REFERENCES customers(id),
    FOREIGN KEY (assignedTo) REFERENCES users(id),
    FOREIGN KEY (fieldEngineerId) REFERENCES users(id),
    FOREIGN KEY (createdBy) REFERENCES users(id),
    FOREIGN KEY (resolvedBy) REFERENCES users(id)
);

-- Task Updates table
CREATE TABLE task_updates (
    id INT IDENTITY(1,1) PRIMARY KEY,
    taskId INT NOT NULL,
    userId NVARCHAR(255) NOT NULL,
    updateType NVARCHAR(50) DEFAULT 'note' CHECK (updateType IN ('note', 'status_change', 'assignment', 'file_upload')),
    note NVARCHAR(MAX),
    status NVARCHAR(50),
    fileName NVARCHAR(255),
    filePath NVARCHAR(512),
    fileSize INT,
    createdAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (taskId) REFERENCES tasks(id),
    FOREIGN KEY (userId) REFERENCES users(id)
);

-- Performance Metrics table
CREATE TABLE performance_metrics (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId NVARCHAR(255) NOT NULL,
    tasksCompleted INT DEFAULT 0,
    avgResponseTime DECIMAL(10,2),
    avgResolutionTime DECIMAL(10,2),
    customerSatisfaction DECIMAL(3,2),
    periodStart DATE NOT NULL,
    periodEnd DATE NOT NULL,
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES users(id)
);

-- SQL Connections table
CREATE TABLE sql_connections (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    host NVARCHAR(255) NOT NULL,
    port INT DEFAULT 1433,
    username NVARCHAR(255) NOT NULL,
    password NVARCHAR(512) NOT NULL,
    database_name NVARCHAR(255) NOT NULL,
    connection_type NVARCHAR(50) DEFAULT 'mssql' CHECK (connection_type IN ('mssql', 'mysql', 'postgresql', 'sqlite')),
    ssl_enabled BIT DEFAULT 0,
    test_status NVARCHAR(50) DEFAULT 'never_tested' CHECK (test_status IN ('success', 'failed', 'pending', 'never_tested')),
    last_test_at DATETIME2,
    created_by NVARCHAR(255) NOT NULL,
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Insert default admin user
IF NOT EXISTS (SELECT 1 FROM users WHERE id = 'admin001')
BEGIN
    INSERT INTO users (id, username, password, email, firstName, lastName, role, department, isActive)
    VALUES ('admin001', 'admin', '32dc874d83f8e3829e47123a59ed94f270e6b284fea685496f1fada378a02c1d51464b035595d1bd7872c55355a59f3dc9516a19a096daf5d3485803d09826c4.8e1fabfbd18012c505718f32b41244e1', 'admin@wizone.com', 'Admin', 'User', 'admin', 'Management', 1);
END

-- Insert sample field engineer
IF NOT EXISTS (SELECT 1 FROM users WHERE id = 'WIZONE0015')
BEGIN
    INSERT INTO users (id, username, password, email, firstName, lastName, role, department, isActive)
    VALUES ('WIZONE0015', 'RAVI', '32dc874d83f8e3829e47123a59ed94f270e6b284fea685496f1fada378a02c1d51464b035595d1bd7872c55355a59f3dc9516a19a096daf5d3485803d09826c4.8e1fabfbd18012c505718f32b41244e1', 'ravi@wizone.com', 'Ravi', 'Kumar', 'field_engineer', 'Field Operations', 1);
END

-- Insert sample customer
IF NOT EXISTS (SELECT 1 FROM customers WHERE customerId = 'C001')
BEGIN
    INSERT INTO customers (customerId, name, contactPerson, address, city, state, mobilePhone, email, servicePlan, connectedTower, wirelessIp, status)
    VALUES ('C001', 'TechCorp Solutions', 'John Smith', '123 Business Park Drive', 'Austin', 'TX', '+1-512-555-0101', 'john.smith@techcorp.com', 'Enterprise', 'Tower-A1', '192.168.1.100', 'active');
END

-- Create indexes for better performance
CREATE INDEX IX_tasks_customerId ON tasks(customerId);
CREATE INDEX IX_tasks_assignedTo ON tasks(assignedTo);
CREATE INDEX IX_tasks_fieldEngineerId ON tasks(fieldEngineerId);
CREATE INDEX IX_tasks_status ON tasks(status);
CREATE INDEX IX_tasks_createdAt ON tasks(createdAt);
CREATE INDEX IX_task_updates_taskId ON task_updates(taskId);
CREATE INDEX IX_performance_metrics_userId ON performance_metrics(userId);

PRINT 'Wizone IT Support Portal database schema created successfully!';
GO