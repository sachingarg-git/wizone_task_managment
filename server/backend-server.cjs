require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
const { initDatabase, customerDB, userDB, closeDatabase } = require('./database.cjs');

const app = express();
const PORT = process.env.PORT || 4003;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|xlsx|xls|ppt|pptx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only common file types are allowed (images, documents, spreadsheets)'));
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist/public')));

// Mock data
const mockUsers = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@wizone.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    department: 'IT',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const mockTasks = [
  {
    id: 1,
    title: 'System Maintenance',
    description: 'Perform routine system maintenance',
    status: 'pending',
    priority: 'high',
    customerId: 2, // wizone it network india pvt ltd
    customerName: 'wizone it network india pvt ltd',
    customerEmail: 'support@wizoneit.com',
    assigneeId: 1,
    assigneeName: 'System Admin',
    issueType: 'maintenance',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 hour ago
  },
  {
    id: 2,
    title: 'Network Setup',
    description: 'Setup new network infrastructure',
    status: 'in-progress',
    priority: 'medium',
    customerId: 3, // wizoneit
    customerName: 'wizoneit',
    customerEmail: 'admin@wizoneit.com',
    assigneeId: 1,
    assigneeName: 'System Admin',
    issueType: 'network',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
  },
  {
    id: 3,
    title: 'Technical Support Request',
    description: 'Customer needs assistance with system configuration',
    status: 'open',
    priority: 'medium',
    customerId: 2, // wizone it network india pvt ltd
    customerName: 'wizone it network india pvt ltd',
    customerEmail: 'support@wizoneit.com',
    assigneeId: 1,
    assigneeName: 'System Admin',
    issueType: 'support',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  }
];

