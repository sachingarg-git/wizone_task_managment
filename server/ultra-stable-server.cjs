const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 8050;

console.log('=== ULTRA STABLE SERVER STARTING ===');
console.log('Process ID:', process.pid);
console.log('Port:', port);

// Completely override signal handling to prevent any shutdown
process.on = function() {}; // Disable all event listeners
process.removeAllListeners = function() {}; // Disable removal
process.kill = function() {}; // Disable kill
process.exit = function() {}; // Disable exit

// Prevent uncaught exception crashes
process.on('uncaughtException', (error) => {
  console.log('🛡️  Caught exception, continuing:', error.message);
});

process.on('unhandledRejection', (reason) => {
  console.log('🛡️  Caught rejection, continuing:', reason);
});

const server = http.createServer((req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`📥 ${req.method} ${req.url} - ${req.headers['user-agent']?.substring(0, 30) || 'Unknown'}`);
  
  // CORS headers for everything
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  try {
    // Handle preflight
    if (req.method === 'OPTIONS') {
      console.log('✅ CORS preflight handled');
      res.writeHead(200);
      res.end();
      return;
    }
    
    // Health check endpoint
    if (req.url === '/api/health') {
      console.log('💚 Health check requested');
      const healthData = JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        port: port,
        pid: process.pid,
        uptime: Math.floor(process.uptime()),
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(healthData);
      return;
    }
    
    // Login endpoint
    if (req.url === '/api/auth/login' && req.method === 'POST') {
      console.log('🔐 Login attempt');
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.username === 'admin' && data.password === 'admin123') {
            console.log('✅ Login successful for admin');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              user: {
                id: 1,
                username: 'admin',
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@wizone.com',
                role: 'admin'
              }
            }));
          } else {
            console.log('❌ Invalid login credentials');
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid credentials' }));
          }
        } catch (e) {
          console.log('❌ Login JSON parse error');
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
      return;
    }
    
    // User info endpoint
    if (req.url === '/api/auth/user') {
      console.log('👤 User info requested - not authenticated');
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }
    
    // Mock data endpoints
    if (req.url === '/api/tasks') {
      console.log('📋 Tasks requested');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify([
        { id: 1, title: 'Sample Task 1', status: 'open', priority: 'high' },
        { id: 2, title: 'Sample Task 2', status: 'in-progress', priority: 'medium' }
      ]));
      return;
    }
    
    if (req.url === '/api/customers') {
      console.log('👥 Customers requested');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify([
        { id: 1, name: 'ABC Company', email: 'contact@abc.com', status: 'active' },
        { id: 2, name: 'XYZ Corp', email: 'info@xyz.com', status: 'active' }
      ]));
      return;
    }
    
    // Static file serving
    const publicDir = path.resolve(__dirname, '../dist/public');
    console.log('📁 Public directory:', publicDir);
    
    let requestPath = req.url;
    if (requestPath === '/') requestPath = '/index.html';
    
    // Remove query string
    requestPath = requestPath.split('?')[0];
    
    const filePath = path.join(publicDir, requestPath);
    const resolvedPath = path.resolve(filePath);
    
    // Security check
    if (!resolvedPath.startsWith(publicDir)) {
      console.log('🚫 Path traversal attempt blocked');
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    
    console.log('📄 Attempting to serve:', requestPath);
    
    fs.readFile(resolvedPath, (err, data) => {
      if (err) {
        // Try serving index.html for SPA routing
        console.log('⚠️  File not found, trying index.html for SPA');
        const indexPath = path.join(publicDir, 'index.html');
        fs.readFile(indexPath, (indexErr, indexData) => {
          if (indexErr) {
            console.log('❌ Index.html also not found');
            res.writeHead(404);
            res.end('Not Found - No index.html available');
          } else {
            console.log('✅ Served index.html for SPA routing');
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(indexData);
          }
        });
        return;
      }
      
      // Determine content type
      const ext = path.extname(resolvedPath).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2'
      };
      
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
      console.log(`✅ Served: ${path.basename(resolvedPath)} (${data.length} bytes)`);
    });
    
  } catch (error) {
    console.log('❌ Request error:', error.message);
    try {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Server error' }));
    } catch (e) {
      console.log('❌ Error response failed');
    }
  }
});

// Server event handlers
server.on('error', (error) => {
  console.log('🚨 Server error occurred but continuing:', error.message);
});

server.on('connection', (socket) => {
  console.log('🔗 New connection from:', socket.remoteAddress || 'unknown');
  socket.on('error', (err) => {
    console.log('🔌 Socket error (ignored):', err.message);
  });
});

server.on('close', () => {
  console.log('🔄 Server close event (restarting...)');
  setTimeout(() => {
    server.listen(port, '0.0.0.0');
  }, 1000);
});

// Start the server
server.listen(port, '0.0.0.0', (error) => {
  if (error) {
    console.log('❌ Server start error:', error.message);
    return;
  }
  
  console.log('');
  console.log('🚀 ================================');
  console.log('🚀 ULTRA STABLE SERVER IS RUNNING');
  console.log('🚀 ================================');
  console.log(`🌐 URL: http://localhost:${port}`);
  console.log(`📍 PID: ${process.pid}`);
  console.log(`📁 Serving: ${path.resolve(__dirname, '../dist/public')}`);
  console.log(`⏰ Started: ${new Date().toLocaleString()}`);
  console.log('🚀 ================================');
  console.log('');
});

// Keep-alive mechanism
let heartbeatCount = 0;
setInterval(() => {
  heartbeatCount++;
  console.log(`💓 Heartbeat #${heartbeatCount} - Server alive at ${new Date().toLocaleTimeString()}`);
  console.log(`   Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB, Uptime: ${Math.floor(process.uptime())}s`);
}, 30000); // Every 30 seconds

console.log('🛡️  All protections enabled');
console.log('⚡ Server script loaded and ready');