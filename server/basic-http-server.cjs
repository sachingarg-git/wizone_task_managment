const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const PUBLIC_DIR = path.join(__dirname, '../dist/public');

console.log('🔧 Starting basic HTTP server...');
console.log('📁 Public directory:', PUBLIC_DIR);

// Check if public directory exists
if (!fs.existsSync(PUBLIC_DIR)) {
  console.error('❌ Public directory does not exist:', PUBLIC_DIR);
  process.exit(1);
}

const server = http.createServer((req, res) => {
  console.log(`📝 ${req.method} ${req.url}`);
  
  let filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url);
  
  // Security check
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log('🔍 File not found, trying index.html');
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error('❌ Error reading file:', err);
      res.writeHead(404);
      res.end('File not found');
      return;
    }
    
    const ext = path.extname(filePath);
    let contentType = 'text/html';
    
    switch (ext) {
      case '.js': contentType = 'application/javascript'; break;
      case '.css': contentType = 'text/css'; break;
      case '.json': contentType = 'application/json'; break;
      case '.png': contentType = 'image/png'; break;
      case '.jpg': contentType = 'image/jpeg'; break;
    }
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log('✅ ================================');
  console.log('✅ 🚀 BASIC SERVER RUNNING');
  console.log('✅ ================================');
  console.log(`✅ 🌐 URL: http://localhost:${PORT}`);
  console.log('✅ 📂 Files:', fs.readdirSync(PUBLIC_DIR).slice(0, 5).join(', '));
  console.log('✅ ================================');
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Server shutting down...');
  server.close(() => {
    console.log('🛑 Server closed');
    process.exit(0);
  });
});