const mockCustomers = [
  {
    id: 1,
    customerId: 'WZ001',
    name: 'ABC Corporation',
    email: 'contact@abc.com',
    phone: '+1234567890',
    mobilePhone: '+1234567890',
    address: '123 Business St, Downtown',
    city: 'New York',
    state: 'NY',
    contactPerson: 'John Smith',
    servicePlan: 'Enterprise - 200 Mbps',
    monthlyFee: 5000,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    customerId: 'WZ002',
    name: 'Wizone IT Network India Pvt Ltd',
    email: 'support@wizoneit.com',
    phone: '+91-9876543210',
    mobilePhone: '+91-9876543210',
    address: 'IT Park, Sector 45, Gurgaon',
    city: 'Gurgaon',
    state: 'Haryana',
    contactPerson: 'Rajesh Kumar',
    servicePlan: 'Premium - 100 Mbps',
    monthlyFee: 3500,
    status: 'active',
    portalAccess: {
      enabled: true,
      username: 'wizoneit',
      password: 'wizone123',
      portalUrl: '/customer-portal',
      createdAt: new Date().toISOString()
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    customerId: 'WZ003',
    name: 'Tech Solutions Mumbai',
    email: 'admin@techsolutions.com',
    phone: '+91-9876543211',
    mobilePhone: '+91-9876543211',
    address: 'Tech Hub, Andheri East',
    city: 'Mumbai',
    state: 'Maharashtra',
    contactPerson: 'Priya Sharma',
    servicePlan: 'Business Pro - 500 Mbps',
    monthlyFee: 7500,
    status: 'active',
    portalAccess: {
      enabled: true,
      username: 'techsol',
      password: 'tech123',
      portalUrl: '/customer-portal',
      createdAt: new Date().toISOString()
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 4,
    customerId: 'WZ004',
    name: 'TechCorp Solutions',
    email: 'contact@techcorp.com',
    phone: '+91-9876543212',
    mobilePhone: '+91-9876543212',
    address: '123 Tech Street, Cyber City',
    city: 'Bangalore',
    state: 'Karnataka',
    contactPerson: 'Amit Verma',
    servicePlan: 'Standard - 50 Mbps',
    monthlyFee: 2500,
    status: 'active',
    portalAccess: {
      enabled: true,
      username: 'techcorp',
      password: 'corp123',
      portalUrl: '/customer-portal',
      createdAt: new Date().toISOString()
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 5,
    customerId: 'WZ005',
    name: 'Global Enterprises',
    email: 'admin@globalent.com',
    phone: '+91-9988776655',
    mobilePhone: '+91-9988776655',
    address: '456 Business Avenue, Connaught Place',
    city: 'Delhi',
    state: 'Delhi',
    contactPerson: 'Sneha Gupta',
    servicePlan: 'Basic - 25 Mbps',
    monthlyFee: 1500,
    status: 'active',
    portalAccess: {
      enabled: true,
      username: 'global',
      password: 'global123',
      portalUrl: '/customer-portal',
      createdAt: new Date().toISOString()
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 6,
    customerId: 'WZ006',
    name: 'Digital Innovations Pvt Ltd',
    email: 'info@digitalinnovations.com',
    phone: '+91-9123456789',
    mobilePhone: '+91-9123456789',
    address: 'Innovation Campus, Electronic City',
    city: 'Bangalore',
    state: 'Karnataka',
    contactPerson: 'Vikram Singh',
    servicePlan: 'Enterprise - 200 Mbps',
    monthlyFee: 5500,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 7,
    customerId: 'WZ007',
    name: 'Smart Systems Ltd',
    email: 'contact@smartsystems.in',
    phone: '+91-9876501234',
    mobilePhone: '+91-9876501234',
    address: 'Smart Tower, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    contactPerson: 'Kavita Joshi',
    servicePlan: 'Premium - 100 Mbps',
    monthlyFee: 4000,
    status: 'inactive',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 8,
    customerId: 'WZ008',
    name: 'Future Tech Solutions',
    email: 'support@futuretech.com',
    phone: '+91-9456781230',
    mobilePhone: '+91-9456781230',
    address: 'Future Plaza, Sector 18',
    city: 'Noida',
    state: 'Uttar Pradesh',
    contactPerson: 'Rohit Sharma',
    servicePlan: 'Standard - 50 Mbps',
    monthlyFee: 2800,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Mock task updates/history data
const mockTaskUpdates = [
  {
    id: 1,
    taskId: 1,
    updateType: 'status_change',
    oldValue: 'open',
    newValue: 'in-progress',
    note: 'Started working on the server maintenance task',
    updatedBy: 'admin',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    taskId: 1,
    updateType: 'comment',
    note: 'Completed initial system backup. Moving to hardware inspection phase.',
    updatedBy: 'admin',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 3,
    taskId: 1,
    updateType: 'priority_change',
    oldValue: 'medium',
    newValue: 'high',
    note: 'Increased priority due to client requirements',
    updatedBy: 'admin',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 4,
    taskId: 2,
    updateType: 'status_change',
    oldValue: 'open',
    newValue: 'in-progress',
    note: 'Network infrastructure planning completed, starting implementation',
    updatedBy: 'admin',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 100,
    taskId: 1,
    updateType: 'file_upload',
    note: 'Uploaded network diagram and configuration files',
    updatedBy: 'admin',
    attachments: [
      {
        originalName: 'network_diagram.pdf',
        filename: 'sample-network-diagram.pdf',
        size: 524288,
        mimetype: 'application/pdf',
        path: '/api/uploads/sample-network-diagram.pdf'
      },
      {
        originalName: 'config.txt',
        filename: 'sample-config.txt',
        size: 2048,
        mimetype: 'text/plain',
        path: '/api/uploads/sample-config.txt'
      }
    ],
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  }
];

// Session storage (in-memory for demo)
let currentSession = null;

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Backend server is running'
  });
});

// Authentication endpoints
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  console.log('🔑 Login attempt:', { username, password });
  
  // Accept multiple valid credentials for easier access
  const validCredentials = [
    { username: 'admin', password: 'admin123', role: 'admin', name: 'Admin User' },
    { username: 'admin', password: 'admin', role: 'admin', name: 'Admin User' },
    { username: 'user', password: 'user123', role: 'technician', name: 'Tech User' },
    { username: 'test', password: 'test', role: 'admin', name: 'Test User' },
    { username: 'demo', password: 'demo', role: 'admin', name: 'Demo User' }
  ];
  
  const validUser = validCredentials.find(cred => 
    cred.username === username && cred.password === password
  );
  
  if (validUser) {
    console.log('✅ Login successful for:', username);
    currentSession = {
      id: 1,
      username: validUser.username,
      firstName: validUser.name.split(' ')[0],
      lastName: validUser.name.split(' ')[1] || 'User',
      email: `${validUser.username}@wizone.com`,
      role: validUser.role,
      name: validUser.name
    };
    res.json(currentSession);
  } else {
    console.log('❌ Invalid credentials for:', username);
    console.log('💡 Valid credentials: admin/admin, admin/admin123, demo/demo, test/test, user/user123');
    res.status(401).json({
      success: false,
      message: 'Invalid username or password. Try: admin/admin or demo/demo'
    });
  }
});

