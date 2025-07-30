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

// Create MS SQL connection pool
const pool = new ConnectionPool(config);
pool.connect().then(() => {
  console.log("✅ Connected to MS SQL Server: 14.102.70.90:1433");
}).catch(err => {
  console.error("❌ MS SQL Connection Error:", err);
});

// Type definitions
export interface User {
  id: string;
  username: string;
  password?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  department?: string;
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  serviceType?: string;
  connectionStatus: string;
  username?: string;
  password?: string;
  portalAccess: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: number;
  ticketNumber: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  customerId: number;
  assignedTo?: string;
  fieldEngineerId?: string;
  issueType?: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface TaskWithRelations extends Task {
  customer?: Customer;
  assignedUser?: User;
  fieldEngineer?: User;
}

export interface InsertUser {
  id?: string;
  username: string;
  password?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  department?: string;
  profileImageUrl?: string;
}

export interface UpsertUser extends InsertUser {}

export interface InsertCustomer {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  serviceType?: string;
  connectionStatus?: string;
  username?: string;
  password?: string;
  portalAccess?: boolean;
}

export interface InsertTask {
  ticketNumber?: string;
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  customerId: number;
  assignedTo?: string;
  fieldEngineerId?: string;
  issueType?: string;
  location?: string;
}

// Storage Interface
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUserWithPassword(user: UpsertUser & { username: string; password: string }): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: string, role: string): Promise<User>;
  updateUser(id: string, userData: Partial<UpsertUser>): Promise<User>;
  
  // Customer operations
  getAllCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: number): Promise<void>;
  searchCustomers(query: string): Promise<Customer[]>;
  
  // Task operations
  getAllTasks(filters?: { assignedTo?: string; fieldEngineerId?: string }): Promise<TaskWithRelations[]>;
  getTask(id: number): Promise<TaskWithRelations | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: number): Promise<void>;
  getTasksByUser(userId: string): Promise<TaskWithRelations[]>;
  getTasksByCustomer(customerId: number): Promise<TaskWithRelations[]>;
  searchTasks(query: string): Promise<TaskWithRelations[]>;
  getTaskStats(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  }>;
  
  // Dashboard operations
  getDashboardStats(): Promise<{
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    resolvedTasks: number;
    cancelledTasks: number;
    avgPerformanceScore: number;
    avgResponseTime: number;
    totalCustomers: number;
    activeUsers: number;
  }>;
}

// MS SQL Storage Implementation
export class MSSQLStorage implements IStorage {
  
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const request = pool.request();
      request.input('id', mssql.VarChar, id);
      const result = await request.query('SELECT * FROM users WHERE id = @id');
      return result.recordset[0] || undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const request = pool.request();
      request.input('email', mssql.VarChar, email);
      const result = await request.query('SELECT * FROM users WHERE email = @email');
      return result.recordset[0] || undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const request = pool.request();
      request.input('username', mssql.VarChar, username);
      const result = await request.query('SELECT * FROM users WHERE username = @username');
      return result.recordset[0] || undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    try {
      const request = pool.request();
      const userId = user.id || this.generateId();
      
      request.input('id', mssql.VarChar, userId);
      request.input('username', mssql.VarChar, user.username);
      request.input('email', mssql.VarChar, user.email || null);
      request.input('firstName', mssql.VarChar, user.firstName || null);
      request.input('lastName', mssql.VarChar, user.lastName || null);
      request.input('role', mssql.VarChar, user.role || 'engineer');
      request.input('department', mssql.VarChar, user.department || null);
      request.input('profileImageUrl', mssql.VarChar, user.profileImageUrl || null);

      const result = await request.query(`
        MERGE users AS target
        USING (SELECT @id as id, @username as username, @email as email, 
               @firstName as firstName, @lastName as lastName, @role as role,
               @department as department, @profileImageUrl as profileImageUrl) AS source
        ON target.id = source.id
        WHEN MATCHED THEN
          UPDATE SET username = source.username, email = source.email, 
                    firstName = source.firstName, lastName = source.lastName,
                    role = source.role, department = source.department,
                    profileImageUrl = source.profileImageUrl, updatedAt = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (id, username, email, firstName, lastName, role, department, profileImageUrl, createdAt, updatedAt)
          VALUES (source.id, source.username, source.email, source.firstName, source.lastName, 
                  source.role, source.department, source.profileImageUrl, GETDATE(), GETDATE())
        OUTPUT inserted.*;
      `);

      return result.recordset[0];
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }

