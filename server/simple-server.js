import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8050;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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

// API routes first (before catch-all)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: port,
    message: 'TaskScoreTracker server is healthy'
  });
});

app.get('/api/status', (req, res) => {
  res.json({ 
    server: 'running',
    port: port,
    environment: process.env.NODE_ENV || 'development',
    database: 'not connected (expected)',
    uptime: process.uptime()
  });
});

// Authentication endpoints
app.post('/api/auth/login', (req, res) => {
  console.log('🔑 Admin login attempt:', req.body);
  
  const { username, password } = req.body;
  
  if (!username || !password) {
    console.log('❌ Missing credentials');
    return res.status(400).json({
      success: false,
      message: 'Username and password required'
    });
  }
  
  // Demo login - accept any non-empty credentials
  console.log('✅ Login successful for:', username);
  
  const user = {
    id: 1,
    username: username,
    firstName: username.charAt(0).toUpperCase() + username.slice(1),
    lastName: 'User',
    email: `${username}@wizone.com`,
    role: 'admin',
    name: `${username.charAt(0).toUpperCase() + username.slice(1)} User`
  };
  
  // Set a simple session cookie (for demo purposes)
  res.cookie('session', 'demo-session-' + Date.now(), { 
    httpOnly: true, 
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
  
  res.json(user);
});

app.post('/api/auth/logout', (req, res) => {
  console.log('🚪 User logging out');
  // Clear the session cookie
  res.clearCookie('session');
  res.json({ success: true, message: 'Logged out successfully' });
});

// Customer login endpoint
app.post('/api/customer/login', (req, res) => {
  console.log('🔑 Customer login attempt:', req.body);
  
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password required'
    });
  }
  
  // Demo customer login
  const customer = {
    id: 2,
    username: username,
    name: `Customer ${username}`,
    email: `${username}@customer.com`,
    type: 'customer'
  };
  
  console.log('✅ Customer login successful:', customer.username);
  res.json(customer);
});

app.get('/api/auth/me', (req, res) => {
  // Mock user session check
  res.json({
    user: null,
    authenticated: false
  });
});

app.get('/api/auth/user', (req, res) => {
  console.log('🔍 Checking user session:', req.headers.cookie);
  
  // Check if there's a session cookie (simple demo check)
  const sessionCookie = req.headers.cookie?.includes('session=demo-session');
  
  if (sessionCookie) {
    // Return the demo user if session exists
    const user = {
      id: 1,
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@wizone.com',
      role: 'admin',
      name: 'Admin User'
    };
    console.log('✅ User authenticated:', user.username);
    res.json(user);
  } else {
    // Return 401 to indicate no user is logged in (triggers login page)
    console.log('❌ No valid session found');
    res.status(401).json({
      error: 'Not authenticated'
    });
  }
});

// Mock user data
const mockUsers = [
  {
    id: 1,
    username: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@wizone.com',
    role: 'admin',
    active: true,
    createdAt: '2024-01-10T08:00:00Z',
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
  },
  {
    id: 3,
    username: 'sarah.security',
    firstName: 'Sarah',
    lastName: 'Security',
    email: 'sarah@wizone.com',
    role: 'technician',
    active: true,
    createdAt: '2024-01-20T11:00:00Z',
    lastLogin: '2024-09-30T14:20:00Z'
  },
  {
    id: 4,
    username: 'mike.systems',
    firstName: 'Mike',
    lastName: 'Systems',
    email: 'mike@wizone.com',
    role: 'technician',
    active: true,
    createdAt: '2024-02-01T10:15:00Z',
    lastLogin: '2024-09-29T17:30:00Z'
  },
  {
    id: 5,
    username: 'lisa.manager',
    firstName: 'Lisa',
    lastName: 'Manager',
    email: 'lisa@wizone.com',
    role: 'manager',
    active: true,
    createdAt: '2024-01-12T12:00:00Z',
    lastLogin: '2024-10-01T13:15:00Z'
  }
];

// Users endpoints
app.get('/api/users', (req, res) => {
  console.log('👥 Fetching users list');
  
  // Return users without passwords
  const safeUsers = mockUsers.map(user => {
    const { password, ...safeUser } = user;
    return safeUser;
  });
  
  console.log(`✅ Returning ${safeUsers.length} users`);
  res.json(safeUsers);
});

