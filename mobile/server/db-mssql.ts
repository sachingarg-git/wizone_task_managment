// MS SQL Database Connection - Field Engineer Mobile App
import mssql from 'mssql';

const config: mssql.config = {
  server: "14.102.70.90",
  port: 1433,
  database: "TASK_SCORE_WIZONE",
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
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
};

export const pool = new mssql.ConnectionPool(config);

// Initialize connection
let connectionPromise: Promise<mssql.ConnectionPool> | null = null;

export const getConnection = async (): Promise<mssql.ConnectionPool> => {
  if (!connectionPromise) {
    connectionPromise = pool.connect().then(() => {
      console.log('✅ Connected to MS SQL Server: 14.102.70.90:1433');
      return pool;
    });
  }
  return connectionPromise;
};

// Types for Field Engineer App
export interface User {
  id: string;
  username: string;
  password: string;
  role: string;
  first_name?: string;
  last_name?: string;
  department?: string;
  is_active: boolean;
}

export interface Task {
  id: number;
  ticket_number: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  issue_type?: string;
  customer_id?: number;
  assigned_to?: string;
  created_by: string;
  created_at: Date;
  updated_at?: Date;
}

export interface Customer {
  id: number;
  customer_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status: string;
}

export interface TaskUpdate {
  id: number;
  task_id: number;
  content: string;
  updated_by: string;
  updated_at: Date;
  file_path?: string;
}

export default pool;