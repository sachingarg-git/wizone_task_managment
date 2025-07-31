import { getConnection } from '../database/mssql-connection';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export interface IStorage {
  // User operations
  getUser(id: string): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;
  updateUser(id: string, updates: any): Promise<any>;
  getAllUsers(): Promise<any[]>;
  
  // Customer operations
  getCustomer(id: number): Promise<any | undefined>;
  getAllCustomers(): Promise<any[]>;
  createCustomer(customer: any): Promise<any>;
  updateCustomer(id: number, updates: any): Promise<any>;
  deleteCustomer(id: number): Promise<boolean>;
  
  // Task operations
  getTask(id: number): Promise<any | undefined>;
  getAllTasks(): Promise<any[]>;
  createTask(task: any): Promise<any>;
  updateTask(id: number, updates: any): Promise<any>;
  deleteTask(id: number): Promise<boolean>;
  
  // Task update operations
  createTaskUpdate(update: any): Promise<any>;
  getTaskUpdates(taskId: number): Promise<any[]>;
  
  // Performance metrics
  createPerformanceMetric(metric: any): Promise<any>;
  getPerformanceMetrics(userId: string): Promise<any[]>;
  
  // Bot configurations
  getAllBotConfigurations(): Promise<any[]>;
  createBotConfiguration(config: any): Promise<any>;
  updateBotConfiguration(id: number, updates: any): Promise<any>;
  deleteBotConfiguration(id: number): Promise<boolean>;
  
  // Notification logs
  createNotificationLog(log: any): Promise<any>;
  getAllNotificationLogs(): Promise<any[]>;
  getNotificationsByUser(userId: string): Promise<any[]>;
  
  // Dashboard stats
  getDashboardStats(): Promise<any>;
  
  // Chat operations
  getAllChatRooms(): Promise<any[]>;
  createChatRoom(room: any): Promise<any>;
  getChatMessages(roomId: number): Promise<any[]>;
  createChatMessage(message: any): Promise<any>;
  
  // Analytics operations
  getAnalyticsOverview(days: number): Promise<any>;
  getEngineerPerformance(days: number): Promise<any[]>;
  getCustomerAnalytics(days: number): Promise<any>;
  getTrendAnalytics(days: number): Promise<any>;
  
  // Recent tasks
  getRecentTasks(limit?: number): Promise<any[]>;
}

