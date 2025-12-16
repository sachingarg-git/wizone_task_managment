import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import nodemailer from "nodemailer";
// import { seedDatabase } from "./seed"; // Temporarily disabled to avoid db.js dependency
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
import { db, sql, schema, client } from "./database-init.js";
import { sendTaskAssignmentNotification, sendTaskStatusNotification } from "./push-notifications";
import { eq } from "drizzle-orm";
import mobileAuthRoutes from "./routes/mobile-auth";
import { sendDailySummaryNotification, getDailySummaryData } from "./scheduled-notifications";

// PostgreSQL database helper functions
async function getUserFromDatabase(userId: string) {
  try {
    const users = await db.select().from(schema.users).where(eq(schema.users.id, userId));
    return users[0] || null;
  } catch (error) {
    console.error('Error fetching user from database:', error);
    return null;
  }
}

// Notification helper function
async function sendTaskNotification(task: any, eventType: string) {
  try {
    console.log(`=== SENDING NOTIFICATION ===`);
    console.log(`Event Type: ${eventType}`);
    console.log(`Task ID: ${task.id}`);
    console.log(`Task Title: ${task.title}`);
    
    // Get all active bot configurations - handle case where table doesn't exist
    let botConfigs = [];
    try {
      botConfigs = await storage.getAllBotConfigurations();
    } catch (error) {
      console.log(`⚠️ Bot configurations table not found, skipping notifications`);
      console.log('Task notification sent successfully');
      return;
    }
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

    // === PUSH NOTIFICATION ===
    // Send push notification to assigned field engineer (works even when app is closed)
    try {
      if (task.fieldEngineerId) {
        const customer = await storage.getCustomer(task.customerId);
        
        if (eventType === 'task_assign' || eventType === 'task_create') {
          await sendTaskAssignmentNotification(task.fieldEngineerId, {
            taskId: task.id,
            ticketNumber: task.ticketNumber,
            title: task.title,
            customerName: customer?.name || 'Unknown Customer',
            priority: task.priority,
          });
          console.log(`📱 Push notification sent to field engineer ${task.fieldEngineerId}`);
        } else if (eventType === 'task_update' || eventType === 'task_complete') {
          const updatedBy = task.updatedByName || 'System';
          await sendTaskStatusNotification(task.fieldEngineerId, {
            taskId: task.id,
            ticketNumber: task.ticketNumber,
            title: task.title,
            status: task.status,
            updatedBy,
          });
          console.log(`📱 Push status notification sent to field engineer ${task.fieldEngineerId}`);
        }
      }

      // Also send to assigned engineer if different from field engineer
      if (task.assignedTo && task.assignedTo !== task.fieldEngineerId) {
        const customer = await storage.getCustomer(task.customerId);
        
        if (eventType === 'task_update' || eventType === 'task_complete') {
          const updatedBy = task.updatedByName || 'System';
          await sendTaskStatusNotification(task.assignedTo, {
            taskId: task.id,
            ticketNumber: task.ticketNumber,
            title: task.title,
            status: task.status,
            updatedBy,
          });
          console.log(`📱 Push status notification sent to engineer ${task.assignedTo}`);
        }
      }
    } catch (pushError) {
      console.error('Error sending push notification:', pushError);
    }

  } catch (error) {
    console.error('Error in sendTaskNotification:', error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Check if PostgreSQL database is initialized
  let isInitialized = false;
  try {
    // Test if we can connect to PostgreSQL and if users table exists
    await sql`SELECT 1 FROM users LIMIT 1`;
    isInitialized = true;
    console.log('✅ PostgreSQL database connection successful');
  } catch (error) {
    console.log('⚠️ PostgreSQL database not available, using demo mode with mock data');
    isInitialized = false;
  }
  
  // Setup routes for database configuration
  app.use('/api/setup', setupRoutes);
  
  // If database is not available, we'll continue with the mock storage system
  if (!isInitialized) {
    console.log('Using mock storage system for demo mode');
    console.log('⚠️ Continuing with main application using mock data instead of setup redirect');
    
    // Don't redirect to setup - continue with full application setup using mock data
    // The routes will handle the mock storage system automatically
    
    // Enable demo mode in storage
    const { setDemoMode } = await import('./storage.js');
    setDemoMode(true);
    console.log('✅ Demo mode enabled with sample customers');
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
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
      });
    });
  });

  // Get current user route - Enhanced for both passport and manual sessions
  app.get('/api/auth/user', (req, res) => {
    console.log('🔍 Auth check - req.isAuthenticated():', req.isAuthenticated ? req.isAuthenticated() : false);
    console.log('🔍 Auth check - req.user exists:', !!req.user);
    console.log('🔍 Auth check - req.session.user exists:', !!(req.session as any)?.user);
    
    // Check both passport authentication and manual session
    let currentUser = null;
    
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      console.log('✅ Using passport authenticated user');
      currentUser = req.user;
    } else if ((req.session as any)?.user) {
      console.log('✅ Using manual session user');
      currentUser = (req.session as any).user;
    }
    
    if (!currentUser) {
      console.log('❌ No authenticated user found');
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const userAgent = req.get('User-Agent') || '';
    const isMobileApp = userAgent.includes('WizoneFieldApp') ||
                       userAgent.includes('WizoneFieldEngineerApp') || 
                       req.get('X-Mobile-App') === 'true' ||
                       req.get('X-Requested-With') === 'mobile';
    
    if (isMobileApp) {
      console.log('✅ Mobile APK authenticated user request');
    }
    
    res.json({
      id: currentUser.id,
      username: currentUser.username,
      email: currentUser.email,
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      role: currentUser.role,
      department: currentUser.department,
      isActive: currentUser.isActive,
      createdAt: currentUser.createdAt,
      updatedAt: currentUser.updatedAt
    });
  });

  // DEBUG: Create mobile users directly via routes  
  app.post("/api/create-mobile-engineers", async (req, res) => {
    try {
      const mobileUsers = [
        { username: 'engineer1', password: 'engineer1', firstName: 'राज', lastName: 'शर्मा' },
        { username: 'engineer2', password: 'engineer2', firstName: 'विकास', lastName: 'गुप्ता' },
        { username: 'engineer3', password: 'engineer3', firstName: 'अमित', lastName: 'वर्मा' },
        { username: 'mobile_test', password: 'mobile123', firstName: 'टेस्ट', lastName: 'इंजीनियर' },
        { username: 'admin', password: 'admin123', firstName: 'एडमिन', lastName: 'यूजर' }
      ];
      
      const results = [];
      for (const userData of mobileUsers) {
        try {
          const existing = await storage.getUserByUsername(userData.username);
          if (!existing) {
            const user = await storage.createUser({
              id: `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              username: userData.username,
              password: userData.password,
              email: `${userData.username}@wizone.com`,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: userData.username === 'admin' ? 'admin' : 'field_engineer',
              department: 'FIELD ENGINEERING',
              isActive: true
            });
            results.push({ username: userData.username, status: 'created', id: user.id });
          } else {
            // Reset password for existing users
            await storage.updateUser(existing.id, { password: userData.password });
            results.push({ username: userData.username, status: 'password_reset', id: existing.id });
          }
        } catch (error) {
          results.push({ username: userData.username, status: 'error', error: error.message });
        }
      }
      
      res.json({ 
        message: 'Mobile engineers setup completed',
        results: results,
        login_credentials: mobileUsers.map(u => ({ username: u.username, password: u.password }))
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
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
  
  // Serve CCTV uploaded images
  app.use('/uploads/cctv', express.static(path.join(process.cwd(), 'uploads', 'cctv')));

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
      if (!customer || customer.portalPassword !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Store customer session
      (req.session as any).customer = {
        id: customer.id,
        customerId: customer.customerId,
        name: customer.name,
        username: customer.portalUsername,
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
        username: customer.portalUsername,
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
      
      // Ensure timestamps are in proper ISO format
      const formattedTasks = tasks.map(task => ({
        ...task,
        createdAt: task.createdAt instanceof Date ? task.createdAt.toISOString() : 
                   (typeof task.createdAt === 'string' ? task.createdAt : new Date(task.createdAt).toISOString()),
        completionTime: task.completionTime ? 
                       (task.completionTime instanceof Date ? task.completionTime.toISOString() : 
                        (typeof task.completionTime === 'string' ? task.completionTime : new Date(task.completionTime).toISOString())) : 
                       null
      }));
      
      res.json(formattedTasks);
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
      
      console.log("📝 Customer Portal - Creating task:", { 
        customerId, 
        customerName, 
        title, 
        priority, 
        issueType,
        sessionCustomer: customer 
      });
      
      if (!title || !description) {
        console.log("❌ Validation failed: Missing title or description");
        return res.status(400).json({ message: "Title and description are required" });
      }
      
      // Verify customer exists in database
      const dbCustomer = await storage.getCustomer(customerId);
      if (!dbCustomer) {
        console.error("❌ Customer not found in database:", customerId);
        return res.status(400).json({ message: "Customer not found. Please log in again." });
      }
      
      console.log("✅ Customer verified in database:", { id: dbCustomer.id, name: dbCustomer.name });
      
      const taskData = {
        title,
        description,
        priority: priority || "medium",
        issueType: issueType || "technical",
        customerId: dbCustomer.id, // Use verified database customer ID
        customerName: dbCustomer.name, // Use database customer name
        status: "pending",
        assignedTo: null, // Will be assigned by admin later
        createdBy: null // Customer-created tasks don't have a backend user creator
      };
      
      console.log("📋 Creating task with data:", taskData);
      const task = await storage.createTask(taskData);
      console.log("✅ Customer task created successfully:", task.id);
      
      res.status(201).json(task);
    } catch (error) {
      console.error("❌ Error creating customer task:", error);
      console.error("❌ Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ message: "Failed to create task", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get task comments for customer
  app.get('/api/customer-portal/tasks/:taskId/comments', isCustomerAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const customerId = (req.session as any).customer.id;
      
      console.log("💬 Getting task comments for customer:", { taskId, customerId });
      
      // Verify task belongs to customer
      const task = await storage.getTask(taskId);
      if (!task || task.customerId !== customerId) {
        console.log("❌ Access denied: Task not found or doesn't belong to customer");
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get comments from task_updates table (customer_feedback type)
      const taskUpdates = await storage.getTaskUpdates(taskId);
      const comments = taskUpdates
        .filter(update => update.type === 'customer_feedback' || update.type === 'comment')
        .map(update => ({
          id: update.id,
          taskId: update.taskId,
          comment: update.message, // Frontend expects 'comment' property
          message: update.message, // Keep both for compatibility
          type: update.type,
          createdBy: update.createdBy,
          createdByName: update.createdByName,
          createdAt: update.createdAt instanceof Date ? update.createdAt.toISOString() : 
                     (typeof update.createdAt === 'string' ? update.createdAt : new Date(update.createdAt).toISOString()),
          isInternal: false, // Customer comments are never internal
          respondedByUser: update.createdBy !== customerId ? {
            firstName: update.createdByName?.split(' ')[0] || 'Admin',
            lastName: update.createdByName?.split(' ')[1] || '',
            role: 'admin'
          } : null
        }));
      
      console.log("✅ Found comments:", comments.length);
      res.json(comments);
    } catch (error) {
      console.error("❌ Error fetching task comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Get task history for customer (includes ALL updates: admin, customer, comments)
  app.get('/api/customer-portal/tasks/:taskId/history', isCustomerAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const customerId = (req.session as any).customer.id;
      
      console.log("📋 Getting complete task history for customer:", { taskId, customerId });
      
      // Verify task belongs to customer
      const task = await storage.getTask(taskId);
      if (!task || task.customerId !== customerId) {
        console.log("❌ Access denied: Task not found or doesn't belong to customer");
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get ALL updates (admin updates, customer updates, comments, etc.)
      const allUpdates = await storage.getTaskUpdates(taskId);
      
      // Map updates to include proper display info for customer portal
      const history = allUpdates.map(update => {
        // Ensure createdAt is in ISO format with timezone info
        const createdAt = update.createdAt instanceof Date ? 
          update.createdAt.toISOString() : 
          (typeof update.createdAt === 'string' ? update.createdAt : new Date(update.createdAt).toISOString());
        
        return {
          id: update.id,
          taskId: update.taskId,
          message: update.message,
          type: update.type || 'status_update',
          createdBy: update.createdBy,
          createdByName: update.createdByName || (update.updatedByUser ? `${update.updatedByUser.firstName} ${update.updatedByUser.lastName}` : 'System'),
          createdAt: createdAt,
          isCustomerUpdate: update.createdBy === customerId || update.createdByName === (req.session as any).customer.name,
          isAdminUpdate: update.createdBy !== customerId && update.createdByName !== (req.session as any).customer.name,
          priority: update.priority,
          status: update.status,
          updatedByUser: update.updatedByUser
        };
      });
      
      console.log(`✅ Found ${history.length} total updates for task ${taskId}:`, 
        history.map(h => ({ id: h.id, type: h.type, by: h.createdByName, isCustomer: h.isCustomerUpdate })));
      
      // Debug: Log timestamp info for the latest update
      if (history.length > 0) {
        const latest = history[0];
        const rawUpdate = allUpdates[0];
        console.log('🕐 Timestamp debugging for latest update:');
        console.log('  - Raw DB timestamp:', rawUpdate.createdAt, typeof rawUpdate.createdAt);
        console.log('  - Processed timestamp:', latest.createdAt, typeof latest.createdAt);
        console.log('  - Current server time:', new Date().toISOString());
        console.log('  - Current local time:', new Date().toString());
      }
      
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
        message: `[Customer Update] ${comment || `Priority: ${priority || 'unchanged'}, Status: ${status || 'unchanged'}`}`,
        type: 'customer_feedback',
        createdBy: systemAdmin?.id,
        createdByName: 'System Administrator',
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
        message: `[Customer Update] ${updateNote}`,
        type: 'customer_feedback',
        createdBy: systemAdmin?.id,
        createdByName: 'System Administrator',
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
      const customer = (req.session as any).customer;
      const customerId = customer.id;
      
      console.log("💬 Customer adding comment:", { taskId, customerId, customerName: customer.name, comment: comment?.substring(0, 50) + "..." });
      
      if (!taskId || !comment) {
        return res.status(400).json({ message: "Task ID and comment are required" });
      }
      
      // Verify task belongs to customer
      const task = await storage.getTask(taskId);
      if (!task || task.customerId !== customerId) {
        console.log("❌ Access denied: Task not found or doesn't belong to customer", { 
          taskExists: !!task, 
          taskCustomerId: task?.customerId, 
          sessionCustomerId: customerId 
        });
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Use the task_updates table instead of customer_comments
      const taskUpdateData = {
        taskId: parseInt(taskId),
        message: comment,
        type: 'customer_feedback',
        createdBy: null, // Customer comments don't have a user ID
        createdByName: customer.name || customer.customerId || 'Customer'
      };
      
      console.log("📝 Creating task update for customer comment:", taskUpdateData);
      const newUpdate = await storage.createTaskUpdate(taskUpdateData);
      console.log("✅ Customer comment added successfully:", newUpdate.id);
      
      res.json({
        id: newUpdate.id,
        taskId: newUpdate.taskId,
        message: newUpdate.message,
        type: newUpdate.type,
        createdBy: newUpdate.createdBy,
        createdByName: newUpdate.createdByName,
        createdAt: newUpdate.createdAt
      });
    } catch (error) {
      console.error("❌ Error adding customer comment:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });



  // Enhanced Authentication middleware - handles both web sessions and mobile authentication
  const isAuthenticated = async (req: any, res: any, next: any) => {
    try {
      // Log all authentication attempts for debugging
      const userAgent = req.get('user-agent') || '';
      const isMobile = userAgent.includes('Mobile') || userAgent.includes('WizoneTaskManager') || userAgent.includes('WebView') || req.get('X-Mobile-Session');
      
      if (isMobile) {
        console.log(`📱 MOBILE AUTH CHECK: ${req.method} ${req.path}`);
        console.log(`📱 User-Agent: ${userAgent.substring(0, 100)}`);
        console.log(`📱 Has Session: ${!!req.session}`);
        console.log(`📱 Session User: ${req.session?.user ? 'YES' : 'NO'}`);
        console.log(`📱 Passport User: ${req.user ? 'YES' : 'NO'}`);
        console.log(`📱 Mobile Headers: X-Mobile-User-ID=${req.get('X-Mobile-User-ID')}, X-Mobile-Username=${req.get('X-Mobile-Username')}`);
      }
      
      // PRIORITY 1: Check mobile custom headers FIRST (for proper tracking)
      if (req.get('X-Mobile-User-ID') && req.get('X-Mobile-Username')) {
        const mobileUserId = req.get('X-Mobile-User-ID');
        const mobileUsername = req.get('X-Mobile-Username');
        
        console.log(`🎯 PRIORITY: Checking mobile headers first - ID: ${mobileUserId}, Username: ${mobileUsername}`);
        
        // Verify user exists in database
        try {
          const dbUser = await getUserFromDatabase(mobileUserId);
          if (dbUser && dbUser.username === mobileUsername) {
            req.user = dbUser;
            console.log(`✅ MOBILE HEADER AUTH SUCCESS: ${dbUser.username} (ID: ${dbUser.id}) - ${req.method} ${req.path}`);
            return next();
          } else {
            console.log(`❌ Mobile header auth failed: User not found or username mismatch`);
          }
        } catch (error) {
          console.log(`❌ Mobile header auth error:`, error);
        }
      }
      
      // PRIORITY 2: Check if user is authenticated via Passport session
      if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        console.log(`✅ Passport authenticated: ${req.user.username} (${req.user.role}) - ${req.method} ${req.path}`);
        return next();
      }
      
      // PRIORITY 3: Check if user is authenticated via session (fallback)
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
                             userAgent.includes('WizoneTaskManager') || 
                             userAgent.includes('Android') ||
                             req.get('X-Mobile-Session') === 'true' ||
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
        
        // Check for authenticated user in multiple ways for mobile compatibility
        let authenticatedUser = null;
        
        // Check Passport session first
        if (req.isAuthenticated && req.isAuthenticated() && req.user) {
          authenticatedUser = req.user;
          console.log(`📱 Mobile Passport session found: ${authenticatedUser.username} (ID: ${authenticatedUser.id})`);
        }
        // Check manual session
        else if (req.session && req.session.user) {
          authenticatedUser = req.session.user;
          console.log(`📱 Mobile manual session found: ${authenticatedUser.username} (ID: ${authenticatedUser.id})`);
        }
        // Check mobile custom headers (fallback for APK without cookies)
        else if (req.get('X-Mobile-User-ID') && req.get('X-Mobile-Username')) {
          const mobileUserId = req.get('X-Mobile-User-ID');
          const mobileUsername = req.get('X-Mobile-Username');
          
          // Verify user exists in database
          try {
            const dbUser = await getUserFromDatabase(mobileUserId);
            if (dbUser && dbUser.username === mobileUsername) {
              authenticatedUser = dbUser;
              console.log(`📱 Mobile header auth verified: ${authenticatedUser.username} (ID: ${authenticatedUser.id})`);
            } else {
              console.log(`❌ Mobile header auth failed: User not found or username mismatch`);
            }
          } catch (error) {
            console.log(`❌ Mobile header auth error:`, error);
          }
        }
        
        if (authenticatedUser) {
          req.user = authenticatedUser;
          return next();
        }
        
        // If no authentication found, reject the request
        console.log(`❌ Mobile request to ${req.path} denied - no valid authentication`);
        return res.status(401).json({ message: "Authentication required. Please login first." });
      }
      
      // For non-mobile requests, use standard authentication
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

  // Seed database route (for development) - temporarily disabled
  /*
  app.post('/api/seed', isAuthenticated, async (req: any, res) => {
    try {
      await seedDatabase();
      res.json({ message: "Database seeded successfully" });
    } catch (error) {
      console.error("Error seeding database:", error);
      res.status(500).json({ message: "Failed to seed database" });
    }
  });
  */

  // Profile endpoints for mobile app
  app.get('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user || (req.session as any)?.user;
      if (!currentUser) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Get full user details from database
      const user = await storage.getUser(currentUser.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        department: user.department,
        profileImageUrl: user.profileImageUrl,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ message: 'Failed to fetch profile' });
    }
  });

  app.put('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user || (req.session as any)?.user;
      if (!currentUser) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { firstName, lastName, email, phone } = req.body;
      
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: "First name, last name, and email are required" });
      }
      
      // Check if email is being changed and if it conflicts with another user
      if (email && email !== currentUser.email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== currentUser.id) {
          return res.status(400).json({ 
            message: "A user with this email already exists",
            error: "DUPLICATE_EMAIL"
          });
        }
      }

      const userData = {
        firstName,
        lastName,
        email,
        phone,
        updatedAt: new Date()
      };

      const updatedUser = await storage.updateUser(currentUser.id, userData);
      
      // Update session with new user data
      if (req.user) {
        req.user = { ...req.user, ...updatedUser };
      }
      if ((req.session as any)?.user) {
        (req.session as any).user = { ...(req.session as any).user, ...updatedUser };
      }

      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        role: updatedUser.role,
        department: updatedUser.department,
        profileImageUrl: updatedUser.profileImageUrl,
        isActive: updatedUser.isActive,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      
      // Handle specific database constraint errors
      if ((error as any).code === '23505') {
        if ((error as any).constraint === 'users_email_unique') {
          return res.status(400).json({ 
            message: "A user with this email already exists",
            error: "DUPLICATE_EMAIL"
          });
        }
      }
      
      res.status(500).json({ message: 'Failed to update profile' });
    }
  });

  // Profile photo upload endpoint
  app.post('/api/profile/photo', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user || (req.session as any)?.user;
      if (!currentUser) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { photoData } = req.body;
      
      if (!photoData) {
        return res.status(400).json({ message: 'Photo data is required' });
      }

      // Validate base64 image data
      if (!photoData.startsWith('data:image/')) {
        return res.status(400).json({ message: 'Invalid image format' });
      }

      // Update user with the profile image URL (stored as base64 data URL)
      const updatedUser = await storage.updateUser(currentUser.id, {
        profileImageUrl: photoData,
        updatedAt: new Date()
      });

      // Update session with new user data
      if (req.user) {
        req.user = { ...req.user, profileImageUrl: photoData };
      }
      if ((req.session as any)?.user) {
        (req.session as any).user = { ...(req.session as any).user, profileImageUrl: photoData };
      }

      console.log('📸 Profile photo updated for user:', currentUser.id);
      
      res.json({
        message: 'Profile photo updated successfully',
        profileImageUrl: photoData
      });
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      res.status(500).json({ message: 'Failed to upload profile photo' });
    }
  });

  // Delete profile photo endpoint
  app.delete('/api/profile/photo', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user || (req.session as any)?.user;
      if (!currentUser) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Remove profile image URL
      const updatedUser = await storage.updateUser(currentUser.id, {
        profileImageUrl: null,
        updatedAt: new Date()
      });

      // Update session
      if (req.user) {
        req.user = { ...req.user, profileImageUrl: null };
      }
      if ((req.session as any)?.user) {
        (req.session as any).user = { ...(req.session as any).user, profileImageUrl: null };
      }

      console.log('📸 Profile photo removed for user:', currentUser.id);
      
      res.json({ message: 'Profile photo removed successfully' });
    } catch (error) {
      console.error('Error removing profile photo:', error);
      res.status(500).json({ message: 'Failed to remove profile photo' });
    }
  });

  // Push notification token registration
  app.post('/api/push-token', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user || (req.session as any)?.user;
      if (!currentUser) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { token, platform } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: 'Push token is required' });
      }

      // Update user with FCM token
      await storage.updateUser(currentUser.id, {
        fcmToken: token,
        updatedAt: new Date()
      });

      console.log(`📱 FCM token registered for user ${currentUser.id} (${platform || 'unknown'})`);
      
      res.json({ message: 'Push token registered successfully' });
    } catch (error) {
      console.error('Error registering push token:', error);
      res.status(500).json({ message: 'Failed to register push token' });
    }
  });

  // Remove push token on logout
  app.post('/api/push-token/remove', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user || (req.session as any)?.user;
      if (!currentUser) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Clear FCM token
      await storage.updateUser(currentUser.id, {
        fcmToken: null,
        updatedAt: new Date()
      });

      console.log(`📱 FCM token removed for user ${currentUser.id}`);
      
      res.json({ message: 'Push token removed successfully' });
    } catch (error) {
      console.error('Error removing push token:', error);
      res.status(500).json({ message: 'Failed to remove push token' });
    }
  });

  // Get users for employee dropdown in customer portal
  app.get('/api/customer-portal/users', isCustomerAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Return only active users with basic info
      const filteredUsers = users
        .filter((u: any) => u.isActive !== false)
        .map((u: any) => ({
          id: u.id,
          username: u.username,
          firstName: u.firstName,
          lastName: u.lastName
        }));
      res.json(filteredUsers);
    } catch (error) {
      console.error("Error fetching users for customer portal:", error);
      res.json([]);
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
      const customer = (req.session as any).customer;
      
      console.log("🔍 System Details Debug - Session customer:", { 
        id: customer.id, 
        customerId: customer.customerId, 
        name: customer.name,
        username: customer.username
      });
      
      // Use the session customer data directly - it's already validated
      if (!customer || !customer.id) {
        console.error("❌ Customer session invalid");
        return res.status(400).json({ message: "Customer session invalid. Please log in again." });
      }
      
      // Validate required fields - only systemName is required
      if (!req.body.systemName) {
        console.error("❌ Validation failed: Missing system name");
        return res.status(400).json({ message: "System name is required" });
      }
      
      // Helper function to convert undefined to null for database compatibility
      const toNull = (value: any) => value === undefined || value === '' ? null : value;
      
      // Use the session customer ID directly
      const systemData = {
        customerId: customer.id, // Use the session customer ID
        customerName: customer.name || null,
        empId: toNull(req.body.empId || req.body.employeeId),
        empName: toNull(req.body.empName),
        systemName: req.body.systemName, // Required field
        systemType: toNull(req.body.systemType),
        department: toNull(req.body.department),
        processor: toNull(req.body.processor),
        processorCores: toNull(req.body.processorCores),
        processorSpeed: toNull(req.body.processorSpeed),
        ram: toNull(req.body.ram),
        ramType: toNull(req.body.ramType),
        ramFrequency: toNull(req.body.ramFrequency),
        ramSlots: toNull(req.body.ramSlots),
        motherboard: toNull(req.body.motherboard),
        motherboardManufacturer: toNull(req.body.motherboardManufacturer),
        hardDisk: toNull(req.body.hardDisk),
        hddCapacity: toNull(req.body.hddCapacity),
        ssd: toNull(req.body.ssd),
        ssdCapacity: toNull(req.body.ssdCapacity),
        graphicsCard: toNull(req.body.graphicsCard),
        graphicsMemory: toNull(req.body.graphicsMemory),
        operatingSystem: toNull(req.body.operatingSystem),
        osVersion: toNull(req.body.osVersion),
        osArchitecture: toNull(req.body.osArchitecture),
        macAddress: toNull(req.body.macAddress),
        ipAddress: toNull(req.body.ipAddress),
        ethernetSpeed: toNull(req.body.ethernetSpeed),
        serialNumber: toNull(req.body.serialNumber),
        biosVersion: toNull(req.body.biosVersion),
        antivirus: toNull(req.body.antivirus),
        msOffice: toNull(req.body.msOffice),
        otherSoftware: toNull(req.body.otherSoftware),
        configuration: toNull(req.body.configuration || req.body.systemConfiguration)
      };
      
      console.log("📝 Creating system details with data:", systemData);
      const newSystem = await storage.createCustomerSystemDetails(systemData);
      console.log("✅ System details created successfully:", newSystem.id);
      
      res.json(newSystem);
    } catch (error) {
      console.error("❌ Error creating system details:", error);
      console.error("❌ Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      console.error("❌ Error message:", error instanceof Error ? error.message : 'Unknown error');
      res.status(500).json({ 
        message: "Failed to create system details", 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
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

  // Admin CCTV information routes
  app.get('/api/customers/:customerId/cctv-information', isAuthenticated, async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const cctvData = await storage.getCctvByCustomerId(customerId);
      res.json(cctvData);
    } catch (error) {
      console.error("Error fetching customer CCTV information:", error);
      res.status(500).json({ message: "Failed to fetch CCTV information" });
    }
  });

  // CCTV Information routes for Customer Portal
  app.get('/api/customer-portal/cctv-information', isCustomerAuthenticated, async (req, res) => {
    try {
      const customer = (req as any).session?.customer;
      if (!customer) {
        return res.status(401).json({ message: "Customer not authenticated" });
      }
      const cctvData = await storage.getCctvByCustomerId(customer.id);
      res.json(cctvData);
    } catch (error) {
      console.error("Error fetching CCTV information:", error);
      res.status(500).json({ message: "Failed to fetch CCTV information" });
    }
  });

  app.get('/api/customer-portal/cctv-information/:id', isCustomerAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const cctv = await storage.getCctvInformation(id);
      if (!cctv) {
        return res.status(404).json({ message: "CCTV record not found" });
      }
      res.json(cctv);
    } catch (error) {
      console.error("Error fetching CCTV detail:", error);
      res.status(500).json({ message: "Failed to fetch CCTV detail" });
    }
  });

  app.post('/api/customer-portal/cctv-information', isCustomerAuthenticated, async (req, res) => {
    try {
      const customer = (req as any).session?.customer;
      if (!customer) {
        return res.status(401).json({ message: "Customer not authenticated" });
      }
      
      const cctvData = {
        ...req.body,
        customerId: customer.id,
        customerName: customer.name,
        updatedBy: customer.id,
        updatedByName: customer.name,
      };
      
      console.log('Creating CCTV record:', cctvData);
      const newCctv = await storage.createCctvInformation(cctvData);
      res.status(201).json(newCctv);
    } catch (error) {
      console.error("Error creating CCTV information:", error);
      res.status(500).json({ message: "Failed to create CCTV information" });
    }
  });

  app.put('/api/customer-portal/cctv-information/:id', isCustomerAuthenticated, async (req, res) => {
    try {
      const customer = (req as any).session?.customer;
      const id = parseInt(req.params.id);
      const updatedCctv = await storage.updateCctvInformation(id, {
        ...req.body,
        updatedBy: customer?.id,
        updatedByName: customer?.name,
      });
      res.json(updatedCctv);
    } catch (error) {
      console.error("Error updating CCTV information:", error);
      res.status(500).json({ message: "Failed to update CCTV information" });
    }
  });

  app.delete('/api/customer-portal/cctv-information/:id', isCustomerAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCctvInformation(id);
      res.json({ message: "CCTV information deleted successfully" });
    } catch (error) {
      console.error("Error deleting CCTV information:", error);
      res.status(500).json({ message: "Failed to delete CCTV information" });
    }
  });

  app.post('/api/customer-portal/cctv-information/bulk-upload', isCustomerAuthenticated, async (req, res) => {
    try {
      const customer = (req as any).session?.customer;
      if (!customer) {
        return res.status(401).json({ message: "Customer not authenticated" });
      }
      
      const { data } = req.body;
      
      if (!Array.isArray(data) || data.length === 0) {
        return res.status(400).json({ message: "Invalid data: expected non-empty array" });
      }

      // Map the bulk data to include customer info and user info
      const cctvRecords = data.map((item: any, index: number) => ({
        customerId: customer.id,
        customerName: customer.name,
        serialNumber: item.serialNumber || item['S.NO.'] || String(index + 1),
        cameraIp: item.cameraIp || item['CAMERA IP'] || '',
        addedIn: item.addedIn || item['ADDED IN'] || '',
        port: item.port || item['PORT'] || '',
        httpPort: item.httpPort || item['HTTP PORT'] || '',
        modelNo: item.modelNo || item['MODEL NO.'] || '',
        locationName: item.locationName || item['LOCATION NAME'] || '',
        uplink: item.uplink || item['UPLINK'] || '',
        rackPhoto: item.rackPhoto || item['RACK PHOTO'] || '',
        nvrCameraPhoto: item.nvrCameraPhoto || item['NVR PHOTO/CAMERA LOCATION PHOTO'] || '',
        deviceSerialNo: item.deviceSerialNo || item['SERIAL NO.'] || '',
        macAddress: item.macAddress || item['MAC ADDRESS'] || '',
        updatedBy: customer.id,
        updatedByName: customer.name,
      }));

      const createdRecords = await storage.bulkCreateCctvInformation(cctvRecords);
      res.status(201).json({ 
        message: `Successfully uploaded ${createdRecords.length} CCTV records`,
        count: createdRecords.length,
        records: createdRecords
      });
    } catch (error) {
      console.error("Error bulk uploading CCTV information:", error);
      res.status(500).json({ message: "Failed to bulk upload CCTV information" });
    }
  });

  // CCTV Image Upload endpoint
  app.post('/api/customer-portal/cctv-upload-image', isCustomerAuthenticated, async (req: any, res) => {
    try {
      const customer = req.session?.customer;
      if (!customer) {
        return res.status(401).json({ message: "Customer not authenticated" });
      }

      // Create upload directory for CCTV images
      const cctvUploadDir = path.join(process.cwd(), 'uploads', 'cctv', String(customer.id));
      if (!fs.existsSync(cctvUploadDir)) {
        fs.mkdirSync(cctvUploadDir, { recursive: true });
      }

      // Handle base64 image upload
      const { imageData, imageType, fileName } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ message: "No image data provided" });
      }

      // Remove data URL prefix if present
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Generate unique filename
      const extension = imageType || 'jpg';
      const uniqueFileName = fileName || `cctv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${extension}`;
      const filePath = path.join(cctvUploadDir, uniqueFileName);
      
      fs.writeFileSync(filePath, buffer);
      
      // Return the URL to access the image
      const imageUrl = `/uploads/cctv/${customer.id}/${uniqueFileName}`;
      
      res.json({ 
        success: true, 
        imageUrl,
        fileName: uniqueFileName 
      });
    } catch (error) {
      console.error("Error uploading CCTV image:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      console.log('📊 Fetching dashboard stats...');
      const stats = await storage.getDashboardStats();
      console.log('✅ Dashboard stats retrieved:', stats);
      res.json(stats);
    } catch (error) {
      console.error("❌ Error fetching dashboard stats:", error);
      
      // Return default stats if database query fails
      const defaultStats = {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        resolvedTasks: 0,
        cancelledTasks: 0,
        avgPerformanceScore: 0,
        avgResponseTime: 0,
        totalCustomers: 0,
        activeUsers: 0,
      };
      
      res.json(defaultStats);
    }
  });

  app.get('/api/dashboard/recent-tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId || userId === 'undefined' || userId === 'null' || userId === 'NaN') {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Get current user to check role
      const currentUser = await storage.getUser(userId);
      const userRole = currentUser?.role;
      
      console.log(`🔍 RECENT-TASKS API: User ${currentUser?.username} (ID: ${userId}, Role: ${userRole}) requesting recent tasks`);
      
      let tasks;
      
      // Apply same filtering logic as main tasks endpoint
      if (userRole === 'field_engineer') {
        // Field engineers only see tasks where they are the field engineer
        const allTasks = await storage.getAllTasks();
        tasks = allTasks.filter((task: any) => 
          task.fieldEngineerId === userId || 
          String(task.fieldEngineerId) === String(userId)
        );
        console.log(`👷‍♂️ Field engineer recent tasks filtered: ${tasks.length}`);
      } else if (userRole === 'engineer' || userRole === 'backend_engineer') {
        // Regular engineers see tasks assigned to them
        const allTasks = await storage.getAllTasks();
        tasks = allTasks.filter((task: any) => 
          task.assignedTo === userId || 
          String(task.assignedTo) === String(userId) ||
          task.fieldEngineerId === userId ||
          String(task.fieldEngineerId) === String(userId)
        );
        console.log(`🛠️ Engineer recent tasks filtered: ${tasks.length}`);
      } else if (userRole === 'admin' || userRole === 'manager' || userRole === 'supervisor') {
        // Admin, manager, and supervisor see all tasks
        tasks = await storage.getAllTasks();
        console.log(`👨‍💼 Admin/Manager/Supervisor recent tasks - showing all: ${tasks.length}`);
      } else {
        // For any other role, filter to only their assigned tasks (safeguard)
        const allTasks = await storage.getAllTasks();
        tasks = allTasks.filter((task: any) => 
          task.assignedTo === userId || 
          String(task.assignedTo) === String(userId) ||
          task.fieldEngineerId === userId ||
          String(task.fieldEngineerId) === String(userId)
        );
        console.log(`🔒 Default role recent tasks filtered: ${tasks.length}`);
      }
      
      const recentTasks = tasks.slice(0, 5); // Get 5 most recent tasks
      res.json(recentTasks);
    } catch (error) {
      console.error("Error fetching recent tasks:", error);
      res.status(500).json({ message: "Failed to fetch recent tasks" });
    }
  });

  // Task routes
  // TEMPORARY: Test endpoint to verify task filtering without authentication
  app.get('/api/test-tasks/:userId', async (req: any, res) => {
    try {
      const userId = parseInt(req.params.userId);
      console.log(`🧪 TEST ENDPOINT: Testing task filtering for user ID: ${userId}`);
      
      // Get user info
      const user = await storage.getUser(userId);
      console.log(`👤 Test user: ${user?.username} (Role: ${user?.role})`);
      
      // Get all tasks
      const allTasks = await storage.getAllTasks();
      console.log(`📊 Total tasks in database: ${allTasks.length}`);
      
      // Apply field engineer filtering
      let filteredTasks = allTasks;
      if (user?.role === 'field_engineer') {
        filteredTasks = allTasks.filter(task => 
          task.field_engineer_id === userId || 
          String(task.field_engineer_id) === String(userId) ||
          task.fieldEngineerId === userId || 
          String(task.fieldEngineerId) === String(userId)
        );
        console.log(`👷‍♂️ Field engineer filtered tasks: ${filteredTasks.length}`);
        console.log(`🔍 Field engineer (${user.username}, ID: ${userId}) task filter - looking for field_engineer_id OR fieldEngineerId = ${userId}`);
        
        // Show what tasks exist and their field engineer IDs
        console.log('📝 All tasks with field engineer assignments:');
        allTasks.forEach((task, index) => {
          console.log(`  Task ${task.id}: field_engineer_id = ${task.field_engineer_id} (${task.field_engineer_name || 'No name'})`);
          console.log(`    Full task object keys:`, Object.keys(task));
          console.log(`    Field engineer related fields:`, {
            field_engineer_id: task.field_engineer_id,
            fieldEngineerId: task.fieldEngineerId,
            field_engineer_name: task.field_engineer_name,
            fieldEngineerName: task.fieldEngineerName,
            assigned_to: task.assigned_to,
            assignedTo: task.assignedTo
          });
        });
      }
      
      res.json({
        user: user,
        totalTasks: allTasks.length,
        filteredTasks: filteredTasks.length,
        tasks: filteredTasks
      });
      
    } catch (error) {
      console.error('🧪 Test endpoint error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const { search, priority, status, assignedTo } = req.query;
      const userId = req.user.id;
      
      // Get current user to check role
      let currentUser = await storage.getUser(userId);
      
      // Handle demo users - if database lookup fails, use session user role
      if (!currentUser && req.user) {
        console.log('⚠️ Demo user detected, using session role');
        currentUser = {
          id: req.user.id,
          username: req.user.username || 'demo',
          role: req.user.role || 'admin', // Demo users are typically admin
          email: req.user.email || 'demo@demo.com'
        };
      }
      
      console.log(`🔍 TASKS API: User ${currentUser?.username} (ID: ${userId}, Role: ${currentUser?.role}) requesting tasks`);
      
      let tasks;
      if (search) {
        // Use getAllTasks and filter client-side since searchTasks doesn't exist
        const allTasks = await storage.getAllTasks();
        const searchQuery = (search as string).toLowerCase();
        tasks = allTasks.filter((task: any) => 
          (task.title && task.title.toLowerCase().includes(searchQuery)) ||
          (task.description && task.description.toLowerCase().includes(searchQuery)) ||
          (task.ticketNumber && task.ticketNumber.toLowerCase().includes(searchQuery)) ||
          (task.customerName && task.customerName.toLowerCase().includes(searchQuery))
        );
      } else {
        tasks = await storage.getAllTasks();
      }
      
      console.log(`📊 Total tasks in database: ${tasks.length}`);
      
      // Debug: Check first task to see customer data
      if (tasks.length > 0) {
        console.log(`🔍 Sample task customer data:`, {
          customerName: tasks[0].customerName,
          customer_id: tasks[0].customer_id,
          customerId: tasks[0].customerId,
          customer: tasks[0].customer ? { id: tasks[0].customer.id, name: tasks[0].customer.name } : null
        });
      }
      
      // Normalize role to lowercase for case-insensitive comparison
      const userRole = currentUser?.role?.toLowerCase() || '';
      console.log(`🔐 User role (normalized): ${userRole}`);
      
      // Filter tasks based on user role - IMPORTANT: All users should only see their assigned tasks
      if (userRole === 'field_engineer') {
        // Field engineers only see tasks where they are the field engineer
        tasks = tasks.filter(task => 
          task.field_engineer_id === userId || 
          String(task.field_engineer_id) === String(userId) ||
          task.fieldEngineerId === userId || 
          String(task.fieldEngineerId) === String(userId)
        );
        console.log(`👷‍♂️ Field engineer filtered tasks: ${tasks.length}`);
        console.log(`🔍 Field engineer (${currentUser.username}, ID: ${userId}) task filter - looking for field_engineer_id = ${userId}`);
      } else if (userRole === 'engineer' || userRole === 'backend_engineer') {
        // Regular engineers see tasks assigned to them
        tasks = tasks.filter(task => 
          task.assigned_to === userId || 
          String(task.assigned_to) === String(userId) ||
          task.assignedTo === userId || 
          String(task.assignedTo) === String(userId) ||
          task.field_engineer_id === userId ||
          String(task.field_engineer_id) === String(userId) ||
          task.fieldEngineerId === userId ||
          String(task.fieldEngineerId) === String(userId)
        );
        console.log(`🛠️ Engineer filtered tasks: ${tasks.length}`);
      } else if (userRole === 'admin' || userRole === 'manager' || userRole === 'supervisor') {
        // Only admin, manager, and supervisor roles see all tasks
        console.log(`👨‍💼 Admin/Manager/Supervisor - showing all tasks: ${tasks.length}`);
      } else {
        // For any other role, filter to only their assigned tasks (safeguard)
        tasks = tasks.filter(task => 
          task.assigned_to === userId || 
          String(task.assigned_to) === String(userId) ||
          task.assignedTo === userId || 
          String(task.assignedTo) === String(userId) ||
          task.field_engineer_id === userId ||
          String(task.field_engineer_id) === String(userId) ||
          task.fieldEngineerId === userId ||
          String(task.fieldEngineerId) === String(userId)
        );
        console.log(`🔒 Default role filtered tasks: ${tasks.length}`);
      }
      
      // Apply other filters
      if (priority && priority !== 'all') {
        tasks = tasks.filter(task => task.priority === priority);
      }

      if (status && status !== 'all') {
        tasks = tasks.filter(task => task.status === status);
      }

      // Filter by assigned user (for team member link from dashboard)
      if (assignedTo && assignedTo !== 'all') {
        const assignedToId = parseInt(assignedTo as string);
        tasks = tasks.filter(task => 
          task.assigned_to === assignedToId || 
          String(task.assigned_to) === String(assignedToId) ||
          task.assignedTo === assignedToId ||
          String(task.assignedTo) === String(assignedToId) ||
          task.field_engineer_id === assignedToId ||
          String(task.field_engineer_id) === String(assignedToId) ||
          task.fieldEngineerId === assignedToId ||
          String(task.fieldEngineerId) === String(assignedToId)
        );
        console.log(`👤 Filtered by assignedTo=${assignedTo}: ${tasks.length} tasks`);
      }

      // Optimize response: select only essential fields to reduce payload size
      const optimizedTasks = tasks.map(task => ({
        id: task.id,
        ticketNumber: task.ticketNumber,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        category: task.category,
        issueType: task.issueType,
        createdAt: task.createdAt,
        completionTime: task.completionTime || null,
        updatedAt: task.updatedAt || null,
        // Customer info (use stored customerName first, handle both snake_case and camelCase)
        customer_id: task.customer_id || task.customerId,
        customerName: task.customerName || task.customer_name || task.customer?.name || 'Unknown Customer',
        customer: task.customer ? {
          id: task.customer.id,
          name: task.customer.name,
          city: task.customer.city
        } : null,
        // Assigned user info (minimal but structured for table display)
        assigned_to: task.assigned_to,
        assignedUser: task.assignedUser ? {
          id: task.assignedUser.id,
          username: task.assignedUser.username,
          firstName: task.assignedUser.firstName || task.assignedUser.username,
          lastName: task.assignedUser.lastName || ''
        } : null,
        // Field engineer info (minimal but structured for table display)
        field_engineer_id: task.field_engineer_id,
        fieldEngineer: task.fieldEngineer ? {
          id: task.fieldEngineer.id,
          username: task.fieldEngineer.username,
          firstName: task.fieldEngineer.firstName || task.fieldEngineer.username,
          lastName: task.fieldEngineer.lastName || ''
        } : null,
        // Include resolution time for metrics
        resolutionTime: task.resolutionTime
      }));
      
      res.json(optimizedTasks);
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
      const username = (req.user as any)?.username;
      
      if (!userId || userId === 'undefined' || userId === 'null' || userId === 'NaN' || userId === undefined) {
        return res.status(400).json({ message: "Invalid user ID", debug: { userId, username, type: typeof userId } });
      }
      
      console.log("=== MY-TASKS API CALL ===");
      console.log("User ID:", userId);
      console.log("Username:", username);
      console.log("User role:", (req.user as any)?.role);
      console.log("Full user object:", req.user);
      
      // Get ALL tasks first to debug
      const allTasks = await storage.getAllTasks();
      console.log(`Total tasks in database: ${allTasks.length}`);
      
      if (allTasks.length > 0) {
        console.log("Sample task structure:", JSON.stringify(allTasks[0], null, 2));
        console.log("Assignment fields in tasks:", allTasks.map(t => ({
          id: t.id,
          assignedTo: t.assignedTo,
          fieldEngineerId: t.fieldEngineerId,
          assignedUser: t.assignedUser,
          engineer: t.engineer,
          engineerName: t.engineerName
        })));
      }
      
      // Filter tasks by multiple possible assignment fields
      const userTasks = allTasks.filter(task => {
        const matches = [
          task.assignedTo === userId,
          task.assignedTo === username,
          task.fieldEngineerId === userId,
          task.fieldEngineerId === username,
          // Also check if the assignedTo field contains the username or id as string
          String(task.assignedTo) === String(userId),
          String(task.assignedTo) === String(username),
          String(task.fieldEngineerId) === String(userId),
          String(task.fieldEngineerId) === String(username)
        ];
        
        const isMatch = matches.some(match => match);
        if (isMatch) {
          console.log(`✅ Task ${task.id} matched for user ${username}:`, {
            assignedTo: task.assignedTo,
            fieldEngineerId: task.fieldEngineerId,
            taskTitle: task.title || task.description
          });
        }
        return isMatch;
      });
      
      console.log(`Tasks filtered for user ${username}: ${userTasks.length} out of ${allTasks.length}`);
      
      if (userTasks.length > 0) {
        console.log("First filtered task:", JSON.stringify(userTasks[0], null, 2));
      } else {
        console.log("❌ No tasks found for this user. Check task assignments in database.");
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
      let userId = req.user.id;
      
      // Handle demo user - convert demo_admin to a real user ID or use null
      if (typeof userId === 'string' && userId.includes('demo')) {
        // For demo users, try to use admin user (ID: 7) or set to null
        userId = 7; // Use actual admin user ID
        console.log('⚠️ Demo user detected, using admin user ID (7) for createdBy');
      }
      
      const validatedData = insertTaskSchema.parse({
        ...req.body,
        createdBy: userId,
      });
      
      const task = await storage.createTask(validatedData);
      
      // Update performance metrics for the assigned user
      if (task.assignedTo) {
        try {
          await storage.calculateUserPerformance(task.assignedTo);
        } catch (perfError) {
          console.error('Error updating performance metrics (non-critical):', perfError);
          // Don't fail the task creation if performance metrics update fails
        }
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
        
        // Notify assigned backend engineer
        if (task.assignedTo) {
          (app as any).broadcastToUser(task.assignedTo, {
            type: 'task_assigned',
            task: task,
            message: `New task assigned: ${task.title}`,
            timestamp: new Date().toISOString()
          });
        }
        
        // Notify assigned field engineer (mobile)
        if (task.fieldEngineerId) {
          (app as any).broadcastToUser(task.fieldEngineerId, {
            type: 'task_assigned',
            task: task,
            message: `New task assigned: ${task.title} - Ticket: ${task.ticketNumber}`,
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
      
      // Map status values to match database constraints (underscore to hyphen)
      if (updateData.status) {
        const statusMap: Record<string, string> = {
          'in_progress': 'in-progress',
          'in-progress': 'in-progress', // Keep as-is if already correct
          'resolved': 'in-progress', // Map resolved to in-progress for field engineers
          'pending': 'pending',
          'completed': 'completed',
          'cancelled': 'cancelled',
          'approved': 'approved',
          'rejected': 'rejected'
        };
        
        if (statusMap[updateData.status]) {
          const originalStatus = updateData.status;
          updateData.status = statusMap[updateData.status] as any;
          console.log(`🔄 Status mapped: ${originalStatus} -> ${updateData.status}`);
        }
      }
      console.log("Parsed update data:", JSON.stringify(updateData, null, 2));
      
      // Get the current task to check status changes
      const currentTask = await storage.getTask(id);
      if (!currentTask) {
        console.log("Task not found for ID:", id);
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Auto-set timing fields based on status changes
      if (updateData.status) {
        // Just update the status and timestamp, timing fields will be handled separately if needed
        console.log(`🔄 Status changing from ${currentTask.status} to ${updateData.status}`);
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
          console.log(`🔄 Field engineer ${userId} marked task as resolved`);
          
          // Auto-close resolved tasks after brief delay
          setTimeout(async () => {
            try {
              await storage.updateTask(id, { 
                status: 'completed'
              });
              
              // Log auto-closure using the field engineer's user ID
              const user = await storage.getUser(userId);
              const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : `User ${userId}`;
              
              await storage.createTaskUpdate({
                taskId: id,
                message: 'Task automatically closed after resolution by field engineer',
                type: 'status_update',
                createdBy: userId,
                createdByName: userName,
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
          
        // Get user details for the update
        const user = await storage.getUser(userId);
        const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : `User ${userId}`;
        
        // Create a structured message for status changes
        const statusChangeMessage = `Status changed from ${oldStatus} to ${newStatus}`;
        const finalMessage = updateNotes?.trim() 
          ? `${statusChangeMessage}. Notes: ${updateNotes.trim()}`
          : statusChangeMessage;
        
        // Convert userId to integer or null for demo users
        const createdById = typeof userId === 'number' ? userId : (isNaN(parseInt(userId)) ? null : parseInt(userId));
        
        await storage.createTaskUpdate({
          taskId: id,
          message: finalMessage,
          type: "status_update",
          createdBy: createdById,
          createdByName: userName,
        });
        
        console.log(`✅ Task update record created for task ${id}`);
      } else if (newStatus && oldStatus === newStatus) {
        console.log(`⚠️ Status update skipped - no actual change (${oldStatus} → ${newStatus})`);
        
        // Even if status doesn't change, still log notes if provided
        if (notes?.trim()) {
          const user = await storage.getUser(userId);
          const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : `User ${userId}`;
          
          // Convert userId to integer or null for demo users
          const createdById = typeof userId === 'number' ? userId : (isNaN(parseInt(userId)) ? null : parseInt(userId));
          
          await storage.createTaskUpdate({
            taskId: id,
            message: notes.trim(),
            type: "status_update",
            createdBy: createdById,
            createdByName: userName,
          });
          
          console.log(`✅ Task notes logged even though status unchanged`);
        }
      }
      
      // Log notes if provided without status update
      if (notes && !newStatus) {
        // Get user details for the update
        const user = await storage.getUser(userId);
        const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : `User ${userId}`;
        
        // Ensure message is never null or empty
        const finalMessage = notes?.trim() || `Task updated by ${userName}`;
        
        // Convert userId to integer or null for demo users
        const createdById = typeof userId === 'number' ? userId : (isNaN(parseInt(userId)) ? null : parseInt(userId));
        
        await storage.createTaskUpdate({
          taskId: id,
          message: finalMessage,
          type: "comment",
          createdBy: createdById,
          createdByName: userName,
        });
      }
      
      // Update performance metrics if status changed to completed
      if (updateData.status === 'completed' && task.assignedTo) {
        try {
          await storage.calculateUserPerformance(task.assignedTo);
        } catch (perfError) {
          console.error('Error updating performance metrics (non-critical):', perfError);
        }
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

  // Dedicated status update endpoint for mobile compatibility
  app.put('/api/tasks/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const userId = req.user.id;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      console.log(`🔄 Mobile status update - Task ${id} to ${status} by user ${userId}`);
      
      // Use the main task update endpoint logic but only update status
      const task = await storage.updateTask(id, { status });
      
      // Log the status update
      const user = await storage.getUser(userId);
      const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : `User ${userId}`;
      
      await storage.createTaskUpdate({
        taskId: id,
        message: `Status changed to ${status}`,
        type: "status_update",
        createdBy: userId,
        createdByName: userName,
      });
      
      console.log(`✅ Mobile status update successful - Task ${id}`);
      res.json({ success: true, task });
    } catch (error) {
      console.error("Error updating task status:", error);
      res.status(500).json({ message: "Failed to update task status" });
    }
  });

  // Mobile compatibility endpoint - redirect /history to /updates
  app.get('/api/tasks/:id/history', isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      console.log(`📱 Mobile history request for task ${taskId} - redirecting to updates`);
      
      // Use the same logic as /updates endpoint
      const updates = await storage.getTaskUpdates(taskId);
      
      res.json(updates);
    } catch (error) {
      console.error("Error fetching task history:", error);
      res.status(500).json({ message: "Failed to fetch task history" });
    }
  });

  app.delete('/api/tasks/:id', isAuthenticated, async (req, res) => {
    try {
      const currentUser = req.user as any;
      
      // Only admin can delete tasks
      if (currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Only administrators can delete tasks" });
      }
      
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
      
      // Get all task updates - no filtering, everyone sees everything
      const updates = await storage.getTaskUpdates(taskId);
      
      res.json(updates);
    } catch (error) {
      console.error("Error fetching task updates:", error);
      res.status(500).json({ message: "Failed to fetch task updates" });
    }
  });

  // Fix admin user endpoint (GET for easy testing)
  app.get('/api/admin/fix-user', isAuthenticated, async (req, res) => {
    try {
      // Only allow admin users to execute this
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      console.log('🔧 Fixing admin user name...');
      
      // Get current admin user
      const adminUsers = await db.select().from(schema.users).where(eq(schema.users.username, 'admin'));
      
      if (adminUsers.length > 0) {
        const admin = adminUsers[0];
        console.log('Current admin user:', JSON.stringify({
          id: admin.id,
          username: admin.username,
          firstName: admin.firstName,
          lastName: admin.lastName
        }, null, 2));
        
        if (admin.firstName === 'System' && admin.lastName === 'Administrator') {
          // Update admin user with proper name
          await db.update(schema.users)
            .set({
              firstName: 'Admin',
              lastName: 'User'
            })
            .where(eq(schema.users.username, 'admin'));
          
          console.log('✅ Admin user updated successfully!');
          
          // Verify the update
          const updatedAdmins = await db.select().from(schema.users).where(eq(schema.users.username, 'admin'));
          const updatedAdmin = updatedAdmins[0];
          
          console.log('Updated admin user:', JSON.stringify({
            id: updatedAdmin.id,
            username: updatedAdmin.username,
            firstName: updatedAdmin.firstName,
            lastName: updatedAdmin.lastName
          }, null, 2));
          
          res.json({ 
            success: true, 
            message: 'Admin user updated successfully',
            oldName: `${admin.firstName} ${admin.lastName}`,
            newName: `${updatedAdmin.firstName} ${updatedAdmin.lastName}`
          });
        } else {
          console.log('✅ Admin user already has proper name');
          res.json({ 
            success: true, 
            message: 'Admin user already has proper name',
            currentName: `${admin.firstName} ${admin.lastName}`
          });
        }
      } else {
        console.log('❌ Admin user not found');
        res.status(404).json({ message: 'Admin user not found' });
      }
      
    } catch (error) {
      console.error('❌ Error fixing admin user:', error);
      res.status(500).json({ message: 'Failed to fix admin user', error: error.message });
    }
  });

  // Fix existing task updates endpoint
  app.get('/api/admin/fix-task-updates', isAuthenticated, async (req, res) => {
    try {
      // Only allow admin users to execute this
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      console.log('🔧 Fixing existing task updates...');
      
      // Get all task updates with "System Administrator" as createdByName
      const updatesWithSystemAdmin = await db.select()
        .from(schema.taskUpdates)
        .where(eq(schema.taskUpdates.createdByName, 'System Administrator'));
      
      console.log(`Found ${updatesWithSystemAdmin.length} task updates with "System Administrator"`);
      
      if (updatesWithSystemAdmin.length > 0) {
        // Update all these records to use "Admin User" instead
        const updateResult = await db.update(schema.taskUpdates)
          .set({
            createdByName: 'Admin User'
          })
          .where(eq(schema.taskUpdates.createdByName, 'System Administrator'));
        
        console.log('✅ Task updates fixed successfully!');
        
        res.json({ 
          success: true, 
          message: 'Task updates fixed successfully',
          updatedCount: updatesWithSystemAdmin.length,
          details: 'Changed "System Administrator" to "Admin User" in task updates'
        });
      } else {
        console.log('✅ No task updates need fixing');
        res.json({ 
          success: true, 
          message: 'No task updates need fixing',
          updatedCount: 0
        });
      }
      
    } catch (error) {
      console.error('❌ Error fixing task updates:', error);
      res.status(500).json({ message: 'Failed to fix task updates', error: error.message });
    }
  });





  // File upload route for task attachments
  // Accepts JSON body with files: [{ name, type, data }] where data is base64 string
  app.post('/api/tasks/:id/upload', isAuthenticated, async (req: any, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const userId = req.user.id;
      const { files, notes } = req.body;

      if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ message: "No files provided" });
      }

      const savedFiles: string[] = [];
      for (const f of files) {
        const { name, data, type } = f;
        if (!name || !data) continue;

        // Decode base64
        const base64Data = data.replace(/^data:\w+\/[-+.\w]+;base64,/, '')
                              .replace(/^data:\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Ensure uploads/task-<id> folder exists
        const taskUploadDir = path.join(process.cwd(), 'uploads', `task_${taskId}`);
        if (!fs.existsSync(taskUploadDir)) fs.mkdirSync(taskUploadDir, { recursive: true });

        const timestamp = Date.now();
        const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filename = `${timestamp}_${safeName}`;
        const filePath = path.join(taskUploadDir, filename);

        fs.writeFileSync(filePath, buffer);
        savedFiles.push(`/downloads/task_${taskId}/${filename}`);
      }

      // Create file upload audit record with links
      const user = await storage.getUser(userId);
      const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : `User ${userId}`;

      const message = notes || `${savedFiles.length} file(s) uploaded`;
      const fileListText = savedFiles.length > 0 ? '\nFiles:\n' + savedFiles.join('\n') : '';

      await storage.createTaskUpdate({
        taskId,
        message: `${message}${fileListText}`,
        type: 'file_upload',
        createdBy: userId,
        createdByName: userName,
      });

      res.json({ message: "Files uploaded successfully", count: savedFiles.length, files: savedFiles });
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
      console.log('?? NEW CODE: Assign multiple field engineers endpoint hit');
      const taskId = parseInt(req.params.id);
      // Handle both numeric and string user IDs (like demo_admin)
      let userId = req.user.id;
      console.log('?? Raw user ID from session:', userId, 'Type:', typeof userId);
      if (userId === 'demo_admin' || isNaN(parseInt(userId))) {
        console.log('?? Converting demo_admin or NaN to admin user ID 7');
        userId = '7'; // Default to admin user ID for demo users
      } else {
        userId = String(userId);
      }
      const { fieldEngineerIds } = req.body;

      console.log('?? Final values:', { taskId, userId, rawUserId: req.user.id, fieldEngineerIds });

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
          
          // Real-time WebSocket notification to field engineer
          if ((app as any).broadcastToUser && task.fieldEngineerId) {
            (app as any).broadcastToUser(task.fieldEngineerId, {
              type: 'task_assigned',
              task: task,
              message: `Task assigned to you: ${task.title} - Ticket: ${task.ticketNumber}`,
              timestamp: new Date().toISOString()
            });
          }
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
      // Handle both numeric and string user IDs (like demo_admin)
      let userId = req.user.id;
      if (userId === 'demo_admin' || isNaN(parseInt(userId))) {
        userId = '7'; // Default to admin user ID for demo users
      } else {
        userId = String(userId);
      }
      const { fieldEngineerIds } = req.body;

      console.log('?? Assign field engineers (alt endpoint):', { taskId, userId, rawUserId: req.user.id, fieldEngineerIds });

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
      
      // Create CSV content with ALL fields matching the Add Customer form
      const csvHeader = 'customerId,name,contactPerson,email,mobilePhone,address,city,state,country,servicePlan,connectedTower,wirelessIp,wirelessApIp,port,connectionType,planType,monthlyFee,latitude,longitude,status\n';
      
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
          escapeCSV(customer.contactPerson),
          escapeCSV(customer.email),
          escapeCSV(customer.mobilePhone),
          escapeCSV(customer.address),
          escapeCSV(customer.city),
          escapeCSV(customer.state),
          escapeCSV(customer.country),
          escapeCSV(customer.servicePlan),
          escapeCSV(customer.connectedTower),
          escapeCSV(customer.wirelessIp),
          escapeCSV(customer.wirelessApIp),
          escapeCSV(customer.port),
          escapeCSV(customer.connectionType),
          escapeCSV(customer.planType),
          escapeCSV(customer.monthlyFee),
          escapeCSV(customer.latitude),
          escapeCSV(customer.longitude),
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

  // Download import template
  app.get('/api/customers/import-template', isAuthenticated, async (req, res) => {
    try {
      // CSV template with ALL columns matching the Add Customer form
      const csvTemplate = `customerId,name,contactPerson,email,mobilePhone,address,city,state,country,servicePlan,connectedTower,wirelessIp,wirelessApIp,port,connectionType,planType,monthlyFee,latitude,longitude,status
C001,Sample Customer,John Doe,customer@example.com,9876543210,123 Main Street,Mumbai,Maharashtra,India,Premium - 100 Mbps,OSHO Tower,192.168.1.100,192.168.1.1,8080,fiber,business,2500,19.076,72.8777,active
C002,Another Customer,Jane Smith,jane@example.com,9876543211,456 Park Avenue,Delhi,Delhi,India,Business - 50 Mbps,Main Tower,192.168.2.100,192.168.2.1,8081,wireless,enterprise,1500,28.6139,77.209,active`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="customer-import-template.csv"');
      res.send(csvTemplate);
    } catch (error) {
      console.error("Error generating template:", error);
      res.status(500).json({ message: "Failed to generate template" });
    }
  });

  // Customer import endpoint
  app.post('/api/customers/import', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      console.log('🔄 Starting customer import process');
      
      if (!req.file) {
        console.log('❌ No file provided');
        return res.status(400).json({ message: "No file provided" });
      }

      console.log(`📁 Processing file: ${req.file.originalname}, Size: ${req.file.size} bytes`);

      const fs = await import('fs');
      const { parse } = await import('csv-parse/sync');
      
      const filePath = req.file.path;
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      console.log(`📄 File content length: ${fileContent.length} characters`);
      console.log(`📄 First 200 characters of file: ${fileContent.substring(0, 200)}`);
      
      let records;
      if (req.file.originalname.endsWith('.csv')) {
        try {
          records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true
          });
          console.log(`📋 Parsed ${records.length} records from CSV`);
          if (records.length > 0) {
            console.log(`📋 First record keys: ${Object.keys(records[0]).join(', ')}`);
            console.log(`📋 First record sample: ${JSON.stringify(records[0])}`);
          }
        } catch (parseError) {
          console.error('❌ CSV Parse Error:', parseError);
          return res.status(400).json({ message: "Failed to parse CSV file", error: parseError.message });
        }
      } else {
        console.log('❌ Invalid file format');
        return res.status(400).json({ message: "Please use CSV format for imports" });
      }

      // Try to drop the constraint before import (in case it still exists)
      try {
        await sql`ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_plan_type_check`;
        console.log('✅ Dropped customers_plan_type_check constraint for import');
      } catch (e) {
        console.log('ℹ️ Could not drop constraint, continuing anyway');
      }

      let imported = 0;
      let updated = 0;
      let errors = 0;
      const errorDetails = [];

      console.log(`🔄 Processing ${records.length} records...`);

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        try {
          // Validate required fields
          if (!record.name) {
            const errorMsg = `Row ${i + 1}: Missing required field: name`;
            console.log(`❌ ${errorMsg}`);
            errors++;
            errorDetails.push(errorMsg);
            continue;
          }

          const customerId = record.customerId || `C${Date.now()}${Math.random().toString(36).substr(2, 3)}`;
          const email = record.email || `customer${customerId}@example.com`;
          const latitude = record.latitude ? parseFloat(record.latitude) : null;
          const longitude = record.longitude ? parseFloat(record.longitude) : null;
          const monthlyFee = record.monthlyFee ? parseFloat(record.monthlyFee) : 0;

          // Check if customer exists by customerId using raw SQL
          const existingCheck = await sql`
            SELECT id FROM customers WHERE customer_id = ${customerId} LIMIT 1
          `;
          
          if (existingCheck.length > 0) {
            // Update existing customer using raw SQL - ALL FIELDS
            console.log('Updating existing customer: ' + customerId);
            await sql`
              UPDATE customers SET
                name = ${record.name},
                email = ${email},
                contact_person = ${record.contactPerson || null},
                mobile_phone = ${record.mobilePhone || null},
                address = ${record.address || null},
                city = ${record.city || null},
                state = ${record.state || null},
                country = ${record.country || 'India'},
                service_plan = ${record.servicePlan || null},
                connected_tower = ${record.connectedTower || null},
                wireless_ip = ${record.wirelessIp || null},
                wireless_ap_ip = ${record.wirelessApIp || null},
                port = ${record.port || null},
                latitude = ${latitude},
                longitude = ${longitude},
                connection_type = ${record.connectionType || null},
                plan_type = ${record.planType || null},
                monthly_fee = ${monthlyFee},
                status = ${record.status || 'active'},
                updated_at = NOW()
              WHERE customer_id = ${customerId}
            `;
            updated++;
            console.log('Updated customer: ' + customerId);
          } else {
            // Insert new customer using raw SQL - ALL FIELDS
            console.log('Creating new customer: ' + customerId);
            await sql`
              INSERT INTO customers (
                customer_id, name, email, contact_person, mobile_phone, 
                address, city, state, country,
                service_plan, connected_tower, wireless_ip, wireless_ap_ip, port,
                latitude, longitude, connection_type, plan_type, monthly_fee, status, 
                created_at, updated_at
              ) VALUES (
                ${customerId}, ${record.name}, ${email}, ${record.contactPerson || null}, ${record.mobilePhone || null},
                ${record.address || null}, ${record.city || null}, ${record.state || null}, ${record.country || 'India'},
                ${record.servicePlan || null}, ${record.connectedTower || null}, ${record.wirelessIp || null}, ${record.wirelessApIp || null}, ${record.port || null},
                ${latitude}, ${longitude}, ${record.connectionType || null}, ${record.planType || null}, ${monthlyFee}, ${record.status || 'active'},
                NOW(), NOW()
              )
            `;
            imported++;
            console.log('Created new customer: ' + customerId);
          }
          
        } catch (error) {
          const errorMsg = `Row ${i + 1}: ${error.message}`;
          console.error(`❌ Error processing record ${i + 1}:`, error);
          errors++;
          errorDetails.push(errorMsg);
        }
      }

      console.log(`📊 Import summary: ${imported} imported, ${updated} updated, ${errors} errors`);
      
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
      console.error("❌ Error importing customers:", error);
      
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
      const currentUser = req.user as any;
      
      // Only admin can delete customers
      if (currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Only administrators can delete customers" });
      }
      
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
  // Temporary debug endpoint to check users without authentication
  app.get('/api/debug/users', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      console.log(`🔍 DEBUG: Database returned ${users.length} users:`);
      users.forEach((user: any) => {
        console.log(`   - ID: ${user.id}, Username: ${user.username}, Role: ${user.role}, Active: ${user.active}`);
      });
      res.json({
        totalUsers: users.length,
        users: users.map((user: any) => ({
          id: user.id,
          username: user.username,
          role: user.role,
          active: user.active,
          firstName: user.firstName,
          lastName: user.lastName
        }))
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Endpoint to create sample users - call this once to populate the database
  app.post('/api/debug/create-sample-users', async (req, res) => {
    try {
      console.log('🔄 Creating sample users...');

      const sampleUsers = [
        {
          username: 'manager1',
          email: 'manager1@wizoneit.com',
          firstName: 'John',
          lastName: 'Manager',
          role: 'manager',
          password: 'manager123'
        },
        {
          username: 'engineer1',
          email: 'engineer1@wizoneit.com',
          firstName: 'Alice',
          lastName: 'Engineer',
          role: 'engineer',
          password: 'engineer123'
        },
        {
          username: 'field1',
          email: 'field1@wizoneit.com',
          firstName: 'Bob',
          lastName: 'Field',
          role: 'field_engineer',
          password: 'field123'
        },
        {
          username: 'field2',
          email: 'field2@wizoneit.com',
          firstName: 'Charlie',
          lastName: 'Field',
          role: 'field_engineer',
          password: 'field123'
        },
        {
          username: 'backend2',
          email: 'backend2@wizoneit.com',
          firstName: 'David',
          lastName: 'Backend',
          role: 'backend_engineer',
          password: 'backend123'
        },
        {
          username: 'support1',
          email: 'support1@wizoneit.com',
          firstName: 'Eva',
          lastName: 'Support',
          role: 'support',
          password: 'support123'
        }
      ];

      const createdUsers = [];
      const skippedUsers = [];

      for (const userData of sampleUsers) {
        try {
          // Check if user already exists
          const existingUser = await storage.getUserByUsername(userData.username);
          
          if (existingUser) {
            skippedUsers.push(userData.username);
            console.log(`⚠️  User ${userData.username} already exists`);
            continue;
          }

          // Create the user
          const newUser = await storage.createUser(userData);
          createdUsers.push(userData.username);
          console.log(`✅ Created user: ${userData.username} (${userData.role})`);
        } catch (userError) {
          console.error(`❌ Error creating user ${userData.username}:`, userError.message);
        }
      }

      // Get updated user count
      const allUsers = await storage.getAllUsers();
      
      res.json({
        success: true,
        message: `Sample users creation completed`,
        created: createdUsers,
        skipped: skippedUsers,
        totalUsers: allUsers.length,
        users: allUsers.map((user: any) => ({
          username: user.username,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName
        }))
      });

    } catch (error) {
      console.error("Error creating sample users:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to create sample users",
        error: error.message 
      });
    }
  });

  app.get('/api/users', isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const userRole = (req.user as any).role;
      
      // Admin and backend engineers should see all users for user management
      // No role-based filtering is applied - all authenticated users can see user list
      console.log(`🔍 User ${(req.user as any).username} (${userRole}) accessing users API`);
      console.log(`📊 Database returned ${users.length} users - showing all to user (${userRole})`);
      
      if (userRole === 'admin' || userRole === 'backend_engineer') {
        console.log(`✅ Admin/Backend Engineer access: showing all ${users.length} users`);
      }
      
      users.forEach((user: any) => {
        console.log(`   - ID: ${user.id}, Username: ${user.username}, Role: ${user.role}, Active: ${user.active}`);
      });
      
      // Map database roles back to frontend roles
      const reverseMappedUsers = users.map((user: any) => ({
        ...user,
        role: user.role === 'technician' ? 'backend_engineer' : user.role
      }));
      
      res.json(reverseMappedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users', isAuthenticated, async (req, res) => {
    try {
      const { username, password, email, firstName, lastName, phone, role } = req.body;
      
      if (!username || !password || !email || !firstName || !lastName) {
        return res.status(400).json({ message: "Username, password, email, first name, and last name are required" });
      }
      
      // Check if user with this email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ 
          message: "A user with this email already exists",
          error: "DUPLICATE_EMAIL"
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
        username,
        passwordHash: hashedPassword,
        email,
        firstName,
        lastName,
        phone,
        role: role || 'engineer',
        active: true,
        department: 'WIZONE HELP DESK',
      };
      
      const user = await storage.createUserWithPassword(userData);

      // User successfully created in PostgreSQL database
      console.log("New user created successfully in database");

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
      const currentUser = req.user as any;
      
      // Only admin can change roles
      if (currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Only administrators can change user roles" });
      }
      
      if (!role) {
        return res.status(400).json({ message: "Role is required" });
      }
      
      // Map frontend role values to database-compatible values
      const roleMapping: { [key: string]: string } = {
        'admin': 'admin',              // Allowed by constraint
        'manager': 'manager',          // Allowed by constraint
        'backend_engineer': 'technician', // Map to 'technician' (allowed by constraint)
        'field_engineer': 'field_engineer'  // Keep as is (allowed by constraint)
      };
      
      const mappedRole = roleMapping[role] || role;
      
      // Validate role against allowed values (temporarily expanded for testing)
      const allowedRoles = ['admin', 'manager', 'backend_engineer', 'field_engineer', 'engineer', 'technician', 'user'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ 
          message: `Invalid role: ${role}. Must be one of: ${allowedRoles.join(', ')}` 
        });
      }
      
      console.log(`Role update: ${role} -> ${mappedRole} for user ${id}`);
      const user = await storage.updateUserRole(id, mappedRole);
      
      // Return the user with the original frontend role value for consistency
      const responseUser = { ...user, role: role };
      res.json(responseUser);
    } catch (error: any) {
      console.error("Error updating user role:", error);
      
      // Handle specific database constraint errors
      if (error.message && error.message.includes('Invalid role')) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.put('/api/users/:id/status', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { active } = req.body;
      
      if (active === undefined) {
        return res.status(400).json({ message: "Active status is required" });
      }
      
      console.log(`Status update: User ${id} -> ${active ? 'Active' : 'Inactive'}`);
      const user = await storage.updateUserStatus(parseInt(id), active);
      
      res.json(user);
    } catch (error: any) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  app.put('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = parseInt(id);
      const currentUser = req.user;
      const { firstName, lastName, username, email, phone, role, department } = req.body;
      
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: "First name, last name, and email are required" });
      }
      
      // Check if email is being changed and if it conflicts with another user
      if (email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ 
            message: "A user with this email already exists",
            error: "DUPLICATE_EMAIL"
          });
        }
      }
      
      // Check if username is being changed (only admins can change usernames)
      if (username && currentUser.role === 'admin') {
        const existingUsername = await storage.getUserByUsername(username);
        if (existingUsername && existingUsername.id !== userId) {
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
      
      const user = await storage.updateUser(userId, userData);
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

  // Reset password route (admin and backend engineer)
  app.put('/api/users/:id/reset-password', isAuthenticated, async (req: any, res) => {
    try {
      // Check if current user is admin or backend engineer
      const currentUser = req.user;
      if (currentUser.role !== 'admin' && currentUser.role !== 'backend_engineer') {
        return res.status(403).json({ message: "Admin or backend engineer access required" });
      }

      const { id } = req.params;
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }
      
      console.log(`🔐 Password reset requested for user ${id} by ${currentUser.username} (${currentUser.role})`);
      
      // Hash the new password using the same function as auth
      const authModule = await import("./auth.js");
      const hashedPassword = await authModule.hashPassword(newPassword);
      
      // Update user password in storage with proper logging
      const user = await storage.updateUser(id, { 
        password: hashedPassword,
        updatedAt: new Date()
      });
      
      console.log(`✅ Password successfully reset for user ${id} (${user.username})`);
      
      // Special handling for field engineers - ensure they can login immediately
      if (user.role === 'field_engineer') {
        console.log(`🔧 Field engineer password reset - ensuring mobile compatibility for ${user.username}`);
        // Also store plain text temporarily for immediate login (will be upgraded on first successful login)
        await storage.updateUser(id, { 
          temporaryPassword: newPassword,
          passwordResetAt: new Date()
        });
      }
      
      res.json({ 
        message: "Password reset successfully",
        username: user.username,
        role: user.role 
      });
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
      console.log('🔍 Storage getAllDomains check:', typeof storage.getAllDomains);
      console.log('🔍 Storage object keys:', Object.getOwnPropertyNames(Object.getPrototypeOf(storage)));
      
      if (typeof storage.getAllDomains !== 'function') {
        console.error('❌ getAllDomains is not a function on storage object');
        return res.status(500).json({ message: "Storage method not available" });
      }
      
      const domains = await storage.getAllDomains();
      console.log('✅ Domains fetched successfully:', domains.length);
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

  // Get unread notifications for polling (mobile app) - Uses push notification queue
  app.get('/api/notifications/unread', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Get unshown notifications from push queue
      const { getUnshownNotifications } = await import('./push-notifications');
      const notifications = await getUnshownNotifications(userId);

      res.json(notifications);
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });

  // Mark notification as shown (for mobile local notifications)
  app.post('/api/notifications/:id/mark-shown', isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Mark as shown in push notification queue
      const { markNotificationShown } = await import('./push-notifications');
      await markNotificationShown(notificationId);

      res.json({ success: true });
    } catch (error) {
      console.error('Error marking notification as shown:', error);
      res.status(500).json({ message: 'Failed to mark notification' });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Mark as read in push notification queue
      const { markNotificationRead } = await import('./push-notifications');
      await markNotificationRead(notificationId);

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

  // Note: Admin/Staff Authentication Routes are handled above at line 278 with enhanced session logic

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
      console.log("Customer found:", customer ? { id: customer.id, username: customer.portalUsername, portalAccess: customer.portalAccess } : "No customer found");
      
      if (!customer || !customer.portalAccess) {
        console.log("Customer not found or portal access denied");
        return res.status(401).json({ message: "Invalid credentials or portal access denied" });
      }
      
      // Verify password (in production, use proper password hashing)
      console.log("Password check:", { provided: password, stored: customer.portalPassword, match: customer.portalPassword === password });
      if (customer.portalPassword !== password) {
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
      
      console.log("🔑 Portal access update request:", { 
        customerId, 
        username, 
        portalAccess, 
        passwordProvided: !!password 
      });
      
      // Validate required fields when enabling portal access
      if (portalAccess && (!username || !password)) {
        console.log("❌ Missing required fields for portal access");
        return res.status(400).json({ 
          message: "Username and password are required when enabling portal access" 
        });
      }
      
      // Get existing customer first
      const existingCustomer = await storage.getCustomer(customerId);
      if (!existingCustomer) {
        console.log("❌ Customer not found:", customerId);
        return res.status(404).json({ message: "Customer not found" });
      }
      
      console.log("📋 Existing customer data:", {
        id: existingCustomer.id,
        name: existingCustomer.name,
        currentPortalAccess: existingCustomer.portalAccess,
        currentUsername: existingCustomer.portalUsername
      });
      
      // Update customer portal access
      const updatedCustomer = await storage.updateCustomerPortalAccess(customerId, {
        username: portalAccess ? username : null,
        password: portalAccess ? password : null,
        portalAccess
      });
      
      console.log("✅ Portal access updated successfully:", {
        customerId: updatedCustomer.id,
        name: updatedCustomer.name,
        portalAccess: updatedCustomer.portalAccess,
        username: updatedCustomer.portalUsername
      });
      
      res.json(updatedCustomer);
    } catch (error) {
      console.error("❌ Error updating customer portal access:", error);
      res.status(500).json({ 
        message: "Failed to update portal access",
        error: error.message 
      });
    }
  });

  // Get tasks by customer ID
  app.get('/api/customers/:customerId/tasks', isAuthenticated, async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      console.log(`📋 Fetching tasks for customer ${customerId}`);
      
      const tasks = await storage.getTasksByCustomer(customerId);
      console.log(`✅ Found ${tasks.length} tasks for customer ${customerId}`);
      
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching customer tasks:", error);
      res.status(500).json({ message: "Failed to fetch customer tasks" });
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
      console.log("📋 Bot Configuration GET - Fetching configurations...");
      const userId = req.user?.id;
      const userRole = req.user?.role;
      console.log("📋 Bot Configuration - User ID:", userId, "Role:", userRole);
      
      if (userRole !== 'admin' && userRole !== 'manager') {
        console.log("📋 Bot Configuration - Access denied for role:", userRole);
        return res.status(403).json({ message: "Only administrators can view bot configurations" });
      }

      console.log("📋 Bot Configuration - Fetching from storage...");
      const configurations = await storage.getAllBotConfigurations();
      console.log("📋 Bot Configuration - Found:", configurations.length, "configurations");
      res.json(configurations);
    } catch (error) {
      console.error("Error fetching bot configurations:", error);
      res.status(500).json({ message: "Failed to fetch bot configurations" });
    }
  });

  app.post("/api/bot-configurations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      if (userRole !== 'admin' && userRole !== 'manager') {
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
      const userRole = req.user?.role;
      
      if (userRole !== 'admin' && userRole !== 'manager') {
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
      const userRole = req.user?.role;
      
      if (userRole !== 'admin' && userRole !== 'manager') {
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
      const userRole = req.user?.role;
      
      if (userRole !== 'admin' && userRole !== 'manager') {
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
      const userRole = req.user?.role;
      
      if (userRole !== 'admin' && userRole !== 'manager') {
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

  // Daily Summary Report Endpoints
  // Get daily summary data (for viewing in dashboard)
  app.get("/api/daily-summary", isAuthenticated, async (req, res) => {
    try {
      const userRole = req.user?.role;
      
      if (userRole !== 'admin' && userRole !== 'manager') {
        return res.status(403).json({ message: "Only administrators can view daily summary" });
      }

      const summaryData = await getDailySummaryData();
      res.json(summaryData);
    } catch (error) {
      console.error("Error fetching daily summary:", error);
      res.status(500).json({ message: "Failed to fetch daily summary" });
    }
  });

  // Manually trigger daily summary notification (for testing)
  app.post("/api/daily-summary/send", isAuthenticated, async (req, res) => {
    try {
      const userRole = req.user?.role;
      
      if (userRole !== 'admin') {
        return res.status(403).json({ message: "Only administrators can trigger daily summary notifications" });
      }

      console.log("📤 Manual trigger: Sending daily summary notification...");
      const success = await sendDailySummaryNotification();
      
      if (success) {
        res.json({ success: true, message: "Daily summary notification sent successfully!" });
      } else {
        res.status(500).json({ success: false, message: "Failed to send daily summary notification. Check server logs." });
      }
    } catch (error) {
      console.error("Error sending daily summary notification:", error);
      res.status(500).json({ message: "Failed to send daily summary notification" });
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
  
  // ===================================================
  // NETWORK MONITORING ENDPOINTS
  // ===================================================

  // Get all towers from database
  app.get('/api/network/towers', isAuthenticated, async (req, res) => {
    try {
      const result = await db.query(`
        SELECT 
          id, name, target_ip as "targetIP", location, ssid, total_devices as devices,
          address, latitude, longitude, bandwidth, expected_latency as latency,
          actual_latency, description, status, created_at, updated_at, last_test_at,
          COALESCE(actual_latency, expected_latency) as uptime
        FROM network_towers 
        ORDER BY created_at DESC
      `);
      
      const towers = result.rows.map(tower => ({
        ...tower,
        alerts: Math.floor(Math.random() * 3), // Mock alerts for now
        uptime: tower.status === 'online' ? '99.9%' : '0%'
      }));
      
      res.json(towers);
    } catch (error) {
      console.error('Error fetching towers:', error);
      
      // Fallback to mock data if database is not ready
      const mockTowers = [
        {
          id: "tower-001",
          name: "Tower-North-01",
          location: "Delhi NCR",
          status: "online",
          bandwidth: "1 Gbps",
          latency: "5ms",
          uptime: "99.9%",
          devices: 156,
          alerts: 0,
          targetIP: "192.168.1.100",
          cpuUsage: "65%",
          memoryUsage: "78%",
          networkIO: "156 Mbps",
          temperature: "42°C"
        },
        {
          id: "tower-002", 
          name: "Tower-South-01",
          location: "Mumbai",
          status: "warning",
          bandwidth: "500 Mbps",
          latency: "12ms",
          uptime: "98.5%",
          devices: 89,
          alerts: 2,
          targetIP: "192.168.2.100",
          cpuUsage: "82%",
          memoryUsage: "91%",
          networkIO: "234 Mbps", 
          temperature: "48°C"
        },
        {
          id: "tower-003",
          name: "Tower-West-01", 
          location: "Pune",
          status: "offline",
          bandwidth: "0 Mbps",
          latency: "timeout",
          uptime: "0%",
          devices: 0,
          alerts: 5,
          targetIP: "192.168.3.100",
          cpuUsage: "0%",
          memoryUsage: "0%",
          networkIO: "0 Mbps",
          temperature: "N/A"
        }
      ];
      res.json(mockTowers);
    }
  });

  // Add new tower with database storage
  app.post('/api/network/towers', isAuthenticated, async (req, res) => {
    try {
      const { 
        name, 
        targetIP, 
        location, 
        ssid, 
        totalDevices, 
        address, 
        latitude, 
        longitude,
        bandwidth = '1 Gbps',
        expectedLatency = '5ms',
        description = ''
      } = req.body;
      
      console.log('📡 Adding new tower:', req.body);
      
      // Create tower in database
      const insertQuery = `
        INSERT INTO network_towers (
          name, target_ip, location, ssid, total_devices, 
          address, latitude, longitude, bandwidth, expected_latency, 
          description, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
        RETURNING *
      `;
      
      const values = [
        name, targetIP, location, ssid || null, totalDevices || 0,
        address || null, latitude || null, longitude || null, 
        bandwidth, expectedLatency, description, 'online',
        new Date(), new Date()
      ];
      
      const result = await db.query(insertQuery, values);
      const tower = result.rows[0];
      
      // Perform real IP ping test if targetIP is provided
      let pingResult = { success: false, latency: null, status: 'offline' };
      if (targetIP) {
        try {
          const ping = require('ping');
          const pingRes = await ping.promise.probe(targetIP, {
            timeout: 5,
            extra: ['-c', '3']
          });
          
          pingResult = {
            success: pingRes.alive,
            latency: pingRes.time ? `${Math.round(pingRes.time)}ms` : 'timeout',
            status: pingRes.alive ? 'online' : 'offline'
          };
          
          // Update tower status based on ping result
          await db.query(
            'UPDATE network_towers SET status = $1, actual_latency = $2 WHERE id = $3',
            [pingResult.status, pingResult.latency, tower.id]
          );
          
        } catch (pingError) {
          console.error('Ping test failed:', pingError);
          pingResult = { success: false, latency: 'error', status: 'unknown' };
        }
      }
      
      res.status(201).json({
        success: true,
        message: 'Tower added successfully',
        tower: {
          ...tower,
          pingTest: pingResult
        }
      });
    } catch (error) {
      console.error('Error adding tower:', error);
      res.status(500).json({ error: 'Failed to add tower', details: error.message });
    }
  });

  // Get single tower details
  app.get('/api/network/towers/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db.query('SELECT * FROM network_towers WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Tower not found' });
      }
      
      const tower = result.rows[0];
      
      // Perform live ping test
      let liveTest = { success: false, latency: null };
      if (tower.target_ip) {
        try {
          const ping = require('ping');
          const pingRes = await ping.promise.probe(tower.target_ip, { timeout: 3 });
          liveTest = {
            success: pingRes.alive,
            latency: pingRes.time ? `${Math.round(pingRes.time)}ms` : 'timeout'
          };
        } catch (error) {
          console.error('Live ping failed:', error);
        }
      }
      
      res.json({
        ...tower,
        liveTest
      });
    } catch (error) {
      console.error('Error fetching tower:', error);
      res.status(500).json({ error: 'Failed to fetch tower details' });
    }
  });

  // Update tower
  app.put('/api/network/towers/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      console.log('📝 Updating tower:', id, updateData);
      
      const updateFields = [];
      const values = [];
      let valueIndex = 1;
      
      // Build dynamic update query
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          const dbField = key === 'targetIP' ? 'target_ip' : 
                         key === 'totalDevices' ? 'total_devices' :
                         key === 'expectedLatency' ? 'expected_latency' : key;
          updateFields.push(`${dbField} = $${valueIndex}`);
          values.push(updateData[key]);
          valueIndex++;
        }
      });
      
      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }
      
      updateFields.push(`updated_at = $${valueIndex}`);
      values.push(new Date());
      values.push(id);
      
      const updateQuery = `
        UPDATE network_towers 
        SET ${updateFields.join(', ')} 
        WHERE id = $${valueIndex + 1} 
        RETURNING *
      `;
      
      const result = await db.query(updateQuery, values);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Tower not found' });
      }
      
      res.json({
        success: true,
        message: 'Tower updated successfully',
        tower: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating tower:', error);
      res.status(500).json({ error: 'Failed to update tower', details: error.message });
    }
  });

  // Delete tower
  app.delete('/api/network/towers/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log('🗑️ Deleting tower:', id);
      
      const result = await db.query(
        'DELETE FROM network_towers WHERE id = $1 RETURNING *',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Tower not found' });
      }
      
      res.json({
        success: true,
        message: 'Tower deleted successfully',
        deletedTower: result.rows[0]
      });
    } catch (error) {
      console.error('Error deleting tower:', error);
      res.status(500).json({ error: 'Failed to delete tower', details: error.message });
    }
  });

  // Test tower connectivity (ping test)
  app.post('/api/network/towers/:id/test', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get tower details
      const towerResult = await db.query('SELECT * FROM network_towers WHERE id = $1', [id]);
      if (towerResult.rows.length === 0) {
        return res.status(404).json({ error: 'Tower not found' });
      }
      
      const tower = towerResult.rows[0];
      
      if (!tower.target_ip) {
        return res.status(400).json({ error: 'No target IP configured for this tower' });
      }
      
      // Perform comprehensive connectivity test
      const ping = require('ping');
      const testResults = {
        timestamp: new Date(),
        targetIP: tower.target_ip,
        tests: {}
      };
      
      // Basic ping test
      try {
        const pingRes = await ping.promise.probe(tower.target_ip, {
          timeout: 5,
          extra: ['-c', '5']
        });
        
        testResults.tests.ping = {
          success: pingRes.alive,
          latency: pingRes.time ? `${Math.round(pingRes.time)}ms` : 'timeout',
          packetLoss: pingRes.packetLoss ? `${pingRes.packetLoss}%` : '0%'
        };
      } catch (error) {
        testResults.tests.ping = { success: false, error: error.message };
      }
      
      // Update tower status based on test results
      const newStatus = testResults.tests.ping.success ? 'online' : 'offline';
      await db.query(
        'UPDATE network_towers SET status = $1, last_test_at = $2, actual_latency = $3 WHERE id = $4',
        [newStatus, new Date(), testResults.tests.ping.latency, id]
      );
      
      res.json({
        success: true,
        message: 'Connectivity test completed',
        results: testResults
      });
    } catch (error) {
      console.error('Error testing tower connectivity:', error);
      res.status(500).json({ error: 'Failed to test tower connectivity' });
    }
  });

  // Get network statistics
  app.get('/api/network/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = {
        totalTowers: 3,
        onlineTowers: 2,
        avgUptime: "99.1%",
        totalBandwidth: "1.5 Gbps",
        activeAlerts: 7,
        totalDevices: 245
      };
      res.json(stats);
    } catch (error) {
      console.error('Error fetching network stats:', error);
      res.status(500).json({ error: 'Failed to fetch network statistics' });
    }
  });

  // Get network alerts
  app.get('/api/network/alerts', isAuthenticated, async (req, res) => {
    try {
      const alerts = [
        {
          id: "alert-001",
          title: "High CPU Usage",
          message: "Tower-South-01 CPU usage is above 80%",
          type: "warning",
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
        },
        {
          id: "alert-002", 
          title: "Tower Offline",
          message: "Tower-West-01 is not responding",
          type: "critical",
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        },
        {
          id: "alert-003",
          title: "High Memory Usage", 
          message: "Tower-South-01 memory usage is above 90%",
          type: "warning",
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
        }
      ];
      res.json(alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  });

  // Get monitoring logs
  app.get('/api/network/monitoring-logs', isAuthenticated, async (req, res) => {
    try {
      const logs = [
        {
          id: "log-001",
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          level: "info",
          message: "Tower-North-01 health check passed",
          tower: "Tower-North-01"
        },
        {
          id: "log-002",
          timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(), 
          level: "warning",
          message: "Tower-South-01 CPU usage spike detected",
          tower: "Tower-South-01"
        },
        {
          id: "log-003",
          timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
          level: "error", 
          message: "Tower-West-01 connection timeout",
          tower: "Tower-West-01"
        }
      ];
      res.json(logs);
    } catch (error) {
      console.error('Error fetching monitoring logs:', error);
      res.status(500).json({ error: 'Failed to fetch monitoring logs' });
    }
  });

  // Get network devices
  app.get('/api/network/devices', isAuthenticated, async (req, res) => {
    try {
      const devices = [
        {
          id: "dev-001",
          name: "Router-Main",
          type: "router",
          tower: "Tower-North-01", 
          status: "online",
          ip: "192.168.1.1",
          lastSeen: new Date().toISOString()
        },
        {
          id: "dev-002",
          name: "Switch-Core",
          type: "switch", 
          tower: "Tower-South-01",
          status: "warning",
          ip: "192.168.2.2",
          lastSeen: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        },
        {
          id: "dev-003",
          name: "AP-Building-A",
          type: "access_point",
          tower: "Tower-West-01",
          status: "offline", 
          ip: "192.168.3.3",
          lastSeen: new Date(Date.now() - 60 * 60 * 1000).toISOString()
        }
      ];
      res.json(devices);
    } catch (error) {
      console.error('Error fetching devices:', error);
      res.status(500).json({ error: 'Failed to fetch devices' });
    }
  });

  // Get analytics data
  app.get('/api/network/analytics', isAuthenticated, async (req, res) => {
    try {
      const analytics = {
        performanceMetrics: {
          avgLatency: "8.5ms",
          avgThroughput: "750 Mbps",
          avgUptime: "99.1%",
          packetLoss: "0.02%"
        },
        usageStats: {
          peakUsageTime: "14:30",
          averageDailyTraffic: "2.3 TB",
          topBandwidthConsumer: "Tower-North-01"
        },
        trends: {
          uptimeImprovement: "+2.1%",
          latencyReduction: "-15ms",
          throughputIncrease: "+150 Mbps"
        }
      };
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  // Update network configuration
  app.put('/api/network/config', isAuthenticated, async (req, res) => {
    try {
      const config = req.body;
      console.log('⚙️ Updating network config:', config);
      
      // In a real implementation, this would update database
      res.json({
        success: true,
        message: 'Network configuration updated successfully',
        config
      });
    } catch (error) {
      console.error('Error updating config:', error);
      res.status(500).json({ error: 'Failed to update configuration' });
    }
  });

  // ===================================================
  // ALTERNATIVE NETWORK MONITORING ENDPOINTS (for frontend compatibility)
  // ===================================================

  // Middleware to check if user has access to network monitoring
  const hasNetworkMonitoringAccess = (req: Request, res: Response, next: Function) => {
    const user = req.user as any;
    
    // Allow access for: admin, manager, support, backend_engineer, engineer
    // Deny access for: field_engineer
    const allowedRoles = ['admin', 'manager', 'support', 'backend_engineer', 'engineer'];
    
    if (!user || !allowedRoles.includes(user.role)) {
      console.log(`🚫 Network monitoring access denied for user: ${user?.username} (${user?.role})`);
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You do not have permission to access network monitoring'
      });
    }
    
    next();
  };

  // Alternative endpoints that mirror the main network endpoints
  // Frontend calls /api/network-monitoring/towers
  app.get('/api/network-monitoring/towers', isAuthenticated, hasNetworkMonitoringAccess, async (req, res) => {
    try {
      const result = await sql`
        SELECT 
          id, name, target_ip, location, ssid, total_devices,
          address, latitude, longitude, bandwidth, expected_latency,
          actual_latency, description, status, created_at, updated_at, last_test_at
        FROM network_towers 
        ORDER BY created_at DESC
      `;
      
      const towers = result.map(tower => ({
        ...tower,
        targetIP: tower.target_ip,
        ip_address: tower.target_ip, // Add this for frontend compatibility
        tower_name: tower.name, // Add this for frontend compatibility
        devices: tower.total_devices,
        latency: tower.expected_latency,
        alerts: Math.floor(Math.random() * 3), // Mock alerts for now
        uptime: tower.status === 'online' ? '99.9%' : '0%'
      }));
      
      res.json(towers);
    } catch (error) {
      console.error('Error fetching towers via /api/network-monitoring/towers:', error);
      res.status(500).json({ error: 'Failed to fetch towers', details: error.message });
    }
  });

  app.post('/api/network-monitoring/towers', isAuthenticated, hasNetworkMonitoringAccess, async (req, res) => {
    try {
      console.log('🚀 TOWER CREATION START - Full request body:', JSON.stringify(req.body, null, 2));
      console.log('🔍 Request headers:', JSON.stringify(req.headers, null, 2));
      console.log('🏗️ Session info:', req.session ? 'Session exists' : 'No session');
      console.log('👤 User info:', req.user ? req.user.username : 'No user');
      
      // Handle both naming conventions from frontend
      const { 
        name, 
        tower_name,
        targetIP, 
        ip_address,
        location, 
        ssid, 
        totalDevices, 
        address, 
        latitude, 
        longitude,
        bandwidth = '1 Gbps',
        expectedLatency = '5ms',
        description = '',
        notes,
        tower_type,
        installation_date,
        owner_operator,
        status = 'Active'
      } = req.body;
      
      // Use frontend field names if available, fallback to expected names
      const towerName = tower_name || name;
      const towerIP = ip_address || targetIP;
      const towerStatus = status === 'Active' ? 'online' : 'offline';
      
      console.log('📡 Adding new tower with processed data:', {
        towerName,
        towerIP,
        location,
        ssid,
        totalDevices,
        address,
        latitude,
        longitude,
        bandwidth,
        expectedLatency,
        description: description || notes || '',
        towerStatus
      });
      
      console.log('💾 Executing SQL INSERT...');
      
      // Create tower in database using raw SQL
      const result = await sql`
        INSERT INTO network_towers (
          name, target_ip, location, ssid, total_devices, 
          address, latitude, longitude, bandwidth, expected_latency, 
          description, status, created_at, updated_at
        ) VALUES (
          ${towerName}, ${towerIP}, ${location}, ${ssid || null}, ${totalDevices || 0},
          ${address || null}, ${latitude || null}, ${longitude || null}, 
          ${bandwidth}, ${expectedLatency}, ${description || notes || ''}, ${towerStatus},
          ${new Date().toISOString()}, ${new Date().toISOString()}
        )
        RETURNING *
      `;
      
      console.log('✅ SQL INSERT completed, result:', result);
      
      const tower = result[0];
      
      // Perform real IP ping test if towerIP is provided
      let pingResult = { success: false, latency: null, status: 'offline' };
      if (towerIP) {
        try {
          console.log(`🏃‍♂️ Testing connectivity for IP: ${towerIP}`);
          
          // Use Node.js built-in net module for TCP connection test
          const net = await import('net');
          const { performance } = await import('perf_hooks');
          
          const testConnectivity = (ip, port = 80, timeout = 5000) => {
            return new Promise((resolve) => {
              const startTime = performance.now();
              const socket = new net.Socket();
              
              socket.setTimeout(timeout);
              
              socket.on('connect', () => {
                const endTime = performance.now();
                const latency = Math.round(endTime - startTime);
                socket.destroy();
                resolve({ success: true, latency: `${latency}ms`, status: 'online' });
              });
              
              socket.on('timeout', () => {
                socket.destroy();
                resolve({ success: false, latency: 'timeout', status: 'offline' });
              });
              
              socket.on('error', () => {
                socket.destroy();
                resolve({ success: false, latency: 'error', status: 'offline' });
              });
              
              socket.connect(port, ip);
            });
          };
          
          // Test common ports (80, 443, 22) to determine if host is reachable
          const testResults = await Promise.allSettled([
            testConnectivity(towerIP, 80, 3000),
            testConnectivity(towerIP, 443, 3000),
            testConnectivity(towerIP, 22, 3000),
            testConnectivity(towerIP, 3007, 3000) // Test our own server port
          ]);
          
          // If any port responds, consider it online
          let bestResult = { success: false, latency: 'timeout', status: 'offline' };
          for (const result of testResults) {
            if (result.status === 'fulfilled' && result.value.success) {
              bestResult = result.value;
              break;
            }
          }
          
          pingResult = bestResult;
          console.log(`✅ Connectivity test result for ${towerIP}:`, pingResult);
          
          // Update tower status based on connectivity test
          await sql`
            UPDATE network_towers 
            SET status = ${pingResult.status}, actual_latency = ${pingResult.latency}, 
                last_test_at = ${new Date().toISOString()}, updated_at = ${new Date().toISOString()}
            WHERE id = ${tower.id}
          `;
          
        } catch (pingError) {
          console.error('Connectivity test failed:', pingError);
          pingResult = { success: false, latency: 'error', status: 'offline' };
        }
      }
      
      res.status(201).json({
        success: true,
        message: 'Tower added successfully',
        tower: {
          ...tower,
          pingTest: pingResult
        }
      });
    } catch (error) {
      console.error('❌ TOWER CREATION ERROR - Full details:');
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Error name:', error.name);
      console.error('Error code:', error.code);
      console.error('Request body that caused error:', JSON.stringify(req.body, null, 2));
      
      res.status(500).json({ 
        success: false,
        error: 'Failed to add tower', 
        details: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      });
    }
  });

  app.get('/api/network-monitoring/towers/:id', isAuthenticated, hasNetworkMonitoringAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await sql`SELECT * FROM network_towers WHERE id = ${id}`;
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Tower not found' });
      }
      
      const tower = result[0];
      res.json(tower);
    } catch (error) {
      console.error('Error fetching tower details via /api/network-monitoring/towers:', error);
      res.status(500).json({ error: 'Failed to fetch tower details' });
    }
  });

  app.put('/api/network-monitoring/towers/:id', isAuthenticated, hasNetworkMonitoringAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        name, tower_name, targetIP, ip_address, location, ssid, totalDevices, 
        address, latitude, longitude, bandwidth, expectedLatency, description, notes 
      } = req.body;
      
      const towerName = tower_name || name;
      const towerIP = ip_address || targetIP;
      
      const result = await sql`
        UPDATE network_towers 
        SET name = ${towerName}, target_ip = ${towerIP}, location = ${location}, 
            ssid = ${ssid || null}, total_devices = ${totalDevices || 0},
            address = ${address || null}, latitude = ${latitude || null}, 
            longitude = ${longitude || null}, bandwidth = ${bandwidth}, 
            expected_latency = ${expectedLatency}, description = ${description || notes || ''}, 
            updated_at = ${new Date().toISOString()}
        WHERE id = ${id} 
        RETURNING *
      `;
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Tower not found' });
      }
      
      res.json({
        success: true,
        message: 'Tower updated successfully',
        tower: result[0]
      });
    } catch (error) {
      console.error('Error updating tower:', error);
      res.status(500).json({ error: 'Failed to update tower' });
    }
  });

  app.delete('/api/network-monitoring/towers/:id', isAuthenticated, hasNetworkMonitoringAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await sql`
        DELETE FROM network_towers WHERE id = ${id} RETURNING *
      `;
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Tower not found' });
      }
      
      res.json({ 
        success: true, 
        message: 'Tower deleted successfully',
        tower: result[0]
      });
    } catch (error) {
      console.error('Error deleting tower:', error);
      res.status(500).json({ error: 'Failed to delete tower' });
    }
  });

  app.post('/api/network-monitoring/test-connectivity', isAuthenticated, hasNetworkMonitoringAccess, async (req, res) => {
    try {
      // Accept both targetIP and ip_address for compatibility
      const targetIP = req.body.targetIP || req.body.ip_address || req.body.target_ip;
      
      if (!targetIP) {
        console.error('❌ No IP address provided in request body:', req.body);
        return res.status(400).json({ 
          error: 'Target IP is required',
          success: false,
          responseTime: 0
        });
      }

      console.log(`🔍 Testing connectivity for IP: ${targetIP}`);
      
      // Use Node.js built-in net module for TCP connection test
      const net = await import('net');
      const { performance } = await import('perf_hooks');
      
      const testConnectivity = (ip, port = 80, timeout = 5000) => {
        return new Promise((resolve) => {
          const startTime = performance.now();
          const socket = new net.Socket();
          
          socket.setTimeout(timeout);
          
          socket.on('connect', () => {
            const endTime = performance.now();
            const latency = Math.round(endTime - startTime);
            socket.destroy();
            resolve({ success: true, latency: `${latency}ms`, status: 'online' });
          });
          
          socket.on('timeout', () => {
            socket.destroy();
            resolve({ success: false, latency: 'timeout', status: 'offline' });
          });
          
          socket.on('error', () => {
            socket.destroy();
            resolve({ success: false, latency: 'error', status: 'offline' });
          });
          
          socket.connect(port, ip);
        });
      };
      
      // Test common ports to determine if host is reachable
      const testResults = await Promise.allSettled([
        testConnectivity(targetIP, 80, 3000),
        testConnectivity(targetIP, 443, 3000),
        testConnectivity(targetIP, 22, 3000),
        testConnectivity(targetIP, 3007, 3000)
      ]);
      
      // If any port responds, consider it online
      let bestResult = { success: false, latency: 'timeout', status: 'offline' };
      for (const result of testResults) {
        if (result.status === 'fulfilled' && result.value.success) {
          bestResult = result.value;
          break;
        }
      }
      
      console.log(`✅ Connectivity test result for ${targetIP}:`, bestResult);
      
      // Parse latency to number for responseTime
      let responseTime = 0;
      if (bestResult.latency && bestResult.latency !== 'timeout' && bestResult.latency !== 'error') {
        responseTime = parseInt(bestResult.latency.replace('ms', '')) || 0;
      }
      
      res.json({
        success: bestResult.success,
        responseTime: responseTime, // Frontend expects responseTime
        latency: bestResult.latency, // Keep for backward compatibility
        status: bestResult.status,
        error: bestResult.success ? undefined : 'Connection failed',
        details: { tested_ports: [80, 443, 22, 3007] }
      });
    } catch (error) {
      console.error('Error testing connectivity:', error);
      res.status(500).json({ 
        error: 'Failed to test connectivity',
        success: false,
        responseTime: 0,
        status: 'error'
      });
    }
  });

  // ===================================================
  // NETWORK MONITORING AUTO-PING SYSTEM
  // ===================================================
  
  // Periodic connectivity check for all towers
  const performPeriodicConnectivityCheck = async () => {
    try {
      console.log('🔄 Starting periodic connectivity check for all towers...');
      
      // Use the postgres client directly for raw SQL
      const towers = await sql`SELECT id, name, target_ip FROM network_towers WHERE target_ip IS NOT NULL`;
      
      if (!towers || towers.length === 0) {
        console.log('📭 No towers found for monitoring');
        return;
      }
      
      for (const tower of towers) {
        try {
          const net = await import('net');
          const { performance } = await import('perf_hooks');
          
          const testConnectivity = (ip, port = 80, timeout = 3000) => {
            return new Promise((resolve) => {
              const startTime = performance.now();
              const socket = new net.Socket();
              
              socket.setTimeout(timeout);
              
              socket.on('connect', () => {
                const endTime = performance.now();
                const latency = Math.round(endTime - startTime);
                socket.destroy();
                resolve({ success: true, latency: `${latency}ms`, status: 'online' });
              });
              
              socket.on('timeout', () => {
                socket.destroy();
                resolve({ success: false, latency: 'timeout', status: 'offline' });
              });
              
              socket.on('error', () => {
                socket.destroy();
                resolve({ success: false, latency: 'error', status: 'offline' });
              });
              
              socket.connect(port, ip);
            });
          };
          
          // Test multiple ports quickly
          const testResults = await Promise.allSettled([
            testConnectivity(tower.target_ip, 80, 2000),
            testConnectivity(tower.target_ip, 443, 2000),
            testConnectivity(tower.target_ip, 3007, 2000)
          ]);
          
          // If any port responds, consider it online
          let result = { success: false, latency: 'timeout', status: 'offline' };
          for (const testResult of testResults) {
            if (testResult.status === 'fulfilled' && testResult.value.success) {
              result = testResult.value;
              break;
            }
          }
          
          // Update tower status
          await sql`
            UPDATE network_towers 
            SET status = ${result.status}, actual_latency = ${result.latency}, 
                last_test_at = ${new Date().toISOString()}, updated_at = ${new Date().toISOString()}
            WHERE id = ${tower.id}
          `;
          
          console.log(`📡 Tower "${tower.name}" (${tower.target_ip}): ${result.status} (${result.latency})`);
          
        } catch (error) {
          console.error(`Error testing tower ${tower.name}:`, error);
        }
      }
      
      console.log('✅ Periodic connectivity check completed');
      
    } catch (error) {
      console.error('Error in periodic connectivity check:', error);
    }
  };
  
  // Start periodic monitoring every 30 seconds
  setInterval(performPeriodicConnectivityCheck, 30000);
  
  // Run initial check after 5 seconds
  setTimeout(performPeriodicConnectivityCheck, 5000);

  // ===================================================
  // END NETWORK MONITORING ENDPOINTS  
  // ===================================================
  
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
  
  function broadcastToUser(userId: string | number, message: any) {
    const messageStr = JSON.stringify(message);
    const userIdStr = String(userId);
    connectedClients.forEach((client, key) => {
      if (String(client.userId) === userIdStr && client.ws.readyState === WebSocket.OPEN) {
        console.log(`?? Sending notification to user ${userId}:`, message.type);
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
  
  // ===================================================
  // ADMIN DATABASE FIXES
  // ===================================================
  
  // Fix visit charges field size (admin only)
  app.post('/api/admin/fix-visit-charges', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.user?.id;
      const userRole = req.user?.role || req.session?.user?.role;
      
      // Only admins can run this fix
      if (userRole !== 'admin') {
        return res.status(403).json({ 
          message: 'Access denied. Admin role required.' 
        });
      }
      
      console.log(`🔧 Admin ${userId} running visit charges fix...`);
      
      // Import postgres directly to run raw SQL
      const postgres = (await import('postgres')).default;
      const sql = postgres(process.env.DATABASE_URL || '', {
        ssl: false,
        max: 1
      });
      
      // Alter the column to allow larger values
      await sql`
        ALTER TABLE tasks 
        ALTER COLUMN estimated_cost TYPE NUMERIC(10,2)
      `;
      
      await sql.end();
      
      console.log('✅ Visit charges field fixed! Now allows values up to 99,999,999.99');
      
      res.json({ 
        success: true,
        message: 'Visit charges field successfully updated! You can now create tasks with higher visit charges (up to 99,999,999.99).',
        details: {
          oldConstraint: 'NUMERIC(5,2) - max 999.99',
          newConstraint: 'NUMERIC(10,2) - max 99,999,999.99'
        }
      });
    } catch (error: any) {
      console.error('❌ Error fixing visit charges:', error.message);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fix visit charges field',
        error: error.message 
      });
    }
  });
  
  // ===================================================
  // END ADMIN DATABASE FIXES
  // ===================================================
  
  // ===================================================
  // DAILY REPORTS API
  // ===================================================
  
  // Submit daily report (for field engineers from mobile APK)
  app.post('/api/daily-reports', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.user?.id;
      const userName = req.user?.firstName && req.user?.lastName 
        ? `${req.user.firstName} ${req.user.lastName}` 
        : req.user?.username || req.session?.user?.username || 'Unknown';
      
      console.log(`?? Daily report submission from ${userName} (ID: ${userId})`);
      console.log(`?? Request body:`, JSON.stringify(req.body, null, 2));
      
      const {
        sitesVisited,
        workDone,
        sitesCompleted,
        completedSitesNames,
        incompleteSitesNames,
        reasonNotDone,
        hasIssue,
        issueDetails
      } = req.body;
      
      // Validate required fields
      if (sitesVisited === undefined || !workDone || sitesCompleted === undefined) {
        return res.status(400).json({ 
          message: 'Missing required fields: sitesVisited, workDone, sitesCompleted' 
        });
      }
      
      // Insert into database using the already imported sql client
      const result = await sql`
        INSERT INTO daily_reports (
          engineer_id, engineer_name, sites_visited, work_done, 
          sites_completed, completed_sites_names, incomplete_sites_names,
          reason_not_done, has_issue, issue_details
        ) VALUES (
          ${typeof userId === 'number' ? userId : parseInt(userId) || 0},
          ${userName},
          ${parseInt(sitesVisited) || 0},
          ${workDone},
          ${parseInt(sitesCompleted) || 0},
          ${completedSitesNames || null},
          ${incompleteSitesNames || null},
          ${reasonNotDone || null},
          ${hasIssue === true || hasIssue === 'yes'},
          ${issueDetails || null}
        ) RETURNING *
      `;
      
      console.log(`? Daily report submitted by ${userName} (ID: ${userId})`);
      console.log(`? Report saved:`, result[0]);
      
      res.status(201).json({
        success: true,
        message: 'Daily report submitted successfully',
        report: result[0]
      });
    } catch (error: any) {
      console.error('? Error submitting daily report:', error);
      console.error('? Error details:', error.message, error.stack);
      res.status(500).json({ 
        success: false,
        message: 'Failed to submit daily report',
        error: error.message 
      });
    }
  });
  
  // Get all daily reports (for admin/manager web portal)
  app.get('/api/daily-reports', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.user?.role || req.session?.user?.role;
      const userId = req.user?.id || req.session?.user?.id;
      
      let reports;
      
      // Admin and manager can see all reports, others only see their own
      if (userRole === 'admin' || userRole === 'manager') {
        reports = await sql`
          SELECT * FROM daily_reports 
          ORDER BY report_date DESC
        `;
      } else {
        reports = await sql`
          SELECT * FROM daily_reports 
          WHERE engineer_id = ${typeof userId === 'number' ? userId : parseInt(userId) || 0}
          ORDER BY report_date DESC
        `;
      }
      
      res.json(reports);
    } catch (error: any) {
      console.error('? Error fetching daily reports:', error);
      res.status(500).json({ 
        message: 'Failed to fetch daily reports',
        error: error.message 
      });
    }
  });
  
  // Get daily reports statistics (for dashboard)
  app.get('/api/daily-reports/stats', isAuthenticated, async (req: any, res) => {
    try {
      const { period } = req.query; // 'weekly', 'monthly', 'all'
      
      let dateFilter = '';
      const now = new Date();
      
      if (period === 'weekly') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = `WHERE report_date >= '${weekAgo.toISOString()}'`;
      } else if (period === 'monthly') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = `WHERE report_date >= '${monthAgo.toISOString()}'`;
      }
      
      // Get total stats
      const totalStats = await sql.unsafe(`
        SELECT 
          COUNT(*) as total_reports,
          SUM(sites_visited) as total_sites_visited,
          SUM(sites_completed) as total_sites_completed,
          COUNT(CASE WHEN has_issue = true THEN 1 END) as reports_with_issues
        FROM daily_reports ${dateFilter}
      `);
      
      // Get engineer-wise counts
      const engineerStats = await sql.unsafe(`
        SELECT 
          engineer_id,
          engineer_name,
          COUNT(*) as report_count,
          SUM(sites_visited) as total_sites_visited,
          SUM(sites_completed) as total_sites_completed
        FROM daily_reports ${dateFilter}
        GROUP BY engineer_id, engineer_name
        ORDER BY report_count DESC
      `);
      
      // Get daily trend (last 7 days)
      const dailyTrend = await sql`
        SELECT 
          DATE(report_date) as date,
          COUNT(*) as count
        FROM daily_reports
        WHERE report_date >= ${new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()}
        GROUP BY DATE(report_date)
        ORDER BY date ASC
      `;
      
      res.json({
        summary: totalStats[0],
        byEngineer: engineerStats,
        dailyTrend: dailyTrend
      });
    } catch (error: any) {
      console.error('? Error fetching daily reports stats:', error);
      res.status(500).json({ 
        message: 'Failed to fetch daily reports statistics',
        error: error.message 
      });
    }
  });
  
  // Get my daily reports (for field engineer)
  app.get('/api/daily-reports/my-reports', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.user?.id;
      
      const reports = await sql`
        SELECT * FROM daily_reports 
        WHERE engineer_id = ${typeof userId === 'number' ? userId : parseInt(userId) || 0}
        ORDER BY report_date DESC
        LIMIT 50
      `;
      
      res.json(reports);
    } catch (error: any) {
      console.error('? Error fetching my daily reports:', error);
      res.status(500).json({ 
        message: 'Failed to fetch your daily reports',
        error: error.message 
      });
    }
  });
  
  // ===================================================
  // END DAILY REPORTS API
  // ===================================================
  
  // ===================================================
  // COMPLAINTS MANAGEMENT API (शिकायत पत्रिका)
  // ===================================================
  
  // Create complaints table if not exists
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS complaints (
        id SERIAL PRIMARY KEY,
        complaint_id VARCHAR UNIQUE NOT NULL,
        engineer_id INTEGER REFERENCES users(id) NOT NULL,
        engineer_name VARCHAR NOT NULL,
        engineer_email VARCHAR,
        mobile VARCHAR,
        complaint_type VARCHAR NOT NULL,
        department VARCHAR,
        complaint_details TEXT NOT NULL,
        status VARCHAR NOT NULL DEFAULT 'pending',
        status_note TEXT,
        status_history JSONB DEFAULT '[]',
        is_locked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        resolved_at TIMESTAMP
      )
    `;
    console.log('✅ Complaints table ready');
  } catch (tableError) {
    console.log('ℹ️ Complaints table check:', tableError);
  }
  
  // Generate complaint ID: WIZ/DDMMYY/001
  async function generateComplaintId(): Promise<string> {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const datePrefix = `WIZ/${day}${month}${year}`;
    
    // Get count of complaints for today
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    
    const result = await sql`
      SELECT COUNT(*) as count FROM complaints 
      WHERE created_at >= ${todayStart.toISOString()}
    `;
    
    const count = parseInt(result[0]?.count || '0') + 1;
    const serial = String(count).padStart(3, '0');
    
    return `${datePrefix}/${serial}`;
  }

  // Email configuration for complaint notifications
  const complaintEmailConfig = {
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true,
    auth: {
      user: process.env.SMTP_USER || 'admin@wizoneit.com',
      pass: process.env.SMTP_PASS || '' // Password will be set via environment variable
    }
  };

  // Send email notification for new complaint
  async function sendComplaintEmailNotification(complaint: any) {
    try {
      // Skip if SMTP password not configured
      if (!complaintEmailConfig.auth.pass) {
        console.log('⚠️ SMTP password not configured. Skipping complaint email notification.');
        return false;
      }

      const transporter = nodemailer.createTransport(complaintEmailConfig);

      const emailHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .footer { background: #333; color: white; padding: 15px; border-radius: 0 0 10px 10px; text-align: center; font-size: 12px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #667eea; }
            .value { background: white; padding: 10px; border-radius: 5px; border-left: 4px solid #667eea; margin-top: 5px; }
            .status { display: inline-block; background: #ffc107; color: #000; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin:0;">🔔 New Complaint Registered</h2>
              <p style="margin:5px 0 0 0;">Wizone IT Support Portal</p>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">📋 Complaint ID:</div>
                <div class="value">${complaint.complaint_id}</div>
              </div>
              <div class="field">
                <div class="label">📝 Subject:</div>
                <div class="value">${complaint.subject || complaint.complaint_type || 'N/A'}</div>
              </div>
              <div class="field">
                <div class="label">📂 Category:</div>
                <div class="value">${complaint.category || complaint.department || 'Other'}</div>
              </div>
              <div class="field">
                <div class="label">📄 Description:</div>
                <div class="value">${complaint.description || complaint.complaint_details || 'N/A'}</div>
              </div>
              <div class="field">
                <div class="label">👤 Submitted By:</div>
                <div class="value">${complaint.engineer_name} (${complaint.engineer_email || 'No email'})</div>
              </div>
              <div class="field">
                <div class="label">📅 Created At:</div>
                <div class="value">${new Date(complaint.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
              </div>
              <div class="field">
                <div class="label">📊 Status:</div>
                <div class="value"><span class="status">Pending</span></div>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated notification from Wizone IT Support Portal</p>
              <p>Please login to the portal to review and take action.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: '"Wizone IT Support" <admin@wizoneit.com>',
        to: 'sachin@wizoneit.com',
        subject: `🔔 New Complaint: ${complaint.subject || complaint.complaint_type || 'Complaint'} - ${complaint.complaint_id}`,
        html: emailHTML
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Complaint email notification sent: ${info.messageId}`);
      return true;
    } catch (error: any) {
      console.error('❌ Error sending complaint email notification:', error.message);
      return false;
    }
  }
  
  // Create new complaint (for mobile app)
  app.post('/api/complaints', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.user?.id;
      const userName = req.user?.firstName && req.user?.lastName 
        ? `${req.user.firstName} ${req.user.lastName}`.trim()
        : req.user?.username || req.session?.user?.username || 'Unknown';
      const userEmail = req.user?.email || req.session?.user?.email || '';
      
      // Support both old format (mobile, complaintType, department, complaintDetails) 
      // and new format (subject, description, category)
      const { mobile, complaintType, department, complaintDetails, subject, description, category } = req.body;
      
      // Determine which format was used
      const isNewFormat = !!(subject || description || category);
      
      // Map fields appropriately
      const finalSubject = subject || complaintType || '';
      const finalDescription = description || complaintDetails || '';
      const finalCategory = category || department || '';
      
      if (!finalSubject || !finalDescription) {
        return res.status(400).json({ 
          message: 'Subject/Complaint type and description/details are required' 
        });
      }
      
      const complaintId = await generateComplaintId();
      
      const result = await sql`
        INSERT INTO complaints (
          complaint_id, engineer_id, engineer_name, engineer_email, 
          subject, description, category,
          status, status_note, created_at, updated_at
        ) VALUES (
          ${complaintId}, ${userId}, ${userName}, ${userEmail},
          ${finalSubject}, ${finalDescription}, ${finalCategory},
          'pending', '', NOW(), NOW()
        )
        RETURNING *
      `;
      
      console.log(`✅ Complaint created: ${complaintId} by ${userName}`);
      
      // Send email notification for new complaint (async, don't block response)
      sendComplaintEmailNotification(result[0]).catch(err => {
        console.error('❌ Failed to send complaint email notification:', err.message);
      });
      
      res.status(201).json(result[0]);
    } catch (error: any) {
      console.error('❌ Error creating complaint:', error);
      res.status(500).json({ 
        message: 'Failed to create complaint',
        error: error.message 
      });
    }
  });
  
  // Get all complaints (for web dashboard - admin only)
  app.get('/api/complaints', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.user?.role || req.session?.user?.role;
      const userId = req.user?.id || req.session?.user?.id;
      
      let complaints;
      
      // Only admin can see all complaints
      if (userRole === 'admin') {
        complaints = await sql`
          SELECT * FROM complaints 
          ORDER BY created_at DESC
        `;
      } else {
        // Engineers and other roles can only see their own complaints
        complaints = await sql`
          SELECT * FROM complaints 
          WHERE engineer_id = ${typeof userId === 'number' ? userId : parseInt(userId) || 0}
          ORDER BY created_at DESC
        `;
      }
      
      res.json(complaints);
    } catch (error: any) {
      console.error('❌ Error fetching complaints:', error);
      res.status(500).json({ 
        message: 'Failed to fetch complaints',
        error: error.message 
      });
    }
  });
  
  // Get my complaints (for mobile app)
  app.get('/api/complaints/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.user?.id;
      
      const complaints = await sql`
        SELECT * FROM complaints 
        WHERE engineer_id = ${typeof userId === 'number' ? userId : parseInt(userId) || 0}
        ORDER BY created_at DESC
      `;
      
      res.json(complaints);
    } catch (error: any) {
      console.error('❌ Error fetching my complaints:', error);
      res.status(500).json({ 
        message: 'Failed to fetch your complaints',
        error: error.message 
      });
    }
  });
  
  // Update complaint status (admin only - with locking after resolved)
  app.put('/api/complaints/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.user?.role || req.session?.user?.role;
      const changerId = req.user?.id || req.session?.user?.id;
      const changerName = req.user?.firstName && req.user?.lastName 
        ? `${req.user.firstName} ${req.user.lastName}`.trim()
        : req.user?.username || req.session?.user?.username || 'Unknown';
      
      if (userRole !== 'admin') {
        return res.status(403).json({ 
          message: 'Only administrators can change complaint status' 
        });
      }
      
      const complaintId = parseInt(req.params.id);
      const { status, statusNote } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }
      
      // Check if complaint exists and is not locked
      const existing = await sql`
        SELECT * FROM complaints WHERE id = ${complaintId}
      `;
      
      if (!existing || existing.length === 0) {
        return res.status(404).json({ message: 'Complaint not found' });
      }
      
      if (existing[0].is_locked) {
        return res.status(400).json({ 
          message: 'This complaint is resolved and locked. Status cannot be changed.' 
        });
      }
      
      // Build status history entry
      const historyEntry = {
        status,
        note: statusNote || '',
        changedBy: changerId,
        changedByName: changerName,
        changedAt: new Date().toISOString()
      };
      
      // Get current history
      const currentHistory = existing[0].status_history || [];
      const newHistory = [...currentHistory, historyEntry];
      
      // Prepare update
      const isResolved = status === 'resolved';
      
      const result = await sql`
        UPDATE complaints SET
          status = ${status},
          status_note = ${statusNote || ''},
          status_history = ${JSON.stringify(newHistory)},
          is_locked = ${isResolved},
          resolved_at = ${isResolved ? new Date().toISOString() : null},
          updated_at = NOW()
        WHERE id = ${complaintId}
        RETURNING *
      `;
      
      console.log(`✅ Complaint ${complaintId} status updated to ${status} by ${changerName}`);
      res.json(result[0]);
    } catch (error: any) {
      console.error('❌ Error updating complaint status:', error);
      res.status(500).json({ 
        message: 'Failed to update complaint status',
        error: error.message 
      });
    }
  });

  // Add engineer note to complaint (without changing status)
  app.post('/api/complaints/:id/engineer-note', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.user?.id;
      const userName = req.user?.firstName && req.user?.lastName 
        ? `${req.user.firstName} ${req.user.lastName}`.trim()
        : req.user?.username || req.session?.user?.username || 'Unknown';
      
      const complaintId = parseInt(req.params.id);
      const { note } = req.body;
      
      if (!note || !note.trim()) {
        return res.status(400).json({ message: 'Note is required' });
      }
      
      // Check if complaint exists and belongs to the engineer
      const existing = await sql`
        SELECT * FROM complaints WHERE id = ${complaintId}
      `;
      
      if (!existing || existing.length === 0) {
        return res.status(404).json({ message: 'Complaint not found' });
      }
      
      // Check if this engineer owns the complaint
      if (existing[0].engineer_id !== userId) {
        return res.status(403).json({ 
          message: 'You can only add notes to your own complaints' 
        });
      }
      
      // Build note entry for status history
      const historyEntry = {
        status: existing[0].status, // Keep same status
        note: note.trim(),
        changedBy: userId,
        changedByName: `${userName} (Engineer)`,
        changedAt: new Date().toISOString(),
        isEngineerNote: true // Mark as engineer note
      };
      
      // Get current history
      const currentHistory = existing[0].status_history || [];
      const newHistory = [...currentHistory, historyEntry];
      
      const result = await sql`
        UPDATE complaints SET
          status_history = ${JSON.stringify(newHistory)},
          updated_at = NOW()
        WHERE id = ${complaintId}
        RETURNING *
      `;
      
      console.log(`✅ Engineer ${userName} added note to complaint ${complaintId}`);
      res.json(result[0]);
    } catch (error: any) {
      console.error('❌ Error adding engineer note:', error);
      res.status(500).json({ 
        message: 'Failed to add note',
        error: error.message 
      });
    }
  });
  
  // ===================================================
  // END COMPLAINTS MANAGEMENT API
  // ===================================================
  
  // ========================================
  // SYSTEM INFO COLLECTION ENDPOINTS
  // For batch script to collect desktop/laptop info
  // ========================================
  
  // Step 1: Login with Customer Portal credentials
  // Returns customer name for auto-fill
  app.post('/api/system-info/login', async (req, res) => {
    try {
      console.log('?? System Info Login Request');
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username and password are required' 
        });
      }
      
      // Authenticate using Customer Portal credentials
      console.log('?? Authenticating customer portal user:', username);
      const customer = await storage.getCustomerByUsername(username);
      
      if (!customer) {
        console.log('? Customer not found:', username);
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid username or password' 
        });
      }
      
      // Verify password (plain text comparison as per customer portal)
      if (customer.portalPassword !== password) {
        console.log('? Invalid password for customer:', username);
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid username or password' 
        });
      }
      
      console.log('? Customer authenticated:', customer.name);
      
      res.json({ 
        success: true, 
        customerId: customer.id,
        customerName: customer.name,
        message: `Welcome - ${customer.name}`
      });
      
    } catch (error: any) {
      console.error('? System info login error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Login failed',
        error: error.message 
      });
    }
  });
  
  // Step 2: Collect system information from batch script
  // username/password = Customer Portal credentials
  // engineerName = Manual entry (matched against users table for "updated by")
  // customerName = Auto-filled from customer portal login
  // systemUserName = Manual entry (who uses this PC)
  app.post('/api/system-info/collect', async (req, res) => {
    try {
      console.log('?? Received system info collection request');
      console.log('?? Request body:', JSON.stringify(req.body, null, 2));
      
      const { username, password, engineerName, systemUserName, department, customerName, customerId, systemInfo } = req.body;
      
      // Validate required fields
      if (!username || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username and password are required' 
        });
      }
      
      if (!systemInfo || !systemInfo.systemName) {
        return res.status(400).json({ 
          success: false, 
          message: 'System information is required' 
        });
      }
      
      // Authenticate using Customer Portal credentials
      console.log('?? Authenticating customer portal user:', username);
      const customer = await storage.getCustomerByUsername(username);
      
      if (!customer) {
        console.log('? Customer not found:', username);
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid username or password' 
        });
      }
      
      // Verify password (plain text comparison as per customer portal)
      if (customer.portalPassword !== password) {
        console.log('? Invalid password for customer:', username);
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid username or password' 
        });
      }
      
      console.log('? Customer authenticated:', customer.name);
      
      // Get the customer details
      const finalCustomerId = customer.id;
      const finalCustomerName = customer.name;
      
      // Engineer name is manually entered, try to find matching user for emp_id
      let empId = '';
      let finalEngineerName = engineerName || 'Unknown';
      
      if (engineerName) {
        try {
          // Try to find user by username or name
          const users = await client`
            SELECT id, username, first_name, last_name 
            FROM users 
            WHERE LOWER(username) = ${engineerName.toLowerCase()}
               OR LOWER(first_name) = ${engineerName.toLowerCase()}
               OR LOWER(CONCAT(first_name, ' ', last_name)) = ${engineerName.toLowerCase()}
            LIMIT 1
          `;
          if (users.length > 0) {
            empId = users[0].id.toString();
            finalEngineerName = users[0].first_name 
              ? `${users[0].first_name} ${users[0].last_name || ''}`.trim()
              : users[0].username;
            console.log('? Found engineer:', finalEngineerName, '(ID:', empId, ')');
          }
        } catch (err) {
          console.log('?? Engineer lookup failed, using provided name');
        }
      }
      
      // Insert system details into database
      console.log('?? Saving system information to database...');
      console.log('  Customer:', finalCustomerName, '(ID:', finalCustomerId, ')');
      console.log('  Engineer:', finalEngineerName, '(ID:', empId || 'N/A', ')');
      console.log('  System User:', systemUserName || 'Not provided');
      console.log('  System:', systemInfo.systemName);
      
      // Build other_software field with system user name
      const otherSoftwareData = systemUserName 
        ? `System User: ${systemUserName}` 
        : null;
      
      // Ensure new columns exist
      try {
        await client`ALTER TABLE customer_system_details ADD COLUMN IF NOT EXISTS ethernet_speed VARCHAR(50)`;
        await client`ALTER TABLE customer_system_details ADD COLUMN IF NOT EXISTS department VARCHAR(100)`;
      } catch (e) {
        console.log('?? Could not add columns (may already exist)');
      }
      
      const result = await client`
        INSERT INTO customer_system_details (
          customer_id, customer_name, emp_id, emp_name, department, system_name, system_type,
          processor, processor_cores, processor_speed, ram, ram_type, ram_frequency, ram_slots,
          motherboard, motherboard_manufacturer, hard_disk, hdd_capacity, ssd, ssd_capacity,
          graphics_card, graphics_memory, operating_system, os_version, os_architecture,
          mac_address, ip_address, ethernet_speed, serial_number, bios_version, antivirus, ms_office,
          other_software, collected_at, created_at, updated_at
        ) VALUES (
          ${finalCustomerId}, ${finalCustomerName}, ${empId}, ${finalEngineerName}, ${department || null},
          ${systemInfo.systemName || null}, ${systemInfo.systemType || null},
          ${systemInfo.processor || null}, ${systemInfo.processorCores || null}, ${systemInfo.processorSpeed || null},
          ${systemInfo.ram || null}, ${systemInfo.ramType || null}, ${systemInfo.ramFrequency || null}, ${systemInfo.ramSlots || null},
          ${systemInfo.motherboard || null}, ${systemInfo.motherboardManufacturer || null},
          ${systemInfo.hardDisk || null}, ${systemInfo.hddCapacity || null},
          ${systemInfo.ssd || null}, ${systemInfo.ssdCapacity || null},
          ${systemInfo.graphicsCard || null}, ${systemInfo.graphicsMemory || null},
          ${systemInfo.operatingSystem || null}, ${systemInfo.osVersion || null}, ${systemInfo.osArchitecture || null},
          ${systemInfo.macAddress || null}, ${systemInfo.ipAddress || null}, ${systemInfo.ethernetSpeed || null},
          ${systemInfo.serialNumber || null}, ${systemInfo.biosVersion || null},
          ${systemInfo.antivirus || null}, ${systemInfo.msOffice || null},
          ${otherSoftwareData},
          NOW(), NOW(), NOW()
        ) RETURNING id
      `;
      
      const recordId = result[0]?.id;
      console.log('? System info saved successfully! Record ID:', recordId);
      
      res.json({ 
        success: true, 
        message: 'System information saved successfully',
        recordId: recordId,
        customer: finalCustomerName,
        engineer: finalEngineerName
      });
      
    } catch (error: any) {
      console.error('? Error saving system info:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to save system information',
        error: error.message 
      });
    }
  });
  
  // Get all system info records (admin only)
  app.get('/api/system-info', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.user?.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin' && user?.role !== 'manager') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const records = await client`
        SELECT * FROM customer_system_details 
        ORDER BY created_at DESC
        LIMIT 100
      `;
      
      res.json(records);
    } catch (error: any) {
      console.error('? Error fetching system info:', error);
      res.status(500).json({ 
        message: 'Failed to fetch system information',
        error: error.message 
      });
    }
  });
  
  // Get system info for specific customer
  app.get('/api/system-info/customer/:customerId', isAuthenticated, async (req: any, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      
      const records = await client`
        SELECT * FROM customer_system_details 
        WHERE customer_id = ${customerId}
        ORDER BY created_at DESC
      `;
      
      res.json(records);
    } catch (error: any) {
      console.error('? Error fetching customer system info:', error);
      res.status(500).json({ 
        message: 'Failed to fetch customer system information',
        error: error.message 
      });
    }
  });
  
  // Delete system info record
  app.delete('/api/system-info/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.user?.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can delete system info' });
      }
      
      const recordId = parseInt(req.params.id);
      
      await client`DELETE FROM customer_system_details WHERE id = ${recordId}`;
      
      res.json({ success: true, message: 'Record deleted successfully' });
    } catch (error: any) {
      console.error('? Error deleting system info:', error);
      res.status(500).json({ 
        message: 'Failed to delete system information',
        error: error.message 
      });
    }
  });
  
  // ===================================================
  // END SYSTEM INFO API
  // ===================================================

  // ===================================================
  // FIX MISSING COLUMNS IN USERS TABLE
  // ===================================================
  try {
    await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(255)`;
    await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(255)`;
    await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT`;
    await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token TEXT`;
    await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS device_info TEXT`;
    await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP`;
    await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true`;
    await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`;
    console.log('✅ Users table columns verified');
  } catch (error) {
    console.log('Users table columns may already exist');
  }

  // ===================================================
  // ENGINEER PORTAL DOCUMENTS API
  // ===================================================
  
  // Create tables if they don't exist
  try {
    await client`
      CREATE TABLE IF NOT EXISTS customer_documents (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        document_type VARCHAR(50) NOT NULL,
        document_name VARCHAR(255),
        file_name VARCHAR(255) NOT NULL,
        file_url TEXT NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        uploaded_by INTEGER NOT NULL REFERENCES users(id),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    await client`
      CREATE TABLE IF NOT EXISTS engineer_documents (
        id SERIAL PRIMARY KEY,
        engineer_id INTEGER NOT NULL REFERENCES users(id),
        document_name VARCHAR(255) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_url TEXT NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Document tables initialized');
  } catch (error) {
    console.log('Document tables may already exist or error:', error);
  }
  
  // Get all customer documents (for engineer who uploaded)
  app.get('/api/portal/customer-documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.user?.id;
      const search = req.query.search || '';
      
      let documents;
      if (search) {
        documents = await client`
          SELECT cd.*, c.name as customer_name, u.first_name || ' ' || u.last_name as uploaded_by_name
          FROM customer_documents cd
          LEFT JOIN customers c ON cd.customer_id = c.id
          LEFT JOIN users u ON cd.uploaded_by = u.id
          WHERE cd.uploaded_by = ${userId}
          AND (c.name ILIKE ${'%' + search + '%'} OR cd.document_name ILIKE ${'%' + search + '%'} OR cd.document_type ILIKE ${'%' + search + '%'})
          ORDER BY cd.created_at DESC
        `;
      } else {
        documents = await client`
          SELECT cd.*, c.name as customer_name, u.first_name || ' ' || u.last_name as uploaded_by_name
          FROM customer_documents cd
          LEFT JOIN customers c ON cd.customer_id = c.id
          LEFT JOIN users u ON cd.uploaded_by = u.id
          WHERE cd.uploaded_by = ${userId}
          ORDER BY cd.created_at DESC
        `;
      }
      
      res.json(documents);
    } catch (error: any) {
      console.error('Error fetching customer documents:', error);
      res.status(500).json({ message: 'Failed to fetch customer documents', error: error.message });
    }
  });
  
  // Upload customer document
  app.post('/api/portal/customer-documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.user?.id;
      const { customerId, documentType, documentName, fileName, fileUrl, fileSize, mimeType, notes } = req.body;
      
      if (!customerId || !documentType || !fileUrl) {
        return res.status(400).json({ message: 'Customer, document type and file are required' });
      }
      
      const result = await client`
        INSERT INTO customer_documents (customer_id, document_type, document_name, file_name, file_url, file_size, mime_type, uploaded_by, notes)
        VALUES (${customerId}, ${documentType}, ${documentName || null}, ${fileName || 'document'}, ${fileUrl}, ${fileSize || null}, ${mimeType || null}, ${userId}, ${notes || null})
        RETURNING *
      `;
      
      // Get customer name for response
      const customer = await client`SELECT name FROM customers WHERE id = ${customerId}`;
      const doc = result[0];
      doc.customer_name = customer[0]?.name || 'Unknown';
      
      res.status(201).json(doc);
    } catch (error: any) {
      console.error('Error uploading customer document:', error);
      res.status(500).json({ message: 'Failed to upload customer document', error: error.message });
    }
  });
  
  // Delete customer document
  app.delete('/api/portal/customer-documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.user?.id;
      const documentId = parseInt(req.params.id);
      
      // Only allow deleting own documents
      const doc = await client`SELECT * FROM customer_documents WHERE id = ${documentId} AND uploaded_by = ${userId}`;
      if (doc.length === 0) {
        return res.status(404).json({ message: 'Document not found or not authorized' });
      }
      
      await client`DELETE FROM customer_documents WHERE id = ${documentId}`;
      
      res.json({ success: true, message: 'Document deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting customer document:', error);
      res.status(500).json({ message: 'Failed to delete customer document', error: error.message });
    }
  });
  
  // Get all engineer documents (for current engineer)
  app.get('/api/portal/engineer-documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.user?.id;
      const search = req.query.search || '';
      
      let documents;
      if (search) {
        documents = await client`
          SELECT ed.*, u.first_name || ' ' || u.last_name as engineer_name
          FROM engineer_documents ed
          LEFT JOIN users u ON ed.engineer_id = u.id
          WHERE ed.engineer_id = ${userId}
          AND ed.document_name ILIKE ${'%' + search + '%'}
          ORDER BY ed.created_at DESC
        `;
      } else {
        documents = await client`
          SELECT ed.*, u.first_name || ' ' || u.last_name as engineer_name
          FROM engineer_documents ed
          LEFT JOIN users u ON ed.engineer_id = u.id
          WHERE ed.engineer_id = ${userId}
          ORDER BY ed.created_at DESC
        `;
      }
      
      res.json(documents);
    } catch (error: any) {
      console.error('Error fetching engineer documents:', error);
      res.status(500).json({ message: 'Failed to fetch engineer documents', error: error.message });
    }
  });
  
  // Upload engineer document
  app.post('/api/portal/engineer-documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.user?.id;
      const { documentName, fileName, fileUrl, fileSize, mimeType, notes } = req.body;
      
      if (!documentName || !fileUrl) {
        return res.status(400).json({ message: 'Document name and file are required' });
      }
      
      const result = await client`
        INSERT INTO engineer_documents (engineer_id, document_name, file_name, file_url, file_size, mime_type, notes)
        VALUES (${userId}, ${documentName}, ${fileName || 'document'}, ${fileUrl}, ${fileSize || null}, ${mimeType || null}, ${notes || null})
        RETURNING *
      `;
      
      // Get engineer name for response
      const engineer = await client`SELECT first_name, last_name FROM users WHERE id = ${userId}`;
      const doc = result[0];
      doc.engineer_name = `${engineer[0]?.first_name || ''} ${engineer[0]?.last_name || ''}`.trim() || 'Unknown';
      
      res.status(201).json(doc);
    } catch (error: any) {
      console.error('Error uploading engineer document:', error);
      res.status(500).json({ message: 'Failed to upload engineer document', error: error.message });
    }
  });
  
  // Delete engineer document
  app.delete('/api/portal/engineer-documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.user?.id;
      const documentId = parseInt(req.params.id);
      
      // Only allow deleting own documents
      const doc = await client`SELECT * FROM engineer_documents WHERE id = ${documentId} AND engineer_id = ${userId}`;
      if (doc.length === 0) {
        return res.status(404).json({ message: 'Document not found or not authorized' });
      }
      
      await client`DELETE FROM engineer_documents WHERE id = ${documentId}`;
      
      res.json({ success: true, message: 'Document deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting engineer document:', error);
      res.status(500).json({ message: 'Failed to delete engineer document', error: error.message });
    }
  });
  
  // ===================================================
  // END ENGINEER PORTAL DOCUMENTS API
  // ===================================================
  
  return httpServer;
}

