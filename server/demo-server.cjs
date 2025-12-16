const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 8050;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Cookie parser (simple implementation)
app.use((req, res, next) => {
  req.cookies = {};
  if (req.headers.cookie) {
    req.headers.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        req.cookies[name] = decodeURIComponent(value);
      }
    });
  }
  next();
});

// CORS headers with credentials support
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Serve static files from the built React app
const distPath = path.resolve(__dirname, '../dist/public');
console.log('Serving static files from:', distPath);
app.use(express.static(distPath));

// Mock users data
const mockUsers = [
  {
    id: 1,
    username: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@wizone.com',
    role: 'admin',
    active: true,
    createAt: '2024-01-10T08:00:00Z',
    lastLogin: '2024-10-02T15:30:00Z'
  },
  {
    id: 2,
    username: 'john.technical',
    firstName: 'John',
    lastName: 'Technical',
    email: 'john@wizone.com',
    role: 'technician',
    active: true,
    createdAt: '2024-01-15T09:30:00Z',
    lastLogin: '2024-10-01T16:45:00Z'
  }
];

// Mock customers data
const mockCustomers = [
  {
    id: 1,
    customerId: 'WZ001',
    name: 'TechCorp Solutions',
    email: 'contact@techcorp.com',
    contactPerson: 'John Smith',
    mobilePhone: '+91-9876543210',
    phone: '+91-9876543210',
    address: '123 Tech Park, Electronic City',
    city: 'Bangalore',
    state: 'Karnataka',
    servicePlan: 'Enterprise - 200 Mbps',
    monthlyFee: 5000,
    status: 'active',
    portalAccess: true,
    username: 'techcorp',
    password: 'tech123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    customerId: 'WZ002',
    name: 'Global Enterprises',
    email: 'admin@globalent.com',
    contactPerson: 'Sarah Johnson',
    mobilePhone: '+91-9988776655',
    phone: '+91-9988776655',
    address: '456 Business District, Whitefield',
    city: 'Bangalore',
    state: 'Karnataka',
    servicePlan: 'Premium - 100 Mbps',
    monthlyFee: 3500,
    status: 'active',
    portalAccess: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    customerId: 'WZ003',
    name: 'Digital Innovations Pvt Ltd',
    email: 'info@digitalinnovations.com',
    contactPerson: 'Vikram Singh',
    mobilePhone: '+91-9123456789',
    phone: '+91-9123456789',
    address: 'Innovation Campus, Electronic City',
    city: 'Bangalore',
    state: 'Karnataka',
    servicePlan: 'Business Pro - 500 Mbps',
    monthlyFee: 7500,
    status: 'active',
    portalAccess: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 4,
    customerId: 'WZ004',
    name: 'Smart Systems Ltd',
    email: 'contact@smartsystems.in',
    contactPerson: 'Kavita Joshi',
    mobilePhone: '+91-9876501234',
    phone: '+91-9876501234',
    address: 'Smart Tower, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    servicePlan: 'Standard - 50 Mbps',
    monthlyFee: 2500,
    status: 'inactive',
    portalAccess: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 5,
    customerId: 'WZ005',
    name: 'Future Tech Solutions',
    email: 'support@futuretech.com',
    contactPerson: 'Rohit Sharma',
    mobilePhone: '+91-9456781230',
    phone: '+91-9456781230',
    address: 'Future Plaza, Sector 18',
    city: 'Noida',
    state: 'Uttar Pradesh',
    servicePlan: 'Basic - 25 Mbps',
    monthlyFee: 1500,
    status: 'active',
    portalAccess: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Mock tasks data
const mockTasks = [
  {
    id: 1,
    title: 'Fix network connectivity issue',
    description: 'Customer reporting intermittent internet disconnections in Bangalore office',
    customerId: 1,
    customerName: 'TechCorp Solutions',
    priority: 'high',
    status: 'in-progress',
    assignedTo: 1,
    assignedToName: 'John Technical',
    createdBy: 1,
    createdByName: 'Admin User',
    category: 'network',
    estimatedHours: 4,
    actualHours: 2.5,
    createdAt: '2024-10-01T09:00:00Z',
    updatedAt: '2024-10-02T14:30:00Z',
    dueDate: '2024-10-03T18:00:00Z'
  },
  {
    id: 2,
    title: 'Install new firewall software',
    description: 'Upgrade security infrastructure for Global Enterprises office',
    customerId: 2,
    customerName: 'Global Enterprises',
    priority: 'medium',
    status: 'pending',
    assignedTo: 2,
    assignedToName: 'John Technical',
    createdBy: 1,
    createdByName: 'Admin User',
    category: 'security',
    estimatedHours: 6,
    actualHours: 0,
    createdAt: '2024-10-01T14:20:00Z',
    updatedAt: '2024-10-01T14:20:00Z',
    dueDate: '2024-10-05T17:00:00Z'
  }
];

// API routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: port,
    message: 'TaskScoreTracker Demo Server is healthy'
  });
});

