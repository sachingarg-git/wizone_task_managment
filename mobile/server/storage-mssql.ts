// MS SQL Storage Layer - Field Engineer Mobile App
import { getConnection, User, Task, Customer, TaskUpdate } from './db-mssql.js';
import mssql from 'mssql';

export class MSSQLStorage {
  
  // User Authentication
  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('username', mssql.VarChar, username)
        .query('SELECT * FROM users WHERE username = @username');
      
      return result.recordset[0] || null;
    } catch (error) {
      console.error('Error fetching user by username:', error);
      throw error;
    }
  }

  async authenticateUser(username: string, password: string): Promise<User | null> {
    try {
      const user = await this.getUserByUsername(username);
      if (user && user.password === password) {
        return user;
      }
      return null;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  // Field Engineer Tasks - Only assigned tasks
  async getTasksForUser(assignedTo: string): Promise<Task[]> {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('assigned_to', mssql.VarChar, assignedTo)
        .query(`
          SELECT t.*, c.name as customer_name 
          FROM tasks t 
          LEFT JOIN customers c ON t.customer_id = c.id 
          WHERE t.assigned_to = @assigned_to 
          ORDER BY t.created_at DESC
        `);
      
      return result.recordset;
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      throw error;
    }
  }

  // Get single task details
  async getTask(taskId: number): Promise<Task | null> {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('task_id', mssql.Int, taskId)
        .query('SELECT * FROM tasks WHERE id = @task_id');
      
      return result.recordset[0] || null;
    } catch (error) {
      console.error('Error fetching task:', error);
      throw error;
    }
  }

  // Update task status
  async updateTaskStatus(taskId: number, status: string, updatedBy: string): Promise<boolean> {
    try {
      const pool = await getConnection();
      
      // Update task status
      await pool.request()
        .input('task_id', mssql.Int, taskId)
        .input('status', mssql.VarChar, status)
        .input('updated_at', mssql.DateTime, new Date())
        .query(`
          UPDATE tasks 
          SET status = @status, updated_at = @updated_at 
          WHERE id = @task_id
        `);

      // Add task update entry
      await pool.request()
        .input('task_id', mssql.Int, taskId)
        .input('content', mssql.Text, `Status updated to: ${status}`)
        .input('updated_by', mssql.VarChar, updatedBy)
        .input('updated_at', mssql.DateTime, new Date())
        .query(`
          INSERT INTO task_updates (task_id, content, updated_by, updated_at)
          VALUES (@task_id, @content, @updated_by, @updated_at)
        `);

      return true;
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }

  // Add task note/comment
  async addTaskNote(taskId: number, content: string, updatedBy: string, filePath?: string): Promise<boolean> {
    try {
      const pool = await getConnection();
      
      await pool.request()
        .input('task_id', mssql.Int, taskId)
        .input('content', mssql.Text, content)
        .input('updated_by', mssql.VarChar, updatedBy)
        .input('file_path', mssql.VarChar, filePath || null)
        .input('updated_at', mssql.DateTime, new Date())
        .query(`
          INSERT INTO task_updates (task_id, content, updated_by, file_path, updated_at)
          VALUES (@task_id, @content, @updated_by, @file_path, @updated_at)
        `);

      return true;
    } catch (error) {
      console.error('Error adding task note:', error);
      throw error;
    }
  }

  // Get task updates/history
  async getTaskUpdates(taskId: number): Promise<TaskUpdate[]> {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('task_id', mssql.Int, taskId)
        .query(`
          SELECT * FROM task_updates 
          WHERE task_id = @task_id 
          ORDER BY updated_at DESC
        `);
      
      return result.recordset;
    } catch (error) {
      console.error('Error fetching task updates:', error);
      throw error;
    }
  }

  // Get customer details
  async getCustomer(customerId: number): Promise<Customer | null> {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('customer_id', mssql.Int, customerId)
        .query('SELECT * FROM customers WHERE id = @customer_id');
      
      return result.recordset[0] || null;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  }

  // Dashboard stats for field engineer
  async getFieldEngineerStats(assignedTo: string): Promise<any> {
    try {
      const pool = await getConnection();
      
      // Get task counts by status
      const statsResult = await pool.request()
        .input('assigned_to', mssql.VarChar, assignedTo)
        .query(`
          SELECT 
            COUNT(*) as total_tasks,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
            SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
            SUM(CASE WHEN status = 'on_hold' THEN 1 ELSE 0 END) as on_hold_tasks
          FROM tasks 
          WHERE assigned_to = @assigned_to
        `);

      return statsResult.recordset[0] || {
        total_tasks: 0,
        pending_tasks: 0,
        in_progress_tasks: 0,
        completed_tasks: 0,
        on_hold_tasks: 0
      };
    } catch (error) {
      console.error('Error fetching field engineer stats:', error);
      throw error;
    }
  }
}

export const storage = new MSSQLStorage();