app.get('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  console.log('👤 Fetching user details for ID:', userId);
  
  const user = mockUsers.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Return user without password
  const { password, ...safeUser } = user;
  console.log('✅ User found:', user.username);
  res.json(safeUser);
});

app.post('/api/users', (req, res) => {
  console.log('➕ Creating new user:', req.body);
  
  const newUser = {
    id: mockUsers.length + 1,
    ...req.body,
    active: true,
    createdAt: new Date().toISOString(),
    lastLogin: null
  };
  
  mockUsers.push(newUser);
  
  // Return user without password
  const { password, ...safeUser } = newUser;
  console.log('✅ User created:', newUser.username);
  
  res.status(201).json(safeUser);
});

app.put('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  console.log('✏️ Updating user ID:', userId, 'with data:', req.body);
  
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  mockUsers[userIndex] = {
    ...mockUsers[userIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  // Return user without password
  const { password, ...safeUser } = mockUsers[userIndex];
  console.log('✅ User updated:', mockUsers[userIndex].username);
  res.json(safeUser);
});

app.put('/api/users/:id/role', (req, res) => {
  const userId = parseInt(req.params.id);
  const { role } = req.body;
  console.log('🔄 Updating user role for ID:', userId, 'to role:', role);
  
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  mockUsers[userIndex].role = role;
  mockUsers[userIndex].updatedAt = new Date().toISOString();
  
  // Return user without password
  const { password, ...safeUser } = mockUsers[userIndex];
  console.log('✅ User role updated:', mockUsers[userIndex].username);
  res.json(safeUser);
});

app.put('/api/users/:id/reset-password', (req, res) => {
  const userId = parseInt(req.params.id);
  const { newPassword } = req.body;
  console.log('🔑 Resetting password for user ID:', userId);
  
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // In a real app, hash the password
  mockUsers[userIndex].password = newPassword;
  mockUsers[userIndex].updatedAt = new Date().toISOString();
  
  console.log('✅ Password reset for:', mockUsers[userIndex].username);
  res.json({
    success: true,
    message: 'Password reset successfully'
  });
});

// Setup wizard endpoints
app.get('/api/setup/status', (req, res) => {
  res.json({
    setup_required: false,
    database_connected: true,
    message: 'System is set up and running in demo mode'
  });
});

app.post('/api/setup/database', (req, res) => {
  res.json({
    success: true,
    message: 'Database setup simulated (demo mode)'
  });
});

// Analytics endpoints
app.get('/api/analytics/overview', (req, res) => {
  console.log('📊 Fetching analytics overview, timeRange:', req.query.timeRange);
  
  const overview = {
    totalTasks: mockTasks.length,
    completedTasks: mockTasks.filter(t => t.status === 'completed').length,
    activeTasks: mockTasks.filter(t => t.status === 'in-progress').length,
    totalCustomers: mockCustomers.length,
    activeCustomers: mockCustomers.filter(c => c.status === 'active').length,
    totalUsers: mockUsers.length,
    averageResolutionTime: 2.5, // hours
    customerSatisfaction: 94.2, // percentage
    systemUptime: 99.8 // percentage
  };
  
  console.log('✅ Analytics overview:', overview);
  res.json(overview);
});

app.get('/api/analytics/performance', (req, res) => {
  const { timeRange, metric } = req.query;
  console.log('📈 Fetching performance analytics:', { timeRange, metric });
  
  // Generate mock performance data
  const performanceData = [];
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    performanceData.push({
      date: date.toISOString().split('T')[0],
      value: Math.floor(Math.random() * 50) + 20,
      metric: metric || 'tasks_completed'
    });
  }
  
  console.log(`✅ Performance data: ${performanceData.length} points`);
  res.json(performanceData);
});

