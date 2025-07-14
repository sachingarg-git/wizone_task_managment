
-- Wizone IT Support Portal Sample Data
-- SQL Server INSERT statements for default users and customers

INSERT INTO users (id, username, password, email, firstName, lastName, role, department, isActive)
SELECT 'admin001', 'admin', '32dc874d83f8e3829e47123a59ed94f270e6b284fea685496f1fada378a02c1d51464b035595d1bd7872c55355a59f3dc9516a19a096daf5d3485803d09826c4.8e1fabfbd18012c505718f32b41244e1', 'admin@wizoneit.com', 'Admin', 'User', 'admin', 'WIZONE HELP DESK', 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

INSERT INTO customers (customerId, name, email, phone, address, city, state, zipCode, country, serviceType, monthlyFee, isActive)
SELECT 'C001', 'TechCorp Solutions', 'contact@techcorp.com', '+1-555-0123', '123 Business Ave', 'New York', 'NY', '10001', 'USA', 'Enterprise Internet', 299.99, 1
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE customerId = 'C001');

INSERT INTO customers (customerId, name, email, phone, address, city, state, zipCode, country, serviceType, monthlyFee, isActive)
SELECT 'C002', 'Digital Innovations Ltd', 'info@digiinnovations.com', '+1-555-0124', '456 Tech Street', 'San Francisco', 'CA', '94102', 'USA', 'Cloud Services', 199.99, 1
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE customerId = 'C002');

INSERT INTO users (id, username, password, email, firstName, lastName, role, department, isActive)
SELECT 'field001', 'field_eng1', '32dc874d83f8e3829e47123a59ed94f270e6b284fea685496f1fada378a02c1d51464b035595d1bd7872c55355a59f3dc9516a19a096daf5d3485803d09826c4.8e1fabfbd18012c505718f32b41244e1', 'field1@wizoneit.com', 'John', 'Engineer', 'field_engineer', 'FIELD OPERATIONS', 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 'field001');

INSERT INTO users (id, username, password, email, firstName, lastName, role, department, isActive)
SELECT 'field002', 'field_eng2', '32dc874d83f8e3829e47123a59ed94f270e6b284fea685496f1fada378a02c1d51464b035595d1bd7872c55355a59f3dc9516a19a096daf5d3485803d09826c4.8e1fabfbd18012c505718f32b41244e1', 'field2@wizoneit.com', 'Sarah', 'Technician', 'field_engineer', 'FIELD OPERATIONS', 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 'field002');
