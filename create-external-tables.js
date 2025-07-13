import sql from 'mssql';

async function createTablesOnExternalServer() {
    try {
        const config = {
            server: '14.102.70.90',
            port: 1433,
            user: 'sa',
            password: 'ss123456',
            database: 'master',
            options: {
                encrypt: false,
                trustServerCertificate: true,
                enableArithAbort: true,
            },
            connectionTimeout: 30000,
            requestTimeout: 30000,
        };

        console.log('Connecting to SQL Server 14.102.70.90:1433...');
        const pool = new sql.ConnectionPool(config);
        await pool.connect();

        const request = pool.request();

        // Create database if it doesn't exist
        console.log('Creating database wizone_production...');
        await request.query(`
            IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'wizone_production')
            CREATE DATABASE [wizone_production]
        `);

        // Switch to the target database
        await request.query(`USE [wizone_production]`);

        // Create all required tables
        console.log('Creating tables...');
        
        // Create users table
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
            CREATE TABLE users (
                id NVARCHAR(50) PRIMARY KEY,
                username NVARCHAR(100) UNIQUE,
                password NVARCHAR(255),
                email NVARCHAR(255) UNIQUE NOT NULL,
                firstName NVARCHAR(100) NOT NULL,
                lastName NVARCHAR(100) NOT NULL,
                phone NVARCHAR(20),
                profileImageUrl NVARCHAR(500),
                role NVARCHAR(50) DEFAULT 'engineer',
                department NVARCHAR(100),
                isActive BIT DEFAULT 1,
                createdAt DATETIME2 DEFAULT GETDATE(),
                updatedAt DATETIME2 DEFAULT GETDATE()
            )
        `);

        // Create customers table
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='customers' AND xtype='U')
            CREATE TABLE customers (
                id INT IDENTITY(1,1) PRIMARY KEY,
                customerId NVARCHAR(50) UNIQUE,
                name NVARCHAR(255) NOT NULL,
                email NVARCHAR(255),
                phone NVARCHAR(20),
                address NTEXT,
                city NVARCHAR(100),
                state NVARCHAR(50),
                zipCode NVARCHAR(20),
                country NVARCHAR(100) DEFAULT 'USA',
                serviceType NVARCHAR(100),
                contractStartDate DATE,
                contractEndDate DATE,
                monthlyFee DECIMAL(10,2),
                isActive BIT DEFAULT 1,
                createdAt DATETIME2 DEFAULT GETDATE(),
                updatedAt DATETIME2 DEFAULT GETDATE()
            )
        `);

        // Create tasks table
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tasks' AND xtype='U')
            CREATE TABLE tasks (
                id INT IDENTITY(1,1) PRIMARY KEY,
                title NVARCHAR(255) NOT NULL,
                description NTEXT,
                status NVARCHAR(50) DEFAULT 'pending',
                priority NVARCHAR(20) DEFAULT 'medium',
                assignedTo NVARCHAR(50),
                customerId INT,
                createdBy NVARCHAR(50),
                createdAt DATETIME2 DEFAULT GETDATE(),
                updatedAt DATETIME2 DEFAULT GETDATE(),
                resolvedAt DATETIME2
            )
        `);

        // Create sql_connections table
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='sql_connections' AND xtype='U')
            CREATE TABLE sql_connections (
                id INT IDENTITY(1,1) PRIMARY KEY,
                name NVARCHAR(255) NOT NULL,
                description NTEXT,
                host NVARCHAR(255) NOT NULL,
                port INT DEFAULT 1433,
                username NVARCHAR(100) NOT NULL,
                password NVARCHAR(255) NOT NULL,
                database_name NVARCHAR(100),
                connection_type NVARCHAR(50) DEFAULT 'mssql',
                ssl_enabled BIT DEFAULT 0,
                test_status NVARCHAR(50) DEFAULT 'never_tested',
                created_by NVARCHAR(50),
                createdAt DATETIME2 DEFAULT GETDATE(),
                updatedAt DATETIME2 DEFAULT GETDATE(),
                last_test_at DATETIME2
            )
        `);

        // Create task_updates table
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='task_updates' AND xtype='U')
            CREATE TABLE task_updates (
                id INT IDENTITY(1,1) PRIMARY KEY,
                taskId INT NOT NULL,
                note NTEXT NOT NULL,
                status NVARCHAR(50),
                files NTEXT,
                updatedBy NVARCHAR(50) NOT NULL,
                createdAt DATETIME2 DEFAULT GETDATE()
            )
        `);

        // Create performance_metrics table
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='performance_metrics' AND xtype='U')
            CREATE TABLE performance_metrics (
                id INT IDENTITY(1,1) PRIMARY KEY,
                userId NVARCHAR(50) NOT NULL,
                month INT NOT NULL,
                year INT NOT NULL,
                tasksCompleted INT DEFAULT 0,
                avgResponseTime DECIMAL(10,2) DEFAULT 0,
                customerSatisfaction DECIMAL(3,2) DEFAULT 0,
                performanceScore DECIMAL(5,2) DEFAULT 0,
                createdAt DATETIME2 DEFAULT GETDATE(),
                updatedAt DATETIME2 DEFAULT GETDATE()
            )
        `);

        // Insert admin user
        console.log('Creating admin user...');
        await request.query(`
            IF NOT EXISTS (SELECT * FROM users WHERE id = 'admin001')
            INSERT INTO users (id, username, password, email, firstName, lastName, role, department, isActive, createdAt, updatedAt)
            VALUES (
                'admin001', 
                'admin', 
                '32dc874d83f8e3829e47123a59ed94f270e6b284fea685496f1fada378a02c1d51464b035595d1bd7872c55355a59f3dc9516a19a096daf5d3485803d09826c4.8e1fabfbd18012c505718f32b41244e1',
                'admin@wizoneit.com', 
                'Admin', 
                'User', 
                'admin', 
                'WIZONE HELP DESK', 
                1, 
                GETDATE(), 
                GETDATE()
            )
        `);

        // Insert sample customer
        await request.query(`
            IF NOT EXISTS (SELECT * FROM customers WHERE customerId = 'C001')
            INSERT INTO customers (customerId, name, email, phone, address, city, state, zipCode, serviceType, monthlyFee, isActive, createdAt, updatedAt)
            VALUES (
                'C001',
                'TechCorp Solutions',
                'contact@techcorp.com',
                '+1-555-0123',
                '123 Business Ave',
                'New York',
                'NY',
                '10001',
                'Enterprise Internet',
                299.99,
                1,
                GETDATE(),
                GETDATE()
            )
        `);

        await pool.close();
        console.log('✅ All tables created successfully on external SQL Server!');
        console.log('✅ Admin user created: admin/admin123');
        console.log('✅ Sample customer created: TechCorp Solutions');
        
        return { success: true, message: 'Database and tables created successfully' };
    } catch (error) {
        console.error('❌ Error creating tables:', error);
        return { success: false, message: error.message };
    }
}

createTablesOnExternalServer()
    .then(result => {
        console.log('Final result:', result);
        process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
        console.error('Script failed:', error);
        process.exit(1);
    });