app.get('/api/status', (req, res) => {
  res.json({ 
    server: 'running',
    port: port,
    environment: process.env.NODE_ENV || 'development',
    database: 'demo mode',
    uptime: process.uptime()
  });
});

// Authentication endpoints
app.post('/api/auth/login', (req, res) => {
  console.log('🔑 Login attempt:', req.body);
  
  const { username, password } = req.body;
  
  if (!username || !password) {
    console.log('❌ Missing credentials');
    return res.status(400).json({
      success: false,
      message: 'Username and password required'
    });
  }
  
  // Demo login - accept multiple valid credentials
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
    
    const user = {
      id: 1,
      username: validUser.username,
      firstName: validUser.name.split(' ')[0],
      lastName: validUser.name.split(' ')[1] || 'User',
      email: `${validUser.username}@wizone.com`,
      role: validUser.role,
      name: validUser.name
    };
    
    // Set a demo session cookie
    res.cookie('session', 'demo-session', {
      httpOnly: false,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    res.json(user);
  } else {
    console.log('❌ Invalid credentials for:', username);
    console.log('💡 Valid demo credentials:');
    console.log('   - admin/admin123 or admin/admin');
    console.log('   - user/user123');  
    console.log('   - test/test');
    console.log('   - demo/demo');
    return res.status(401).json({
      success: false,
      message: 'Invalid username or password. Try: admin/admin or demo/demo'
    });
  }
});

app.post('/api/auth/logout', (req, res) => {
  console.log('🚪 User logging out');
  res.clearCookie('session');
  res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/api/auth/user', (req, res) => {
  // Mock authenticated user check
  const sessionCookie = req.headers.cookie?.includes('session=demo-session');
  
  if (sessionCookie) {
    const user = {
      id: 1,
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@wizone.com',
      role: 'admin',
      name: 'Admin User'
    };
    console.log('✅ User authenticated (demo):', user.username);
    res.json(user);
  } else {
    console.log('❌ No authentication found');
    res.status(401).json({
      error: 'Not authenticated'
    });
  }
});

// Users endpoints
app.get('/api/users', (req, res) => {
  console.log('👥 Fetching users list');
  res.json(mockUsers);
});

// Tasks endpoints
app.get('/api/tasks', (req, res) => {
  console.log('📋 Fetching tasks list');
  res.json(mockTasks);
});

app.get('/api/tasks/stats', (req, res) => {
  console.log('📊 Fetching task statistics');
  
  const stats = {
    total: mockTasks.length,
    pending: mockTasks.filter(t => t.status === 'pending').length,
    inProgress: mockTasks.filter(t => t.status === 'in-progress').length,
    completed: mockTasks.filter(t => t.status === 'completed').length,
    highPriority: mockTasks.filter(t => t.priority === 'high').length,
    overdue: mockTasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length
  };
  
  res.json(stats);
});

// Customers endpoints
app.get('/api/customers', (req, res) => {
  console.log('🏢 Fetching customers list');
  res.json(mockCustomers);
});

// Dashboard endpoints
app.get('/api/dashboard/stats', (req, res) => {
  console.log('📊 Fetching dashboard stats');
  
  const stats = {
    tasks: {
      total: mockTasks.length,
      pending: mockTasks.filter(t => t.status === 'pending').length,
      inProgress: mockTasks.filter(t => t.status === 'in-progress').length,
      completed: mockTasks.filter(t => t.status === 'completed').length,
      overdue: mockTasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length
    },
    customers: {
      total: mockCustomers.length,
      active: mockCustomers.filter(c => c.status === 'active').length,
      inactive: mockCustomers.filter(c => c.status === 'inactive').length
    },
    users: {
      total: mockUsers.length,
      active: mockUsers.filter(u => u.active).length,
      technicians: mockUsers.filter(u => u.role === 'technician').length
    }
  };
  
  res.json(stats);
});

// Serve React app for all other routes (SPA routing)
app.get('*', (req, res) => {
  console.log('🌐 Serving React app for route:', req.path);
  res.sendFile(path.resolve(distPath, 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`=== TaskScoreTracker Demo Server ===`);
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Time: ${new Date().toLocaleString()}`);
  console.log(`=== Server Started Successfully ===`);
});

// Keep server running without shutdown handlers
console.log('Server is running and will continue until manually stopped...');