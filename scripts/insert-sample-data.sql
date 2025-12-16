-- TaskScoreTracker Sample Data Insertion
-- PostgreSQL Data Seeding Script

-- Insert sample users (password: 'password123' - you should hash these in production)
INSERT INTO users (username, password_hash, email, first_name, last_name, role, active) VALUES
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@wizone.com', 'Admin', 'User', 'admin', true),
('john.technical', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'john@wizone.com', 'John', 'Technical', 'technician', true),
('sarah.security', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'sarah@wizone.com', 'Sarah', 'Security', 'technician', true),
('mike.systems', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'mike@wizone.com', 'Mike', 'Systems', 'technician', true),
('lisa.manager', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'lisa@wizone.com', 'Lisa', 'Manager', 'manager', true),
('raj.field', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'raj@wizone.com', 'Raj', 'Field', 'field_engineer', true);

-- Insert sample customers
INSERT INTO customers (customer_id, name, email, contact_person, mobile_phone, address, city, state, latitude, longitude, connection_type, plan_type, service_plan, monthly_fee, status, portal_access, portal_username, portal_password) VALUES
('WZ001', 'TechCorp Solutions', 'contact@techcorp.com', 'John Smith', '+91-9876543210', '123 Tech Park, Electronic City', 'Bangalore', 'Karnataka', 12.8456, 77.6653, 'fiber', 'business', 'Enterprise Plan - 1Gbps', 5000.00, 'active', true, 'techcorp', 'tech123'),
('WZ002', 'Global Enterprises', 'admin@globalent.com', 'Sarah Johnson', '+91-9988776655', '456 Business District, Whitefield', 'Bangalore', 'Karnataka', 12.9698, 77.7500, 'fiber', 'corporate', 'Corporate Plan - 500Mbps', 3500.00, 'active', false, NULL, NULL),
('WZ003', 'StartupHub Pvt Ltd', 'info@startuphub.in', 'Raj Patel', '+91-8877665544', '789 Innovation Center, Koramangala', 'Bangalore', 'Karnataka', 12.9279, 77.6271, 'wireless', 'business', 'Business Plan - 200Mbps', 2000.00, 'active', true, 'startuphub', 'startup2024'),
('WZ004', 'Mumbai Finance Corp', 'support@mumfinance.com', 'Priya Sharma', '+91-7766554433', '321 Financial District, BKC', 'Mumbai', 'Maharashtra', 19.0596, 72.8656, 'fiber', 'enterprise', 'Premium Plan - 2Gbps', 8000.00, 'active', true, 'mumfinance', 'finance123'),
('WZ005', 'Delhi Digital Services', 'contact@delhidigital.co.in', 'Amit Kumar', '+91-6655443322', '654 Cyber Hub, Gurgaon', 'Delhi', 'Delhi', 28.4824, 77.0926, 'fiber', 'business', 'Professional Plan - 300Mbps', 2500.00, 'inactive', false, NULL, NULL),
('WZ006', 'Chennai Software Solutions', 'admin@chennaisoft.com', 'Lakshmi Nair', '+91-9123456789', '123 IT Corridor, OMR', 'Chennai', 'Tamil Nadu', 12.9716, 80.2340, 'fiber', 'corporate', 'Corporate Plan - 1Gbps', 4500.00, 'active', true, 'chennaisoft', 'chen123'),
('WZ007', 'Pune Tech Industries', 'contact@punetech.in', 'Vikram Desai', '+91-8765432109', '456 Hinjewadi Phase 2', 'Pune', 'Maharashtra', 18.5912, 73.7398, 'wireless', 'business', 'Business Plan - 150Mbps', 1800.00, 'active', false, NULL, NULL),
('WZ008', 'Hyderabad Solutions Ltd', 'info@hydsolutions.com', 'Suresh Reddy', '+91-7654321098', '789 HITEC City', 'Hyderabad', 'Telangana', 17.4435, 78.3772, 'fiber', 'enterprise', 'Enterprise Plan - 2Gbps', 7500.00, 'active', true, 'hydsolutions', 'hyd2024');