app.get('/api/analytics/trends', (req, res) => {
  console.log('📊 Fetching trends analytics, timeRange:', req.query.timeRange);
  
  const trends = {
    taskTrends: {
      thisMonth: mockTasks.filter(t => new Date(t.createdAt) > new Date(Date.now() - 30*24*60*60*1000)).length,
      lastMonth: 15,
      growth: 33.3
    },
    customerTrends: {
      thisMonth: mockCustomers.filter(c => new Date(c.createdAt) > new Date(Date.now() - 30*24*60*60*1000)).length,
      lastMonth: 3,
      growth: 66.7
    },
    satisfactionTrends: {
      thisMonth: 94.2,
      lastMonth: 91.8,
      growth: 2.6
    }
  };
  
  console.log('✅ Trends data:', trends);
  res.json(trends);
});

app.get('/api/analytics/engineers', (req, res) => {
  console.log('👷 Fetching engineer analytics, timeRange:', req.query.timeRange);
  
  const engineerStats = mockUsers
    .filter(u => u.role === 'technician')
    .map(user => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      tasksAssigned: mockTasks.filter(t => t.assignedTo === user.id).length,
      tasksCompleted: mockTasks.filter(t => t.assignedTo === user.id && t.status === 'completed').length,
      averageResolutionTime: Math.random() * 3 + 1, // 1-4 hours
      customerRating: Math.random() * 1 + 4 // 4-5 stars
    }));
  
  console.log(`✅ Engineer stats: ${engineerStats.length} engineers`);
  res.json(engineerStats);
});

app.get('/api/analytics/customers', (req, res) => {
  console.log('🏢 Fetching customer analytics, timeRange:', req.query.timeRange);
  
  const customerStats = {
    byLocation: {
      'Bangalore': mockCustomers.filter(c => c.city === 'Bangalore').length,
      'Mumbai': mockCustomers.filter(c => c.city === 'Mumbai').length,
      'Delhi': mockCustomers.filter(c => c.city === 'Delhi').length
    },
    byPlan: {
      'Enterprise': mockCustomers.filter(c => c.servicePlan.includes('Enterprise')).length,
      'Corporate': mockCustomers.filter(c => c.servicePlan.includes('Corporate')).length,
      'Business': mockCustomers.filter(c => c.servicePlan.includes('Business')).length,
      'Professional': mockCustomers.filter(c => c.servicePlan.includes('Professional')).length
    },
    byStatus: {
      'active': mockCustomers.filter(c => c.status === 'active').length,
      'inactive': mockCustomers.filter(c => c.status === 'inactive').length
    }
  };
  
  console.log('✅ Customer analytics:', customerStats);
  res.json(customerStats);
});

// Performance endpoints
app.get('/api/performance/overview', (req, res) => {
  console.log('⚡ Fetching performance overview');
  
  const performance = {
    systemPerformance: {
      cpuUsage: Math.random() * 30 + 20, // 20-50%
      memoryUsage: Math.random() * 40 + 30, // 30-70%
      diskUsage: Math.random() * 20 + 40, // 40-60%
      networkLatency: Math.random() * 10 + 5 // 5-15ms
    },
    applicationMetrics: {
      responseTime: Math.random() * 100 + 50, // 50-150ms
      throughput: Math.random() * 500 + 1000, // 1000-1500 req/min
      errorRate: Math.random() * 2, // 0-2%
      activeConnections: Math.floor(Math.random() * 100) + 50 // 50-150
    },
    businessMetrics: {
      dailyTasks: mockTasks.filter(t => new Date(t.createdAt) > new Date(Date.now() - 24*60*60*1000)).length,
      avgResolutionTime: 2.3,
      customerSatisfaction: 94.5,
      slaCompliance: 96.8
    }
  };
  
  console.log('✅ Performance overview generated');
  res.json(performance);
});

// Additional utility endpoints
app.get('/api/dashboard/stats', (req, res) => {
  console.log('🏠 Fetching dashboard statistics');
  
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
      inactive: mockCustomers.filter(c => c.status === 'inactive').length,
      newThisMonth: mockCustomers.filter(c => new Date(c.createdAt) > new Date(Date.now() - 30*24*60*60*1000)).length
    },
    users: {
      total: mockUsers.length,
      active: mockUsers.filter(u => u.active).length,
      technicians: mockUsers.filter(u => u.role === 'technician').length,
      managers: mockUsers.filter(u => u.role === 'manager').length
    },
    performance: {
      averageResolutionTime: 2.3,
      customerSatisfaction: 94.5,
      systemUptime: 99.8,
      activeTickets: mockTasks.filter(t => t.status !== 'completed').length
    }
  };
  
  console.log('✅ Dashboard stats generated');
  res.json(stats);
});

