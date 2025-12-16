const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8050;

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }
  
  // Simple health check
  if (req.url === '/api/health') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'ok', port: PORT, pid: process.pid }));
    return;
  }
  
  // Serve index.html for everything else
  const indexPath = path.join(__dirname, '..', 'dist', 'public', 'index.html');
  
  fs.readFile(indexPath, (err, data) => {
    if (err) {
      console.error('Error reading index.html:', err);
      res.statusCode = 404;
      res.end('Index file not found');
      return;
    }
    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end(data);
    console.log('Served index.html');
  });
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
  console.log(`Process ID: ${process.pid}`);
  console.log(`Time: ${new Date().toLocaleString()}`);
});

console.log(`Starting server on port ${PORT}...`);