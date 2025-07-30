import mssql from "mssql";
const { ConnectionPool } = mssql;

// MS SQL Server Configuration
const config = {
  server: '14.102.70.90',
  port: 1433,
  database: 'TASK_SCORE_WIZONE',
  user: 'sa',
  password: 'ss123456',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Create and export the MS SQL connection pool
export const pool = new ConnectionPool(config);

// Initialize connection
pool.connect().then(() => {
  console.log("✅ Connected to MS SQL Server: 14.102.70.90:1433");
}).catch(err => {
  console.error("❌ MS SQL Connection Error:", err);
});

// Export a simplified db object for compatibility
export const db = {
  pool,
  query: async (sql: string, params?: any[]) => {
    const request = pool.request();
    if (params) {
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });
    }
    return await request.query(sql);
  }
};

// Database is now MS SQL - no schema exports needed