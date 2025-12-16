const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

// Serve static files from dist/public
const staticPath = path.join(__dirname, '..', 'dist', 'public');
console.log('Serving static files from:', staticPath);

app.use(express.static(staticPath));

// Simple test endpoint
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'ok', message: 'Server is running!' });
});

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Start server
const server = app.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('=================================');
  console.log('🚀 SIMPLE TEST SERVER STARTED');
  console.log('=================================');
  console.log(`🌐 Server: http://127.0.0.1:${PORT}`);
  console.log(`📁 Static files: ${staticPath}`);
  console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
  console.log('=================================');
  console.log('');
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});