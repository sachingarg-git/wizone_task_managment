import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, createDefaultUsers } from "./auth";
import { seedDatabase } from "./seed";
import { 
  insertTaskSchema, 
  insertCustomerSchema, 
  insertPerformanceMetricsSchema,
  insertSqlConnectionSchema,
  insertChatRoomSchema,
  insertChatMessageSchema,
  insertChatParticipantSchema
} from "@shared/schema";
import { z } from "zod";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { createTablesInExternalDatabase, seedDefaultData } from "./migrations";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Create default users
  await createDefaultUsers();



  // Customer portal redirect route
  app.get('/customer-portal', (req, res) => {
    res.redirect('/#/customer-portal');
  });

  // Customer portal authentication middleware
  const isCustomerAuthenticated = (req: any, res: any, next: any) => {
    console.log("Customer auth check:", {
      hasSession: !!(req.session),
      hasCustomer: !!(req.session as any)?.customer,
      customerData: (req.session as any)?.customer ? { id: (req.session as any).customer.id, name: (req.session as any).customer.name } : null
    });
    
    if (!(req.session as any)?.customer) {
      return res.status(401).json({ message: "Customer not authenticated" });
    }
    next();
  };

  // Customer portal authentication routes
  app.post('/api/customer-portal/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const customer = await storage.getCustomerByUsername(username);
      if (!customer || customer.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Store customer session
      (req.session as any).customer = {
        id: customer.id,
        customerId: customer.customerId,
        name: customer.name,
        username: customer.username,
        email: customer.email,
        contactPerson: customer.contactPerson,
        mobilePhone: customer.mobilePhone,
        address: customer.address,
        city: customer.city,
        state: customer.state
      };

      res.json({ 
        id: customer.id,
        customerId: customer.customerId,
        name: customer.name,
        username: customer.username,
        email: customer.email,
        contactPerson: customer.contactPerson,
        mobilePhone: customer.mobilePhone,
        address: customer.address,
        city: customer.city,
        state: customer.state
      });
    } catch (error) {
      console.error("Customer login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Customer portal logout
  app.post('/api/customer-portal/auth/logout', (req, res) => {
    (req.session as any).customer = null;
    res.json({ message: "Logged out successfully" });
  });

  // Get customer's tasks
  app.get('/api/customer-portal/tasks', isCustomerAuthenticated, async (req, res) => {
    try {
      const customerId = (req.session as any).customer.id;
      const tasks = await storage.getTasksByCustomer(customerId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching customer tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  // Create new task (customer portal)
  app.post('/api/customer-portal/tasks', isCustomerAuthenticated, async (req, res) => {
    try {
      const customerId = (req.session as any).customer.id;
      const { title, description, priority, issueType } = req.body;
      
      if (!title || !description) {
        return res.status(400).json({ message: "Title and description are required" });
      }
      
      const taskData = {
        title,
        description,
        priority: priority || "medium",
        issueType: issueType || "technical",
        customerId,
        status: "pending",
        assignedTo: null, // Will be assigned by admin later
        createdBy: `customer_${customerId}` // Track that this was created by customer
      };
      
      console.log("Customer creating task:", { customerId, title, priority, issueType });
      const task = await storage.createTask(taskData);
      console.log("Customer task created successfully:", task.id);
      
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating customer task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  // Get task comments for customer
  app.get('/api/customer-portal/tasks/:taskId/comments', isCustomerAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const customerId = (req.session as any).customer.id;
      
      // Verify task belongs to customer
      const task = await storage.getTask(taskId);
      if (!task || task.customerId !== customerId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const comments = await storage.getTaskComments(taskId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching task comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Get task history for customer
  app.get('/api/customer-portal/tasks/:taskId/history', isCustomerAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const customerId = (req.session as any).customer.id;
      
      // Verify task belongs to customer
      const task = await storage.getTask(taskId);
      if (!task || task.customerId !== customerId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const history = await storage.getTaskUpdates(taskId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching task history:", error);
      res.status(500).json({ message: "Failed to fetch task history" });
    }
  });

  // Customer task update endpoint
  app.post('/api/customer-portal/tasks/:taskId/update', isCustomerAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const customerId = (req.session as any).customer.id;
      const { comment, status, priority } = req.body;
      
      // Verify task belongs to customer
      const task = await storage.getTask(taskId);
      if (!task || task.customerId !== customerId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Update task if priority or status changed
      if (priority && priority !== task.priority) {
        await storage.updateTask(taskId, { priority });
      }
      
      // Customer can only set status to certain values
      if (status && ['pending', 'cancelled'].includes(status) && status !== task.status) {
        await storage.updateTask(taskId, { status });
      }
      
      // Add the update record using valid system user for customer updates
      await storage.createTaskUpdate({
        taskId,
        updatedBy: 'admin001', // Use system admin for customer updates
        updateType: 'note_added',
        note: `[Customer Update] ${comment || `Priority: ${priority || 'unchanged'}, Status: ${status || 'unchanged'}`}`
      });
      
      console.log("Customer task update:", { customerId, taskId, comment, priority, status });
      res.json({ message: "Task updated successfully" });
    } catch (error) {
      console.error("Error updating customer task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Add comment to task (customer portal)
  app.post('/api/customer-portal/comments', isCustomerAuthenticated, async (req, res) => {
    try {
      const { taskId, comment } = req.body;
      const customerId = (req.session as any).customer.id;
      
      // Verify task belongs to customer
      const task = await storage.getTask(taskId);
      if (!task || task.customerId !== customerId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const commentData = {
        taskId,
        customerId,
        comment,
        attachments: null,
        isInternal: false,
        respondedBy: null
      };
      
      const newComment = await storage.createCustomerComment(commentData);
      res.json(newComment);
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  // Create new task (customer portal)
  app.post('/api/customer-portal/tasks', isCustomerAuthenticated, async (req, res) => {
    try {
      const customerId = (req.session as any).customer.id;
      const taskData = {
        ...req.body,
        customerId,
        status: 'open',
        priority: req.body.priority || 'medium',
        assignedTo: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const validatedData = insertTaskSchema.parse(taskData);
      const task = await storage.createTask(validatedData);
      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  // Authentication middleware
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    next();
  };

  // Geofencing routes
  app.get('/api/geofencing/zones', isAuthenticated, async (req, res) => {
    try {
      const zones = await storage.getGeofenceZones();
      res.json(zones);
    } catch (error) {
      console.error("Error fetching geofencing zones:", error);
      res.status(500).json({ message: "Failed to fetch geofencing zones" });
    }
  });

  app.post('/api/geofencing/zones', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const zoneData = { ...req.body, createdBy: userId };
      const zone = await storage.createGeofenceZone(zoneData);
      res.json(zone);
    } catch (error) {
      console.error("Error creating geofencing zone:", error);
      res.status(500).json({ message: "Failed to create geofencing zone" });
    }
  });

  app.get('/api/geofencing/events', isAuthenticated, async (req, res) => {
    try {
      const events = await storage.getRecentGeofenceEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching geofencing events:", error);
      res.status(500).json({ message: "Failed to fetch geofencing events" });
    }
  });

  app.get('/api/geofencing/locations/live', isAuthenticated, async (req, res) => {
    try {
      const locations = await storage.getLiveUserLocations();
      res.json(locations);
    } catch (error) {
      console.error("Error fetching live locations:", error);
      res.status(500).json({ message: "Failed to fetch live locations" });
    }
  });

  app.post('/api/geofencing/locations', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const locationData = { ...req.body, userId };
      const location = await storage.createUserLocation(locationData);
      
      // Check for geofence events
      await storage.checkGeofenceEvents(userId, locationData.latitude, locationData.longitude);
      
      res.json(location);
    } catch (error) {
      console.error("Error updating location:", error);
      res.status(500).json({ message: "Failed to update location" });
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

  // Customer system details routes
  app.get('/api/customer-portal/system-details', isCustomerAuthenticated, async (req, res) => {
    try {
      const customerId = (req.session as any).customer.id;
      const systemDetails = await storage.getCustomerSystemDetails(customerId);
      res.json(systemDetails);
    } catch (error) {
      console.error("Error fetching system details:", error);
      res.status(500).json({ message: "Failed to fetch system details" });
    }
  });

  app.post('/api/customer-portal/system-details', isCustomerAuthenticated, async (req, res) => {
    try {
      const customerId = (req.session as any).customer.id;
      const systemData = {
        customerId,
        ...req.body
      };
      
      const newSystem = await storage.createCustomerSystemDetails(systemData);
      res.json(newSystem);
    } catch (error) {
      console.error("Error creating system details:", error);
      res.status(500).json({ message: "Failed to create system details" });
    }
  });

  app.put('/api/customer-portal/system-details/:id', isCustomerAuthenticated, async (req, res) => {
    try {
      const customerId = (req.session as any).customer.id;
      const systemId = parseInt(req.params.id);
      
      // Verify the system belongs to the customer
      const systems = await storage.getCustomerSystemDetails(customerId);
      const systemExists = systems.find(s => s.id === systemId);
      
      if (!systemExists) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedSystem = await storage.updateCustomerSystemDetails(systemId, req.body);
      res.json(updatedSystem);
    } catch (error) {
      console.error("Error updating system details:", error);
      res.status(500).json({ message: "Failed to update system details" });
    }
  });

  app.delete('/api/customer-portal/system-details/:id', isCustomerAuthenticated, async (req, res) => {
    try {
      const customerId = (req.session as any).customer.id;
      const systemId = parseInt(req.params.id);
      
      // Verify the system belongs to the customer
      const systems = await storage.getCustomerSystemDetails(customerId);
      const systemExists = systems.find(s => s.id === systemId);
      
      if (!systemExists) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteCustomerSystemDetails(systemId);
      res.json({ message: "System details deleted successfully" });
    } catch (error) {
      console.error("Error deleting system details:", error);
      res.status(500).json({ message: "Failed to delete system details" });
    }
  });

  // Admin system details routes
  app.get('/api/customers/:customerId/system-details', isAuthenticated, async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const systemDetails = await storage.getCustomerSystemDetails(customerId);
      res.json(systemDetails);
    } catch (error) {
      console.error("Error fetching customer system details:", error);
      res.status(500).json({ message: "Failed to fetch system details" });
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
      const userId = req.user.id;
      const tasks = await storage.getTasksByUser(userId);
      const recentTasks = tasks.slice(0, 5); // Get 5 most recent tasks
      res.json(recentTasks);
    } catch (error) {
      console.error("Error fetching recent tasks:", error);
      res.status(500).json({ message: "Failed to fetch recent tasks" });
    }
  });

  // Task routes
  app.get('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const { search, priority, status } = req.query;
      const userId = req.user.id;
      
      // Get current user to check role
      const currentUser = await storage.getUser(userId);
      
      let tasks;
      if (search) {
        tasks = await storage.searchTasks(search as string);
      } else {
        tasks = await storage.getAllTasks();
      }
      
      // Filter tasks based on user role
      if (currentUser?.role === 'field_engineer') {
        // Field engineers only see tasks assigned to them
        tasks = tasks.filter(task => task.fieldEngineerId === userId);
      } else if (currentUser?.role === 'engineer') {
        // Regular engineers see tasks assigned to them or unassigned tasks
        tasks = tasks.filter(task => 
          task.assignedTo === userId || 
          task.fieldEngineerId === userId ||
          (!task.assignedTo && !task.fieldEngineerId)
        );
      }
      // Admin and manager roles see all tasks (no filtering)
      
      // Apply other filters
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
      const userId = req.user.id;
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
        console.error("Task validation errors:", error.errors);
        console.error("Request body:", req.body);
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.put('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
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
      
      // Create audit trail for task update
      const notes = (req.body as any).notes;
      const oldStatus = currentTask.status;
      const newStatus = updateData.status;
      
      // Implement field engineer workflow automation before updating
      let automatedUpdate = false;
      const assignedUser = await storage.getUser(currentTask.assignedTo || '');
      
      // Check if assigned to field engineer
      if (assignedUser && assignedUser.role === 'field_engineer') {
        // Auto-resolve tasks when field engineer marks as resolved
        if (newStatus === 'resolved' && oldStatus !== 'resolved') {
          updateData.resolvedBy = userId;
          updateData.completionTime = new Date();
          
          // Auto-close resolved tasks after brief delay
          setTimeout(async () => {
            try {
              await storage.updateTask(id, { 
                status: 'completed',
                resolution: updateData.resolution || `Task automatically closed after resolution by field engineer on ${new Date().toISOString()}`
              });
              
              // Log auto-closure
              await storage.createTaskUpdate({
                taskId: id,
                updatedBy: 'system',
                updateType: 'status_change',
                oldValue: 'resolved',
                newValue: 'completed',
                note: 'Task automatically closed after resolution by field engineer',
              });
            } catch (error) {
              console.error('Error auto-closing task:', error);
            }
          }, 2000); // 2 second delay for auto-closure
          automatedUpdate = true;
        }
      }
      
      const task = await storage.updateTask(id, updateData);
      
      // Always log status updates (even if status doesn't change)
      if (newStatus) {
        const updateType = oldStatus !== newStatus ? 'status_change' : 'status_update';
        const updateNotes = oldStatus !== newStatus 
          ? notes || `Status changed from ${oldStatus} to ${newStatus}`
          : notes || `Status updated to ${newStatus}`;
          
        await storage.createTaskUpdate({
          taskId: id,
          updatedBy: userId,
          updateType: updateType,
          oldValue: oldStatus !== newStatus ? oldStatus : undefined,
          newValue: newStatus,
          note: updateNotes,
        });
      }
      
      // Log notes if provided without status update
      if (notes && !newStatus) {
        await storage.createTaskUpdate({
          taskId: id,
          updatedBy: userId,
          updateType: 'note_added',
          note: notes,
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
      const userId = req.user.id;
      const { files, notes } = req.body;
      
      if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ message: "No files provided" });
      }
      
      // Create file upload audit record
      await storage.createTaskUpdate({
        taskId,
        updatedBy: userId,
        updateType: 'file_uploaded',
        note: notes || `${files.length} file(s) uploaded`,
        attachments: files,
      });
      
      res.json({ message: "Files uploaded successfully", count: files.length });
    } catch (error) {
      console.error("Error uploading files:", error);
      res.status(500).json({ message: "Failed to upload files" });
    }
  });

  // Field engineer routes
  app.get('/api/field-engineers', isAuthenticated, async (req, res) => {
    try {
      const { region, skillSet } = req.query;
      const engineers = await storage.getAvailableFieldEngineers(
        region as string, 
        skillSet as string
      );
      res.json(engineers);
    } catch (error) {
      console.error("Error fetching field engineers:", error);
      res.status(500).json({ message: "Failed to fetch field engineers" });
    }
  });

  app.post('/api/tasks/:id/assign-field-engineer', isAuthenticated, async (req: any, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const userId = req.user.id;
      const { fieldEngineerId } = req.body;

      if (!fieldEngineerId) {
        return res.status(400).json({ message: "Field engineer ID is required" });
      }

      const task = await storage.assignTaskToFieldEngineer(taskId, fieldEngineerId, userId);
      res.json(task);
    } catch (error) {
      console.error("Error assigning field engineer:", error);
      res.status(500).json({ message: "Failed to assign field engineer" });
    }
  });

  // Multiple field engineer assignment with automatic task duplication
  app.post('/api/tasks/:id/assign-multiple-field-engineers', isAuthenticated, async (req: any, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const userId = req.user.id;
      const { fieldEngineerIds } = req.body;

      if (!fieldEngineerIds || !Array.isArray(fieldEngineerIds) || fieldEngineerIds.length === 0) {
        return res.status(400).json({ message: "At least one field engineer ID is required" });
      }

      const result = await storage.assignMultipleFieldEngineers(taskId, fieldEngineerIds, userId);
      res.json(result);
    } catch (error) {
      console.error("Error assigning multiple field engineers:", error);
      res.status(500).json({ message: "Failed to assign multiple field engineers" });
    }
  });

  app.post('/api/tasks/:id/field-status', isAuthenticated, async (req: any, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const userId = req.user.id;
      const { status, note } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const task = await storage.updateFieldTaskStatus(taskId, status, userId, note);
      res.json(task);
    } catch (error) {
      console.error("Error updating field task status:", error);
      res.status(500).json({ message: "Failed to update field task status" });
    }
  });

  app.post('/api/tasks/:id/complete', isAuthenticated, async (req: any, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const userId = req.user.id;
      const { completionNote, files } = req.body;

      if (!completionNote || completionNote.trim() === '') {
        return res.status(400).json({ message: "Completion note is required" });
      }

      const task = await storage.completeFieldTask(taskId, userId, completionNote, files);
      res.json(task);
    } catch (error) {
      console.error("Error completing field task:", error);
      res.status(500).json({ message: "Failed to complete field task" });
    }
  });

  app.get('/api/field-engineers/:id/tasks', isAuthenticated, async (req, res) => {
    try {
      const fieldEngineerId = req.params.id;
      const tasks = await storage.getFieldTasksByEngineer(fieldEngineerId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching field engineer tasks:", error);
      res.status(500).json({ message: "Failed to fetch field engineer tasks" });
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

  app.post('/api/users', isAuthenticated, async (req, res) => {
    try {
      const { id, username, password, email, firstName, lastName, phone, role } = req.body;
      
      if (!id || !username || !password || !email || !firstName || !lastName) {
        return res.status(400).json({ message: "ID, username, password, email, first name, and last name are required" });
      }
      
      // Check if user with this email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ 
          message: "A user with this email already exists",
          error: "DUPLICATE_EMAIL"
        });
      }
      
      // Check if user with this ID already exists
      const existingUserById = await storage.getUser(id);
      if (existingUserById) {
        return res.status(400).json({ 
          message: "A user with this ID already exists",
          error: "DUPLICATE_ID"
        });
      }

      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ 
          message: "A user with this username already exists",
          error: "DUPLICATE_USERNAME"
        });
      }
      
      // Hash the password using the same function as auth
      const authModule = await import("./auth.js");
      const hashedPassword = await authModule.hashPassword(password);
      
      const userData = {
        id,
        username,
        password: hashedPassword,
        email,
        firstName,
        lastName,
        phone,
        role: role || 'engineer',
        isActive: true,
      };
      
      const user = await storage.createUserWithPassword(userData);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      
      // Handle specific database constraint errors
      if ((error as any).code === '23505') {
        if ((error as any).constraint === 'users_email_unique') {
          return res.status(400).json({ 
            message: "A user with this email already exists",
            error: "DUPLICATE_EMAIL"
          });
        } else if ((error as any).constraint === 'users_pkey') {
          return res.status(400).json({ 
            message: "A user with this ID already exists",
            error: "DUPLICATE_ID"
          });
        }
      }
      
      res.status(500).json({ message: "Failed to create user" });
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

  app.put('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const currentUser = req.user;
      const { firstName, lastName, username, email, phone, role, department } = req.body;
      
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: "First name, last name, and email are required" });
      }
      
      // Check if email is being changed and if it conflicts with another user
      if (email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({ 
            message: "A user with this email already exists",
            error: "DUPLICATE_EMAIL"
          });
        }
      }
      
      // Check if username is being changed (only admins can change usernames)
      if (username && currentUser.role === 'admin') {
        const existingUsername = await storage.getUserByUsername(username);
        if (existingUsername && existingUsername.id !== id) {
          return res.status(400).json({ 
            message: "A user with this username already exists",
            error: "DUPLICATE_USERNAME"
          });
        }
      }
      
      const userData = {
        firstName,
        lastName,
        email,
        phone,
        role,
        department,
        updatedAt: new Date(),
        ...(username && currentUser.role === 'admin' && { username })
      };
      
      const user = await storage.updateUser(id, userData);
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      
      // Handle specific database constraint errors
      if ((error as any).code === '23505') {
        if ((error as any).constraint === 'users_email_unique') {
          return res.status(400).json({ 
            message: "A user with this email already exists",
            error: "DUPLICATE_EMAIL"
          });
        }
      }
      
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Reset password route (admin only)
  app.put('/api/users/:id/reset-password', isAuthenticated, async (req: any, res) => {
    try {
      // Check if current user is admin
      const currentUser = req.user;
      if (currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can reset passwords" });
      }

      const { id } = req.params;
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }
      
      // Hash the new password using the same function as auth
      const authModule = await import("./auth.js");
      const hashedPassword = await authModule.hashPassword(newPassword);
      
      // Update user password in storage
      const user = await storage.updateUser(id, { 
        password: hashedPassword,
        updatedAt: new Date()
      });
      
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/overview', isAuthenticated, async (req, res) => {
    try {
      const timeRange = parseInt(req.query.timeRange as string) || 30;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - timeRange);
      
      const analytics = await storage.getAnalyticsOverview(startDate, endDate);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics overview:", error);
      res.status(500).json({ message: "Failed to fetch analytics overview" });
    }
  });

  app.get('/api/analytics/performance', isAuthenticated, async (req, res) => {
    try {
      const timeRange = parseInt(req.query.timeRange as string) || 30;
      const metric = req.query.metric as string || 'completion_rate';
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - timeRange);
      
      const performanceData = await storage.getPerformanceAnalytics(startDate, endDate, metric);
      res.json(performanceData);
    } catch (error) {
      console.error("Error fetching performance analytics:", error);
      res.status(500).json({ message: "Failed to fetch performance analytics" });
    }
  });

  app.get('/api/analytics/trends', isAuthenticated, async (req, res) => {
    try {
      const timeRange = parseInt(req.query.timeRange as string) || 30;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - timeRange);
      
      const trendsData = await storage.getTrendsAnalytics(startDate, endDate);
      res.json(trendsData);
    } catch (error) {
      console.error("Error fetching trends analytics:", error);
      res.status(500).json({ message: "Failed to fetch trends analytics" });
    }
  });

  app.get('/api/analytics/engineers', isAuthenticated, async (req, res) => {
    try {
      const timeRange = parseInt(req.query.timeRange as string) || 30;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - timeRange);
      
      const engineerStats = await storage.getEngineerAnalytics(startDate, endDate);
      res.json(engineerStats);
    } catch (error) {
      console.error("Error fetching engineer analytics:", error);
      res.status(500).json({ message: "Failed to fetch engineer analytics" });
    }
  });

  app.get('/api/analytics/customers', isAuthenticated, async (req, res) => {
    try {
      const timeRange = parseInt(req.query.timeRange as string) || 30;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - timeRange);
      
      const customerStats = await storage.getCustomerAnalytics(startDate, endDate);
      res.json(customerStats);
    } catch (error) {
      console.error("Error fetching customer analytics:", error);
      res.status(500).json({ message: "Failed to fetch customer analytics" });
    }
  });

  // Domain management routes
  app.get('/api/domains', isAuthenticated, async (req, res) => {
    try {
      const domains = await storage.getAllDomains();
      res.json(domains);
    } catch (error) {
      console.error("Error fetching domains:", error);
      res.status(500).json({ message: "Failed to fetch domains" });
    }
  });

  app.post('/api/domains', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const domainData = {
        ...req.body,
        ownerId: userId,
      };
      
      const domain = await storage.createDomain(domainData);
      res.json(domain);
    } catch (error) {
      console.error("Error creating domain:", error);
      res.status(500).json({ message: "Failed to create domain" });
    }
  });

  app.put('/api/domains/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const domain = await storage.updateDomain(id, req.body);
      res.json(domain);
    } catch (error) {
      console.error("Error updating domain:", error);
      res.status(500).json({ message: "Failed to update domain" });
    }
  });

  app.delete('/api/domains/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDomain(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting domain:", error);
      res.status(500).json({ message: "Failed to delete domain" });
    }
  });

  // SQL Connections routes
  app.get('/api/sql-connections', isAuthenticated, async (req, res) => {
    try {
      const connections = await storage.getAllSqlConnections();
      // Don't send passwords in the response
      const safeConnections = connections.map(conn => ({
        ...conn,
        password: '***hidden***'
      }));
      res.json(safeConnections);
    } catch (error) {
      console.error("Error fetching SQL connections:", error);
      res.status(500).json({ message: "Failed to fetch SQL connections" });
    }
  });

  app.get('/api/sql-connections/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const connection = await storage.getSqlConnection(id);
      
      if (!connection) {
        return res.status(404).json({ message: "SQL connection not found" });
      }
      
      // Don't send password in the response
      const safeConnection = {
        ...connection,
        password: '***hidden***'
      };
      
      res.json(safeConnection);
    } catch (error) {
      console.error("Error fetching SQL connection:", error);
      res.status(500).json({ message: "Failed to fetch SQL connection" });
    }
  });

  app.post('/api/sql-connections', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const connectionData = {
        ...req.body,
        createdBy: userId,
      };
      
      const validatedData = insertSqlConnectionSchema.parse(connectionData);
      const connection = await storage.createSqlConnection(validatedData);
      
      // Don't send password in the response
      const safeConnection = {
        ...connection,
        password: '***hidden***'
      };
      
      res.status(201).json(safeConnection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid SQL connection data", errors: error.errors });
      }
      console.error("Error creating SQL connection:", error);
      res.status(500).json({ message: "Failed to create SQL connection" });
    }
  });

  app.put('/api/sql-connections/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertSqlConnectionSchema.partial().parse(req.body);
      const connection = await storage.updateSqlConnection(id, validatedData);
      
      // Don't send password in the response
      const safeConnection = {
        ...connection,
        password: '***hidden***'
      };
      
      res.json(safeConnection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid SQL connection data", errors: error.errors });
      }
      console.error("Error updating SQL connection:", error);
      res.status(500).json({ message: "Failed to update SQL connection" });
    }
  });

  app.delete('/api/sql-connections/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSqlConnection(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting SQL connection:", error);
      res.status(500).json({ message: "Failed to delete SQL connection" });
    }
  });

  app.post('/api/sql-connections/:id/test', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const testResult = await storage.testSqlConnection(id);
      res.json(testResult);
    } catch (error) {
      console.error("Error testing SQL connection:", error);
      res.status(500).json({ message: "Failed to test SQL connection" });
    }
  });

  // Migration routes
  app.post('/api/sql-connections/:id/migrate', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const connection = await storage.getSqlConnection(id);
      
      if (!connection) {
        return res.status(404).json({ message: "SQL connection not found" });
      }
      
      // Debug log the connection data to see what's stored
      console.log('Stored connection data:', {
        host: `"${connection.host}"`,
        username: `"${connection.username}"`,
        database: `"${connection.database}"`,
        hostLength: connection.host?.length,
        usernameLength: connection.username?.length,
        databaseLength: connection.database?.length
      });
      
      const migrationResult = await createTablesInExternalDatabase({
        host: connection.host,
        port: connection.port,
        database: connection.database,
        username: connection.username,
        password: connection.password,
        connectionType: connection.connectionType,
        sslEnabled: connection.sslEnabled || false
      });
      
      res.json(migrationResult);
    } catch (error) {
      console.error("Error running migration:", error);
      res.status(500).json({ message: "Failed to run migration" });
    }
  });

  app.post('/api/sql-connections/:id/seed', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const connection = await storage.getSqlConnection(id);
      
      if (!connection) {
        return res.status(404).json({ message: "SQL connection not found" });
      }
      
      const seedResult = await seedDefaultData({
        host: connection.host,
        port: connection.port,
        database: connection.database,
        username: connection.username,
        password: connection.password,
        connectionType: connection.connectionType,
        sslEnabled: connection.sslEnabled || false
      });
      
      res.json(seedResult);
    } catch (error) {
      console.error("Error seeding data:", error);
      res.status(500).json({ message: "Failed to seed data" });
    }
  });

  // Chat system routes - restricted to engineers only
  const isEngineer = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = req.user;
    if (!user || !['manager', 'backend_engineer', 'field_engineer', 'admin'].includes(user.role)) {
      return res.status(403).json({ message: "Access denied. Only engineers can access chat." });
    }
    
    next();
  };

  // Get all chat rooms for the current user
  app.get('/api/chat/rooms', isEngineer, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const rooms = await storage.getChatRooms(userId);
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
      res.status(500).json({ message: "Failed to fetch chat rooms" });
    }
  });

  // Create a new chat room
  app.post('/api/chat/rooms', isEngineer, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const roomData = {
        ...req.body,
        createdBy: userId,
      };
      
      const validatedData = insertChatRoomSchema.parse(roomData);
      const room = await storage.createChatRoom(validatedData);
      
      // Add creator as admin participant
      const participantData = {
        roomId: room.id,
        userId: userId,
        role: 'admin'
      };
      await storage.addChatParticipant(participantData);
      
      res.status(201).json(room);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid chat room data", errors: error.errors });
      }
      console.error("Error creating chat room:", error);
      res.status(500).json({ message: "Failed to create chat room" });
    }
  });

  // Get messages for a specific room
  app.get('/api/chat/rooms/:roomId/messages', isEngineer, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const userId = (req.user as any)?.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Check if user is participant of this room
      const isParticipant = await storage.isChatParticipant(roomId, userId);
      if (!isParticipant) {
        return res.status(403).json({ message: "Access denied. You are not a participant of this room." });
      }
      
      const messages = await storage.getChatMessages(roomId, limit, offset);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  // Send a message to a room
  app.post('/api/chat/rooms/:roomId/messages', isEngineer, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const userId = (req.user as any)?.id;
      
      // Check if user is participant of this room
      const isParticipant = await storage.isChatParticipant(roomId, userId);
      if (!isParticipant) {
        return res.status(403).json({ message: "Access denied. You are not a participant of this room." });
      }
      
      const messageData = {
        roomId,
        senderId: userId,
        ...req.body
      };
      
      const validatedData = insertChatMessageSchema.parse(messageData);
      const message = await storage.createChatMessage(validatedData);
      
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Join a chat room
  app.post('/api/chat/rooms/:roomId/join', isEngineer, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const userId = (req.user as any)?.id;
      
      const participantData = {
        roomId,
        userId,
        role: 'member'
      };
      
      const validatedData = insertChatParticipantSchema.parse(participantData);
      await storage.addChatParticipant(validatedData);
      
      res.status(201).json({ message: "Successfully joined the room" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid participant data", errors: error.errors });
      }
      console.error("Error joining room:", error);
      res.status(500).json({ message: "Failed to join room" });
    }
  });

  // Add a specific user to a chat room (for direct chats)
  app.post('/api/chat/rooms/:roomId/add-participant', isEngineer, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const { userId } = req.body;
      const currentUserId = (req.user as any)?.id;
      
      // Check if current user is participant of this room
      const isParticipant = await storage.isChatParticipant(roomId, currentUserId);
      if (!isParticipant) {
        return res.status(403).json({ message: "Access denied. You are not a participant of this room." });
      }
      
      const participantData = {
        roomId,
        userId,
        role: 'member'
      };
      
      const validatedData = insertChatParticipantSchema.parse(participantData);
      await storage.addChatParticipant(validatedData);
      
      res.status(201).json({ message: "Successfully added participant to the room" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid participant data", errors: error.errors });
      }
      console.error("Error adding participant:", error);
      res.status(500).json({ message: "Failed to add participant" });
    }
  });

  // Leave a chat room
  app.post('/api/chat/rooms/:roomId/leave', isEngineer, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const userId = (req.user as any)?.id;
      
      await storage.removeChatParticipant(roomId, userId);
      res.json({ message: "Successfully left the room" });
    } catch (error) {
      console.error("Error leaving room:", error);
      res.status(500).json({ message: "Failed to leave room" });
    }
  });

  // Get room participants
  app.get('/api/chat/rooms/:roomId/participants', isEngineer, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const userId = (req.user as any)?.id;
      
      // Check if user is participant of this room
      const isParticipant = await storage.isChatParticipant(roomId, userId);
      if (!isParticipant) {
        return res.status(403).json({ message: "Access denied. You are not a participant of this room." });
      }
      
      const participants = await storage.getChatParticipants(roomId);
      res.json(participants);
    } catch (error) {
      console.error("Error fetching participants:", error);
      res.status(500).json({ message: "Failed to fetch participants" });
    }
  });

  // Customer Portal Authentication Routes
  app.post('/api/customer/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      console.log("Customer login attempt:", { username, passwordLength: password?.length });
      
      if (!username || !password) {
        console.log("Missing credentials");
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const customer = await storage.getCustomerByUsername(username);
      console.log("Customer found:", customer ? { id: customer.id, username: customer.username, portalAccess: customer.portalAccess } : "No customer found");
      
      if (!customer || !customer.portalAccess) {
        console.log("Customer not found or portal access denied");
        return res.status(401).json({ message: "Invalid credentials or portal access denied" });
      }
      
      // Verify password (in production, use proper password hashing)
      console.log("Password check:", { provided: password, stored: customer.password, match: customer.password === password });
      if (customer.password !== password) {
        console.log("Password mismatch");
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Store customer session
      (req.session as any).customer = {
        id: customer.id,
        customerId: customer.customerId,
        name: customer.name,
        username: customer.username,
        email: customer.email,
        contactPerson: customer.contactPerson,
        mobilePhone: customer.mobilePhone,
        address: customer.address,
        city: customer.city,
        state: customer.state
      };
      
      // Return customer data (without password)
      const { password: _, ...customerData } = customer;
      console.log("Customer login successful:", customerData.id, "Session stored");
      res.json(customerData);
    } catch (error) {
      console.error("Customer login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get customer tasks
  app.get('/api/customer/:customerId/tasks', async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const tasks = await storage.getTasksByCustomer(customerId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching customer tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  // Get task comments (customer view - excluding internal comments)
  app.get('/api/tasks/:taskId/comments', async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const comments = await storage.getTaskComments(taskId);
      
      // Filter out internal comments for customer view
      const customerComments = comments.filter(comment => !comment.isInternal);
      res.json(customerComments);
    } catch (error) {
      console.error("Error fetching task comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Add customer comment
  app.post('/api/customer/comments', async (req, res) => {
    try {
      const { taskId, customerId, comment } = req.body;
      
      if (!taskId || !customerId || !comment) {
        return res.status(400).json({ message: "Task ID, customer ID, and comment are required" });
      }
      
      const commentData = {
        taskId,
        customerId,
        comment,
        isInternal: false,
        attachments: [],
      };
      
      const newComment = await storage.createCustomerComment(commentData);
      res.status(201).json(newComment);
    } catch (error) {
      console.error("Error creating customer comment:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  // Update customer portal access
  app.patch('/api/customers/:customerId/portal-access', isAuthenticated, async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const { username, password, portalAccess } = req.body;
      
      console.log("Updating portal access for customer:", customerId, { username, portalAccess });
      
      const updatedCustomer = await storage.updateCustomerPortalAccess(customerId, {
        username,
        password,
        portalAccess
      });
      
      console.log("Portal access updated successfully:", updatedCustomer.id);
      res.json(updatedCustomer);
    } catch (error) {
      console.error("Error updating customer portal access:", error);
      res.status(500).json({ message: "Failed to update portal access", error: error.message });
    }
  });

  // Office locations and tracking endpoints
  app.get("/api/tracking/office-locations", isAuthenticated, async (req, res) => {
    try {
      const offices = await storage.getOfficeLocations();
      res.json(offices);
    } catch (error) {
      console.error("Error fetching office locations:", error);
      res.status(500).json({ message: "Failed to fetch office locations" });
    }
  });

  app.post("/api/tracking/office-locations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin' && user?.role !== 'manager') {
        return res.status(403).json({ message: "Only administrators can create office locations" });
      }

      const office = await storage.createOfficeLocation(req.body);
      res.json(office);
    } catch (error) {
      console.error("Error creating office location:", error);
      res.status(500).json({ message: "Failed to create office location" });
    }
  });

  app.patch("/api/tracking/office-locations/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin' && user?.role !== 'manager') {
        return res.status(403).json({ message: "Only administrators can update office locations" });
      }

      const officeId = parseInt(req.params.id);
      const office = await storage.updateOfficeLocation(officeId, req.body);
      res.json(office);
    } catch (error) {
      console.error("Error updating office location:", error);
      res.status(500).json({ message: "Failed to update office location" });
    }
  });

  app.delete("/api/tracking/office-locations/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin' && user?.role !== 'manager') {
        return res.status(403).json({ message: "Only administrators can delete office locations" });
      }

      const officeId = parseInt(req.params.id);
      await storage.deleteOfficeLocation(officeId);
      res.json({ message: "Office location deleted successfully" });
    } catch (error) {
      console.error("Error deleting office location:", error);
      res.status(500).json({ message: "Failed to delete office location" });
    }
  });

  app.get("/api/tracking/main-office", isAuthenticated, async (req, res) => {
    try {
      const mainOffice = await storage.getMainOffice();
      res.json(mainOffice);
    } catch (error) {
      console.error("Error fetching main office:", error);
      res.status(500).json({ message: "Failed to fetch main office" });
    }
  });

  // Office location suggestions based on team distribution
  app.post("/api/tracking/office-suggestions/generate", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Only administrators can generate office location suggestions" });
      }

      const suggestions = await storage.generateOfficeLocationSuggestions();
      res.json(suggestions);
    } catch (error) {
      console.error("Error generating office location suggestions:", error);
      res.status(500).json({ message: "Failed to generate office location suggestions" });
    }
  });

  // Get office location suggestions
  app.get("/api/tracking/office-suggestions", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Only administrators can view office location suggestions" });
      }

      const suggestions = await storage.getOfficeLocationSuggestions();
      res.json(suggestions);
    } catch (error) {
      console.error("Error fetching office location suggestions:", error);
      res.status(500).json({ message: "Failed to fetch office location suggestions" });
    }
  });

  // Engineer tracking history endpoints
  app.get("/api/tracking/history/:userId", isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const { limit } = req.query;
      const trackingHistory = await storage.getEngineerTrackingHistory(
        userId, 
        limit ? parseInt(limit as string) : 100
      );
      res.json(trackingHistory);
    } catch (error) {
      console.error("Error fetching tracking history:", error);
      res.status(500).json({ message: "Failed to fetch tracking history" });
    }
  });

  app.post("/api/tracking/location", isAuthenticated, async (req, res) => {
    try {
      const trackingData = req.body;
      
      // Calculate distance from office if coordinates provided
      if (trackingData.latitude && trackingData.longitude) {
        const mainOffice = await storage.getMainOffice();
        if (mainOffice) {
          const distance = calculateDistance(
            parseFloat(trackingData.latitude),
            parseFloat(trackingData.longitude),
            parseFloat(mainOffice.latitude),
            parseFloat(mainOffice.longitude)
          );
          trackingData.distanceFromOffice = distance.toFixed(2);
        }
      }

      const tracking = await storage.createTrackingHistoryEntry(trackingData);
      res.json(tracking);
    } catch (error) {
      console.error("Error creating tracking entry:", error);
      res.status(500).json({ message: "Failed to create tracking entry" });
    }
  });

  app.get("/api/tracking/task/:taskId", isAuthenticated, async (req, res) => {
    try {
      const { taskId } = req.params;
      const trackingHistory = await storage.getTrackingHistoryByTask(parseInt(taskId));
      res.json(trackingHistory);
    } catch (error) {
      console.error("Error fetching task tracking history:", error);
      res.status(500).json({ message: "Failed to fetch task tracking history" });
    }
  });

  app.get("/api/tracking/stats/:userId", isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;
      
      const stats = await storage.getTrackingStatsByUser(
        userId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(stats);
    } catch (error) {
      console.error("Error fetching tracking stats:", error);
      res.status(500).json({ message: "Failed to fetch tracking stats" });
    }
  });

  // Utility function to calculate distance between two coordinates
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  }

  function toRadians(degrees: number): number {
    return degrees * (Math.PI/180);
  }

  const httpServer = createServer(app);
  return httpServer;
}