// Mock task data
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
    assignedToName: 'Sarah Security',
    createdBy: 1,
    createdByName: 'Admin User',
    category: 'security',
    estimatedHours: 6,
    actualHours: 0,
    createdAt: '2024-10-01T14:20:00Z',
    updatedAt: '2024-10-01T14:20:00Z',
    dueDate: '2024-10-05T17:00:00Z'
  },
  {
    id: 3,
    title: 'Server maintenance and updates',
    description: 'Routine maintenance for StartupHub server infrastructure',
    customerId: 3,
    customerName: 'StartupHub Pvt Ltd',
    priority: 'low',
    status: 'completed',
    assignedTo: 3,
    assignedToName: 'Mike Systems',
    createdBy: 1,
    createdByName: 'Admin User',
    category: 'maintenance',
    estimatedHours: 3,
    actualHours: 2.8,
    createdAt: '2024-09-28T10:15:00Z',
    updatedAt: '2024-09-30T16:45:00Z',
    dueDate: '2024-09-30T18:00:00Z'
  },
  {
    id: 4,
    title: 'Backup system configuration',
    description: 'Configure automated backup system for Mumbai Finance Corp',
    customerId: 4,
    customerName: 'Mumbai Finance Corp',
    priority: 'high',
    status: 'in-progress',
    assignedTo: 1,
    assignedToName: 'John Technical',
    createdBy: 1,
    createdByName: 'Admin User',
    category: 'backup',
    estimatedHours: 5,
    actualHours: 3.2,
    createdAt: '2024-10-01T11:30:00Z',
    updatedAt: '2024-10-02T13:15:00Z',
    dueDate: '2024-10-04T16:00:00Z'
  },
  {
    id: 5,
    title: 'Email server troubleshooting',
    description: 'Resolve email delivery issues for Delhi Digital Services',
    customerId: 5,
    customerName: 'Delhi Digital Services',
    priority: 'medium',
    status: 'pending',
    assignedTo: null,
    assignedToName: null,
    createdBy: 1,
    createdByName: 'Admin User',
    category: 'email',
    estimatedHours: 2,
    actualHours: 0,
    createdAt: '2024-10-02T08:45:00Z',
    updatedAt: '2024-10-02T08:45:00Z',
    dueDate: '2024-10-03T12:00:00Z'
  }
];

// Mock task updates/comments
const mockTaskUpdates = {
  1: [
    {
      id: 1,
      taskId: 1,
      message: 'Started investigating the connectivity issue. Found packet loss on primary route.',
      type: 'status_update',
      createdBy: 1,
      createdByName: 'John Technical',
      createdAt: '2024-10-02T10:30:00Z'
    },
    {
      id: 2,
      taskId: 1,
      message: 'Customer confirmed the issue is intermittent, occurs mainly during peak hours.',
      type: 'customer_feedback',
      createdBy: 1,
      createdByName: 'John Technical',
      createdAt: '2024-10-02T14:30:00Z'
    }
  ],
  2: [
    {
      id: 3,
      taskId: 2,
      message: 'Task assigned to security team for firewall installation.',
      type: 'assignment',
      createdBy: 1,
      createdByName: 'Admin User',
      createdAt: '2024-10-01T14:25:00Z'
    }
  ],
  3: [
    {
      id: 4,
      taskId: 3,
      message: 'Server maintenance completed successfully. All systems operational.',
      type: 'completion',
      createdBy: 3,
      createdByName: 'Mike Systems',
      createdAt: '2024-09-30T16:45:00Z'
    }
  ],
  4: [
    {
      id: 5,
      taskId: 4,
      message: 'Backup configuration 60% complete. Setting up automated schedules.',
      type: 'progress_update',
      createdBy: 1,
      createdByName: 'John Technical',
      createdAt: '2024-10-02T13:15:00Z'
    }
  ]
};

