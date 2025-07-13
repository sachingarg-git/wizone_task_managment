import sql from 'mssql';

async function testDirectConnection() {
    try {
        console.log('Testing direct connection to 14.102.70.90:1433 with sa/ss123456...');
        
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

        const pool = new sql.ConnectionPool(config);
        await pool.connect();
        console.log('✅ Successfully connected to SQL Server!');
        
        const request = pool.request();
        const result = await request.query('SELECT @@VERSION as version, DB_NAME() as current_db');
        console.log('Server version:', result.recordset[0].version);
        console.log('Current database:', result.recordset[0].current_db);
        
        // Test if wizone_production database exists
        const dbCheck = await request.query("SELECT name FROM sys.databases WHERE name = 'wizone_production'");
        if (dbCheck.recordset.length > 0) {
            console.log('✅ wizone_production database exists');
        } else {
            console.log('❌ wizone_production database does not exist');
        }
        
        await pool.close();
        console.log('Connection test completed successfully');
        
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.error('Error details:', error);
    }
}

testDirectConnection();