app.get('/api/auth/user', (req, res) => {
  if (currentSession) {
    res.json(currentSession);
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  currentSession = null;
  res.json({ message: 'Logged out successfully' });
});

// Dashboard endpoints
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const customers = await customerDB.getAll();
    res.json({
      totalTasks: mockTasks.length,
      pendingTasks: mockTasks.filter(t => t.status === 'pending').length,
      inProgressTasks: mockTasks.filter(t => t.status === 'in-progress').length,
      completedTasks: mockTasks.filter(t => t.status === 'completed').length,
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.status === 'active').length
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    // Fallback to mock data
    res.json({
      totalTasks: mockTasks.length,
      pendingTasks: mockTasks.filter(t => t.status === 'pending').length,
      inProgressTasks: mockTasks.filter(t => t.status === 'in-progress').length,
      completedTasks: mockTasks.filter(t => t.status === 'completed').length,
      totalCustomers: mockCustomers.length,
      activeCustomers: mockCustomers.filter(c => c.status === 'active').length
    });
  }
});

app.get('/api/dashboard/recent-tasks', (req, res) => {
  res.json(mockTasks.slice(0, 5)); // Return first 5 tasks
});

// Tasks endpoints
app.get('/api/tasks', (req, res) => {
  console.log('📋 Fetching all tasks');
  
  // Enrich tasks with customer information
  const enrichedTasks = mockTasks.map(task => {
    const customer = mockCustomers.find(c => c.id === task.customerId);
    return {
      ...task,
      customerName: customer ? customer.name : task.customerName || 'Unknown Customer',
      customerEmail: customer ? customer.email : 'Unknown Email'
    };
  });
  
  res.json(enrichedTasks);
});

app.get('/api/tasks/:id', (req, res) => {
  const task = mockTasks.find(t => t.id === parseInt(req.params.id));
  if (task) {
    res.json(task);
  } else {
    res.status(404).json({ message: 'Task not found' });
  }
});

