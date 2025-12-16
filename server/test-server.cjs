const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 8050;

console.log('Creating Express app...');

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

console.log('Middleware configured...');

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

console.log('CORS configured...');

// Serve static files from the built React app
const distPath = path.resolve(__dirname, '../dist/public');
console.log('Static files path:', distPath);
app.use(express.static(distPath));

// Test endpoint
app.get('/api/health', (req, res) => {
  console.log('Health endpoint called');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: port,
    message: 'Test server is healthy'
  });
});

// Authentication endpoint for login test
app.post('/api/auth/login', (req, res) => {
  console.log('Login attempt:', req.body);
  const { username, password } = req.body;
  
  if (username === 'admin' && password === 'admin123') {
    console.log('Login successful');
    res.json({
      id: 1,
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@wizone.com',
      role: 'admin'
    });
  } else {
    console.log('Login failed');
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Mock data endpoints
app.get('/api/tasks', (req, res) => {
  console.log('Tasks endpoint called');
  res.json([
    {
      id: 1,
      title: 'Test Task',
      description: 'This is a test task',
      status: 'pending',
      priority: 'medium'
    }
  ]);
});

app.get('/api/customers', (req, res) => {
  console.log('Customers endpoint called');
  res.json([
    {
      id: 1,
      name: 'Test Customer',
      email: 'test@example.com',
      status: 'active'
    }
  ]);
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  console.log('Serving React app for route:', req.path);
  res.sendFile(path.resolve(distPath, 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

console.log('Setting up server...');

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`=== Test Server Started ===`);
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Static files: ${distPath}`);
  console.log(`Time: ${new Date().toLocaleString()}`);
  console.log(`=== Ready for connections ===`);
});

server.on('error', (error) => {
  console.error('Server error:', error);
});

console.log('Server setup complete');