  async createUserWithPassword(user: UpsertUser & { username: string; password: string }): Promise<User> {
    try {
      const request = pool.request();
      const userId = this.generateId();
      
      request.input('id', mssql.VarChar, userId);
      request.input('username', mssql.VarChar, user.username);
      request.input('password', mssql.VarChar, user.password);
      request.input('email', mssql.VarChar, user.email || null);
      request.input('firstName', mssql.VarChar, user.firstName || null);
      request.input('lastName', mssql.VarChar, user.lastName || null);
      request.input('role', mssql.VarChar, user.role || 'engineer');
      request.input('department', mssql.VarChar, user.department || null);

      const result = await request.query(`
        INSERT INTO users (id, username, password, email, firstName, lastName, role, department, createdAt, updatedAt)
        OUTPUT inserted.*
        VALUES (@id, @username, @password, @email, @firstName, @lastName, @role, @department, GETDATE(), GETDATE())
      `);

      return result.recordset[0];
    } catch (error) {
      console.error('Error creating user with password:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const result = await pool.request().query('SELECT * FROM users ORDER BY createdAt DESC');
      return result.recordset;
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    try {
      const request = pool.request();
      request.input('id', mssql.VarChar, id);
      request.input('role', mssql.VarChar, role);
      
      const result = await request.query(`
        UPDATE users SET role = @role, updatedAt = GETDATE() 
        OUTPUT inserted.*
        WHERE id = @id
      `);

      return result.recordset[0];
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    try {
      const request = pool.request();
      request.input('id', mssql.VarChar, id);
      
      const setClause = [];
      if (userData.username) {
        request.input('username', mssql.VarChar, userData.username);
        setClause.push('username = @username');
      }
      if (userData.email) {
        request.input('email', mssql.VarChar, userData.email);
        setClause.push('email = @email');
      }
      if (userData.firstName) {
        request.input('firstName', mssql.VarChar, userData.firstName);
        setClause.push('firstName = @firstName');
      }
      if (userData.lastName) {
        request.input('lastName', mssql.VarChar, userData.lastName);
        setClause.push('lastName = @lastName');
      }
      if (userData.role) {
        request.input('role', mssql.VarChar, userData.role);
        setClause.push('role = @role');
      }
      if (userData.department) {
        request.input('department', mssql.VarChar, userData.department);
        setClause.push('department = @department');
      }

      const result = await request.query(`
        UPDATE users SET ${setClause.join(', ')}, updatedAt = GETDATE()
        OUTPUT inserted.*
        WHERE id = @id
      `);

      return result.recordset[0];
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Customer operations
  async getAllCustomers(): Promise<Customer[]> {
    try {
      const result = await pool.request().query('SELECT * FROM customers ORDER BY createdAt DESC');
      return result.recordset;
    } catch (error) {
      console.error('Error getting all customers:', error);
      return [];
    }
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    try {
      const request = pool.request();
      request.input('id', mssql.Int, id);
      const result = await request.query('SELECT * FROM customers WHERE id = @id');
      return result.recordset[0] || undefined;
    } catch (error) {
      console.error('Error getting customer:', error);
      return undefined;
    }
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    try {
      const request = pool.request();
      
      request.input('name', mssql.VarChar, customer.name);
      request.input('email', mssql.VarChar, customer.email || null);
      request.input('phone', mssql.VarChar, customer.phone || null);
      request.input('address', mssql.Text, customer.address || null);
      request.input('serviceType', mssql.VarChar, customer.serviceType || null);
      request.input('connectionStatus', mssql.VarChar, customer.connectionStatus || 'active');
      request.input('username', mssql.VarChar, customer.username || null);
      request.input('password', mssql.VarChar, customer.password || null);
      request.input('portalAccess', mssql.Bit, customer.portalAccess || false);

      const result = await request.query(`
        INSERT INTO customers (name, email, phone, address, serviceType, connectionStatus, username, password, portalAccess, createdAt, updatedAt)
        OUTPUT inserted.*
        VALUES (@name, @email, @phone, @address, @serviceType, @connectionStatus, @username, @password, @portalAccess, GETDATE(), GETDATE())
      `);

      return result.recordset[0];
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer> {
    try {
      const request = pool.request();
      request.input('id', mssql.Int, id);
      
      const setClause = [];
      if (customer.name) {
        request.input('name', mssql.VarChar, customer.name);
        setClause.push('name = @name');
      }
      if (customer.email) {
        request.input('email', mssql.VarChar, customer.email);
        setClause.push('email = @email');
      }
      if (customer.phone) {
        request.input('phone', mssql.VarChar, customer.phone);
        setClause.push('phone = @phone');
      }
      if (customer.address) {
        request.input('address', mssql.Text, customer.address);
        setClause.push('address = @address');
      }
      if (customer.serviceType) {
        request.input('serviceType', mssql.VarChar, customer.serviceType);
        setClause.push('serviceType = @serviceType');
      }
      if (customer.connectionStatus) {
        request.input('connectionStatus', mssql.VarChar, customer.connectionStatus);
        setClause.push('connectionStatus = @connectionStatus');
      }

      const result = await request.query(`
        UPDATE customers SET ${setClause.join(', ')}, updatedAt = GETDATE()
        OUTPUT inserted.*
        WHERE id = @id
      `);

      return result.recordset[0];
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  async deleteCustomer(id: number): Promise<void> {
    try {
      const request = pool.request();
      request.input('id', mssql.Int, id);
      await request.query('DELETE FROM customers WHERE id = @id');
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    try {
      const request = pool.request();
      request.input('query', mssql.VarChar, `%${query}%`);
      
      const result = await request.query(`
        SELECT * FROM customers 
        WHERE name LIKE @query OR email LIKE @query OR phone LIKE @query 
        ORDER BY name
      `);

      return result.recordset;
    } catch (error) {
      console.error('Error searching customers:', error);
      return [];
    }
  }

  // Task operations
  async getAllTasks(filters?: { assignedTo?: string; fieldEngineerId?: string }): Promise<TaskWithRelations[]> {
    try {
      const request = pool.request();
      let whereClause = '';
      
      if (filters?.assignedTo) {
        request.input('assignedTo', mssql.VarChar, filters.assignedTo);
        whereClause += ' AND t.assignedTo = @assignedTo';
      }
      
      if (filters?.fieldEngineerId) {
        request.input('fieldEngineerId', mssql.VarChar, filters.fieldEngineerId);
        whereClause += ' AND t.fieldEngineerId = @fieldEngineerId';
      }

      const result = await request.query(`
        SELECT t.*, c.name as customerName, c.email as customerEmail, c.phone as customerPhone,
               u1.username as assignedUserName, u2.username as fieldEngineerName
        FROM tasks t
        LEFT JOIN customers c ON t.customerId = c.id
        LEFT JOIN users u1 ON t.assignedTo = u1.id
        LEFT JOIN users u2 ON t.fieldEngineerId = u2.id
        WHERE 1=1 ${whereClause}
        ORDER BY t.createdAt DESC
      `);

      return result.recordset.map(row => ({
        ...row,
        customer: row.customerName ? {
          id: row.customerId,
          name: row.customerName,
          email: row.customerEmail,
          phone: row.customerPhone
        } : undefined,
        assignedUser: row.assignedUserName ? {
          id: row.assignedTo,
          username: row.assignedUserName
        } : undefined,
        fieldEngineer: row.fieldEngineerName ? {
          id: row.fieldEngineerId,
          username: row.fieldEngineerName
        } : undefined
      }));
    } catch (error) {
      console.error('Error getting all tasks:', error);
      return [];
    }
  }

  async getTask(id: number): Promise<TaskWithRelations | undefined> {
    try {
      const request = pool.request();
      request.input('id', mssql.Int, id);
      
      const result = await request.query(`
        SELECT t.*, c.name as customerName, c.email as customerEmail, c.phone as customerPhone,
               u1.username as assignedUserName, u2.username as fieldEngineerName
        FROM tasks t
        LEFT JOIN customers c ON t.customerId = c.id
        LEFT JOIN users u1 ON t.assignedTo = u1.id
        LEFT JOIN users u2 ON t.fieldEngineerId = u2.id
        WHERE t.id = @id
      `);

      const row = result.recordset[0];
      if (!row) return undefined;

      return {
        ...row,
        customer: row.customerName ? {
          id: row.customerId,
          name: row.customerName,
          email: row.customerEmail,
          phone: row.customerPhone
        } : undefined,
        assignedUser: row.assignedUserName ? {
          id: row.assignedTo,
          username: row.assignedUserName
        } : undefined,
        fieldEngineer: row.fieldEngineerName ? {
          id: row.fieldEngineerId,
          username: row.fieldEngineerName
        } : undefined
      };
    } catch (error) {
      console.error('Error getting task:', error);
      return undefined;
    }
  }

  async createTask(task: InsertTask): Promise<Task> {
    try {
      const request = pool.request();
      const ticketNumber = task.ticketNumber || this.generateTicketNumber();
      
      request.input('ticketNumber', mssql.VarChar, ticketNumber);
      request.input('title', mssql.VarChar, task.title);
      request.input('description', mssql.Text, task.description || null);
      request.input('priority', mssql.VarChar, task.priority || 'medium');
      request.input('status', mssql.VarChar, task.status || 'pending');
      request.input('customerId', mssql.Int, task.customerId);
      request.input('assignedTo', mssql.VarChar, task.assignedTo || null);
      request.input('fieldEngineerId', mssql.VarChar, task.fieldEngineerId || null);
      request.input('issueType', mssql.VarChar, task.issueType || null);
      request.input('location', mssql.VarChar, task.location || null);

      const result = await request.query(`
        INSERT INTO tasks (ticketNumber, title, description, priority, status, customerId, assignedTo, fieldEngineerId, issueType, location, createdAt, updatedAt)
        OUTPUT inserted.*
        VALUES (@ticketNumber, @title, @description, @priority, @status, @customerId, @assignedTo, @fieldEngineerId, @issueType, @location, GETDATE(), GETDATE())
      `);

      return result.recordset[0];
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async updateTask(id: number, task: Partial<InsertTask>): Promise<Task> {
    try {
      const request = pool.request();
      request.input('id', mssql.Int, id);
      
      const setClause = [];
      if (task.title) {
        request.input('title', mssql.VarChar, task.title);
        setClause.push('title = @title');
      }
      if (task.description !== undefined) {
        request.input('description', mssql.Text, task.description);
        setClause.push('description = @description');
      }
      if (task.priority) {
        request.input('priority', mssql.VarChar, task.priority);
        setClause.push('priority = @priority');
      }
      if (task.status) {
        request.input('status', mssql.VarChar, task.status);
        setClause.push('status = @status');
        if (task.status === 'completed' || task.status === 'resolved') {
          setClause.push('resolvedAt = GETDATE()');
        }
      }
      if (task.assignedTo !== undefined) {
        request.input('assignedTo', mssql.VarChar, task.assignedTo);
        setClause.push('assignedTo = @assignedTo');
      }
      if (task.fieldEngineerId !== undefined) {
        request.input('fieldEngineerId', mssql.VarChar, task.fieldEngineerId);
        setClause.push('fieldEngineerId = @fieldEngineerId');
      }
      if (task.issueType) {
        request.input('issueType', mssql.VarChar, task.issueType);
        setClause.push('issueType = @issueType');
      }
      if (task.location) {
        request.input('location', mssql.VarChar, task.location);
        setClause.push('location = @location');
      }

      const result = await request.query(`
        UPDATE tasks SET ${setClause.join(', ')}, updatedAt = GETDATE()
        OUTPUT inserted.*
        WHERE id = @id
      `);

      return result.recordset[0];
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  async deleteTask(id: number): Promise<void> {
    try {
      const request = pool.request();
      request.input('id', mssql.Int, id);
      await request.query('DELETE FROM tasks WHERE id = @id');
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  async getTasksByUser(userId: string): Promise<TaskWithRelations[]> {
    return this.getAllTasks({ assignedTo: userId });
  }

  async getTasksByCustomer(customerId: number): Promise<TaskWithRelations[]> {
    try {
      const request = pool.request();
      request.input('customerId', mssql.Int, customerId);
      
      const result = await request.query(`
        SELECT t.*, c.name as customerName, c.email as customerEmail, c.phone as customerPhone,
               u1.username as assignedUserName, u2.username as fieldEngineerName
        FROM tasks t
        LEFT JOIN customers c ON t.customerId = c.id
        LEFT JOIN users u1 ON t.assignedTo = u1.id
        LEFT JOIN users u2 ON t.fieldEngineerId = u2.id
        WHERE t.customerId = @customerId
        ORDER BY t.createdAt DESC
      `);

      return result.recordset.map(row => ({
        ...row,
        customer: row.customerName ? {
          id: row.customerId,
          name: row.customerName,
          email: row.customerEmail,
          phone: row.customerPhone
        } : undefined,
        assignedUser: row.assignedUserName ? {
          id: row.assignedTo,
          username: row.assignedUserName
        } : undefined,
        fieldEngineer: row.fieldEngineerName ? {
          id: row.fieldEngineerId,
          username: row.fieldEngineerName
        } : undefined
      }));
    } catch (error) {
      console.error('Error getting tasks by customer:', error);
      return [];
    }
  }

  async searchTasks(query: string): Promise<TaskWithRelations[]> {
    try {
      const request = pool.request();
      request.input('query', mssql.VarChar, `%${query}%`);
      
      const result = await request.query(`
        SELECT t.*, c.name as customerName, c.email as customerEmail, c.phone as customerPhone,
               u1.username as assignedUserName, u2.username as fieldEngineerName
        FROM tasks t
        LEFT JOIN customers c ON t.customerId = c.id
        LEFT JOIN users u1 ON t.assignedTo = u1.id
        LEFT JOIN users u2 ON t.fieldEngineerId = u2.id
        WHERE t.title LIKE @query OR t.description LIKE @query OR t.ticketNumber LIKE @query
        ORDER BY t.createdAt DESC
      `);

      return result.recordset.map(row => ({
        ...row,
        customer: row.customerName ? {
          id: row.customerId,
          name: row.customerName,
          email: row.customerEmail,
          phone: row.customerPhone
        } : undefined,
        assignedUser: row.assignedUserName ? {
          id: row.assignedTo,
          username: row.assignedUserName
        } : undefined,
        fieldEngineer: row.fieldEngineerName ? {
          id: row.fieldEngineerId,
          username: row.fieldEngineerName
        } : undefined
      }));
    } catch (error) {
      console.error('Error searching tasks:', error);
      return [];
    }
  }

  async getTaskStats(): Promise<{ total: number; pending: number; inProgress: number; completed: number; }> {
    try {
      const result = await pool.request().query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as inProgress,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
        FROM tasks
      `);

      const row = result.recordset[0];
      return {
        total: row.total || 0,
        pending: row.pending || 0,
        inProgress: row.inProgress || 0,
        completed: row.completed || 0
      };
    } catch (error) {
      console.error('Error getting task stats:', error);
      return { total: 0, pending: 0, inProgress: 0, completed: 0 };
    }
  }

  async getDashboardStats(): Promise<{
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    resolvedTasks: number;
    cancelledTasks: number;
    avgPerformanceScore: number;
    avgResponseTime: number;
    totalCustomers: number;
    activeUsers: number;
  }> {
    try {
      const result = await pool.request().query(`
        SELECT 
          (SELECT COUNT(*) FROM tasks) as totalTasks,
          (SELECT COUNT(*) FROM tasks WHERE status = 'completed') as completedTasks,
          (SELECT COUNT(*) FROM tasks WHERE status = 'pending') as pendingTasks,
          (SELECT COUNT(*) FROM tasks WHERE status = 'in_progress') as inProgressTasks,
          (SELECT COUNT(*) FROM tasks WHERE status = 'resolved') as resolvedTasks,
          (SELECT COUNT(*) FROM tasks WHERE status = 'cancelled') as cancelledTasks,
          (SELECT COUNT(*) FROM customers) as totalCustomers,
          (SELECT COUNT(*) FROM users WHERE role != 'admin') as activeUsers
      `);

      const row = result.recordset[0];
      return {
        totalTasks: row.totalTasks || 0,
        completedTasks: row.completedTasks || 0,
        pendingTasks: row.pendingTasks || 0,
        inProgressTasks: row.inProgressTasks || 0,
        resolvedTasks: row.resolvedTasks || 0,
        cancelledTasks: row.cancelledTasks || 0,
        avgPerformanceScore: 85, // Placeholder
        avgResponseTime: 2.5, // Placeholder
        totalCustomers: row.totalCustomers || 0,
        activeUsers: row.activeUsers || 0
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        resolvedTasks: 0,
        cancelledTasks: 0,
        avgPerformanceScore: 0,
        avgResponseTime: 0,
        totalCustomers: 0,
        activeUsers: 0
      };
    }
  }

  // Utility methods
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private generateTicketNumber(): string {
    return 'TK' + Date.now().toString().slice(-8);
  }
}

// Export storage instance
export const storage = new MSSQLStorage();