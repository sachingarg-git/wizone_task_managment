import sql from "mssql";
import * as schema from "../shared/schema.js";

// Parse SQL Server comma format for host and port (sa:ss123456@14.102.70.90,1433)
const serverHostPort = process.env.SQL_SERVER_HOST || "14.102.70.90,1433";
let serverHost = "14.102.70.90";
let serverPort = 1433;

if (serverHostPort.includes(',')) {
  const [host, port] = serverHostPort.split(',');
  serverHost = host.trim();
  serverPort = parseInt(port.trim()) || 1433;
}

console.log(`SQL Server configuration: ${serverHost}:${serverPort}`);

// SQL Server connection configuration
const config = {
  server: serverHost,
  port: serverPort,
  user: process.env.SQL_SERVER_USER || "sa",
  password: process.env.SQL_SERVER_PASSWORD || "ss123456",
  database: process.env.SQL_SERVER_DATABASE || "wizone_production",
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

// Create connection pool
const pool = new sql.ConnectionPool(config);

// Connect to SQL Server and create tables if needed
let isConnected = false;

try {
  await pool.connect();
  console.log("Connected to SQL Server successfully");
  isConnected = true;
  
  // Auto-create tables on first connection
  await createTablesIfNotExists();
} catch (err) {
  console.warn("SQL Server connection failed:", err.message);
  console.log("Application will run in demo mode without database persistence");
  isConnected = false;
}

// Function to create tables automatically
async function createTablesIfNotExists() {
  try {
    const request = pool.request();
    
    // Check if users table exists
    const tableCheck = await request.query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'users'
    `);
    
    if (tableCheck.recordset[0].count === 0) {
      console.log("Creating database tables...");
      
      // Read and execute the schema file
      const fs = await import('fs');
      const path = await import('path');
      const schemaPath = path.join(process.cwd(), 'wizone_sqlserver_schema.sql');
      
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await request.query(schemaSql);
        console.log("Database tables created successfully");
      } else {
        console.log("Schema file not found, tables need to be created manually");
      }
    }
  } catch (error) {
    console.error("Error creating tables:", error);
  }
}

// Export the pool for direct SQL queries and connection status
export const db = pool;
export const isDbConnected = () => isConnected;

// Create a safe request function that checks connection
export const createSafeRequest = () => {
  if (!isConnected) {
    throw new Error("Database not connected");
  }
  return pool.request();
};

// Export schema elements for convenience
export const {
  users,
  customers,
  tasks,
  taskUpdates,
  performanceMetrics,
  domains,
  sqlConnections,
  sessions,
  chatRooms,
  chatMessages,
  chatParticipants,
  customerComments,
  customerSystemDetails,
  userLocations,
  geofenceZones,
  geofenceEvents,
  tripTracking,
  officeLocations,
  officeLocationSuggestions,
  engineerTrackingHistory,
  botConfigurations,
  notificationLogs,
} = schema;