import { ConnectionPool, config as MSSQLConfig } from 'mssql';
import fs from 'fs/promises';
import path from 'path';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  trustCertificate: boolean;
  connectionTimeout: number;
  requestTimeout: number;
}

const CONFIG_PATH = path.join(process.cwd(), 'config', 'database.json');

// Default configuration
const DEFAULT_CONFIG: DatabaseConfig = {
  host: 'localhost',
  port: 1433,
  database: 'WIZONE_TASK_MANAGER',
  username: 'sa',
  password: '',
  ssl: false,
  trustCertificate: true,
  connectionTimeout: 30000,
  requestTimeout: 30000
};

let connectionPool: ConnectionPool | null = null;

export async function loadDatabaseConfig(): Promise<DatabaseConfig | null> {
  try {
    const configData = await fs.readFile(CONFIG_PATH, 'utf8');
    return JSON.parse(configData) as DatabaseConfig;
  } catch (error) {
    console.log('No database config found, setup required');
    return null;
  }
}

export async function saveDatabaseConfig(config: DatabaseConfig): Promise<void> {
  try {
    // Ensure config directory exists
    const configDir = path.dirname(CONFIG_PATH);
    await fs.mkdir(configDir, { recursive: true });
    
    // Save configuration
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
    console.log('Database configuration saved successfully');
  } catch (error) {
    console.error('Failed to save database configuration:', error);
    throw error;
  }
}

export async function testConnection(config: DatabaseConfig): Promise<boolean> {
  try {
    const mssqlConfig: MSSQLConfig = {
      server: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      options: {
        encrypt: config.ssl,
        trustServerCertificate: config.trustCertificate,
        enableArithAbort: true,
      },
      pool: {
        max: 1,
        min: 0,
        idleTimeoutMillis: 30000
      },
      connectionTimeout: config.connectionTimeout,
      requestTimeout: config.requestTimeout,
    };

    const testPool = new ConnectionPool(mssqlConfig);
    await testPool.connect();
    
    // Test basic query
    const request = testPool.request();
    await request.query('SELECT 1 as test');
    
    await testPool.close();
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

export async function initializeConnection(): Promise<ConnectionPool> {
  if (connectionPool) {
    return connectionPool;
  }

  const config = await loadDatabaseConfig();
  if (!config) {
    throw new Error('Database not configured. Please run setup wizard first.');
  }

  const mssqlConfig: MSSQLConfig = {
    server: config.host,
    port: config.port,
    database: config.database,
    user: config.username,
    password: config.password,
    options: {
      encrypt: config.ssl,
      trustServerCertificate: config.trustCertificate,
      enableArithAbort: true,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    },
    connectionTimeout: config.connectionTimeout,
    requestTimeout: config.requestTimeout,
  };

  try {
    connectionPool = new ConnectionPool(mssqlConfig);
    await connectionPool.connect();
    console.log('Connected to MS SQL Server database');
    return connectionPool;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    connectionPool = null;
    throw error;
  }
}

export async function closeConnection(): Promise<void> {
  if (connectionPool) {
    await connectionPool.close();
    connectionPool = null;
    console.log('Database connection closed');
  }
}

export async function getConnection(): Promise<ConnectionPool> {
  if (!connectionPool) {
    return await initializeConnection();
  }
  return connectionPool;
}

// Check if database is initialized
export async function isDatabaseInitialized(): Promise<boolean> {
  try {
    const pool = await getConnection();
    const request = pool.request();
    
    // Check if users table exists
    const result = await request.query(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'users'
    `);
    
    return result.recordset[0].count > 0;
  } catch (error) {
    return false;
  }
}

export { DEFAULT_CONFIG };