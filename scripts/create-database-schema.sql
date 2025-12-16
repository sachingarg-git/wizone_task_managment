-- TaskScoreTracker Database Schema
-- PostgreSQL Database Schema Creation Script

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS task_updates CASCADE;
DROP TABLE IF EXISTS task_files CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS customer_system_details CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS network_towers CASCADE;
DROP TABLE IF EXISTS performance_metrics CASCADE;

-- Create Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role VARCHAR(20) DEFAULT 'technician' CHECK (role IN ('admin', 'manager', 'technician', 'field_engineer')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Create Sessions table for authentication
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Customers table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    customer_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(100),
    contact_person VARCHAR(100),
    mobile_phone VARCHAR(20),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    country VARCHAR(50) DEFAULT 'India',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    connection_type VARCHAR(20) CHECK (connection_type IN ('fiber', 'wireless', 'satellite')),
    plan_type VARCHAR(20) CHECK (plan_type IN ('business', 'enterprise', 'corporate', 'residential')),
    service_plan VARCHAR(100),
    monthly_fee DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    portal_access BOOLEAN DEFAULT false,
    portal_username VARCHAR(50),
    portal_password VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Customer System Details table
CREATE TABLE customer_system_details (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    emp_id VARCHAR(20),
    system_name VARCHAR(100) NOT NULL,
    processor VARCHAR(100),
    ram VARCHAR(50),
    hard_disk VARCHAR(100),
    ssd VARCHAR(100),
    operating_system VARCHAR(100),
    antivirus VARCHAR(100),
    ms_office VARCHAR(100),
    other_software TEXT,
    configuration TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Tasks table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(200),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled', 'on-hold')),
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_to_name VARCHAR(100),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by_name VARCHAR(100),
    category VARCHAR(50),
    estimated_hours DECIMAL(5, 2),
    actual_hours DECIMAL(5, 2) DEFAULT 0,
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Task Updates table for comments and status updates
CREATE TABLE task_updates (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'comment' CHECK (type IN ('comment', 'status_update', 'assignment', 'completion', 'customer_feedback', 'progress_update', 'file_upload')),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Task Files table for file attachments
CREATE TABLE task_files (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    file_path VARCHAR(500),
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    uploaded_by_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Network Towers table for WIZONE monitoring
CREATE TABLE network_towers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    target_ip INET,
    location VARCHAR(200) NOT NULL,
    ssid VARCHAR(100),
    total_devices INTEGER DEFAULT 0,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    bandwidth VARCHAR(50) DEFAULT '1 Gbps',
    expected_latency VARCHAR(20) DEFAULT '5ms',
    actual_latency VARCHAR(20),
    description TEXT,
    status VARCHAR(20) DEFAULT 'online' CHECK (status IN ('online', 'offline', 'warning', 'maintenance')),
    last_test_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Performance Metrics table for monitoring data
CREATE TABLE performance_metrics (
    id SERIAL PRIMARY KEY,
    tower_id INTEGER REFERENCES network_towers(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL, -- 'ping', 'bandwidth', 'cpu', 'memory', 'temperature'
    metric_value VARCHAR(100) NOT NULL,
    metric_unit VARCHAR(20), -- 'ms', 'mbps', '%', 'celsius'
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(50) DEFAULT 'system' -- 'system', 'manual', 'snmp'
);

-- Create indexes for better performance
CREATE INDEX idx_customers_customer_id ON customers(customer_id);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_city ON customers(city);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_customer_id ON tasks(customer_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_task_updates_task_id ON task_updates(task_id);
CREATE INDEX idx_task_files_task_id ON task_files(task_id);
CREATE INDEX idx_sessions_session_id ON sessions(session_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_network_towers_name ON network_towers(name);
CREATE INDEX idx_network_towers_status ON network_towers(status);
CREATE INDEX idx_network_towers_location ON network_towers(location);
CREATE INDEX idx_network_towers_target_ip ON network_towers(target_ip);
CREATE INDEX idx_performance_metrics_tower_id ON performance_metrics(tower_id);
CREATE INDEX idx_performance_metrics_type ON performance_metrics(metric_type);
CREATE INDEX idx_performance_metrics_recorded_at ON performance_metrics(recorded_at);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_system_details_updated_at BEFORE UPDATE ON customer_system_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_network_towers_updated_at BEFORE UPDATE ON network_towers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Display confirmation message
SELECT 'Database schema created successfully!' as message;