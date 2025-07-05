import sql from 'mssql';

const config: sql.config = {
  server: '122.176.151.226',
  port: 1440,
  user: 'sa',
  password: 'ss123456',
  database: 'master', // You can change this to your specific database name
  options: {
    encrypt: false, // Set to true if using Azure
    trustServerCertificate: true, // Set to false in production with proper certificates
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

export const pool = new sql.ConnectionPool(config);

// Initialize the connection pool
export const initializeDb = async () => {
  try {
    await pool.connect();
    console.log('Connected to SQL Server successfully');
  } catch (error) {
    console.error('Failed to connect to SQL Server:', error);
    throw error;
  }
};

// Helper function to execute queries
export const query = async (queryText: string, params: any[] = []) => {
  try {
    const request = pool.request();
    params.forEach((param, index) => {
      request.input(`param${index}`, param);
    });
    const result = await request.query(queryText);
    return result;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};