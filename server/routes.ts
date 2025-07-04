import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { seedDatabase } from "./seed";
import { 
  insertTaskSchema, 
  insertCustomerSchema, 
  insertPerformanceMetricsSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Seed database route (for development)
  app.post('/api/seed', isAuthenticated, async (req: any, res) => {
    try {
      await seedDatabase();
      res.json({ message: "Database seeded successfully" });
    } catch (error) {
      console.error("Error seeding database:", error);
      res.status(500).json({ message: "Failed to seed database" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/recent-tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tasks = await storage.getTasksByUser(userId);
      const recentTasks = tasks.slice(0, 5); // Get 5 most recent tasks
      res.json(recentTasks);
    } catch (error) {
      console.error("Error fetching recent tasks:", error);
      res.status(500).json({ message: "Failed to fetch recent tasks" });
    }
  });

  // Task routes
  app.get('/api/tasks', isAuthenticated, async (req, res) => {
    try {
      const { search, priority, status } = req.query;
      
      let tasks;
      if (search) {
        tasks = await storage.searchTasks(search as string);
      } else {
        tasks = await storage.getAllTasks();
      }
      
      // Apply filters
      if (priority && priority !== 'all') {
        tasks = tasks.filter(task => task.priority === priority);
      }
      
      if (status && status !== 'all') {
        tasks = tasks.filter(task => task.status === status);
      }
      
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get('/api/tasks/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getTaskStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching task stats:", error);
      res.status(500).json({ message: "Failed to fetch task stats" });
    }
  });

  app.get('/api/tasks/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getTask(id);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.post('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertTaskSchema.parse({
        ...req.body,
        createdBy: userId,
      });
      
      const task = await storage.createTask(validatedData);
      
      // Update performance metrics for the assigned user
      if (task.assignedTo) {
        await storage.calculateUserPerformance(task.assignedTo);
      }
      
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.put('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const updateData = insertTaskSchema.partial().parse(req.body);
      
      // Get the current task to check status changes
      const currentTask = await storage.getTask(id);
      if (!currentTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Auto-set timing and resolution fields based on status changes
      if (updateData.status) {
        if (updateData.status === 'in_progress' && currentTask.status === 'pending') {
          updateData.startTime = new Date();
        }
        
        if (updateData.status === 'completed' && currentTask.status !== 'completed') {
          updateData.completionTime = new Date();
          
          // Handle notes/resolution from the frontend
          const notes = (req.body as any).notes;
          if (notes) {
            updateData.resolution = `${notes} (Resolved by user ${userId} on ${new Date().toISOString()})`;
          } else if (!updateData.resolution) {
            updateData.resolution = `Task completed by user ${userId} on ${new Date().toISOString()}`;
          }
          
          // Calculate actual time if start time exists
          if (currentTask.startTime) {
            const actualMinutes = Math.round((new Date().getTime() - new Date(currentTask.startTime).getTime()) / (1000 * 60));
            updateData.actualTime = actualMinutes;
          }
        }
      }
      
      const task = await storage.updateTask(id, updateData);
      
      // Create audit trail for task update
      const notes = (req.body as any).notes;
      const oldStatus = currentTask.status;
      const newStatus = updateData.status;
      
      // Log status change
      if (newStatus && oldStatus !== newStatus) {
        await storage.createTaskUpdate({
          taskId: id,
          updatedBy: userId,
          updateType: 'status_change',
          oldValue: oldStatus,
          newValue: newStatus,
          notes: notes || `Status changed from ${oldStatus} to ${newStatus}`,
        });
      }
      
      // Log notes if provided without status change
      if (notes && !newStatus) {
        await storage.createTaskUpdate({
          taskId: id,
          updatedBy: userId,
          updateType: 'note_added',
          notes: notes,
        });
      }
      
      // Update performance metrics if status changed to completed
      if (updateData.status === 'completed' && task.assignedTo) {
        await storage.calculateUserPerformance(task.assignedTo);
      }
      
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete('/api/tasks/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTask(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Task update history routes
  app.get('/api/tasks/:id/updates', isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const updates = await storage.getTaskUpdates(taskId);
      res.json(updates);
    } catch (error) {
      console.error("Error fetching task updates:", error);
      res.status(500).json({ message: "Failed to fetch task updates" });
    }
  });

  // File upload route for task attachments
  app.post('/api/tasks/:id/upload', isAuthenticated, async (req: any, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const { files, notes } = req.body;
      
      if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ message: "No files provided" });
      }
      
      // Create file upload audit record
      await storage.createTaskUpdate({
        taskId,
        updatedBy: userId,
        updateType: 'file_uploaded',
        notes: notes || `${files.length} file(s) uploaded`,
        attachments: files,
      });
      
      res.json({ message: "Files uploaded successfully", count: files.length });
    } catch (error) {
      console.error("Error uploading files:", error);
      res.status(500).json({ message: "Failed to upload files" });
    }
  });

  // Customer routes
  app.get('/api/customers', isAuthenticated, async (req, res) => {
    try {
      const { search, location } = req.query;
      
      let customers;
      if (search) {
        customers = await storage.searchCustomers(search as string);
      } else {
        customers = await storage.getAllCustomers();
      }
      
      // Apply location filter
      if (location && location !== 'all') {
        customers = customers.filter(customer => 
          customer.city?.toLowerCase().includes((location as string).toLowerCase()) ||
          customer.state?.toLowerCase().includes((location as string).toLowerCase())
        );
      }
      
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomer(id);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post('/api/customers', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.put('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(id, validatedData);
      res.json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      console.error("Error updating customer:", error);
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  app.delete('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCustomer(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Performance routes
  app.get('/api/performance/top-performers', isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const topPerformers = await storage.getTopPerformers(limit);
      res.json(topPerformers);
    } catch (error) {
      console.error("Error fetching top performers:", error);
      res.status(500).json({ message: "Failed to fetch top performers" });
    }
  });

  app.get('/api/performance/user/:userId', isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const { month, year } = req.query;
      
      const metrics = await storage.getPerformanceMetrics(
        userId,
        month ? parseInt(month as string) : undefined,
        year ? parseInt(year as string) : undefined
      );
      
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching user performance:", error);
      res.status(500).json({ message: "Failed to fetch user performance" });
    }
  });

  app.post('/api/performance/calculate/:userId', isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      await storage.calculateUserPerformance(userId);
      res.json({ message: "Performance calculated successfully" });
    } catch (error) {
      console.error("Error calculating performance:", error);
      res.status(500).json({ message: "Failed to calculate performance" });
    }
  });

  // User management routes
  app.get('/api/users', isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put('/api/users/:id/role', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      if (!role) {
        return res.status(400).json({ message: "Role is required" });
      }
      
      const user = await storage.updateUserRole(id, role);
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