app.post('/api/tasks', (req, res) => {
  const newTask = {
    id: mockTasks.length + 1,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mockTasks.push(newTask);
  res.status(201).json(newTask);
});

app.put('/api/tasks/:id', (req, res) => {
  const taskIndex = mockTasks.findIndex(t => t.id === parseInt(req.params.id));
  if (taskIndex !== -1) {
    const oldTask = { ...mockTasks[taskIndex] };
    mockTasks[taskIndex] = {
      ...mockTasks[taskIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    // Create an update history entry when task is updated
    const updateEntry = {
      id: mockTaskUpdates.length + 1,
      taskId: parseInt(req.params.id),
      updateType: 'update',
      note: req.body.notes || 'Task updated',
      updatedBy: 'admin', // In real app, get from session
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add specific update types based on what changed
    if (req.body.status && req.body.status !== oldTask.status) {
      updateEntry.updateType = 'status_change';
      updateEntry.oldValue = oldTask.status;
      updateEntry.newValue = req.body.status;
      updateEntry.note = req.body.notes || `Status changed from ${oldTask.status} to ${req.body.status}`;
    } else if (req.body.priority && req.body.priority !== oldTask.priority) {
      updateEntry.updateType = 'priority_change';
      updateEntry.oldValue = oldTask.priority;
      updateEntry.newValue = req.body.priority;
      updateEntry.note = req.body.notes || `Priority changed from ${oldTask.priority} to ${req.body.priority}`;
    } else if (req.body.notes) {
      updateEntry.updateType = 'comment';
    }
    
    mockTaskUpdates.push(updateEntry);
    console.log('✅ Task updated and history entry created:', updateEntry);
    
    res.json(mockTasks[taskIndex]);
  } else {
    res.status(404).json({ message: 'Task not found' });
  }
});

// Task updates/history endpoint
app.get('/api/tasks/:id/updates', (req, res) => {
  const taskId = parseInt(req.params.id);
  const updates = mockTaskUpdates
    .filter(update => update.taskId === taskId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Most recent first
  
  console.log(`📋 Fetching task updates for task ${taskId}:`, updates);
  res.json(updates);
});

// File upload endpoint for tasks (handles base64 data from frontend)
app.post('/api/tasks/:id/upload', (req, res) => {
  const taskId = parseInt(req.params.id);
  const { files, notes } = req.body;
  
  console.log(`📁 File upload for task ${taskId}:`, files?.length || 0, 'files');
  console.log('Upload notes:', notes);
  
  if (!files || files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }
  
  const fileInfos = [];
  
  try {
    // Process each base64 file
    files.forEach((fileData, index) => {
      // Extract file info from base64 data URL
      const matches = fileData.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        throw new Error(`Invalid file data format for file ${index + 1}`);
      }
      
      const mimeType = matches[1];
      const base64Data = matches[2];
      
      // Generate filename
      const timestamp = Date.now();
      const random = Math.round(Math.random() * 1E9);
      const extension = mimeType.split('/')[1] || 'bin';
      const filename = `upload-${timestamp}-${random}.${extension}`;
      const filePath = path.join(uploadsDir, filename);
      
      // Save file to disk
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filePath, buffer);
      
      fileInfos.push({
        originalName: `Document_${index + 1}.${extension}`,
        filename: filename,
        size: buffer.length,
        mimetype: mimeType,
        path: `/api/uploads/${filename}`
      });
    });
    
    // Create update history entry for file upload
    const updateEntry = {
      id: mockTaskUpdates.length + 1,
      taskId: taskId,
      updateType: 'file_upload',
      note: notes || `Uploaded ${files.length} file(s)`,
      updatedBy: 'admin', // In real app, get from session
      attachments: fileInfos,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    mockTaskUpdates.push(updateEntry);
    console.log('✅ File upload history entry created:', updateEntry);
    
    res.json({
      message: 'Files uploaded successfully',
      files: fileInfos,
      updateId: updateEntry.id
    });
    
  } catch (error) {
    console.error('❌ File upload error:', error.message);
    res.status(500).json({ message: `File upload failed: ${error.message}` });
  }
});

// Delete task endpoint
app.delete('/api/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const taskIndex = mockTasks.findIndex(task => task.id === taskId);
  
  if (taskIndex === -1) {
    return res.status(404).json({ message: 'Task not found' });
  }
  
  const deletedTask = mockTasks[taskIndex];
  
  // Remove task from mock data
  mockTasks.splice(taskIndex, 1);
  
  // Remove related task updates
  const updatesToRemove = mockTaskUpdates.filter(update => update.taskId === taskId);
  updatesToRemove.forEach(update => {
    const updateIndex = mockTaskUpdates.indexOf(update);
    if (updateIndex > -1) {
      mockTaskUpdates.splice(updateIndex, 1);
    }
  });
  
  console.log(`🗑️ Task deleted: ${deletedTask.ticketNumber} (ID: ${taskId})`);
  console.log(`🗑️ Removed ${updatesToRemove.length} related updates`);
  
  res.json({
    message: 'Task deleted successfully',
    deletedTask: {
      id: deletedTask.id,
      ticketNumber: deletedTask.ticketNumber,
      title: deletedTask.title
    }
  });
});

// Task statistics endpoint
app.get('/api/tasks/stats', (req, res) => {
  try {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Calculate task statistics
    const stats = {
      total: mockTasks.length,
      pending: mockTasks.filter(task => task.status === 'pending').length,
      inProgress: mockTasks.filter(task => task.status === 'in_progress' || task.status === 'start_task').length,
      completed: mockTasks.filter(task => {
        if (task.status === 'completed' || task.status === 'resolved') {
          // Check if completed today
          const completedDate = new Date(task.completionTime || task.updatedAt);
          return completedDate >= todayStart;
        }
        return false;
      }).length,
      resolved: mockTasks.filter(task => task.status === 'resolved').length,
      cancelled: mockTasks.filter(task => task.status === 'cancelled').length,
      // Priority breakdown
      highPriority: mockTasks.filter(task => task.priority === 'high').length,
      mediumPriority: mockTasks.filter(task => task.priority === 'medium').length,
      lowPriority: mockTasks.filter(task => task.priority === 'low').length,
      // Assigned vs unassigned
      assigned: mockTasks.filter(task => task.assignedTo).length,
      unassigned: mockTasks.filter(task => !task.assignedTo).length
    };
    
    console.log('📊 Task statistics requested:', stats);
    
    res.json(stats);
  } catch (error) {
    console.error('❌ Error calculating task stats:', error);
    res.status(500).json({ 
      message: 'Failed to calculate task statistics',
      error: error.message 
    });
  }
});

// Serve uploaded files
app.get('/api/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }
  
  res.sendFile(filePath);
});

// Customers endpoints
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await customerDB.getAll();
    res.json(customers);
  } catch (error) {
    console.error('Error getting customers:', error);
    // Fallback to mock data if database fails
    res.json(mockCustomers);
  }
});

