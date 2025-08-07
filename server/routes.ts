import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import fs from "fs";
import { storage } from "./storage/mssql-storage";
import { setupAuth } from "./auth";
import { seedDatabase } from "./seed";
import passport from "passport";
import { setupRoutes } from "./setup-routes";
import { 
  insertTaskSchema, 
  insertCustomerSchema, 
  insertPerformanceMetricsSchema,
  insertSqlConnectionSchema,
  insertChatRoomSchema,
  insertChatMessageSchema,
  insertChatParticipantSchema,
  insertBotConfigurationSchema,
  insertNotificationLogSchema
} from "@shared/schema";
import { z } from "zod";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { createTablesInExternalDatabase, seedDefaultData } from "./migrations";
import multer from "multer";
import { setupHealthEndpoint } from "./health";
import { loadDatabaseConfig, isDatabaseInitialized } from "./database/mssql-connection";
import mobileAuthRoutes from "./routes/mobile-auth";

// SQL Server sync helper function
async function syncUserToSqlServer(user: any, connection: any) {
  try {
    const mssql = await import('mssql');
    const { ConnectionPool } = mssql.default || mssql;
    
    // Parse host and port - SQL Server uses comma format like "14.102.70.90,1433"
    let server = connection.host.trim();
    let port = connection.port;
    
    // If host contains comma, split it for SQL Server format
    if (server.includes(',')) {
      const parts = server.split(',');
      server = parts[0].trim();
      port = parseInt(parts[1].trim()) || port;
    }
    
    const config = {
      server: server,
      port: port,
      database: connection.database.trim(),
      user: connection.username.trim(),
      password: connection.password.trim(),
      options: {
        encrypt: connection.sslEnabled,
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
    
    console.log(`Connecting to SQL Server for user sync: ${server},${port}`);
    const pool = new ConnectionPool(config);
    await pool.connect();
    
    // Insert user into SQL Server
    const insertQuery = `
      INSERT INTO users (id, username, password, email, firstName, lastName, phone, profileImageUrl, role, department, isActive, createdAt, updatedAt)
      VALUES (@id, @username, @password, @email, @firstName, @lastName, @phone, @profileImageUrl, @role, @department, @isActive, GETDATE(), GETDATE())
    `;
    
    const request = pool.request()
      .input('id', user.id)
      .input('username', user.username)
      .input('password', user.password)
      .input('email', user.email)
      .input('firstName', user.firstName)
      .input('lastName', user.lastName)
      .input('phone', user.phone || null)
      .input('profileImageUrl', user.profileImageUrl || null)
      .input('role', user.role)
      .input('department', user.department || 'WIZONE HELP DESK')
      .input('isActive', user.isActive);
    
    await request.query(insertQuery);
    await pool.close();
    
    console.log(`User ${user.username} synced to SQL Server successfully`);
  } catch (error) {
    console.error('SQL Server user sync error:', error);
    throw error;
  }
}

// Notification helper function
async function sendTaskNotification(task: any, eventType: string) {
  try {
    console.log(`=== SENDING NOTIFICATION ===`);
    console.log(`Event Type: ${eventType}`);
    console.log(`Task ID: ${task.id}`);
    console.log(`Task Title: ${task.title}`);
    
    // Get all active bot configurations
    const botConfigs = await storage.getAllBotConfigurations();
    console.log(`Found ${botConfigs.length} bot configurations`);
    
    // Filter for enabled configurations based on event type
    const enabledConfigs = botConfigs.filter(config => {
      console.log(`Checking config ${config.id}: isActive=${config.isActive}, notifyOnTaskCreate=${config.notifyOnTaskCreate}, notifyOnTaskUpdate=${config.notifyOnTaskUpdate}`);
      if (!config.isActive) return false;
      
      switch (eventType) {
        case 'task_create':
          return config.notifyOnTaskCreate;
        case 'task_update':
          return config.notifyOnTaskUpdate;
        case 'task_complete':
          return config.notifyOnTaskComplete;
        case 'task_assign':
          return config.notifyOnTaskAssign;
        default:
          return false;
      }
    });
    
    console.log(`Found ${enabledConfigs.length} enabled configurations for event ${eventType}`);
    
    // Send notification for each enabled configuration
    for (const config of enabledConfigs) {
      try {
        if (config.botType === 'telegram' && config.telegramBotToken && config.telegramChatId) {
          const customer = await storage.getCustomer(task.customerId);
          const assignedUser = await storage.getUser(task.assignedTo);
          
          // Get field engineer if task is assigned to field
          let fieldEngineer = null;
          if (task.fieldEngineerId) {
            fieldEngineer = await storage.getUser(task.fieldEngineerId);
          }
          
          console.log(`Task ${task.id} - fieldEngineerId: ${task.fieldEngineerId}, status: ${task.status}`);
          console.log(`Field Engineer:`, fieldEngineer ? `${fieldEngineer.firstName} ${fieldEngineer.lastName}` : 'None');
          
          // Create notification message based on event type
          let message = '';
          
          switch (eventType) {
            case 'task_create':
              message = `🔔 *New Task Created*\n\n`;
              break;
            case 'task_update':
              message = `📝 *Task Updated*\n\n`;
              break;
            case 'task_complete':
              message = `✅ *Task Completed*\n\n`;
              break;
            case 'task_assign':
              message = `👨‍💻 *Task Assigned*\n\n`;
              break;
            default:
              message = `🔔 *Task Notification*\n\n`;
          }
          
          // Escape special characters for Markdown
          const escapeMarkdown = (text) => {
            if (!text) return text;
            return text.toString().replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
          };
          
          message += `📋 *Task:* ${escapeMarkdown(task.title)}\n`;
          message += `🎫 *Ticket:* ${escapeMarkdown(task.ticketNumber)}\n`;
          message += `👤 *Customer:* ${escapeMarkdown(customer?.name || 'Unknown')}\n`;
          
          // Show field engineer if task has field engineer assigned
          if (fieldEngineer) {
            message += `👨‍💻 *Backend Engineer:* ${escapeMarkdown(assignedUser?.firstName)} ${escapeMarkdown(assignedUser?.lastName)}\n`;
            message += `🔧 *Field Engineer:* ${escapeMarkdown(fieldEngineer?.firstName)} ${escapeMarkdown(fieldEngineer?.lastName)}\n`;
          } else {
            message += `👨‍💻 *Assigned To:* ${escapeMarkdown(assignedUser?.firstName)} ${escapeMarkdown(assignedUser?.lastName)}\n`;
          }
          
          message += `⚡ *Priority:* ${escapeMarkdown(task.priority?.toUpperCase())}\n`;
          
          if (eventType === 'task_create') {
            message += `🔧 *Issue Type:* ${escapeMarkdown(task.issueType)}\n`;
            message += `📝 *Description:* ${escapeMarkdown(task.description)}\n`;
            message += `📅 *Created:* ${escapeMarkdown(new Date(task.createdAt).toLocaleString())}`;
          } else if (eventType === 'task_update') {
            message += `📊 *Current Status:* ${escapeMarkdown(task.status?.replace(/_/g, ' ').toUpperCase())}\n`;
            message += `📅 *Last Updated:* ${escapeMarkdown(new Date(task.updatedAt || task.createdAt).toLocaleString())}`;
            
            // Add special message for field assignments
            if (fieldEngineer && (task.status === 'assigned_to_field' || task.status === 'start_task' || task.status.includes('field'))) {
              message += `\n🚀 *Task is being handled by field engineer*`;
            }
          } else if (eventType === 'task_complete') {
            message += `📊 *Status:* COMPLETED\n`;
            message += `✅ *Completed:* ${escapeMarkdown(new Date().toLocaleString())}`;
            if (task.resolution) {
              message += `\n📄 *Resolution:* ${escapeMarkdown(task.resolution)}`;
            }
          }
          
          // Send to Telegram
          const response = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: config.telegramChatId,
              text: message,
              parse_mode: 'Markdown',
            }),
          });
          
          const result = await response.json();
          
          // Log the notification
          await storage.createNotificationLog({
            configId: config.id,
            eventType: eventType,
            taskId: task.id,
            customerId: task.customerId,
            userId: task.assignedTo,
            messageText: message,
            messageTemplateUsed: `default_${eventType}`,
            status: result.ok ? 'sent' : 'failed',
            responseData: result,
            errorMessage: result.ok ? undefined : result.description,
            sentAt: result.ok ? new Date() : undefined,
          });
          
          console.log(`Telegram notification sent for task ${task.ticketNumber}:`, result.ok ? 'SUCCESS' : 'FAILED');
          if (!result.ok) {
            console.error(`Telegram API Error:`, result);
          }
        }
      } catch (configError) {
        console.error(`Error sending notification for config ${config.id}:`, configError);
        
        // Log failed notification
        await storage.createNotificationLog({
          configId: config.id,
          eventType: eventType,
          taskId: task.id,
          customerId: task.customerId,
          userId: task.assignedTo,
          messageText: 'Failed to send notification',
          status: 'failed',
          errorMessage: configError.message,
        });
      }
    }
  } catch (error) {
    console.error('Error in sendTaskNotification:', error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Check if database is configured and initialized
  const dbConfig = await loadDatabaseConfig();
  const isInitialized = dbConfig ? await isDatabaseInitialized() : false;
  
  // Setup routes for database configuration
  app.use('/api/setup', setupRoutes);
  
  // If database is not configured, serve setup wizard
  if (!dbConfig || !isInitialized) {
    console.log('Database not configured, serving setup wizard');
    
    // Serve setup page for all non-API routes
    app.get('/setup*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist/public/setup.html'));
    });
    
    // Redirect all other routes to setup
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/setup')) {
        return; // Let API routes pass through
      }
      res.redirect('/setup');
    });
    
    const httpServer = createServer(app);
    return httpServer;
  }
  
  console.log('✅ Database configured and initialized - serving main application');
  // Configure multer for file uploads
  const upload = multer({
    dest: 'uploads/',
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
      }
    }
  });

  // Setup health endpoints for mobile APK network detection
  setupHealthEndpoint(app);

  // Authentication setup
  setupAuth(app);

  // === AUTHENTICATION ROUTES ===
  
  // Login route for both web and mobile
  app.post('/api/auth/login', async (req, res, next) => {
    const userAgent = req.get('User-Agent') || '';
    const isMobileApp = userAgent.includes('WizoneFieldEngineerApp') || 
                       req.get('X-Mobile-App') === 'true' ||
                       req.get('X-Requested-With') === 'mobile';
    
    console.log(`🔐 Login attempt: ${req.body.username}`);
    console.log(`📱 User Agent: ${userAgent}`);
    console.log(`🌐 Origin: ${req.get('Origin')}`);
    
    if (isMobileApp) {
      console.log('💻 MOBILE APK REQUEST - Using passport authentication');
    } else {
      console.log('💻 WEB REQUEST - Using passport authentication');
    }
    
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        console.error('Authentication error:', err);
        return res.status(500).json({ message: 'Authentication error' });
      }
      
      if (!user) {
        console.log(`❌ Authentication failed for: ${req.body.username}`);
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error('Login error:', loginErr);
          return res.status(500).json({ message: 'Login failed' });
        }
        
        if (isMobileApp) {
          console.log('✅ Mobile APK login successful for:', user.username);
        } else {
          console.log('✅ Web login successful for:', user.username);
        }
        
        // Return user data for both web and mobile
        return res.json({
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          department: user.department,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        });
      });
    })(req, res, next);
  });

  // Logout route
  app.post('/api/auth/logout', (req, res) => {
    req.logout(() => {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
          return res.status(500).json({ message: 'Logout failed' });
        }
        res.clearCookie('wizone.session');
        res.json({ message: 'Logged out successfully' });
      });
    });
  });

  // Get current user route
  app.get('/api/auth/user', (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      console.log('❌ Unauthenticated request to /api/auth/user');
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const userAgent = req.get('User-Agent') || '';
    const isMobileApp = userAgent.includes('WizoneFieldEngineerApp') || 
                       req.get('X-Mobile-App') === 'true' ||
                       req.get('X-Requested-With') === 'mobile';
    
    if (isMobileApp) {
      console.log('✅ Mobile APK authenticated user request');
    }
    
    res.json({
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      role: req.user.role,
      department: req.user.department,
      isActive: req.user.isActive,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt
    });
  });

  // Health endpoint for mobile APK connectivity testing
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      service: 'Wizone Task Manager',
      version: '2.0'
    });
  });

  // Mobile-specific authentication and debugging endpoints
  app.get('/api/mobile/connectivity-test', (req, res) => {
    const userAgent = req.get('user-agent') || '';
    const isMobile = userAgent.includes('WizoneFieldEngineerApp') || req.get('X-Mobile-APK') === 'true';
    
    console.log('📱 Mobile connectivity test:', {
      userAgent: userAgent.substring(0, 100),
      headers: {
        'X-Requested-With': req.get('X-Requested-With'),
        'X-Mobile-Debug': req.get('X-Mobile-Debug'),
        'X-APK-Version': req.get('X-APK-Version'),
        'X-Mobile-APK': req.get('X-Mobile-APK')
      },
      session: req.session ? 'exists' : 'missing',
      auth: req.isAuthenticated ? req.isAuthenticated() : false
    });
    
    res.json({
      status: 'connected',
      message: 'Mobile connectivity test successful',
      timestamp: new Date().toISOString(),
      mobile_detected: isMobile,
      session_status: req.session ? 'exists' : 'missing',
      auth_status: req.isAuthenticated ? (req.isAuthenticated() ? 'authenticated' : 'not_authenticated') : 'no_auth'
    });
  });
  
  app.post('/api/mobile/connectivity-test', (req, res) => {
    const userAgent = req.get('user-agent') || '';
    console.log('📱 POST Mobile connectivity test:', {
      userAgent: userAgent.substring(0, 100),
      body: req.body,
      session: req.session ? 'exists' : 'missing'
    });
    
    res.json({
      status: 'connected',
      message: 'Mobile POST connectivity test successful',
      timestamp: new Date().toISOString(),
      received_data: req.body
    });
  });

  // Register mobile auth routes for field engineer APK
  app.use(mobileAuthRoutes);

  // Serve APK generation page
  app.get("/generate-apk", (req, res) => {
    res.sendFile(path.join(process.cwd(), "generate-instant-apk.html"));
  });

  // Serve static files from uploads directory for downloads
  app.use('/downloads', express.static('uploads'));

  // APK download endpoint
  app.get('/api/download/apk', (req, res) => {
    const filePath = path.join(process.cwd(), 'uploads', 'Wizone-APK-Package.tar.gz');
    
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'APK package not found' });
      }
      
      res.setHeader('Content-Type', 'application/gzip');
      res.setHeader('Content-Disposition', 'attachment; filename="Wizone-APK-Package.tar.gz"');
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      fileStream.on('error', (err) => {
        console.error('APK download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Download failed' });
        }
      });
    } catch (error) {
      console.error('APK download error:', error);
      res.status(500).json({ message: 'Download failed' });
    }
  });
  
  // Auth middleware
  setupAuth(app);
  
  // Add mobile authentication routes
  app.use(mobileAuthRoutes);

  // Skip user seeding for Windows compatibility
  console.log("User seeding skipped for Windows compatibility");





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
      const customer = (req.session as any).customer;
      const customerId = customer.id;
      const customerName = customer.name || customer.customerId || 'Unknown Customer';
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
        customerName, // Add customer name for proper display
        status: "pending",
        assignedTo: null, // Will be assigned by admin later
        createdBy: "admin001" // Use admin user ID for customer-created tasks
      };
      
      console.log("Customer creating task:", { customerId, customerName, title, priority, issueType });
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

  // Customer task update endpoint (POST)
  app.post('/api/customer-portal/tasks/:taskId/update', isCustomerAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const customerId = (req.session as any).customer.id;
      const { comment, status, priority } = req.body;
      
      console.log('🔄 Customer task update (POST):', { taskId, customerId, comment, status, priority });
      
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
      const adminUsers = await storage.getAllUsers();
      const systemAdmin = adminUsers.find(user => user.role === 'admin') || adminUsers[0];
      
      await storage.createTaskUpdate({
        taskId,
        updatedBy: systemAdmin?.id || 'admin_1753865311290', // Use system admin for customer updates
        updateType: 'note_added',
        note: `[Customer Update] ${comment || `Priority: ${priority || 'unchanged'}, Status: ${status || 'unchanged'}`}`
      });
      
      console.log("✅ Customer task update successful:", { customerId, taskId, comment, priority, status });
      res.json({ message: "Task updated successfully" });
    } catch (error) {
      console.error("❌ Customer task update (POST) error:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Customer task update endpoint (PUT) - for direct task updates
  app.put('/api/customer-portal/tasks/:taskId', isCustomerAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const customerId = (req.session as any).customer.id;
      const { comment, status, priority, notes } = req.body;
      
      console.log('🔄 Customer task update (PUT):', { taskId, customerId, comment, status, priority, notes });
      
      // Verify task belongs to customer
      const task = await storage.getTask(taskId);
      if (!task || task.customerId !== customerId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Update task if priority or status changed
      const updateData: any = {};
      
      if (priority && priority !== task.priority) {
        updateData.priority = priority;
      }
      
      // Customer can only set status to certain values
      if (status && ['pending', 'cancelled'].includes(status) && status !== task.status) {
        updateData.status = status;
      }
      
      // Update task if there are changes
      if (Object.keys(updateData).length > 0) {
        await storage.updateTask(taskId, updateData);
      }
      
      // Add the update record with comment/notes
      const adminUsers = await storage.getAllUsers();
      const systemAdmin = adminUsers.find(user => user.role === 'admin') || adminUsers[0];
      const updateNote = notes || comment || `Priority: ${priority || 'unchanged'}, Status: ${status || 'unchanged'}`;
      
      await storage.createTaskUpdate({
        taskId,
        updatedBy: systemAdmin?.id || 'admin_1753865311290', // Use system admin for customer updates
        updateType: 'note_added',
        note: `[Customer Update] ${updateNote}`
      });
      
      // Get updated task to return
      const updatedTask = await storage.getTask(taskId);
      
      console.log("✅ Customer task update (PUT) successful:", { customerId, taskId, updateData });
      res.json(updatedTask);
    } catch (error) {
      console.error('❌ Customer task update (PUT) error:', error);
      res.status(500).json({ message: 'Failed to update task' });
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



  // Enhanced Authentication middleware - handles both web sessions and mobile authentication
  const isAuthenticated = async (req: any, res: any, next: any) => {
    try {
      // Log all authentication attempts for debugging
      const userAgent = req.get('user-agent') || '';
      const isMobile = userAgent.includes('Mobile') || userAgent.includes('WizoneFieldEngineerApp') || userAgent.includes('WebView');
      
      if (isMobile) {
        console.log(`📱 MOBILE AUTH CHECK: ${req.method} ${req.path}`);
        console.log(`📱 User-Agent: ${userAgent.substring(0, 100)}`);
        console.log(`📱 Has Session: ${!!req.session}`);
        console.log(`📱 Session User: ${req.session?.user ? 'YES' : 'NO'}`);
        console.log(`📱 Passport User: ${req.user ? 'YES' : 'NO'}`);
      }
      
      // Check if user is authenticated via Passport session
      if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        console.log(`✅ Passport authenticated: ${req.user.username} (${req.user.role}) - ${req.method} ${req.path}`);
        return next();
      }
      
      // Check if user is authenticated via session (fallback)
      if (req.session && req.session.user) {
        req.user = req.session.user;
        console.log(`✅ Session authenticated: ${req.user.username} (${req.user.role}) - ${req.method} ${req.path}`);
        return next();
      }
      
      // Mobile/WebView authentication - check User-Agent and Origin
      const origin = req.get('Origin');
      const referer = req.get('Referer') || '';
      
      const isMobileRequest = userAgent.includes('Mobile') || 
                             userAgent.includes('WebView') || 
                             userAgent.includes('WizoneApp') || 
                             userAgent.includes('Android') ||
                             origin === null || 
                             origin === 'file://' || 
                             referer.includes('file://') ||
                             req.get('X-Requested-With') === 'mobile';
      
      if (isMobileRequest) {
        console.log(`📱 Mobile request detected for ${req.method} ${req.path} - User-Agent: ${userAgent.substring(0, 50)}...`);
        
        // For mobile requests without authentication, allow limited access to auth endpoints
        if (req.path.includes('/api/auth/') || req.path === '/api/auth/user') {
          console.log(`📱 Allowing mobile access to auth endpoint: ${req.path}`);
          return next();
        }
        
        // For other mobile API requests, check if there's any user session or create temporary
        if (req.session && req.session.user) {
          req.user = req.session.user;
          console.log(`📱 Mobile session found: ${req.user.username}`);
          return next();
        }
        
        // Allow field engineer endpoints for mobile with temporary user
        if (req.path.includes('field-engineers') || req.path.includes('tasks')) {
          req.user = { id: 'mobile_temp', username: 'mobile', role: 'field_engineer', isMobile: true };
          console.log(`📱 Mobile field engineer access granted to: ${req.path}`);
          return next();
        }
      }
      
      console.log(`❌ Authentication failed for ${req.method} ${req.path}`);
      console.log(`   - Session exists: ${!!req.session}`);
      console.log(`   - Session user: ${!!req.session?.user}`);
      console.log(`   - Passport authenticated: ${req.isAuthenticated ? req.isAuthenticated() : 'N/A'}`);
      console.log(`   - User-Agent: ${userAgent.substring(0, 50)}...`);
      
      return res.status(401).json({ message: "Unauthorized" });
    } catch (error) {
      console.error('Authentication middleware error:', error);
      return res.status(500).json({ message: "Authentication error" });
    }
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
      const userId = req.user?.id;
      if (!userId || userId === 'undefined' || userId === 'null' || userId === 'NaN') {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // For field engineers, get their assigned tasks, for others get all recent tasks
      const userRole = req.user?.role;
      let tasks;
      
      if (userRole === 'field_engineer') {
        tasks = await storage.getTasksByUser(userId);
      } else {
        tasks = await storage.getAllTasks();
      }
      
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

  // Engineer portal route - filter tasks by logged-in user (must be before /api/tasks/:id)
  app.get('/api/tasks/my-tasks', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId || userId === 'undefined' || userId === 'null' || userId === 'NaN' || userId === undefined) {
        return res.status(400).json({ message: "Invalid user ID", debug: { userId, type: typeof userId } });
      }
      
      console.log("=== MY-TASKS API CALL ===");
      console.log("User ID:", userId);
      console.log("User role:", (req.user as any)?.role);
      
      const userTasks = await storage.getAllTasks({ assignedTo: userId, fieldEngineerId: userId });
      console.log("Tasks retrieved:", userTasks.length);
      
      if (userTasks.length > 0) {
        console.log("First task:", JSON.stringify(userTasks[0], null, 2));
      }
      console.log("=== MY-TASKS API END ===");
      
      res.json(userTasks);
    } catch (error) {
      console.error("Error fetching my-tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks", error: error.message });
    }
  });

  app.get('/api/tasks/:id', isAuthenticated, async (req, res) => {
    try {
      console.log("GET /api/tasks/:id called with ID:", req.params.id);
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        console.log("Invalid task ID, returning 400");
        return res.status(400).json({ message: "Invalid task ID" });
      }
      const task = await storage.getTask(id);
      
      if (!task) {
        console.log("Task not found for ID:", id);
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
      
      // Send automatic notifications for task creation
      try {
        console.log("Sending task creation notification...");
        await sendTaskNotification(task, 'task_create');
        console.log("Task creation notification sent successfully");
      } catch (notificationError) {
        console.error('Error sending task creation notification:', notificationError);
        // Don't fail the task creation if notification fails
      }
      
      // Real-time WebSocket notification
      if ((app as any).broadcastToAll) {
        (app as any).broadcastToAll({
          type: 'task_created',
          task: task,
          createdBy: userId,
          timestamp: new Date().toISOString()
        });
        
        // Notify assigned field engineer specifically
        if (task.assignedTo) {
          (app as any).broadcastToUser(task.assignedTo, {
            type: 'task_assigned',
            task: task,
            message: `New task assigned: ${task.title}`,
            timestamp: new Date().toISOString()
          });
        }
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
      
      console.log("=== TASK UPDATE REQUEST ===");
      console.log("Task ID:", id);
      console.log("User ID:", userId);
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      let updateData = insertTaskSchema.partial().parse(req.body);
      
      // Handle "resolved" status specifically for field engineers
      if (updateData.status === 'resolved') {
        // Map resolved to in_progress for database compatibility  
        updateData.status = 'in_progress';
        updateData.resolution = updateData.resolution || `Task resolved by field engineer on ${new Date().toISOString()}`;
        console.log("🔄 Resolved status mapped to in_progress for database compatibility");
      }
      console.log("Parsed update data:", JSON.stringify(updateData, null, 2));
      
      // Get the current task to check status changes
      const currentTask = await storage.getTask(id);
      if (!currentTask) {
        console.log("Task not found for ID:", id);
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
              
              // Log auto-closure using the field engineer's user ID
              await storage.createTaskUpdate({
                taskId: id,
                updatedBy: userId,
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
      
      // Always log status updates (only if status actually changes)
      if (newStatus && oldStatus !== newStatus) {
        const updateNotes = notes || `Status changed from ${oldStatus} to ${newStatus}`;
          
        await storage.createTaskUpdate({
          taskId: id,
          updatedBy: userId,
          status: newStatus,
          note: updateNotes,
        });
        
        console.log(`✅ Task update record created for task ${id}`);
      } else if (newStatus && oldStatus === newStatus) {
        console.log(`⚠️ Status update skipped - no actual change (${oldStatus} → ${newStatus})`);
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
      
      // Send notification for task update
      try {
        console.log("Sending task update notification...");
        if (newStatus && oldStatus !== newStatus) {
          await sendTaskNotification(task, newStatus === 'completed' ? 'task_complete' : 'task_update');
        } else if (notes) {
          await sendTaskNotification(task, 'task_update');
        }
        console.log("Task update notification sent successfully");
      } catch (notificationError) {
        console.error('Error sending task update notification:', notificationError);
      }
      
      console.log("Task updated successfully:", task.id);
      console.log("=== TASK UPDATE COMPLETE ===");
      
      // Real-time WebSocket notification for task updates
      if ((app as any).broadcastToAll) {
        (app as any).broadcastToAll({
          type: 'task_updated',
          task: task,
          updatedBy: userId,
          changes: req.body,
          timestamp: new Date().toISOString()
        });
        
        // Notify assigned field engineer specifically
        if (task.assignedTo && task.assignedTo !== userId) {
          (app as any).broadcastToUser(task.assignedTo, {
            type: 'task_update_notification',
            task: task,
            message: `Task updated: ${task.title}`,
            updatedBy: userId,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Task validation errors:", error.errors);
        console.error("Request body that failed validation:", req.body);
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task", error: error.message });
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
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
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

      console.log(`🔧 Assigning field engineer ${fieldEngineerId} to task ${taskId}`);

      if (!fieldEngineerId) {
        return res.status(400).json({ message: "Field engineer ID is required" });
      }

      const task = await storage.assignTaskToFieldEngineer(taskId, fieldEngineerId, userId);
      
      // Send notification for field engineer assignment
      try {
        console.log("Sending field assignment notification...");
        await sendTaskNotification(task, 'task_update');
        console.log("Field assignment notification sent successfully");
      } catch (notificationError) {
        console.error('Error sending field assignment notification:', notificationError);
      }
      
      console.log(`✅ Field engineer assignment successful`);
      res.json(task);
    } catch (error) {
      console.error("Error assigning field engineer:", error);
      res.status(500).json({ message: "Failed to assign field engineer", error: error.message });
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
      
      // Send notification for each assigned task
      try {
        console.log("Sending field assignment notifications...");
        
        // Handle different return types from storage
        let tasksToNotify = [];
        if (result && Array.isArray(result.tasks)) {
          tasksToNotify = result.tasks;
        } else if (result && result.id) {
          // Single task result
          tasksToNotify = [result];
        } else if (Array.isArray(result)) {
          // Array of tasks
          tasksToNotify = result;
        }
        
        for (const task of tasksToNotify) {
          await sendTaskNotification(task, 'task_update');
        }
        console.log("Field assignment notifications sent successfully");
      } catch (notificationError) {
        console.error('Error sending field assignment notifications:', notificationError);
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error assigning multiple field engineers:", error);
      res.status(500).json({ message: "Failed to assign multiple field engineers" });
    }
  });

  // Alternative endpoint for field engineer assignment (matching frontend)
  app.post('/api/tasks/:id/assign-field-engineers', isAuthenticated, async (req: any, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const userId = req.user.id;
      const { fieldEngineerIds } = req.body;

      if (!fieldEngineerIds || !Array.isArray(fieldEngineerIds) || fieldEngineerIds.length === 0) {
        return res.status(400).json({ message: "At least one field engineer ID is required" });
      }

      const result = await storage.assignMultipleFieldEngineers(taskId, fieldEngineerIds, userId);
      
      // Send notification for each assigned task
      try {
        console.log("Sending field assignment notifications...");
        
        // Handle different return types from storage
        let tasksToNotify = [];
        if (result && Array.isArray(result.tasks)) {
          tasksToNotify = result.tasks;
        } else if (result && result.id) {
          // Single task result
          tasksToNotify = [result];
        } else if (Array.isArray(result)) {
          // Array of tasks
          tasksToNotify = result;
        }
        
        for (const task of tasksToNotify) {
          await sendTaskNotification(task, 'task_update');
        }
        console.log("Field assignment notifications sent successfully");
      } catch (notificationError) {
        console.error('Error sending field assignment notifications:', notificationError);
      }
      
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
      
      // Send notification for field status update
      try {
        console.log("Sending field status update notification...");
        await sendTaskNotification(task, 'task_update');
        console.log("Field status update notification sent successfully");
      } catch (notificationError) {
        console.error('Error sending field status update notification:', notificationError);
      }
      
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



  // Sync endpoint for field engineers to refresh their task data with real-time updates
  app.post('/api/tasks/sync', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const userRole = (req.user as any)?.role;
      
      if (!userId || userId === 'undefined' || userId === 'null' || userId === 'NaN') {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      console.log("Syncing data for user:", userId, "Role:", userRole);
      
      // Force refresh user tasks and related data based on role
      let userTasks;
      if (userRole === 'field_engineer') {
        // For field engineers, get tasks where they are assigned as fieldEngineerId
        userTasks = await storage.getTasksByUser(userId);
        console.log("Field engineer sync - found tasks:", userTasks.length);
      } else {
        // For other roles, get tasks assigned to them
        userTasks = await storage.getTasksByUser(userId);
        console.log("Regular sync - found tasks:", userTasks.length);
      }
      
      // Force cache invalidation and fresh data fetch with proper filtering
      let filteredTasks;
      if (userRole === 'field_engineer') {
        // For field engineers, get tasks where they are specifically assigned as field engineer
        filteredTasks = await storage.getAllTasks({ fieldEngineerId: userId });
      } else {
        // For other roles, get tasks assigned to them
        filteredTasks = await storage.getAllTasks({ assignedTo: userId });
      }
      
      console.log("Fresh filtered tasks:", filteredTasks.length);
      
      // Get recent updates for user's tasks
      const taskIds = filteredTasks.map(task => task.id);
      const recentUpdates = [];
      
      for (const taskId of taskIds) {
        try {
          const updates = await storage.getTaskUpdates(taskId);
          recentUpdates.push(...updates.slice(0, 2)); // Get last 2 updates per task
        } catch (error) {
          console.error(`Error getting updates for task ${taskId}:`, error);
        }
      }
      
      res.json({
        tasks: filteredTasks,
        recentUpdates: recentUpdates.slice(0, 8), // Limit to 8 most recent
        syncTime: new Date().toISOString(),
        message: `Real-time sync completed - ${filteredTasks.length} tasks found for ${userRole}`,
        userId: userId,
        userRole: userRole
      });
    } catch (error) {
      console.error("Error syncing tasks:", error);
      res.status(500).json({ message: "Failed to sync tasks", error: error.message });
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

  // Export customers to CSV (must be before /:id route)
  app.get('/api/customers/export', isAuthenticated, async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      
      // Create CSV content
      const csvHeader = 'customerId,name,email,contactPerson,mobilePhone,address,city,state,latitude,longitude,connectionType,planType,monthlyFee,status\n';
      
      const csvContent = customers.map(customer => {
        const escapeCSV = (field: any) => {
          if (field === null || field === undefined) return '';
          const str = String(field);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        };
        
        return [
          escapeCSV(customer.customerId),
          escapeCSV(customer.name),
          escapeCSV(customer.email),
          escapeCSV(customer.contactPerson),
          escapeCSV(customer.mobilePhone),
          escapeCSV(customer.address),
          escapeCSV(customer.city),
          escapeCSV(customer.state),
          escapeCSV(customer.latitude),
          escapeCSV(customer.longitude),
          escapeCSV(customer.connectionType),
          escapeCSV(customer.planType),
          escapeCSV(customer.monthlyFee),
          escapeCSV(customer.status)
        ].join(',');
      }).join('\n');
      
      const csv = csvHeader + csvContent;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="customers-export-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } catch (error) {
      console.error("Error exporting customers:", error);
      res.status(500).json({ message: "Failed to export customers" });
    }
  });

  // Customer import endpoint
  app.post('/api/customers/import', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      const fs = await import('fs');
      const { parse } = await import('csv-parse/sync');
      
      const filePath = req.file.path;
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      let records;
      if (req.file.originalname.endsWith('.csv')) {
        records = parse(fileContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true
        });
      } else {
        // For now, focus on CSV support
        return res.status(400).json({ message: "Please use CSV format for imports" });
      }

      let imported = 0;
      let updated = 0;
      let errors = 0;
      const errorDetails = [];

      for (const record of records) {
        try {
          const customerData = {
            customerId: record.customerId || `C${Date.now()}${Math.random().toString(36).substr(2, 3)}`,
            name: record.name,
            email: record.email,
            contactPerson: record.contactPerson,
            mobilePhone: record.mobilePhone,
            address: record.address,
            city: record.city,
            state: record.state,
            latitude: record.latitude ? parseFloat(record.latitude) : null,
            longitude: record.longitude ? parseFloat(record.longitude) : null,
            connectionType: record.connectionType || 'fiber',
            planType: record.planType || 'basic',
            monthlyFee: record.monthlyFee ? parseFloat(record.monthlyFee) : 0,
            status: record.status || 'active'
          };

          // Validate required fields
          if (!customerData.name) {
            errors++;
            errorDetails.push(`Row ${imported + updated + errors}: Missing required field: name`);
            continue;
          }

          // Generate unique email if not provided
          if (!customerData.email) {
            customerData.email = `customer${customerData.customerId}@example.com`;
          }

          // Check if customer exists by customerId (primary identifier)
          const customers = await storage.getAllCustomers();
          const existingCustomer = customers.find(c => c.customerId === customerData.customerId);
          
          if (existingCustomer) {
            // Update existing customer
            await storage.updateCustomer(existingCustomer.id, customerData);
            updated++;
          } else {
            // Create new customer
            await storage.createCustomer(customerData);
            imported++;
          }
          
        } catch (error) {
          errors++;
          errorDetails.push(`Row ${imported + updated + errors}: ${error.message}`);
        }
      }

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      res.json({
        imported,
        updated,
        errors,
        total: records.length,
        errorDetails: errorDetails.slice(0, 10) // Return first 10 errors
      });

    } catch (error) {
      console.error("Error importing customers:", error);
      
      // Clean up file if it exists
      if (req.file?.path) {
        try {
          const fs = await import('fs');
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error("Error cleaning up file:", cleanupError);
        }
      }
      
      res.status(500).json({ message: "Failed to import customers", error: error.message });
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
      // Transform empty coordinate strings to undefined for database compatibility
      const transformedBody = {
        ...req.body,
        latitude: req.body.latitude && req.body.latitude.trim() !== "" ? req.body.latitude : undefined,
        longitude: req.body.longitude && req.body.longitude.trim() !== "" ? req.body.longitude : undefined,
      };
      
      const validatedData = insertCustomerSchema.parse(transformedBody);
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
      
      // Transform empty coordinate strings to undefined for database compatibility
      const transformedBody = {
        ...req.body,
        latitude: req.body.latitude && req.body.latitude.trim() !== "" ? req.body.latitude : undefined,
        longitude: req.body.longitude && req.body.longitude.trim() !== "" ? req.body.longitude : undefined,
      };
      
      const validatedData = insertCustomerSchema.partial().parse(transformedBody);
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

      // Sync new user to SQL Server if connected
      try {
        const sqlConnections = await storage.getAllSqlConnections();
        const activeConnection = sqlConnections.find(conn => conn.isActive);
        
        if (activeConnection) {
          console.log("Syncing new user to SQL Server...");
          await syncUserToSqlServer(user, activeConnection);
          console.log("User synced to SQL Server successfully");
        }
      } catch (syncError) {
        console.error("Error syncing user to SQL Server:", syncError);
        // Don't fail user creation if SQL sync fails
      }

      // Real-time notification for new user creation
      if ((app as any).broadcastToAdmins) {
        (app as any).broadcastToAdmins({
          type: 'user_created',
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName
          },
          message: `New ${user.role} created: ${user.firstName} ${user.lastName}`,
          canLoginImmediately: true,
          timestamp: new Date().toISOString()
        });
      }
      
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

  // Notification endpoints
  app.get('/api/notifications', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Get recent notification logs for the user
      const notifications = await storage.getNotificationsByUser(userId);

      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      await storage.markNotificationAsRead(notificationId, userId);

      res.json({ success: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Failed to mark notification as read' });
    }
  });

  app.patch('/api/notifications/mark-all-read', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      await storage.markAllNotificationsAsRead(userId);

      res.json({ success: true });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ message: 'Failed to mark all notifications as read' });
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

  // Admin/Staff Authentication Routes - for web and mobile access
  app.post('/api/auth/login', (req, res, next) => {
    const userAgent = req.get('user-agent') || '';
    const isMobile = userAgent.includes('Mobile') || userAgent.includes('WebView') || userAgent.includes('WizoneFieldEngineerApp');
    
    console.log(`🔐 ${isMobile ? 'MOBILE' : 'WEB'} login attempt: ${req.body.username}`);
    console.log(`📱 User-Agent: ${userAgent.substring(0, 100)}`);
    console.log(`🌐 Origin: ${req.get('origin') || 'No Origin'}`);
    console.log(`📊 Request Body:`, { username: req.body.username, passwordLength: req.body.password?.length });
    
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        console.error('❌ Authentication error:', err);
        return res.status(500).json({ message: 'Authentication failed' });
      }
      
      if (!user) {
        console.log(`❌ Login failed for: ${req.body.username} - ${info?.message || 'Invalid credentials'}`);
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      req.logIn(user, (err: any) => {
        if (err) {
          console.error('❌ Session creation error:', err);
          return res.status(500).json({ message: 'Session creation failed' });
        }
        
        console.log(`✅ Login successful: ${user.username} (${user.role})`);
        res.json({
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          department: user.department
        });
      });
    })(req, res, next);
  });

  // Admin/Staff logout
  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Get current user (for both web and mobile)
  app.get('/api/auth/user', isAuthenticated, (req, res) => {
    const user = req.user;
    res.json({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      department: user.department
    });
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

  // Mobile-specific activity logs endpoint
  app.get("/api/mobile/activity-logs", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const { limit = 50 } = req.query;
      
      console.log(`📱 Mobile activity logs request for user: ${userId}`);
      
      // Get recent task updates for the user
      const recentTasks = await storage.getTasksByUser(userId, 20);
      const taskUpdates = [];
      
      for (const task of recentTasks) {
        const updates = await storage.getTaskUpdates(task.id);
        taskUpdates.push(...updates.map(update => ({
          ...update,
          type: 'task_update',
          taskTitle: task.title,
          taskTicketNumber: task.ticketNumber
        })));
      }
      
      // Get tracking history
      const trackingHistory = await storage.getEngineerTrackingHistory(userId, 20);
      const trackingLogs = trackingHistory.map(track => ({
        id: track.id,
        type: 'location_update',
        timestamp: track.timestamp,
        createdAt: track.createdAt,
        note: `${track.movementType} - ${track.distanceFromOffice}km from office`,
        taskTitle: track.taskTitle,
        taskTicketNumber: track.ticketNumber
      }));
      
      // Get notifications
      const notifications = await storage.getNotificationsByUser(userId);
      const notificationLogs = notifications.map(notif => ({
        id: notif.id,
        type: 'notification',
        timestamp: notif.createdAt,
        createdAt: notif.createdAt,
        note: notif.message,
        eventType: notif.eventType
      }));
      
      // Combine all activity logs
      const allLogs = [...taskUpdates, ...trackingLogs, ...notificationLogs]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, parseInt(limit as string));
      
      console.log(`📱 Returning ${allLogs.length} activity logs for mobile`);
      res.json(allLogs);
    } catch (error) {
      console.error("Error fetching mobile activity logs:", error);
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  // Mobile connectivity test endpoint
  app.post('/api/mobile/connectivity-test', (req, res) => {
    const userAgent = req.get('user-agent') || '';
    const body = req.body;
    
    console.log(`📱 MOBILE CONNECTIVITY TEST:`);
    console.log(`📱 User-Agent: ${userAgent}`);
    console.log(`📱 Headers:`, req.headers);
    console.log(`📱 Body:`, body);
    console.log(`📱 Session:`, req.session ? 'EXISTS' : 'NO SESSION');
    console.log(`📱 Cookies:`, req.cookies);
    
    res.json({
      status: 'connectivity_ok',
      timestamp: new Date().toISOString(),
      received_data: body,
      session_exists: !!req.session,
      user_agent: userAgent,
      message: 'Mobile connectivity test successful'
    });
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

  // Bot Configuration Routes
  app.get("/api/bot-configurations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin' && user?.role !== 'manager') {
        return res.status(403).json({ message: "Only administrators can view bot configurations" });
      }

      const configurations = await storage.getAllBotConfigurations();
      res.json(configurations);
    } catch (error) {
      console.error("Error fetching bot configurations:", error);
      res.status(500).json({ message: "Failed to fetch bot configurations" });
    }
  });

  app.post("/api/bot-configurations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin' && user?.role !== 'manager') {
        return res.status(403).json({ message: "Only administrators can create bot configurations" });
      }

      const configData = { ...req.body, createdBy: userId };
      const configuration = await storage.createBotConfiguration(configData);
      res.json(configuration);
    } catch (error) {
      console.error("Error creating bot configuration:", error);
      res.status(500).json({ message: "Failed to create bot configuration" });
    }
  });

  app.put("/api/bot-configurations/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin' && user?.role !== 'manager') {
        return res.status(403).json({ message: "Only administrators can update bot configurations" });
      }

      const configId = parseInt(req.params.id);
      const configuration = await storage.updateBotConfiguration(configId, req.body);
      res.json(configuration);
    } catch (error) {
      console.error("Error updating bot configuration:", error);
      res.status(500).json({ message: "Failed to update bot configuration" });
    }
  });

  app.delete("/api/bot-configurations/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin' && user?.role !== 'manager') {
        return res.status(403).json({ message: "Only administrators can delete bot configurations" });
      }

      const configId = parseInt(req.params.id);
      await storage.deleteBotConfiguration(configId);
      res.json({ message: "Bot configuration deleted successfully" });
    } catch (error) {
      console.error("Error deleting bot configuration:", error);
      res.status(500).json({ message: "Failed to delete bot configuration" });
    }
  });

  app.post("/api/bot-configurations/:id/test", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin' && user?.role !== 'manager') {
        return res.status(403).json({ message: "Only administrators can test bot configurations" });
      }

      const configId = parseInt(req.params.id);
      const testResult = await storage.testBotConfiguration(configId);
      res.json(testResult);
    } catch (error) {
      console.error("Error testing bot configuration:", error);
      res.status(500).json({ message: "Failed to test bot configuration" });
    }
  });

  // Notification logs routes
  app.get("/api/notification-logs", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin' && user?.role !== 'manager') {
        return res.status(403).json({ message: "Only administrators can view notification logs" });
      }

      const { limit, offset } = req.query;
      const logs = await storage.getNotificationLogs(
        limit ? parseInt(limit as string) : 50,
        offset ? parseInt(offset as string) : 0
      );
      res.json(logs);
    } catch (error) {
      console.error("Error fetching notification logs:", error);
      res.status(500).json({ message: "Failed to fetch notification logs" });
    }
  });

  // Debug user endpoint
  app.post('/api/debug-user', async (req, res) => {
    try {
      const { username } = req.body;
      console.log(`🧪 Debug: Getting user data for: ${username}`);
      
      const user = await storage.getUserByUsername(username);
      console.log(`🧪 Debug: Raw user data:`, user);
      
      if (user) {
        const { password, ...safeUser } = user;
        res.json({
          success: true,
          user: safeUser,
          hasPassword: !!password,
          message: 'User data retrieved'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
    } catch (error) {
      console.error('🧪 Debug user error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  const httpServer = createServer(app);
  
  // WebSocket server for real-time communication
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws'
  });
  
  // Store connected clients by user ID and type
  const connectedClients = new Map<string, {
    ws: WebSocket;
    userId: string;
    userRole: string;
    clientType: 'mobile' | 'web';
    lastActivity: Date;
  }>();
  
  wss.on('connection', (ws, req) => {
    console.log('🔗 New WebSocket connection from:', req.socket.remoteAddress);
    
    let clientInfo: any = null;
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('📩 WebSocket message received:', data.type);
        
        switch (data.type) {
          case 'authenticate':
            // Authenticate the WebSocket connection
            const { userId, token, clientType } = data;
            // In production, verify the token properly
            
            if (userId) {
              clientInfo = {
                ws,
                userId,
                userRole: data.userRole || 'unknown',
                clientType: clientType || 'web',
                lastActivity: new Date()
              };
              
              connectedClients.set(`${userId}_${clientType}`, clientInfo);
              
              ws.send(JSON.stringify({
                type: 'authenticated',
                message: 'WebSocket connection authenticated',
                userId,
                clientType
              }));
              
              console.log(`✅ WebSocket authenticated: ${userId} (${clientType})`);
              
              // Broadcast user online status to admins
              broadcastToAdmins({
                type: 'user_status',
                userId,
                status: 'online',
                userRole: data.userRole,
                clientType,
                timestamp: new Date().toISOString()
              });
            }
            break;
            
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
            if (clientInfo) {
              clientInfo.lastActivity = new Date();
            }
            break;
            
          case 'task_update':
            // Real-time task updates
            console.log(`📝 Task update from ${clientInfo?.userId}:`, data.taskId);
            broadcastToAll({
              type: 'task_updated',
              taskId: data.taskId,
              updatedBy: clientInfo?.userId,
              updates: data.updates,
              timestamp: new Date().toISOString()
            });
            break;
            
          case 'location_update':
            // Real-time location updates from field engineers
            if (clientInfo?.userRole === 'field_engineer') {
              console.log(`📍 Location update from ${clientInfo.userId}`);
              broadcastToAdmins({
                type: 'engineer_location',
                userId: clientInfo.userId,
                location: data.location,
                timestamp: new Date().toISOString()
              });
            }
            break;
        }
      } catch (error) {
        console.error('❌ WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });
    
    ws.on('close', () => {
      if (clientInfo) {
        console.log(`🔌 WebSocket disconnected: ${clientInfo.userId} (${clientInfo.clientType})`);
        connectedClients.delete(`${clientInfo.userId}_${clientInfo.clientType}`);
        
        // Broadcast user offline status to admins
        broadcastToAdmins({
          type: 'user_status',
          userId: clientInfo.userId,
          status: 'offline',
          userRole: clientInfo.userRole,
          clientType: clientInfo.clientType,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });
  });
  
  // Broadcast functions
  function broadcastToAll(message: any) {
    const messageStr = JSON.stringify(message);
    connectedClients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
      }
    });
  }
  
  function broadcastToAdmins(message: any) {
    const messageStr = JSON.stringify(message);
    connectedClients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN && 
          (client.userRole === 'admin' || client.userRole === 'manager')) {
        client.ws.send(messageStr);
      }
    });
  }
  
  function broadcastToFieldEngineers(message: any) {
    const messageStr = JSON.stringify(message);
    connectedClients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN && 
          client.userRole === 'field_engineer') {
        client.ws.send(messageStr);
      }
    });
  }
  
  function broadcastToUser(userId: string, message: any) {
    const messageStr = JSON.stringify(message);
    connectedClients.forEach((client, key) => {
      if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
      }
    });
  }
  
  // Store broadcast functions globally for use in routes
  (app as any).wsClients = connectedClients;
  (app as any).broadcastToAll = broadcastToAll;
  (app as any).broadcastToAdmins = broadcastToAdmins;
  (app as any).broadcastToFieldEngineers = broadcastToFieldEngineers;
  (app as any).broadcastToUser = broadcastToUser;
  
  console.log('🚀 WebSocket server initialized on /ws path');
  
  return httpServer;
}
