const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8050;

console.log('=== SIMPLE HTTP SERVER ===');
console.log('Starting server on port', PORT);
console.log('Process ID:', process.pid);

const server = http.createServer((req, res) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health endpoint
  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      port: PORT,
      pid: process.pid,
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  // Login endpoint
  if (req.url === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data.username === 'admin' && data.password === 'admin123') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            user: { id: 1, username: 'admin', role: 'admin' }
          }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid credentials' }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }
  
  // Serve static files
  const publicDir = path.join(__dirname, '..', 'dist', 'public');
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = filePath.split('?')[0]; // Remove query params
  
  const fullPath = path.join(publicDir, filePath);
  
  fs.readFile(fullPath, (err, data) => {
    if (err) {
      // Try index.html for SPA routing
      fs.readFile(path.join(publicDir, 'index.html'), (indexErr, indexData) => {
        if (indexErr) {
          res.writeHead(404);
          res.end('Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(indexData);
        }
      });
      return;
    }
    
    // Set content type
    const ext = path.extname(fullPath);
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
  });
});

server.listen(PORT, (err) => {
  if (err) {
    console.error('Server failed to start:', err);
    process.exit(1);
  }
  console.log('');
  console.log('✅ SERVER STARTED SUCCESSFULLY');
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`📁 Static files: ${path.join(__dirname, '..', 'dist', 'public')}`);
  console.log(`⏰ ${new Date().toLocaleString()}`);
  console.log('');
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

console.log('Attempting to start server...');