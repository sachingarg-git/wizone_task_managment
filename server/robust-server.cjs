const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 8050;

console.log('=== STARTING ROBUST SERVER ===');
console.log('Process ID:', process.pid);
console.log('Port:', port);

// Remove all signal handlers to prevent shutdown
process.removeAllListeners('SIGINT');
process.removeAllListeners('SIGTERM');
process.removeAllListeners('SIGHUP');

const server = http.createServer((req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.url} - User-Agent: ${req.headers['user-agent']?.substring(0, 50) || 'N/A'}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    // API endpoints
    if (req.url === '/api/health') {
      console.log('Serving health endpoint');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        port: port,
        pid: process.pid,
        uptime: process.uptime(),
        message: 'Robust server is healthy'
      }));
      return;
    }
    
    if (req.url.startsWith('/api/auth/login') && req.method === 'POST') {
      console.log('Handling login request');
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          console.log('Login attempt for username:', data.username);
          
          if (data.username === 'admin' && data.password === 'admin123') {
            console.log('✅ Login successful');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              id: 1,
              username: 'admin',
              firstName: 'Admin',
              lastName: 'User',
              email: 'admin@wizone.com',
              role: 'admin'
            }));
          } else {
            console.log('❌ Login failed');
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Invalid credentials' }));
          }
        } catch (error) {
          console.error('Login parsing error:', error);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Invalid JSON' }));
        }
      });
      return;
    }
    
    // Mock API endpoints
    if (req.url === '/api/auth/user') {
      console.log('Serving auth user endpoint');
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }
    
    if (req.url === '/api/tasks') {
      console.log('Serving tasks endpoint');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify([{
        id: 1,
        title: 'Sample Task',
        description: 'This is a sample task',
        status: 'pending',
        priority: 'medium',
        createdAt: new Date().toISOString()
      }]));
      return;
    }
    
    if (req.url === '/api/customers') {
      console.log('Serving customers endpoint');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify([{
        id: 1,
        name: 'Sample Customer',
        email: 'customer@example.com',
        status: 'active'
      }]));
      return;
    }
    
    // Serve static files
    const distPath = path.resolve(__dirname, '../dist/public');
    let filePath;
    
    if (req.url === '/' || req.url === '/index.html') {
      filePath = path.join(distPath, 'index.html');
      console.log('Serving main index.html');
    } else if (req.url.startsWith('/api/')) {
      // Unknown API endpoint
      console.log('Unknown API endpoint:', req.url);
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'API endpoint not found' }));
      return;
    } else {
      // Static file or SPA route
      const cleanUrl = req.url.split('?')[0]; // Remove query parameters
      filePath = path.join(distPath, cleanUrl);
      console.log('Serving static file:', cleanUrl);
    }
    
    // Security check
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(distPath)) {
      console.log('❌ Security violation:', resolvedPath);
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    
    // Check if file exists
    fs.access(resolvedPath, fs.constants.F_OK, (err) => {
      if (err) {
        // Serve index.html for SPA routing
        console.log('File not found, serving index.html for SPA routing');
        filePath = path.join(distPath, 'index.html');
      } else {
        filePath = resolvedPath;
      }
      
      fs.readFile(filePath, (err, data) => {
        if (err) {
          console.error('❌ File read error:', err);
          res.writeHead(404);
          res.end('Not Found');
          return;
        }
        
        // Set content type
        const ext = path.extname(filePath);
        const contentTypes = {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.svg': 'image/svg+xml',
          '.ico': 'image/x-icon'
        };
        
        const contentType = contentTypes[ext] || 'text/plain';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
        console.log('✅ Served:', path.basename(filePath), `(${data.length} bytes)`);
      });
    });
    
  } catch (error) {
    console.error('❌ Request handling error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

server.on('connection', (socket) => {
  console.log('🔗 New connection from:', socket.remoteAddress);
});

server.listen(port, '0.0.0.0', () => {
  console.log('=== ROBUST HTTP SERVER STARTED ===');
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📁 Static files: ${path.resolve(__dirname, '../dist/public')}`);
  console.log(`⏰ Time: ${new Date().toLocaleString()}`);
  console.log(`🆔 Process ID: ${process.pid}`);
  console.log('=== SERVER IS READY FOR CONNECTIONS ===');
  console.log('');
  
  // Keep server alive
  setInterval(() => {
    console.log(`❤️ Server alive at ${new Date().toLocaleTimeString()} - PID: ${process.pid}`);
  }, 60000); // Log every minute
});

console.log('🔧 Server script loaded and configured');
console.log('⚠️ Signal handlers removed to prevent shutdown');
console.log('🏁 Starting server...');