-- Insert customer system details
INSERT INTO customer_system_details (customer_id, emp_id, system_name, processor, ram, hard_disk, ssd, operating_system, antivirus, ms_office, other_software, configuration) VALUES
(1, 'EMP001', 'John-Desktop-01', 'Intel Core i7-11700K', '32GB DDR4', '1TB HDD', '512GB NVMe SSD', 'Windows 11 Pro', 'Windows Defender + Kaspersky', 'Microsoft Office 365', 'Adobe Creative Suite, AutoCAD, VS Code', 'High-performance workstation for development and design work'),
(1, 'EMP002', 'Server-Main-01', 'Intel Xeon Silver 4314', '64GB DDR4 ECC', '4TB RAID 5', '1TB NVMe SSD', 'Windows Server 2022', 'Microsoft Defender for Business', 'N/A', 'SQL Server 2022, IIS, Docker', 'Primary application server handling web services and database operations'),
(2, 'EMP003', 'Sarah-Laptop-01', 'AMD Ryzen 7 5800H', '16GB DDR4', '1TB HDD', '256GB SSD', 'Windows 10 Pro', 'Bitdefender Total Security', 'Microsoft Office 2019', 'SAP, Salesforce Desktop, Chrome', 'Business laptop for sales and administration tasks'),
(3, 'EMP004', 'Dev-Station-01', 'Intel Core i9-12900K', '64GB DDR5', '2TB HDD', '2TB NVMe SSD', 'Ubuntu 22.04 LTS', 'ClamAV', 'LibreOffice', 'Docker, Kubernetes, Node.js, Python, Git', 'High-end development workstation for software engineering'),
(4, 'EMP005', 'Finance-Server-01', 'Intel Xeon Gold 6248R', '128GB DDR4 ECC', '8TB RAID 10', '2TB NVMe SSD', 'Windows Server 2019', 'Symantec Endpoint Protection', 'Microsoft Office 365', 'Oracle Database, SAP ERP, Tally', 'Critical financial applications server with high availability'),
(5, 'EMP006', 'Delhi-Workstation-01', 'AMD Ryzen 9 5950X', '32GB DDR4', '1TB HDD', '1TB SSD', 'Windows 11 Pro', 'McAfee Total Protection', 'Microsoft Office 2021', 'Adobe Photoshop, CorelDRAW, AutoCAD', 'Design and graphics workstation for creative team');

-- Insert sample tasks
INSERT INTO tasks (title, description, customer_id, customer_name, priority, status, assigned_to, assigned_to_name, created_by, created_by_name, category, estimated_hours, actual_hours, due_date) VALUES
('Fix network connectivity issue', 'Customer reporting intermittent internet disconnections in Bangalore office. Need to investigate routing and hardware issues.', 1, 'TechCorp Solutions', 'high', 'in-progress', 2, 'John Technical', 1, 'Admin User', 'network', 4.0, 2.5, '2024-10-03 18:00:00'),
('Install new firewall software', 'Upgrade security infrastructure for Global Enterprises office. Install and configure next-generation firewall.', 2, 'Global Enterprises', 'medium', 'pending', 3, 'Sarah Security', 1, 'Admin User', 'security', 6.0, 0.0, '2024-10-05 17:00:00'),
('Server maintenance and updates', 'Routine maintenance for StartupHub server infrastructure. Apply security patches and performance optimizations.', 3, 'StartupHub Pvt Ltd', 'low', 'completed', 4, 'Mike Systems', 1, 'Admin User', 'maintenance', 3.0, 2.8, '2024-09-30 18:00:00'),
('Backup system configuration', 'Configure automated backup system for Mumbai Finance Corp. Implement disaster recovery procedures.', 4, 'Mumbai Finance Corp', 'high', 'in-progress', 2, 'John Technical', 1, 'Admin User', 'backup', 5.0, 3.2, '2024-10-04 16:00:00'),
('Email server troubleshooting', 'Resolve email delivery issues for Delhi Digital Services. Investigate SMTP configuration and spam filtering.', 5, 'Delhi Digital Services', 'medium', 'pending', NULL, NULL, 1, 'Admin User', 'email', 2.0, 0.0, '2024-10-03 12:00:00'),
('Wireless network optimization', 'Optimize wireless network performance for Chennai Software Solutions. Conduct site survey and adjust access points.', 6, 'Chennai Software Solutions', 'medium', 'in-progress', 3, 'Sarah Security', 5, 'Lisa Manager', 'network', 4.5, 1.5, '2024-10-06 15:00:00'),
('Database performance tuning', 'Improve database query performance for Hyderabad Solutions Ltd. Optimize indexes and query execution plans.', 8, 'Hyderabad Solutions Ltd', 'high', 'pending', 4, 'Mike Systems', 1, 'Admin User', 'database', 6.0, 0.0, '2024-10-07 18:00:00'),
('VPN setup for remote workers', 'Configure secure VPN access for Pune Tech Industries remote employees. Set up multi-factor authentication.', 7, 'Pune Tech Industries', 'medium', 'completed', 6, 'Raj Field', 5, 'Lisa Manager', 'security', 3.5, 3.0, '2024-10-01 14:00:00');