// Tasks endpoints (comprehensive API)
app.get('/api/tasks', (req, res) => {
  console.log('📋 Fetching tasks list, query params:', req.query);
  
  let tasks = [...mockTasks];
  
  // Apply search filter
  if (req.query.search) {
    const searchTerm = req.query.search.toLowerCase();
    tasks = tasks.filter(task => 
      task.title.toLowerCase().includes(searchTerm) ||
      task.description.toLowerCase().includes(searchTerm) ||
      task.customerName.toLowerCase().includes(searchTerm) ||
      task.assignedToName?.toLowerCase().includes(searchTerm)
    );
  }
  
  // Apply priority filter
  if (req.query.priority && req.query.priority !== 'all') {
    tasks = tasks.filter(task => task.priority === req.query.priority);
  }
  
  // Apply status filter
  if (req.query.status && req.query.status !== 'all') {
    tasks = tasks.filter(task => task.status === req.query.status);
  }
  
  console.log(`✅ Returning ${tasks.length} tasks`);
  res.json(tasks);
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
  
  console.log('✅ Task stats:', stats);
  res.json(stats);
});

app.get('/api/tasks/my-tasks', (req, res) => {
  console.log('👤 Fetching my tasks (demo mode - returning assigned tasks)');
  
  // In demo mode, return tasks assigned to user ID 1
  const myTasks = mockTasks.filter(task => task.assignedTo === 1);
  
  console.log(`✅ Returning ${myTasks.length} assigned tasks`);
  res.json(myTasks);
});

app.get('/api/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  console.log('📝 Fetching task details for ID:', taskId);
  
  const task = mockTasks.find(t => t.id === taskId);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  console.log('✅ Task found:', task.title);
  res.json(task);
});

app.get('/api/tasks/:id/updates', (req, res) => {
  const taskId = parseInt(req.params.id);
  console.log('💬 Fetching task updates for task ID:', taskId);
  
  const updates = mockTaskUpdates[taskId] || [];
  console.log(`✅ Returning ${updates.length} updates`);
  res.json(updates);
});

app.post('/api/tasks', (req, res) => {
  console.log('➕ Creating new task:', req.body);
  
  const newTask = {
    id: mockTasks.length + 1,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    actualHours: 0
  };
  
  mockTasks.push(newTask);
  console.log('✅ Task created:', newTask.title);
  
  res.status(201).json(newTask);
});

app.put('/api/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  console.log('✏️ Updating task ID:', taskId, 'with data:', req.body);
  
  const taskIndex = mockTasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  mockTasks[taskIndex] = {
    ...mockTasks[taskIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  console.log('✅ Task updated:', mockTasks[taskIndex].title);
  res.json(mockTasks[taskIndex]);
});

app.delete('/api/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  console.log('🗑️ Deleting task ID:', taskId);
  
  const taskIndex = mockTasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  const deletedTask = mockTasks.splice(taskIndex, 1)[0];
  console.log('✅ Task deleted:', deletedTask.title);
  
  res.json({
    success: true,
    message: 'Task deleted successfully',
    deletedTask
  });
});

app.post('/api/tasks/:id/upload', (req, res) => {
  const taskId = parseInt(req.params.id);
  console.log('📎 File upload for task ID:', taskId, 'with data:', req.body);
  
  // Simulate file upload (in real app, handle multipart/form-data)
  const uploadResult = {
    success: true,
    message: 'Files uploaded successfully (demo mode)',
    files: req.body.files || [],
    notes: req.body.notes || ''
  };
  
  // Add update to task updates
  if (!mockTaskUpdates[taskId]) {
    mockTaskUpdates[taskId] = [];
  }
  
  mockTaskUpdates[taskId].push({
    id: Date.now(),
    taskId: taskId,
    message: `Files uploaded: ${req.body.files?.length || 0} files. Notes: ${req.body.notes || 'No additional notes'}`,
    type: 'file_upload',
    createdBy: 1,
    createdByName: 'Admin User',
    createdAt: new Date().toISOString()
  });
  
  console.log('✅ File upload completed:', uploadResult);
  res.json(uploadResult);
});

