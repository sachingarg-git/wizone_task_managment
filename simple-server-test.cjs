const express = require('express');
const app = express();

app.use(express.json());

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Simple auth endpoint
app.post('/api/auth/login', (req, res) => {
  console.log('🔐 Login request received!');
  console.log('📋 Request body:', req.body);
  console.log('📋 Headers:', req.headers);
  
  const { username, password } = req.body;
  
  // Test with known working credentials
  if (username === 'admin' && password === 'admin123') {
    console.log('✅ Login successful for admin');
    res.json({ 
      success: true, 
      message: 'Login successful',
      user: { id: 1, username: 'admin', role: 'admin' }
    });
  } else if (username === 'sachin' && password === 'admin123') {
    console.log('✅ Login successful for sachin');
    res.json({ 
      success: true, 
      message: 'Login successful',
      user: { id: 2, username: 'sachin', role: 'field_engineer' }
    });
  } else {
    console.log('❌ Login failed for:', username);
    res.status(401).json({ 
      success: false, 
      message: 'Invalid credentials' 
    });
  }
});

const PORT = 3001;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Simple test server running on http://0.0.0.0:${PORT}`);
  console.log(`📱 Test endpoint: http://localhost:${PORT}/test`);
  console.log(`🔐 Auth endpoint: http://localhost:${PORT}/api/auth/login`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

process.on('SIGINT', () => {
  console.log('👋 Shutting down server...');
  server.close();
  process.exit(0);
});