app.get('/api/customers/:id', async (req, res) => {
  try {
    const customer = await customerDB.getById(parseInt(req.params.id));
    if (customer) {
      res.json(customer);
    } else {
      res.status(404).json({ message: 'Customer not found' });
    }
  } catch (error) {
    console.error('Error getting customer:', error);
    // Fallback to mock data
    const customer = mockCustomers.find(c => c.id === parseInt(req.params.id));
    if (customer) {
      res.json(customer);
    } else {
      res.status(404).json({ message: 'Customer not found' });
    }
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const newCustomer = await customerDB.create(req.body);
    res.status(201).json(newCustomer);
  } catch (error) {
    console.error('Error creating customer:', error);
    // Fallback to mock data
    const newCustomer = {
      id: mockCustomers.length + 1,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockCustomers.push(newCustomer);
    res.status(201).json(newCustomer);
  }
});

// Seed database with sample data
app.post('/api/customers/seed-sample-data', async (req, res) => {
  try {
    const sampleCustomers = [
      {
        customer_id: 'WIZONE001',
        name: 'Wizone IT Network India Pvt Ltd',
        email: 'admin@wizoneit.com',
        contact_person: 'Rajesh Kumar',
        mobile_phone: '+91-9876543210',
        address: 'IT Park, Sector 45, Gurgaon, Haryana',
        city: 'Gurgaon',
        state: 'Haryana',
        country: 'India',
        service_plan: 'Enterprise Premium',
        status: 'active'
      },
      {
        customer_id: 'TECH002',
        name: 'Tech Solutions Pvt Ltd',
        email: 'info@techsolutions.com',
        contact_person: 'Priya Sharma',
        mobile_phone: '+91-9876543211',
        address: 'Tech Hub, Mumbai, Maharashtra',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        service_plan: 'Business Plus',
        status: 'active'
      },
      {
        customer_id: 'CORP003',
        name: 'Global Corp Industries',
        email: 'contact@globalcorp.com',
        contact_person: 'Amit Patel',
        mobile_phone: '+91-9876543212',
        address: 'Corporate Tower, Bangalore, Karnataka',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        service_plan: 'Corporate Standard',
        status: 'active'
      }
    ];

    const sampleSystemDetails = [
      {
        customer_id: 'WIZONE001',
        emp_id: 'EMP001',
        system_name: 'Desktop-001',
        processor: 'Intel Core i7-12700K',
        ram: '16GB DDR4',
        hard_disk: '1TB SATA',
        ssd: '512GB NVMe',
        operating_system: 'Windows 11 Pro',
        antivirus: 'Windows Defender + Bitdefender',
        ms_office: 'Microsoft Office 365 Business',
        other_software: 'Adobe Creative Suite, AutoCAD 2024',
        configuration: 'Development workstation with dual monitors'
      },
      {
        customer_id: 'WIZONE001',
        emp_id: 'EMP002',
        system_name: 'Laptop-HR-001',
        processor: 'Intel Core i5-11400H',
        ram: '8GB DDR4',
        hard_disk: '500GB SATA',
        ssd: '256GB NVMe',
        operating_system: 'Windows 11 Home',
        antivirus: 'Windows Defender',
        ms_office: 'Microsoft Office 365 Business',
        other_software: 'HR Management Software, Zoom',
        configuration: 'HR department laptop with VPN access'
      },
      {
        customer_id: 'TECH002',
        emp_id: 'TEC001',
        system_name: 'Server-Main',
        processor: 'AMD Ryzen 9 5950X',
        ram: '64GB DDR4',
        hard_disk: '2TB SATA RAID',
        ssd: '1TB NVMe',
        operating_system: 'Ubuntu Server 22.04 LTS',
        antivirus: 'ClamAV',
        ms_office: 'LibreOffice',
        other_software: 'Docker, Kubernetes, Jenkins',
        configuration: 'Main application server with load balancing'
      }
    ];

    let createdCustomers = 0;
    let createdSystems = 0;

    // Create customers
    for (const customer of sampleCustomers) {
      try {
        await customerDB.create(customer);
        createdCustomers++;
      } catch (error) {
        console.log('Customer already exists or error:', customer.customer_id, error.message);
      }
    }

    // Create system details
    for (const system of sampleSystemDetails) {
      try {
        await customerDB.createSystemDetails(system);
        createdSystems++;
      } catch (error) {
        console.log('System details error:', system.customer_id, error.message);
      }
    }

    res.json({
      success: true,
      message: `Seeded database with ${createdCustomers} customers and ${createdSystems} system details`,
      customersCreated: createdCustomers,
      systemsCreated: createdSystems
    });

  } catch (error) {
    console.error('Error seeding sample data:', error);
    res.status(500).json({ 
      message: 'Error seeding sample data',
      error: error.message 
    });
  }
});

// Customer CSV Import endpoint
app.post('/api/customers/import-csv', upload.single('csvFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No CSV file uploaded' });
  }

  try {
    const results = [];
    const errors = [];
    let successCount = 0;
    
    const csvStream = fs.createReadStream(req.file.path)
      .pipe(csv());
    
    csvStream.on('data', (data) => {
      results.push(data);
    });
    
    csvStream.on('end', async () => {
      for (const row of results) {
        try {
          // Map CSV columns to database fields
          const customerData = {
            customer_id: row['Customer ID'] || `CUST${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: row['Customer Name'] || row['Name'],
            email: row['Email'],
            contact_person: row['Contact Person'],
            mobile_phone: row['Mobile Phone'] || row['Phone'],
            address: row['Address'],
            city: row['City'],
            state: row['State'],
            country: row['Country'] || 'India',
            service_plan: row['Service Plan'],
            status: row['Status'] || 'active'
          };
          
          // Skip empty rows
          if (!customerData.name || customerData.name.trim() === '') {
            continue;
          }
          
          await customerDB.create(customerData);
          successCount++;
        } catch (error) {
          errors.push({
            row: row,
            error: error.message
          });
        }
      }
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      res.json({
        success: true,
        message: `Successfully imported ${successCount} customers`,
        totalProcessed: results.length,
        successCount: successCount,
        errorCount: errors.length,
        errors: errors.slice(0, 10) // Return first 10 errors
      });
    });
    
    csvStream.on('error', (error) => {
      console.error('CSV parsing error:', error);
      res.status(500).json({ 
        message: 'Error parsing CSV file',
        error: error.message 
      });
    });
    
  } catch (error) {
    console.error('Error importing CSV:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Customer Portal Access endpoints
app.put('/api/customers/:id/portal-access', async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    console.log('🔑 Portal access request received:', {
      customerId,
      body: req.body
    });
    
    const { enablePortalAccess, username, password, portalUrl } = req.body;
    
    // Validate required fields
    if (enablePortalAccess && (!username || !password)) {
      console.log('❌ Missing required fields:', { username: !!username, password: !!password });
      return res.status(400).json({ 
        message: 'Username and password are required when enabling portal access' 
      });
    }
    
    try {
      const updatedCustomer = await customerDB.updatePortalAccess(customerId, {
        enabled: enablePortalAccess,
        username: username,
        password: password,
        portalUrl: portalUrl || '/customer-portal'
      });
      
      console.log('✅ Customer portal access updated successfully:', {
        customerId,
        customerName: updatedCustomer.name,
        enabled: enablePortalAccess,
        username: enablePortalAccess ? username : 'N/A'
      });
      
      res.json({
        success: true,
        message: 'Portal access updated successfully',
        customer: updatedCustomer
      });
    } catch (error) {
      console.error('Database error, falling back to mock data:', error);
      
      // Fallback to mock data
      const customerIndex = mockCustomers.findIndex(c => c.id === customerId);
      
      if (customerIndex === -1) {
        console.log('❌ Customer not found:', customerId);
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      // Update customer with portal access information
      mockCustomers[customerIndex] = {
        ...mockCustomers[customerIndex],
        portalAccess: enablePortalAccess ? {
          enabled: true,
          username: username,
          password: password,
          portalUrl: portalUrl || '/customer-portal',
          createdAt: new Date().toISOString()
        } : {
          enabled: false
        },
        updatedAt: new Date().toISOString()
      };
      
      res.json({
        success: true,
        message: 'Portal access updated successfully',
        customer: mockCustomers[customerIndex]
      });
    }
    
  } catch (error) {
    console.error('❌ Error updating portal access:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Customer System Details endpoints
app.get('/api/customers/:id/system-details', async (req, res) => {
  try {
    const customerId = req.params.id;
    const systemDetails = await customerDB.getSystemDetails(customerId);
    res.json(systemDetails);
  } catch (error) {
    console.error('Error getting system details:', error);
    res.json([]); // Return empty array as fallback
  }
});

app.post('/api/customers/:id/system-details', async (req, res) => {
  try {
    const customerId = req.params.id;
    
    // Get the customer_id string from the numeric ID
    let actualCustomerId = customerId;
    if (typeof customerId === 'string' && /^\d+$/.test(customerId)) {
      try {
        const customer = await customerDB.getById(parseInt(customerId));
        if (customer) {
          actualCustomerId = customer.customer_id;
        }
      } catch (error) {
        // Fallback: use the ID as is
        actualCustomerId = customerId;
      }
    }
    
    const systemData = {
      ...req.body,
      customer_id: actualCustomerId
    };
    
    const newSystemDetails = await customerDB.createSystemDetails(systemData);
    res.status(201).json(newSystemDetails);
  } catch (error) {
    console.error('Error creating system details:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Helper function to get customer ID from customer username
function getCustomerIdByUsername(username) {
  const customer = mockCustomers.find(c => 
    c.portalAccess && 
    c.portalAccess.enabled && 
    c.portalAccess.username === username
  );
  return customer ? customer.id : null;
}

// Customer Portal Authentication
app.post('/api/customer-auth/login', (req, res) => {
  const { username, password } = req.body;
  
  console.log('🔐 Customer portal login attempt:', { username, password });
  console.log('🔍 Available customer credentials:');
  mockCustomers.forEach(c => {
    if (c.portalAccess && c.portalAccess.enabled) {
      console.log(`  - Customer: ${c.name}, Username: ${c.portalAccess.username}, Password: ${c.portalAccess.password}`);
    }
  });
  
  // Find customer with matching portal credentials
  const customer = mockCustomers.find(c => 
    c.portalAccess && 
    c.portalAccess.enabled && 
    c.portalAccess.username === username && 
    c.portalAccess.password === password
  );
  
  console.log('🔍 Customer search result:', customer ? `Found: ${customer.name}` : 'Not found');
  
  if (customer) {
    const customerSession = {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      role: 'customer',
      portalAccess: true,
      loginTime: new Date().toISOString()
    };
    
    console.log('✅ Customer portal login successful:', customerSession);
    
    res.json({
      success: true,
      message: 'Login successful',
      user: customerSession,
      token: `customer_token_${customer.id}_${Date.now()}` // Simple token for demo
    });
  } else {
    console.log('❌ Customer portal login failed for:', username);
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Customer Portal Task Management
app.get('/api/customer-portal/tasks/:customerId', (req, res) => {
  const customerId = parseInt(req.params.customerId);
  
  console.log(`🔍 Looking for tasks for customer ID: ${customerId}`);
  console.log('Available customers:', mockCustomers.map(c => ({id: c.id, name: c.name})));
  console.log('Available tasks:', mockTasks.map(t => ({id: t.id, customerId: t.customerId, title: t.title})));
  
  const customer = mockCustomers.find(c => c.id === customerId);
  if (!customer) {
    console.log(`❌ Customer ${customerId} not found`);
    return res.status(404).json({ message: 'Customer not found' });
  }
  
  const customerTasks = mockTasks.filter(t => t.customerId === customerId);
  
  // Enrich tasks with customer and assignee information
  const enrichedTasks = customerTasks.map(task => ({
    ...task,
    customerName: customer.name,
    customerEmail: customer.email,
    assigneeName: 'System Admin' // Could be enhanced to lookup actual assignee
  }));
  
  console.log(`📋 Found ${enrichedTasks.length} tasks for customer "${customer.name}" (ID: ${customerId})`);
  res.json(enrichedTasks);
});

// Get customer portal tasks by username (for easier frontend integration)
app.get('/api/customer-portal/my-tasks/:username', (req, res) => {
  const username = req.params.username;
  const customerId = getCustomerIdByUsername(username);
  
  if (!customerId) {
    console.log(`❌ No customer found for username: ${username}`);
    return res.status(404).json({ message: 'Customer not found' });
  }
  
  // Redirect to the main customer tasks endpoint
  req.params.customerId = customerId;
  const customer = mockCustomers.find(c => c.id === customerId);
  const customerTasks = mockTasks.filter(t => t.customerId === customerId);
  
  const enrichedTasks = customerTasks.map(task => ({
    ...task,
    customerName: customer.name,
    customerEmail: customer.email,
    assigneeName: task.assigneeName || 'System Admin'
  }));
  
  console.log(`📋 Found ${enrichedTasks.length} tasks for username "${username}" (Customer: ${customer.name}, ID: ${customerId})`);
  res.json(enrichedTasks);
});

// Get customer info by username (helper endpoint for frontend)
app.get('/api/customer-auth/user/:username', (req, res) => {
  const username = req.params.username;
  const customer = mockCustomers.find(c => 
    c.portalAccess && 
    c.portalAccess.enabled && 
    c.portalAccess.username === username
  );
  
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }
  
  res.json({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    username: customer.portalAccess.username
  });
});

app.post('/api/customer-portal/tasks', (req, res) => {
  const { customerId, title, description, priority = 'medium', issueType = 'general' } = req.body;
  
  if (!customerId) {
    return res.status(400).json({ message: 'Customer ID is required' });
  }
  
  const customer = mockCustomers.find(c => c.id === parseInt(customerId));
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }
  
  const newTask = {
    id: Math.max(...mockTasks.map(t => t.id), 0) + 1,
    title: title || 'New Task',
    description: description || 'Task created via customer portal',
    status: 'open',
    priority,
    customerId: parseInt(customerId),
    customerName: customer.name,
    customerEmail: customer.email,
    assigneeId: 1,
    assigneeName: 'System Admin',
    issueType,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  mockTasks.push(newTask);
  
  // Create initial task update entry
  const updateEntry = {
    id: Math.max(...mockTaskUpdates.map(u => u.id), 0) + 1,
    taskId: newTask.id,
    updateType: 'task_created',
    note: `Task created by customer: ${customer.name}`,
    updatedBy: customer.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  mockTaskUpdates.push(updateEntry);
  
  console.log('✅ Customer task created:', newTask);
  console.log('✅ Initial task update created:', updateEntry);
  
  res.status(201).json(newTask);
});

// Users endpoints
app.get('/api/users', async (req, res) => {
  try {
    const users = await userDB.getAll();
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    console.log('Creating new user:', req.body);
    
    // Validate required fields
    const { username, email, firstName, lastName, role } = req.body;
    if (!username || !email || !firstName || !lastName || !role) {
      return res.status(400).json({ 
        message: 'Missing required fields: username, email, firstName, lastName, role' 
      });
    }
    
    const userData = {
      username: username,
      email: email,
      firstName: firstName,
      lastName: lastName,
      role: role,
      department: req.body.department || role,
      phone: req.body.phone || '',
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    };
    
    const newUser = await userDB.create(userData);
    console.log('✅ User created successfully in database:', newUser);
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === '23505') { // PostgreSQL unique constraint violation
      if (error.constraint === 'users_email_key') {
        return res.status(409).json({ message: 'DUPLICATE_EMAIL: A user with this email already exists' });
      }
      if (error.constraint === 'users_username_key') {
        return res.status(409).json({ message: 'DUPLICATE_USERNAME: A user with this username already exists' });
      }
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    const userData = {
      username: req.body.username,
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      role: req.body.role,
      department: req.body.department,
      phone: req.body.phone,
      isActive: req.body.isActive
    };
    
    const updatedUser = await userDB.update(userId, userData);
    console.log('✅ User updated successfully in database:', updatedUser);
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.message === 'User not found') {
      return res.status(404).json({ message: 'User not found' });
    }
    if (error.code === '23505') { // PostgreSQL unique constraint violation
      if (error.constraint === 'users_email_key') {
        return res.status(409).json({ message: 'DUPLICATE_EMAIL: A user with this email already exists' });
      }
      if (error.constraint === 'users_username_key') {
        return res.status(409).json({ message: 'DUPLICATE_USERNAME: A user with this username already exists' });
      }
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    await userDB.delete(userId);
    console.log('✅ User deleted successfully from database:', userId);
    res.json({ message: 'User deleted successfully', id: userId });
  } catch (error) {
    console.error('Error deleting user:', error);
    if (error.message === 'User not found') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Analytics endpoints
app.get('/api/analytics/overview', (req, res) => {
  res.json({
    totalTasks: mockTasks.length,
    completionRate: 0.75,
    averageResponseTime: 2.5,
    customerSatisfaction: 4.2
  });
});

// Serve the React app for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/public/index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database connection
    await initDatabase();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    console.log('⚠️  Continuing with mock data...');
  }
  
  // Start the server after database initialization
  app.listen(PORT, () => {
    console.log('=================================');
    console.log('🚀 BACKEND SERVER STARTED');
    console.log('=================================');
    console.log(`🌐 API Server: http://localhost:${PORT}`);
    console.log(`📁 Serving React app from: ${path.join(__dirname, '../dist/public')}`);
    console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
    console.log(`🔐 Login credentials: admin / admin123`);
    console.log('=================================');
    console.log('');
    console.log('Available API endpoints:');
    console.log('  GET  /api/health');
    console.log('  POST /api/auth/login');
    console.log('  GET  /api/auth/user');
    console.log('  POST /api/auth/logout');
    console.log('  GET  /api/dashboard/stats');
    console.log('  GET  /api/dashboard/recent-tasks');
    console.log('  GET  /api/tasks');
    console.log('  GET  /api/tasks/stats');
    console.log('  GET  /api/tasks/:id');
    console.log('  POST /api/tasks');
    console.log('  PUT  /api/tasks/:id');
    console.log('  DELETE /api/tasks/:id');
    console.log('  GET  /api/tasks/:id/updates');
    console.log('  POST /api/tasks/:id/upload');
    console.log('  GET  /api/uploads/:filename');
    console.log('  GET  /api/customers');
    console.log('  POST /api/customers');
    console.log('  POST /api/customers/seed-sample-data');
    console.log('  POST /api/customers/import-csv');
    console.log('  GET  /api/customers/:id');
    console.log('  PUT  /api/customers/:id/portal-access');
    console.log('  GET  /api/customers/:id/system-details');
    console.log('  POST /api/customers/:id/system-details');
    console.log('  POST /api/customer-auth/login');
    console.log('  GET  /api/customer-portal/tasks/:customerId');
    console.log('  POST /api/customer-portal/tasks');
    console.log('  GET  /api/users');
    console.log('');
  });
}

// Handle graceful shutdown only on actual termination
process.on('SIGTERM', async () => {
  console.log('\n🔄 Shutting down server...');
  await closeDatabase();
  process.exit(0);
});

// Initialize database and start server
startServer();

module.exports = app;