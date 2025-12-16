const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 8050;

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // API endpoints
  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      port: port,
      message: 'Minimal server is healthy'
    }));
    return;
  }
  
  if (req.url === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log('Login attempt:', data);
        
        if (data.username === 'admin' && data.password === 'admin123') {
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
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Invalid credentials' }));
        }
      } catch (error) {
        console.error('Login error:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Invalid JSON' }));
      }
    });
    return;
  }
  
  // Serve static files
  const distPath = path.resolve(__dirname, '../dist/public');
  let filePath = path.join(distPath, req.url === '/' ? 'index.html' : req.url);
  
  // Security check
  if (!filePath.startsWith(distPath)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  
  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // Serve index.html for SPA routing
      filePath = path.join(distPath, 'index.html');
    }
    
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error('File read error:', err);
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
        '.svg': 'image/svg+xml'
      };
      
      const contentType = contentTypes[ext] || 'text/plain';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`=== Minimal HTTP Server ===`);
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Static files: ${path.resolve(__dirname, '../dist/public')}`);
  console.log(`Time: ${new Date().toLocaleString()}`);
  console.log(`Process ID: ${process.pid}`);
  console.log(`=== Server Ready ===`);
});

server.on('error', (error) => {
  console.error('Server error:', error);
});

// Keep process alive
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

console.log('Server script loaded, starting...');