// Mock customer data
const mockCustomers = [
  {
    id: 1,
    customerId: 'WZ001',
    name: 'TechCorp Solutions',
    email: 'contact@techcorp.com',
    contactPerson: 'John Smith',
    mobilePhone: '+91-9876543210',
    address: '123 Tech Park, Electronic City',
    city: 'Bangalore',
    state: 'Karnataka',
    latitude: 12.8456,
    longitude: 77.6653,
    connectionType: 'fiber',
    planType: 'business',
    servicePlan: 'Enterprise Plan - 1Gbps',
    monthlyFee: 5000,
    status: 'active',
    portalAccess: true,
    username: 'techcorp',
    password: 'tech123',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-09-30T15:30:00Z'
  },
  {
    id: 2,
    customerId: 'WZ002',
    name: 'Global Enterprises',
    email: 'admin@globalent.com',
    contactPerson: 'Sarah Johnson',
    mobilePhone: '+91-9988776655',
    address: '456 Business District, Whitefield',
    city: 'Bangalore',
    state: 'Karnataka',
    latitude: 12.9698,
    longitude: 77.7500,
    connectionType: 'fiber',
    planType: 'corporate',
    servicePlan: 'Corporate Plan - 500Mbps',
    monthlyFee: 3500,
    status: 'active',
    portalAccess: false,
    username: '',
    password: '',
    createdAt: '2024-02-20T08:30:00Z',
    updatedAt: '2024-10-01T12:15:00Z'
  },
  {
    id: 3,
    customerId: 'WZ003',
    name: 'StartupHub Pvt Ltd',
    email: 'info@startuphub.in',
    contactPerson: 'Raj Patel',
    mobilePhone: '+91-8877665544',
    address: '789 Innovation Center, Koramangala',
    city: 'Bangalore',
    state: 'Karnataka',
    latitude: 12.9279,
    longitude: 77.6271,
    connectionType: 'wireless',
    planType: 'business',
    servicePlan: 'Business Plan - 200Mbps',
    monthlyFee: 2000,
    status: 'active',
    portalAccess: true,
    username: 'startuphub',
    password: 'startup2024',
    createdAt: '2024-03-10T14:20:00Z',
    updatedAt: '2024-09-28T09:45:00Z'
  },
  {
    id: 4,
    customerId: 'WZ004',
    name: 'Mumbai Finance Corp',
    email: 'support@mumfinance.com',
    contactPerson: 'Priya Sharma',
    mobilePhone: '+91-7766554433',
    address: '321 Financial District, BKC',
    city: 'Mumbai',
    state: 'Maharashtra',
    latitude: 19.0596,
    longitude: 72.8656,
    connectionType: 'fiber',
    planType: 'enterprise',
    servicePlan: 'Premium Plan - 2Gbps',
    monthlyFee: 8000,
    status: 'active',
    portalAccess: true,
    username: 'mumfinance',
    password: 'finance123',
    createdAt: '2024-01-25T11:15:00Z',
    updatedAt: '2024-10-02T08:20:00Z'
  },
  {
    id: 5,
    customerId: 'WZ005',
    name: 'Delhi Digital Services',
    email: 'contact@delhidigital.co.in',
    contactPerson: 'Amit Kumar',
    mobilePhone: '+91-6655443322',
    address: '654 Cyber Hub, Gurgaon',
    city: 'Delhi',
    state: 'Delhi',
    latitude: 28.4824,
    longitude: 77.0926,
    connectionType: 'fiber',
    planType: 'business',
    servicePlan: 'Professional Plan - 300Mbps',
    monthlyFee: 2500,
    status: 'inactive',
    portalAccess: false,
    username: '',
    password: '',
    createdAt: '2024-04-05T16:40:00Z',
    updatedAt: '2024-09-15T13:25:00Z'
  }
];