export class MSSQLStorage implements IStorage {
  
  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
    return `${derivedKey.toString('hex')}.${salt}`;
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      const [derivedKey, salt] = hash.split('.');
      const keyBuffer = await scryptAsync(password, salt, 64) as Buffer;
      return keyBuffer.toString('hex') === derivedKey;
    } catch {
      return false;
    }
  }

  // Public method for mobile app authentication
  async verifyUserPassword(username: string, password: string): Promise<any | null> {
    try {
      console.log(`🔍 Fetching user by username: ${username}`);
      const user = await this.getUserByUsername(username);
      
      if (!user) {
        console.log(`❌ User not found: ${username}`);
        return null;
      }
      
      if (!user.password) {
        console.log(`❌ No password hash for user: ${username}`);
        return null;
      }
      
      console.log(`🔍 User found: ID=${user.id}, Role=${user.role}, Username=${user.username}`);
      
      const isValid = await this.verifyPassword(password, user.password);
      console.log(`✅ Password verification result for ${username}: ${isValid}`);
      
      if (!isValid) return null;
      
      // Don't return password in response
      const { password: _, ...userWithoutPassword } = user;
      console.log(`🔍 User data prepared: ID=${userWithoutPassword.id}, Role=${userWithoutPassword.role}`);
      
      return userWithoutPassword;
    } catch (error) {
      console.error('Password verification error:', error);
      return null;
    }
  }

  // User operations
  async getUser(id: string): Promise<any | undefined> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      request.input('id', id);
      
      const result = await request.query(`
        SELECT * FROM users WHERE id = @id
      `);
      
      return result.recordset[0];
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      request.input('username', username);
      
      const result = await request.query(`
        SELECT * FROM users WHERE username = @username
      `);
      
      return result.recordset[0];
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async createUser(userData: any): Promise<any> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      
      // Generate ID if not provided
      const userId = userData.id || `user_${Date.now()}`;
      
      // Hash password if provided
      let hashedPassword = userData.password;
      if (userData.password && !userData.password.includes('.')) {
        hashedPassword = await this.hashPassword(userData.password);
      }
      
      request.input('id', userId);
      request.input('username', userData.username);
      request.input('password', hashedPassword);
      request.input('email', userData.email || null);
      request.input('firstName', userData.firstName || null);
      request.input('lastName', userData.lastName || null);
      request.input('phone', userData.phone || null);
      request.input('profileImageUrl', userData.profileImageUrl || null);
      request.input('role', userData.role || 'field_engineer');
      request.input('department', userData.department || null);
      request.input('isActive', userData.isActive !== false);
      
      await request.query(`
        INSERT INTO users (
          id, username, password, email, firstName, lastName, 
          phone, profileImageUrl, role, department, isActive, 
          createdAt, updatedAt
        )
        VALUES (
          @id, @username, @password, @email, @firstName, @lastName,
          @phone, @profileImageUrl, @role, @department, @isActive,
          GETDATE(), GETDATE()
        )
      `);
      
      return await this.getUser(userId);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, updates: any): Promise<any> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      
      // Build dynamic update query
      const updateFields = [];
      const params = [];
      
      if (updates.username !== undefined) {
        updateFields.push('username = @username');
        request.input('username', updates.username);
      }
      if (updates.password !== undefined) {
        const hashedPassword = await this.hashPassword(updates.password);
        updateFields.push('password = @password');
        request.input('password', hashedPassword);
      }
      if (updates.email !== undefined) {
        updateFields.push('email = @email');
        request.input('email', updates.email);
      }
      if (updates.firstName !== undefined) {
        updateFields.push('firstName = @firstName');
        request.input('firstName', updates.firstName);
      }
      if (updates.lastName !== undefined) {
        updateFields.push('lastName = @lastName');
        request.input('lastName', updates.lastName);
      }
      if (updates.phone !== undefined) {
        updateFields.push('phone = @phone');
        request.input('phone', updates.phone);
      }
      if (updates.role !== undefined) {
        updateFields.push('role = @role');
        request.input('role', updates.role);
      }
      if (updates.department !== undefined) {
        updateFields.push('department = @department');
        request.input('department', updates.department);
      }
      if (updates.isActive !== undefined) {
        updateFields.push('isActive = @isActive');
        request.input('isActive', updates.isActive);
      }
      
      if (updateFields.length === 0) {
        return await this.getUser(id);
      }
      
      updateFields.push('updatedAt = GETDATE()');
      request.input('id', id);
      
      await request.query(`
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = @id
      `);
      
      return await this.getUser(id);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<any[]> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      
      const result = await request.query(`
        SELECT * FROM users ORDER BY createdAt DESC
      `);
      
      return result.recordset;
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  // Customer operations
  async getCustomer(id: number): Promise<any | undefined> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      request.input('id', id);
      
      const result = await request.query(`
        SELECT * FROM customers WHERE id = @id
      `);
      
      return result.recordset[0];
    } catch (error) {
      console.error('Error getting customer:', error);
      return undefined;
    }
  }

  async getAllCustomers(): Promise<any[]> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      
      const result = await request.query(`
        SELECT * FROM customers ORDER BY createdAt DESC
      `);
      
      return result.recordset;
    } catch (error) {
      console.error('Error getting all customers:', error);
      return [];
    }
  }

  async createCustomer(customerData: any): Promise<any> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      
      request.input('customerId', customerData.customerId);
      request.input('name', customerData.name);
      request.input('email', customerData.email || null);
      request.input('phone', customerData.phone || null);
      request.input('address', customerData.address || null);
      request.input('serviceType', customerData.serviceType || null);
      request.input('connectionStatus', customerData.connectionStatus || 'active');
      request.input('installationDate', customerData.installationDate || null);
      request.input('monthlyCharge', customerData.monthlyCharge || null);
      request.input('lastPaymentDate', customerData.lastPaymentDate || null);
      
      const result = await request.query(`
        INSERT INTO customers (
          customerId, name, email, phone, address, serviceType,
          connectionStatus, installationDate, monthlyCharge, lastPaymentDate,
          createdAt, updatedAt
        )
        OUTPUT INSERTED.id
        VALUES (
          @customerId, @name, @email, @phone, @address, @serviceType,
          @connectionStatus, @installationDate, @monthlyCharge, @lastPaymentDate,
          GETDATE(), GETDATE()
        )
      `);
      
      const newId = result.recordset[0].id;
      return await this.getCustomer(newId);
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  async updateCustomer(id: number, updates: any): Promise<any> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      
      // Build dynamic update query
      const updateFields = [];
      
      if (updates.name !== undefined) {
        updateFields.push('name = @name');
        request.input('name', updates.name);
      }
      if (updates.email !== undefined) {
        updateFields.push('email = @email');
        request.input('email', updates.email);
      }
      if (updates.phone !== undefined) {
        updateFields.push('phone = @phone');
        request.input('phone', updates.phone);
      }
      if (updates.address !== undefined) {
        updateFields.push('address = @address');
        request.input('address', updates.address);
      }
      if (updates.serviceType !== undefined) {
        updateFields.push('serviceType = @serviceType');
        request.input('serviceType', updates.serviceType);
      }
      if (updates.connectionStatus !== undefined) {
        updateFields.push('connectionStatus = @connectionStatus');
        request.input('connectionStatus', updates.connectionStatus);
      }
      if (updates.monthlyCharge !== undefined) {
        updateFields.push('monthlyCharge = @monthlyCharge');
        request.input('monthlyCharge', updates.monthlyCharge);
      }
      
      if (updateFields.length === 0) {
        return await this.getCustomer(id);
      }
      
      updateFields.push('updatedAt = GETDATE()');
      request.input('id', id);
      
      await request.query(`
        UPDATE customers 
        SET ${updateFields.join(', ')}
        WHERE id = @id
      `);
      
      return await this.getCustomer(id);
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  async deleteCustomer(id: number): Promise<boolean> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      request.input('id', id);
      
      await request.query(`DELETE FROM customers WHERE id = @id`);
      return true;
    } catch (error) {
      console.error('Error deleting customer:', error);
      return false;
    }
  }

  // Task operations
  async getTask(id: number): Promise<any | undefined> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      request.input('id', id);
      
      const result = await request.query(`
        SELECT * FROM tasks WHERE id = @id
      `);
      
      return result.recordset[0];
    } catch (error) {
      console.error('Error getting task:', error);
      return undefined;
    }
  }

  async getAllTasks(): Promise<any[]> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      
      const result = await request.query(`
        SELECT * FROM tasks ORDER BY createdAt DESC
      `);
      
      return result.recordset;
    } catch (error) {
      console.error('Error getting all tasks:', error);
      return [];
    }
  }

  async createTask(taskData: any): Promise<any> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      
      // Generate ticket number if not provided
      const ticketNumber = taskData.ticketNumber || `TSK${Date.now().toString().slice(-6)}`;
      
      request.input('ticketNumber', ticketNumber);
      request.input('title', taskData.title);
      request.input('description', taskData.description || null);
      request.input('customerId', taskData.customerId || null);
      request.input('customerName', taskData.customerName || null);
      request.input('status', taskData.status || 'pending');
      request.input('priority', taskData.priority || 'medium');
      request.input('issueType', taskData.issueType || null);
      request.input('assignedTo', taskData.assignedTo || null);
      request.input('fieldEngineerId', taskData.fieldEngineerId || null);
      request.input('backendEngineerId', taskData.backendEngineerId || null);
      
      const result = await request.query(`
        INSERT INTO tasks (
          ticketNumber, title, description, customerId, customerName,
          status, priority, issueType, assignedTo, fieldEngineerId,
          backendEngineerId, createdAt, updatedAt
        )
        OUTPUT INSERTED.id
        VALUES (
          @ticketNumber, @title, @description, @customerId, @customerName,
          @status, @priority, @issueType, @assignedTo, @fieldEngineerId,
          @backendEngineerId, GETDATE(), GETDATE()
        )
      `);
      
      const newId = result.recordset[0].id;
      return await this.getTask(newId);
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async updateTask(id: number, updates: any): Promise<any> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      
      // Build dynamic update query
      const updateFields = [];
      
      if (updates.title !== undefined) {
        updateFields.push('title = @title');
        request.input('title', updates.title);
      }
      if (updates.description !== undefined) {
        updateFields.push('description = @description');
        request.input('description', updates.description);
      }
      if (updates.status !== undefined) {
        updateFields.push('status = @status');
        request.input('status', updates.status);
        
        // Set resolvedAt if status is completed
        if (updates.status === 'completed') {
          updateFields.push('resolvedAt = GETDATE()');
        }
      }
      if (updates.priority !== undefined) {
        updateFields.push('priority = @priority');
        request.input('priority', updates.priority);
      }
      if (updates.assignedTo !== undefined) {
        updateFields.push('assignedTo = @assignedTo');
        request.input('assignedTo', updates.assignedTo);
      }
      if (updates.fieldEngineerId !== undefined) {
        updateFields.push('fieldEngineerId = @fieldEngineerId');
        request.input('fieldEngineerId', updates.fieldEngineerId);
      }
      if (updates.backendEngineerId !== undefined) {
        updateFields.push('backendEngineerId = @backendEngineerId');
        request.input('backendEngineerId', updates.backendEngineerId);
      }
      
      if (updateFields.length === 0) {
        return await this.getTask(id);
      }
      
      updateFields.push('updatedAt = GETDATE()');
      request.input('id', id);
      
      await request.query(`
        UPDATE tasks 
        SET ${updateFields.join(', ')}
        WHERE id = @id
      `);
      
      return await this.getTask(id);
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  async deleteTask(id: number): Promise<boolean> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      request.input('id', id);
      
      await request.query(`DELETE FROM tasks WHERE id = @id`);
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  }

  // Task update operations
  async createTaskUpdate(updateData: any): Promise<any> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      
      request.input('taskId', updateData.taskId);
      request.input('status', updateData.status || null);
      request.input('note', updateData.note || null);
      request.input('updatedBy', updateData.updatedBy || null);
      request.input('filePath', updateData.filePath || null);
      request.input('fileName', updateData.fileName || null);
      request.input('fileType', updateData.fileType || null);
      
      const result = await request.query(`
        INSERT INTO task_updates (
          taskId, status, note, updatedBy, filePath, fileName, fileType, createdAt
        )
        OUTPUT INSERTED.id
        VALUES (
          @taskId, @status, @note, @updatedBy, @filePath, @fileName, @fileType, GETDATE()
        )
      `);
      
      return result.recordset[0];
    } catch (error) {
      console.error('Error creating task update:', error);
      throw error;
    }
  }

  async getTaskUpdates(taskId: number): Promise<any[]> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      request.input('taskId', taskId);
      
      const result = await request.query(`
        SELECT * FROM task_updates 
        WHERE taskId = @taskId 
        ORDER BY createdAt DESC
      `);
      
      return result.recordset;
    } catch (error) {
      console.error('Error getting task updates:', error);
      return [];
    }
  }

  // Performance metrics
  async createPerformanceMetric(metricData: any): Promise<any> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      
      request.input('userId', metricData.userId);
      request.input('tasksCompleted', metricData.tasksCompleted || 0);
      request.input('averageResolutionTime', metricData.averageResolutionTime || null);
      request.input('customerSatisfactionScore', metricData.customerSatisfactionScore || null);
      request.input('month', metricData.month);
      request.input('year', metricData.year);
      
      const result = await request.query(`
        INSERT INTO performance_metrics (
          userId, tasksCompleted, averageResolutionTime, customerSatisfactionScore,
          month, year, createdAt, updatedAt
        )
        OUTPUT INSERTED.id
        VALUES (
          @userId, @tasksCompleted, @averageResolutionTime, @customerSatisfactionScore,
          @month, @year, GETDATE(), GETDATE()
        )
      `);
      
      return result.recordset[0];
    } catch (error) {
      console.error('Error creating performance metric:', error);
      throw error;
    }
  }

  async getPerformanceMetrics(userId: string): Promise<any[]> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      request.input('userId', userId);
      
      const result = await request.query(`
        SELECT * FROM performance_metrics 
        WHERE userId = @userId 
        ORDER BY year DESC, month DESC
      `);
      
      return result.recordset;
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return [];
    }
  }

  // Bot configurations
  async getAllBotConfigurations(): Promise<any[]> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      
      const result = await request.query(`
        SELECT * FROM bot_configurations ORDER BY createdAt DESC
      `);
      
      return result.recordset;
    } catch (error) {
      console.error('Error getting bot configurations:', error);
      return [];
    }
  }

  async createBotConfiguration(configData: any): Promise<any> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      
      request.input('name', configData.name);
      request.input('botToken', configData.botToken);
      request.input('chatId', configData.chatId);
      request.input('isActive', configData.isActive !== false);
      request.input('notifyOnTaskCreate', configData.notifyOnTaskCreate !== false);
      request.input('notifyOnTaskUpdate', configData.notifyOnTaskUpdate !== false);
      request.input('notifyOnTaskComplete', configData.notifyOnTaskComplete !== false);
      
      const result = await request.query(`
        INSERT INTO bot_configurations (
          name, botToken, chatId, isActive, notifyOnTaskCreate,
          notifyOnTaskUpdate, notifyOnTaskComplete, createdAt, updatedAt
        )
        OUTPUT INSERTED.id
        VALUES (
          @name, @botToken, @chatId, @isActive, @notifyOnTaskCreate,
          @notifyOnTaskUpdate, @notifyOnTaskComplete, GETDATE(), GETDATE()
        )
      `);
      
      return result.recordset[0];
    } catch (error) {
      console.error('Error creating bot configuration:', error);
      throw error;
    }
  }

  async updateBotConfiguration(id: number, updates: any): Promise<any> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      
      const updateFields = [];
      
      if (updates.name !== undefined) {
        updateFields.push('name = @name');
        request.input('name', updates.name);
      }
      if (updates.botToken !== undefined) {
        updateFields.push('botToken = @botToken');
        request.input('botToken', updates.botToken);
      }
      if (updates.chatId !== undefined) {
        updateFields.push('chatId = @chatId');
        request.input('chatId', updates.chatId);
      }
      if (updates.isActive !== undefined) {
        updateFields.push('isActive = @isActive');
        request.input('isActive', updates.isActive);
      }
      if (updates.notifyOnTaskCreate !== undefined) {
        updateFields.push('notifyOnTaskCreate = @notifyOnTaskCreate');
        request.input('notifyOnTaskCreate', updates.notifyOnTaskCreate);
      }
      if (updates.notifyOnTaskUpdate !== undefined) {
        updateFields.push('notifyOnTaskUpdate = @notifyOnTaskUpdate');
        request.input('notifyOnTaskUpdate', updates.notifyOnTaskUpdate);
      }
      if (updates.notifyOnTaskComplete !== undefined) {
        updateFields.push('notifyOnTaskComplete = @notifyOnTaskComplete');
        request.input('notifyOnTaskComplete', updates.notifyOnTaskComplete);
      }
      
      if (updateFields.length === 0) {
        return { id };
      }
      
      updateFields.push('updatedAt = GETDATE()');
      request.input('id', id);
      
      await request.query(`
        UPDATE bot_configurations 
        SET ${updateFields.join(', ')}
        WHERE id = @id
      `);
      
      return { id, ...updates };
    } catch (error) {
      console.error('Error updating bot configuration:', error);
      throw error;
    }
  }

  async deleteBotConfiguration(id: number): Promise<boolean> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      request.input('id', id);
      
      await request.query(`DELETE FROM bot_configurations WHERE id = @id`);
      return true;
    } catch (error) {
      console.error('Error deleting bot configuration:', error);
      return false;
    }
  }

  // Notification logs
  async createNotificationLog(logData: any): Promise<any> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      
      request.input('eventType', logData.eventType);
      request.input('messageText', logData.messageText);
      request.input('userId', logData.userId || null);
      request.input('customerId', logData.customerId || null);
      request.input('taskId', logData.taskId || null);
      request.input('status', logData.status || 'pending');
      request.input('sentAt', logData.sentAt || null);
      
      const result = await request.query(`
        INSERT INTO notification_logs (
          eventType, messageText, userId, customerId, taskId, status, sentAt, createdAt
        )
        OUTPUT INSERTED.id
        VALUES (
          @eventType, @messageText, @userId, @customerId, @taskId, @status, @sentAt, GETDATE()
        )
      `);
      
      return result.recordset[0];
    } catch (error) {
      console.error('Error creating notification log:', error);
      throw error;
    }
  }

  async getAllNotificationLogs(): Promise<any[]> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      
      const result = await request.query(`
        SELECT * FROM notification_logs ORDER BY createdAt DESC
      `);
      
      return result.recordset;
    } catch (error) {
      console.error('Error getting notification logs:', error);
      return [];
    }
  }



  // Delete user method for debugging
  async deleteUser(userId: string): Promise<boolean> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      request.input('userId', userId);
      
      await request.query(`DELETE FROM users WHERE id = @userId`);
      console.log(`✅ Deleted user with ID: ${userId}`);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  // Field Engineer Methods - CRITICAL FOR MOBILE APK WORKFLOW
  async assignTaskToFieldEngineer(taskId: number, fieldEngineerId: string, assignedBy?: string): Promise<any> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      
      request.input('taskId', taskId);
      request.input('fieldEngineerId', fieldEngineerId);
      request.input('assignedBy', assignedBy || null);
      
      await request.query(`
        UPDATE tasks 
        SET fieldEngineerId = @fieldEngineerId, 
            status = 'assigned_to_field',
            updatedAt = GETDATE()
        WHERE id = @taskId
      `);
      
      console.log(`✅ Task ${taskId} assigned to field engineer ${fieldEngineerId}`);
      return await this.getTask(taskId);
    } catch (error) {
      console.error('Error assigning task to field engineer:', error);
      throw error;
    }
  }

  async assignMultipleFieldEngineers(taskId: number, fieldEngineerIds: string[], assignedBy?: string): Promise<any[]> {
    try {
      const results = [];
      const originalTask = await this.getTask(taskId);
      
      for (let i = 0; i < fieldEngineerIds.length; i++) {
        const fieldEngineerId = fieldEngineerIds[i];
        
        if (i === 0) {
          // Update original task
          const updatedTask = await this.assignTaskToFieldEngineer(taskId, fieldEngineerId, assignedBy);
          results.push(updatedTask);
        } else {
          // Create duplicate tasks for additional field engineers
          const newTaskData = {
            ...originalTask,
            ticketNumber: `${originalTask.ticketNumber}-${i + 1}`,
            fieldEngineerId: fieldEngineerId,
            status: 'assigned_to_field',
            assignedTo: assignedBy,
            id: undefined // Remove ID so it creates new task
          };
          
          const newTask = await this.createTask(newTaskData);
          results.push(newTask);
        }
      }
      
      console.log(`✅ Task assigned to ${fieldEngineerIds.length} field engineers`);
      return results;
    } catch (error) {
      console.error('Error assigning multiple field engineers:', error);
      throw error;
    }
  }

  async getFieldTasksByEngineer(fieldEngineerId: string): Promise<any[]> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      request.input('fieldEngineerId', fieldEngineerId);
      
      const result = await request.query(`
        SELECT t.*, c.name as customerName, c.address as customerAddress
        FROM tasks t
        LEFT JOIN customers c ON t.customerId = c.id
        WHERE t.fieldEngineerId = @fieldEngineerId
        ORDER BY t.createdAt DESC
      `);
      
      console.log(`✅ Found ${result.recordset.length} tasks for field engineer ${fieldEngineerId}`);
      return result.recordset;
    } catch (error) {
      console.error('Error getting field engineer tasks:', error);
      return [];
    }
  }

  async getAvailableFieldEngineers(region?: string, skillSet?: string): Promise<any[]> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      
      let whereClause = "WHERE role = 'field_engineer' AND isActive = 1";
      
      // Note: region and skillSet filters removed as columns don't exist in current schema
      
      const result = await request.query(`
        SELECT id, username, firstName, lastName, email, phone, role, isActive,
               'Available' as status
        FROM users 
        ${whereClause}
        ORDER BY firstName, lastName
      `);
      
      console.log(`✅ Found ${result.recordset.length} available field engineers`);
      return result.recordset;
    } catch (error) {
      console.error('Error getting available field engineers:', error);
      return [];
    }
  }

  // Field task status update methods
  async updateFieldTaskStatus(taskId: number, status: string, updatedBy: string, note?: string): Promise<any> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      
      request.input('taskId', taskId);
      request.input('status', status);
      request.input('updatedBy', updatedBy);
      
      // Update task status
      await request.query(`
        UPDATE tasks 
        SET status = @status, updatedAt = GETDATE()
        WHERE id = @taskId
      `);
      
      // Create task update record
      if (note) {
        await this.createTaskUpdate({
          taskId,
          status,
          note,
          updatedBy
        });
      }
      
      console.log(`✅ Field task ${taskId} status updated to ${status}`);
      return await this.getTask(taskId);
    } catch (error) {
      console.error('Error updating field task status:', error);
      throw error;
    }
  }

  async completeFieldTask(taskId: number, completedBy: string, completionNote: string, files?: any[]): Promise<any> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      
      request.input('taskId', taskId);
      request.input('completedBy', completedBy);
      
      // Update task to completed
      await request.query(`
        UPDATE tasks 
        SET status = 'completed', 
            resolvedAt = GETDATE(),
            updatedAt = GETDATE()
        WHERE id = @taskId
      `);
      
      // Create completion update record
      await this.createTaskUpdate({
        taskId,
        status: 'completed',
        note: completionNote,
        updatedBy: completedBy,
        filePath: files && files.length > 0 ? files[0].path : null,
        fileName: files && files.length > 0 ? files[0].name : null,
        fileType: files && files.length > 0 ? files[0].type : null
      });
      
      console.log(`✅ Field task ${taskId} completed successfully`);
      return await this.getTask(taskId);
    } catch (error) {
      console.error('Error completing field task:', error);  
      throw error;
    }
  }



  async getTasksByStatus(status: string): Promise<any[]> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      request.input('status', status);
      
      const result = await request.query(`
        SELECT t.*, c.name as customerName, u.firstName, u.lastName
        FROM tasks t
        LEFT JOIN customers c ON t.customerId = c.id
        LEFT JOIN users u ON t.fieldEngineerId = u.id
        WHERE t.status = @status
        ORDER BY t.createdAt DESC
      `);
      
      return result.recordset;
    } catch (error) {
      console.error('Error getting tasks by status:', error);
      return [];
    }
  }

  // Additional methods for compatibility
  async getUserByEmail(email: string): Promise<any | undefined> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      request.input('email', email);
      
      const result = await request.query(`
        SELECT * FROM users WHERE email = @email
      `);
      
      return result.recordset[0];
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async createUserWithPassword(userData: any): Promise<any> {
    // This is an alias for createUser for compatibility
    return await this.createUser(userData);
  }

  // Missing methods to fix blank screen issues
  async getNotificationsByUser(userId: string): Promise<any[]> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      request.input('userId', userId);
      
      const result = await request.query(`
        SELECT TOP 50 * FROM notification_logs 
        WHERE userId = @userId 
        ORDER BY createdAt DESC
      `);
      
      return result.recordset;
    } catch (error) {
      console.error('Error getting notifications by user:', error);
      return [];
    }
  }

  async getDashboardStats(): Promise<any> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      
      // Get task counts
      const taskStats = await request.query(`
        SELECT 
          COUNT(*) as totalTasks,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingTasks,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as inProgressTasks,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedTasks,
          SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolvedTasks,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelledTasks
        FROM tasks
      `);
      
      // Get customer count
      const customerStats = await request.query(`
        SELECT COUNT(*) as totalCustomers FROM customers
      `);
      
      // Get user count
      const userStats = await request.query(`
        SELECT COUNT(*) as activeUsers FROM users WHERE isActive = 1
      `);
      
      const stats = taskStats.recordset[0];
      stats.totalCustomers = customerStats.recordset[0].totalCustomers;
      stats.activeUsers = userStats.recordset[0].activeUsers;
      stats.avgPerformanceScore = 85.5; // Default value
      stats.avgResponseTime = 24.2; // Default value in hours
      
      return stats;
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        totalTasks: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        completedTasks: 0,
        resolvedTasks: 0,
        cancelledTasks: 0,
        totalCustomers: 0,
        activeUsers: 0,
        avgPerformanceScore: 0,
        avgResponseTime: 0
      };
    }
  }

  async getRecentTasks(limit: number = 10): Promise<any[]> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      request.input('limit', limit);
      
      const result = await request.query(`
        SELECT TOP (@limit) 
          t.*,
          c.name as customerName,
          u.firstName + ' ' + u.lastName as assignedUserName
        FROM tasks t
        LEFT JOIN customers c ON t.customerId = c.id
        LEFT JOIN users u ON t.assignedTo = u.id
        ORDER BY t.createdAt DESC
      `);
      
      return result.recordset;
    } catch (error) {
      console.error('Error getting recent tasks:', error);
      return [];
    }
  }

  async getAllChatRooms(): Promise<any[]> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      
      const result = await request.query(`
        SELECT * FROM chat_rooms ORDER BY createdAt DESC
      `);
      
      return result.recordset;
    } catch (error) {
      console.error('Error getting chat rooms:', error);
      return [];
    }
  }

  async createChatRoom(room: any): Promise<any> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      
      request.input('name', room.name);
      request.input('description', room.description || null);
      request.input('isPrivate', room.isPrivate || false);
      request.input('createdBy', room.createdBy);
      
      const result = await request.query(`
        INSERT INTO chat_rooms (name, description, isPrivate, createdBy, createdAt, updatedAt)
        OUTPUT INSERTED.id
        VALUES (@name, @description, @isPrivate, @createdBy, GETDATE(), GETDATE())
      `);
      
      const newId = result.recordset[0].id;
      
      // Get the created room
      const roomResult = await request.query(`
        SELECT * FROM chat_rooms WHERE id = ${newId}
      `);
      
      return roomResult.recordset[0];
    } catch (error) {
      console.error('Error creating chat room:', error);
      throw error;
    }
  }

  async getChatMessages(roomId: number): Promise<any[]> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      request.input('roomId', roomId);
      
      const result = await request.query(`
        SELECT 
          m.*,
          u.firstName + ' ' + u.lastName as senderName,
          u.role as senderRole
        FROM chat_messages m
        LEFT JOIN users u ON m.senderId = u.id
        WHERE m.roomId = @roomId
        ORDER BY m.createdAt ASC
      `);
      
      return result.recordset;
    } catch (error) {
      console.error('Error getting chat messages:', error);
      return [];
    }
  }

  async createChatMessage(message: any): Promise<any> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      
      request.input('roomId', message.roomId);
      request.input('senderId', message.senderId);
      request.input('content', message.content);
      
      const result = await request.query(`
        INSERT INTO chat_messages (roomId, senderId, content, createdAt)
        OUTPUT INSERTED.id
        VALUES (@roomId, @senderId, @content, GETDATE())
      `);
      
      const newId = result.recordset[0].id;
      
      // Get the created message
      const messageResult = await request.query(`
        SELECT * FROM chat_messages WHERE id = ${newId}
      `);
      
      return messageResult.recordset[0];
    } catch (error) {
      console.error('Error creating chat message:', error);
      throw error;
    }
  }

  async getAnalyticsOverview(days: number): Promise<any> {
    return { message: 'Analytics overview not implemented for MSSQL yet' };
  }

  async getEngineerPerformance(days: number): Promise<any[]> {
    return [];
  }

  async getCustomerAnalytics(days: number): Promise<any> {
    return { message: 'Customer analytics not implemented for MSSQL yet' };
  }

  async getTrendAnalytics(days: number): Promise<any> {
    return { message: 'Trend analytics not implemented for MSSQL yet' };
  }

  async getTopPerformers(limit: number = 10): Promise<any[]> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      request.input('limit', limit);
      
      const result = await request.query(`
        SELECT TOP (@limit)
          u.id,
          u.firstName + ' ' + u.lastName as name,
          u.role,
          u.department,
          COALESCE(pm.tasksCompleted, 0) as tasksCompleted,
          COALESCE(pm.averageResolutionTime, 0) as averageResolutionTime,
          COALESCE(pm.customerSatisfactionScore, 85.0) as customerSatisfactionScore
        FROM users u
        LEFT JOIN performance_metrics pm ON u.id = pm.userId
        WHERE u.isActive = 1
        ORDER BY COALESCE(pm.tasksCompleted, 0) DESC, COALESCE(pm.customerSatisfactionScore, 85.0) DESC
      `);
      
      return result.recordset;
    } catch (error) {
      console.error('Error getting top performers:', error);
      return [];
    }
  }

  async getPerformanceAnalytics(days: number): Promise<any> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      request.input('days', days);
      
      const result = await request.query(`
        SELECT 
          u.firstName + ' ' + u.lastName as engineerName,
          u.role,
          COALESCE(pm.tasksCompleted, 0) as tasksCompleted,
          COALESCE(pm.averageResolutionTime, 24) as avgResolutionTime,
          COALESCE(pm.customerSatisfactionScore, 85.0) as satisfactionScore
        FROM users u
        LEFT JOIN performance_metrics pm ON u.id = pm.userId
        WHERE u.role IN ('engineer', 'backend_engineer', 'field_engineer') AND u.isActive = 1
        ORDER BY COALESCE(pm.tasksCompleted, 0) DESC
      `);
      
      return {
        engineers: result.recordset,
        totalTasks: result.recordset.reduce((sum: number, eng: any) => sum + eng.tasksCompleted, 0),
        averageTime: result.recordset.reduce((sum: number, eng: any) => sum + eng.avgResolutionTime, 0) / Math.max(result.recordset.length, 1)
      };
    } catch (error) {
      console.error('Error getting performance analytics:', error);
      return { engineers: [], totalTasks: 0, averageTime: 24 };
    }
  }

  async getTrendsAnalytics(days: number): Promise<any> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      request.input('days', days);
      
      const result = await request.query(`
        SELECT 
          CAST(createdAt as DATE) as date,
          COUNT(*) as taskCount,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedTasks,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingTasks
        FROM tasks
        WHERE DATEDIFF(day, createdAt, GETDATE()) <= @days
        GROUP BY CAST(createdAt as DATE)
        ORDER BY date DESC
      `);
      
      return {
        dailyTasks: result.recordset,
        totalTrend: result.recordset.length > 0 ? 
          ((result.recordset[0].taskCount - (result.recordset[result.recordset.length - 1]?.taskCount || 0)) / 
           Math.max(result.recordset[result.recordset.length - 1]?.taskCount || 1, 1)) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting trends analytics:', error);
      return { dailyTasks: [], totalTrend: 0 };
    }
  }

  // Method to get task statistics - Fixed implementation
  async getTaskStats(): Promise<any> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      const result = await request.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as inProgress,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_priority
        FROM tasks
      `);
      return result.recordset[0] || { total: 0, pending: 0, inProgress: 0, completed: 0, high_priority: 0 };
    } catch (error) {
      console.error('Error getting task stats:', error);
      return { total: 0, pending: 0, inProgress: 0, completed: 0, high_priority: 0 };
    }
  }



  // Performance calculation method - Fixed implementation
  async calculateUserPerformance(userId: string): Promise<any> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      request.input('userId', userId);
      
      const result = await request.query(`
        SELECT 
          COUNT(*) as totalTasks,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedTasks,
          AVG(CASE WHEN status = 'completed' AND resolvedAt IS NOT NULL 
              THEN DATEDIFF(hour, createdAt, resolvedAt) ELSE NULL END) as avgResolutionHours
        FROM tasks 
        WHERE assignedTo = @userId OR fieldEngineerId = @userId
      `);
      
      const stats = result.recordset[0] || {};
      return {
        totalTasks: stats.totalTasks || 0,
        completedTasks: stats.completedTasks || 0,
        completionRate: stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks * 100) : 0,
        avgResolutionHours: stats.avgResolutionHours || 0
      };
    } catch (error) {
      console.error('Error calculating user performance:', error);
      return {
        totalTasks: 0,
        completedTasks: 0,
        completionRate: 0,
        avgResolutionHours: 0
      };
    }
  }

  // Method to get all SQL connections - Fixed implementation
  async getAllSqlConnections(): Promise<any[]> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      const result = await request.query(`
        SELECT id, name, host, port, database_name, username, ssl_enabled, status, created_at, updated_at
        FROM sql_connections
        ORDER BY name
      `);
      return result.recordset || [];
    } catch (error) {
      console.error('Error getting SQL connections:', error);
      return [];
    }
  }

  // Method to get customer system details
  async getCustomerSystemDetails(customerId: number): Promise<any[]> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      request.input('customerId', customerId);
      
      const result = await request.query(`
        SELECT * FROM customer_system_details 
        WHERE customer_id = @customerId
        ORDER BY created_at DESC
      `);
      
      return result.recordset || [];
    } catch (error) {
      console.error('Error getting customer system details:', error);
      return [];
    }
  }

  // Method to create customer system details
  async createCustomerSystemDetails(detailsData: any): Promise<any> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      
      request.input('customerId', detailsData.customerId);
      request.input('systemType', detailsData.systemType || null);
      request.input('specifications', detailsData.specifications || null);
      request.input('notes', detailsData.notes || null);
      
      const result = await request.query(`
        INSERT INTO customer_system_details (
          customer_id, system_type, specifications, notes, created_at, updated_at
        )
        OUTPUT INSERTED.id
        VALUES (
          @customerId, @systemType, @specifications, @notes, GETDATE(), GETDATE()
        )
      `);
      
      return result.recordset[0];
    } catch (error) {
      console.error('Error creating customer system details:', error);
      throw error;
    }
  }

  // Method to update customer system details
  async updateCustomerSystemDetails(id: number, updates: any): Promise<any> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      
      const updateFields = [];
      if (updates.systemType !== undefined) {
        updateFields.push('system_type = @systemType');
        request.input('systemType', updates.systemType);
      }
      if (updates.specifications !== undefined) {
        updateFields.push('specifications = @specifications');
        request.input('specifications', updates.specifications);
      }
      if (updates.notes !== undefined) {
        updateFields.push('notes = @notes');
        request.input('notes', updates.notes);
      }
      
      if (updateFields.length === 0) {
        return null;
      }
      
      updateFields.push('updated_at = GETDATE()');
      request.input('id', id);
      
      await request.query(`
        UPDATE customer_system_details 
        SET ${updateFields.join(', ')}
        WHERE id = @id
      `);
      
      // Return updated record
      const selectRequest = pool.request();
      selectRequest.input('id', id);
      const result = await selectRequest.query(`
        SELECT * FROM customer_system_details WHERE id = @id
      `);
      
      return result.recordset[0];
    } catch (error) {
      console.error('Error updating customer system details:', error);
      throw error;
    }
  }
}

export const storage = new MSSQLStorage();