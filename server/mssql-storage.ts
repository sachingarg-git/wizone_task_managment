import { pool } from "./db.js";
import mssql from "mssql";

// User Types
export interface User {
  id: string;
  username?: string;
  password?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  profileImageUrl?: string;
  role: string;
  department?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertUser {
  id: string;
  username?: string;
  password?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  profileImageUrl?: string;
  role?: string;
  department?: string;
  isActive?: boolean;
}

export interface UpsertUser extends InsertUser {}

// Customer Types
export interface Customer {
  id: number;
  customerId: string;
  name: string;
  contactPerson?: string;
  address?: string;
  city?: string;
  state?: string;
  mobilePhone?: string;
  email?: string;
  servicePlan?: string;
  connectedTower?: string;
  wirelessIp?: string;
  wirelessApIp?: string;
  port?: string;
  plan?: string;
  installationDate?: Date;
  status: string;
  username?: string;
  password?: string;
  portalAccess: boolean;
  latitude?: number;
  longitude?: number;
  locationNotes?: string;
  locationVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Task Types
export interface Task {
  id: number;
  taskId: string;
  title: string;
  description?: string;
  ticketNumber?: string;
  customerId?: string;
  assignedTo?: string;
  fieldEngineerId?: string;
  status: string;
  priority: string;
  issueType?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

// Storage Interface
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Customer operations
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  
  // Task operations
  getTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
}

export class MSSQLStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    try {
      const request = pool.request();
      request.input('id', id);
      const result = await request.query(`
        SELECT * FROM users WHERE id = @id
      `);
      return result.recordset[0] || undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const request = pool.request();
      request.input('username', username);
      const result = await request.query(`
        SELECT * FROM users WHERE username = @username
      `);
      return result.recordset[0] || undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const request = pool.request();
      const now = new Date();
      
      request.input('id', user.id);
      request.input('username', user.username || null);
      request.input('password', user.password || null);
      request.input('email', user.email || null);
      request.input('firstName', user.firstName || null);
      request.input('lastName', user.lastName || null);
      request.input('phone', user.phone || null);
      request.input('profileImageUrl', user.profileImageUrl || null);
      request.input('role', user.role || 'engineer');
      request.input('department', user.department || null);
      request.input('isActive', user.isActive !== undefined ? user.isActive : true);
      request.input('createdAt', now);
      request.input('updatedAt', now);

      const result = await request.query(`
        INSERT INTO users (id, username, password, email, firstName, lastName, phone, 
                          profileImageUrl, role, department, isActive, createdAt, updatedAt)
        VALUES (@id, @username, @password, @email, @firstName, @lastName, @phone,
                @profileImageUrl, @role, @department, @isActive, @createdAt, @updatedAt);
        
        SELECT * FROM users WHERE id = @id;
      `);
      
      return result.recordset[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    try {
      const request = pool.request();
      const now = new Date();
      
      request.input('id', user.id);
      request.input('username', user.username || null);
      request.input('password', user.password || null);
      request.input('email', user.email || null);
      request.input('firstName', user.firstName || null);
      request.input('lastName', user.lastName || null);
      request.input('phone', user.phone || null);
      request.input('profileImageUrl', user.profileImageUrl || null);
      request.input('role', user.role || 'engineer');
      request.input('department', user.department || null);
      request.input('isActive', user.isActive !== undefined ? user.isActive : true);
      request.input('createdAt', now);
      request.input('updatedAt', now);

      const result = await request.query(`
        MERGE users AS target
        USING (SELECT @id as id, @username as username, @password as password, 
                      @email as email, @firstName as firstName, @lastName as lastName,
                      @phone as phone, @profileImageUrl as profileImageUrl, 
                      @role as role, @department as department, @isActive as isActive,
                      @createdAt as createdAt, @updatedAt as updatedAt) AS source
        ON target.id = source.id
        WHEN MATCHED THEN
          UPDATE SET username = source.username, password = source.password,
                     email = source.email, firstName = source.firstName,
                     lastName = source.lastName, phone = source.phone,
                     profileImageUrl = source.profileImageUrl, role = source.role,
                     department = source.department, isActive = source.isActive,
                     updatedAt = source.updatedAt
        WHEN NOT MATCHED THEN
          INSERT (id, username, password, email, firstName, lastName, phone,
                  profileImageUrl, role, department, isActive, createdAt, updatedAt)
          VALUES (source.id, source.username, source.password, source.email,
                  source.firstName, source.lastName, source.phone, source.profileImageUrl,
                  source.role, source.department, source.isActive, source.createdAt, source.updatedAt);
        
        SELECT * FROM users WHERE id = @id;
      `);
      
      return result.recordset[0];
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }

  async getCustomers(): Promise<Customer[]> {
    try {
      const result = await pool.request().query('SELECT * FROM customers ORDER BY createdAt DESC');
      return result.recordset;
    } catch (error) {
      console.error('Error getting customers:', error);
      return [];
    }
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    try {
      const request = pool.request();
      request.input('id', id);
      const result = await request.query('SELECT * FROM customers WHERE id = @id');
      return result.recordset[0] || undefined;
    } catch (error) {
      console.error('Error getting customer:', error);
      return undefined;
    }
  }

  async getTasks(): Promise<Task[]> {
    try {
      const result = await pool.request().query('SELECT * FROM tasks ORDER BY createdAt DESC');
      return result.recordset;
    } catch (error) {
      console.error('Error getting tasks:', error);
      return [];
    }
  }

  async getTask(id: number): Promise<Task | undefined> {
    try {
      const request = pool.request();
      request.input('id', id);
      const result = await request.query('SELECT * FROM tasks WHERE id = @id');
      return result.recordset[0] || undefined;
    } catch (error) {
      console.error('Error getting task:', error);
      return undefined;
    }
  }
}

export const storage = new MSSQLStorage();