import mssql from 'mssql';

// WIZONE FIELD ENGINEER - PUBLISHED MS SQL SERVER
export const SQL_SERVER_CONFIG = {
  server: "103.122.85.61",
  port: 1440,
  database: "WIZONE_TASK_MANAGER", 
  user: "sa",
  password: "ss123456",
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
};

// Create SQL Server connection pool
let sqlServerPool: mssql.ConnectionPool | null = null;

export async function getSqlServerConnection(): Promise<mssql.ConnectionPool> {
  if (!sqlServerPool) {
    console.log("Creating SQL Server connection pool...");
    sqlServerPool = new mssql.ConnectionPool(SQL_SERVER_CONFIG);
    await sqlServerPool.connect();
    console.log("✅ SQL Server connected:", {
      server: SQL_SERVER_CONFIG.server,
      port: SQL_SERVER_CONFIG.port,
      database: SQL_SERVER_CONFIG.database,
      user: SQL_SERVER_CONFIG.user
    });
  }
  return sqlServerPool;
}

// Initialize connection on module load
(async () => {
  try {
    await getSqlServerConnection();
    console.log("🚀 SQL Server permanently configured and connected!");
  } catch (error) {
    console.error("❌ SQL Server connection failed:", error);
  }
})();

export { SQL_SERVER_CONFIG as default };