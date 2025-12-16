const express = require('express');
const postgres = require('postgres');
const { scrypt, randomBytes, timingSafeEqual } = require('crypto');
const { promisify } = require('util');

const scryptAsync = promisify(scrypt);

const app = express();
app.use(express.json());

// PostgreSQL connection
const sql = postgres("postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT");

// Password comparison function (same as in your auth.ts)
async function comparePasswords(supplied, stored) {
  try {
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      return false;
    }
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = await scryptAsync(supplied, salt, 64);
    
    if (hashedBuf.length !== suppliedBuf.length) {
      return false;
    }
    
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
}

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, User-Agent, X-Mobile-App');
  
  console.log(`📱 ${req.method} ${req.path} - UA: ${req.get('User-Agent')?.substring(0, 50)}...`);
  
  if (req.method === 'OPTIONS') {
    console.log('📱 CORS preflight handled');
    res.sendStatus(200);
    return;
  }
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Wizone Task Manager API Server', 
    status: 'running',
    database: 'PostgreSQL Connected',
    endpoints: {
      auth: '/api/auth/login',
      test: '/test'
    },
    timestamp: new Date().toISOString() 
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'PostgreSQL server is working!', timestamp: new Date().toISOString() });
});

// Database-connected auth endpoint
app.post('/api/auth/login', async (req, res) => {
  console.log('🔐 POST LOGIN REQUEST RECEIVED!');
  console.log('📋 Request body:', req.body);
  console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
  
  const { username, password } = req.body;
  
  if (!username || !password) {
    console.log('❌ Missing credentials');
    return res.status(400).json({ success: false, message: 'Missing credentials' });
  }
  
  try {
    console.log(`🔍 Looking up user: ${username}`);
    
    // Get user from database
    const users = await sql`
      SELECT id, username, password_hash, email, first_name, last_name, role, active 
      FROM users 
      WHERE username = ${username} OR email = ${username}
    `;
    
    if (users.length === 0) {
      console.log(`❌ User not found: ${username}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const user = users[0];
    console.log(`✅ User found: ${user.username} (${user.email}) - Role: ${user.role}, Active: ${user.active}`);
    
    if (!user.active) {
      console.log(`❌ User account is inactive: ${username}`);
      return res.status(401).json({ success: false, message: 'Account is inactive' });
    }
    
    // Verify password
    console.log(`🔐 Verifying password for: ${user.username}`);
    const isPasswordValid = await comparePasswords(password, user.password_hash);
    
    if (isPasswordValid) {
      console.log(`✅ LOGIN SUCCESS for: ${user.username}`);
      
      // Update last login
      await sql`UPDATE users SET last_login = NOW() WHERE id = ${user.id}`;
      
      // Return user data (without password)
      const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        active: user.active
      };
      
      res.json({ 
        success: true, 
        message: 'Login successful',
        user: userData
      });
    } else {
      console.log(`❌ INVALID PASSWORD for: ${user.username}`);
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

const PORT1 = 3001;
const PORT2 = 3002;

// Start server on both ports for compatibility
const server1 = app.listen(PORT1, '0.0.0.0', () => {
  console.log(`🚀 PostgreSQL server running on http://0.0.0.0:${PORT1}`);
  console.log(`� Auth endpoint: http://103.122.85.61:${PORT1}/api/auth/login`);
});

const server2 = app.listen(PORT2, '0.0.0.0', () => {
  console.log(`🚀 PostgreSQL server running on http://0.0.0.0:${PORT2}`);
  console.log(`🔐 Auth endpoint: http://103.122.85.61:${PORT2}/api/auth/login`);
  console.log(`🗄️ Connected to PostgreSQL: 103.122.85.61:9095/WIZONEIT_SUPPORT`);
  console.log(`📱 APK can connect to either port 3001 or 3002`);
});

const server = server2; // Use server2 for the main reference

server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

process.on('SIGINT', () => {
  console.log('👋 Shutting down servers...');
  sql.end();
  server1.close();
  server2.close();
  process.exit(0);
});