-- Insert task updates/comments
INSERT INTO task_updates (task_id, message, type, created_by, created_by_name) VALUES
(1, 'Started investigating the connectivity issue. Found packet loss on primary route.', 'status_update', 2, 'John Technical'),
(1, 'Customer confirmed the issue is intermittent, occurs mainly during peak hours.', 'customer_feedback', 2, 'John Technical'),
(1, 'Identified faulty network switch. Replacement scheduled for tomorrow.', 'progress_update', 2, 'John Technical'),
(2, 'Task assigned to security team for firewall installation.', 'assignment', 1, 'Admin User'),
(2, 'Firewall hardware delivered. Installation planned for this weekend.', 'progress_update', 3, 'Sarah Security'),
(3, 'Server maintenance completed successfully. All systems operational.', 'completion', 4, 'Mike Systems'),
(3, 'Applied 12 security patches and optimized database performance.', 'progress_update', 4, 'Mike Systems'),
(4, 'Backup configuration 60% complete. Setting up automated schedules.', 'progress_update', 2, 'John Technical'),
(4, 'Customer requested daily incremental backups with weekly full backups.', 'customer_feedback', 2, 'John Technical'),
(5, 'Initial diagnosis shows DNS resolution issues affecting email delivery.', 'status_update', 1, 'Admin User'),
(6, 'Site survey completed. Identified coverage gaps in the east wing.', 'progress_update', 3, 'Sarah Security'),
(6, 'Recommended adding 2 additional access points for better coverage.', 'progress_update', 3, 'Sarah Security'),
(8, 'VPN server configured and tested. Multi-factor authentication enabled.', 'completion', 6, 'Raj Field'),
(8, 'Provided training to 15 remote employees on VPN usage.', 'progress_update', 6, 'Raj Field');

-- Update some user last_login times
UPDATE users SET last_login = CURRENT_TIMESTAMP - INTERVAL '2 hours' WHERE username = 'admin';
UPDATE users SET last_login = CURRENT_TIMESTAMP - INTERVAL '1 day' WHERE username = 'john.technical';
UPDATE users SET last_login = CURRENT_TIMESTAMP - INTERVAL '3 days' WHERE username = 'sarah.security';
UPDATE users SET last_login = CURRENT_TIMESTAMP - INTERVAL '1 week' WHERE username = 'mike.systems';
UPDATE users SET last_login = CURRENT_TIMESTAMP - INTERVAL '2 days' WHERE username = 'lisa.manager';

-- Display confirmation message
SELECT 'Sample data inserted successfully!' as message;
SELECT 'Total users: ' || COUNT(*) as users_count FROM users;
SELECT 'Total customers: ' || COUNT(*) as customers_count FROM customers;
SELECT 'Total tasks: ' || COUNT(*) as tasks_count FROM tasks;
SELECT 'Total system details: ' || COUNT(*) as systems_count FROM customer_system_details;
SELECT 'Total task updates: ' || COUNT(*) as updates_count FROM task_updates;