// Mock system details data
const mockSystemDetails = {
  1: [
    {
      id: 1,
      empId: 'EMP001',
      systemName: 'John-Desktop-01',
      processor: 'Intel Core i7-11700K',
      ram: '32GB DDR4',
      hardDisk: '1TB HDD',
      ssd: '512GB NVMe SSD',
      operatingSystem: 'Windows 11 Pro',
      antivirus: 'Windows Defender + Kaspersky',
      msOffice: 'Microsoft Office 365',
      otherSoftware: 'Adobe Creative Suite, AutoCAD, VS Code',
      configuration: 'High-performance workstation for development and design work',
      createdAt: '2024-01-20T10:00:00Z',
      updatedAt: '2024-09-30T14:30:00Z'
    },
    {
      id: 2,
      empId: 'EMP002',
      systemName: 'Server-Main-01',
      processor: 'Intel Xeon Silver 4314',
      ram: '64GB DDR4 ECC',
      hardDisk: '4TB RAID 5',
      ssd: '1TB NVMe SSD',
      operatingSystem: 'Windows Server 2022',
      antivirus: 'Microsoft Defender for Business',
      msOffice: 'N/A',
      otherSoftware: 'SQL Server 2022, IIS, Docker',
      configuration: 'Primary application server handling web services and database operations',
      createdAt: '2024-01-15T08:00:00Z',
      updatedAt: '2024-10-01T16:45:00Z'
    }
  ],
  2: [
    {
      id: 3,
      empId: 'EMP003',
      systemName: 'Sarah-Laptop-01',
      processor: 'AMD Ryzen 7 5800H',
      ram: '16GB DDR4',
      hardDisk: '1TB HDD',
      ssd: '256GB SSD',
      operatingSystem: 'Windows 10 Pro',
      antivirus: 'Bitdefender Total Security',
      msOffice: 'Microsoft Office 2019',
      otherSoftware: 'SAP, Salesforce Desktop, Chrome',
      configuration: 'Business laptop for sales and administration tasks',
      createdAt: '2024-02-25T09:30:00Z',
      updatedAt: '2024-09-28T11:20:00Z'
    }
  ],
  3: [
    {
      id: 4,
      empId: 'EMP004',
      systemName: 'Dev-Station-01',
      processor: 'Intel Core i9-12900K',
      ram: '64GB DDR5',
      hardDisk: '2TB HDD',
      ssd: '2TB NVMe SSD',
      operatingSystem: 'Ubuntu 22.04 LTS',
      antivirus: 'ClamAV',
      msOffice: 'LibreOffice',
      otherSoftware: 'Docker, Kubernetes, Node.js, Python, Git',
      configuration: 'High-end development workstation for software engineering',
      createdAt: '2024-03-15T12:00:00Z',
      updatedAt: '2024-10-01T10:15:00Z'
    }
  ]
};

// Customers endpoints (comprehensive API)
app.get('/api/customers', (req, res) => {
  console.log('📋 Fetching customers list, query params:', req.query);
  
  let customers = [...mockCustomers];
  
  // Apply search filter
  if (req.query.search) {
    const searchTerm = req.query.search.toLowerCase();
    customers = customers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm) ||
      customer.customerId.toLowerCase().includes(searchTerm) ||
      customer.email.toLowerCase().includes(searchTerm) ||
      customer.contactPerson.toLowerCase().includes(searchTerm) ||
      customer.city.toLowerCase().includes(searchTerm) ||
      customer.state.toLowerCase().includes(searchTerm)
    );
  }
  
  // Apply location filter
  if (req.query.location && req.query.location !== 'all') {
    customers = customers.filter(customer => 
      customer.city.toLowerCase() === req.query.location.toLowerCase()
    );
  }
  
  console.log(`✅ Returning ${customers.length} customers`);
  res.json(customers);
});

app.get('/api/customers/:id', (req, res) => {
  const customerId = parseInt(req.params.id);
  console.log('👤 Fetching customer details for ID:', customerId);
  
  const customer = mockCustomers.find(c => c.id === customerId);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  
  console.log('✅ Customer found:', customer.name);
  res.json(customer);
});

app.get('/api/customers/:id/system-details', (req, res) => {
  const customerId = parseInt(req.params.id);
  console.log('💻 Fetching system details for customer ID:', customerId);
  
  const systemDetails = mockSystemDetails[customerId] || [];
  console.log(`✅ Returning ${systemDetails.length} system details`);
  res.json(systemDetails);
});

app.post('/api/customers', (req, res) => {
  console.log('➕ Creating new customer:', req.body);
  
  const newCustomer = {
    id: mockCustomers.length + 1,
    customerId: `WZ${String(mockCustomers.length + 1).padStart(3, '0')}`,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    portalAccess: false,
    username: '',
    password: ''
  };
  
  mockCustomers.push(newCustomer);
  console.log('✅ Customer created:', newCustomer.customerId);
  
  res.status(201).json(newCustomer);
});

app.put('/api/customers/:id', (req, res) => {
  const customerId = parseInt(req.params.id);
  console.log('✏️ Updating customer ID:', customerId, 'with data:', req.body);
  
  const customerIndex = mockCustomers.findIndex(c => c.id === customerId);
  if (customerIndex === -1) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  
  mockCustomers[customerIndex] = {
    ...mockCustomers[customerIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  console.log('✅ Customer updated:', mockCustomers[customerIndex].name);
  res.json(mockCustomers[customerIndex]);
});

app.patch('/api/customers/:id/portal-access', (req, res) => {
  const customerId = parseInt(req.params.id);
  const { username, password, portalAccess } = req.body;
  console.log('🔐 Updating portal access for customer:', customerId, { username, portalAccess });
  
  const customerIndex = mockCustomers.findIndex(c => c.id === customerId);
  if (customerIndex === -1) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  
  mockCustomers[customerIndex] = {
    ...mockCustomers[customerIndex],
    username: username || '',
    password: password || '',
    portalAccess: portalAccess || false,
    updatedAt: new Date().toISOString()
  };
  
  console.log('✅ Portal access updated for:', mockCustomers[customerIndex].name);
  res.json({
    success: true,
    message: 'Portal access updated successfully',
    customer: mockCustomers[customerIndex]
  });
});

app.delete('/api/customers/:id', (req, res) => {
  const customerId = parseInt(req.params.id);
  console.log('🗑️ Deleting customer ID:', customerId);
  
  const customerIndex = mockCustomers.findIndex(c => c.id === customerId);
  if (customerIndex === -1) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  
  const deletedCustomer = mockCustomers.splice(customerIndex, 1)[0];
  console.log('✅ Customer deleted:', deletedCustomer.name);
  
  res.json({
    success: true,
    message: 'Customer deleted successfully',
    deletedCustomer
  });
});

app.get('/api/customers/export', (req, res) => {
  console.log('📊 Exporting customers to CSV');
  
  const headers = [
    'customerId', 'name', 'email', 'contactPerson', 'mobilePhone',
    'address', 'city', 'state', 'connectionType', 'servicePlan',
    'monthlyFee', 'status', 'portalAccess'
  ];
  
  const csvRows = mockCustomers.map(customer => [
    customer.customerId,
    customer.name,
    customer.email,
    customer.contactPerson,
    customer.mobilePhone,
    customer.address,
    customer.city,
    customer.state,
    customer.connectionType,
    customer.servicePlan,
    customer.monthlyFee,
    customer.status,
    customer.portalAccess ? 'Yes' : 'No'
  ]);
  
  const csvContent = [headers, ...csvRows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="customers-export-${new Date().toISOString().split('T')[0]}.csv"`);
  res.send(csvContent);
  
  console.log('✅ CSV export completed');
});

app.post('/api/customers/import', (req, res) => {
  console.log('📤 Customer import endpoint called (demo mode)');
  
  // Simulate import process
  const importResult = {
    success: true,
    imported: 5,
    updated: 2,
    errors: 0,
    message: 'Demo import completed successfully'
  };
  
  console.log('✅ Import simulation completed:', importResult);
  res.json(importResult);
});

// Serve React app for all other routes (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.resolve(distPath, 'index.html'));
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: port,
    message: 'TaskScoreTracker server is healthy'
  });
});

app.get('/api/status', (req, res) => {
  res.json({ 
    server: 'running',
    port: port,
    environment: process.env.NODE_ENV || 'development',
    database: 'not connected (expected)',
    uptime: process.uptime()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`=== TaskScoreTracker Simple Server ===`);
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Time: ${new Date().toLocaleString()}`);
  console.log(`=== Server Started Successfully ===`);
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\n=== Shutting down server ===');
  server.close(() => {
    console.log('Server shut down successfully');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n=== Server terminated ===');
  server.close(() => {
    process.exit(0);
  });
});