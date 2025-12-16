const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = 5001;

console.log('=== PROXY SERVER STARTING ===');
console.log(`Port: ${PORT}`);
console.log('Proxying API requests to backend on port 3001');

// Proxy API requests to the backend server
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  logLevel: 'info',
  onError: (err, req, res) => {
    console.error('Proxy Error:', err.message);
    res.status(500).json({ 
      error: 'Backend server not available',
      message: 'Please ensure the backend server is running on port 3001'
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Proxying: ${req.method} ${req.url} -> http://localhost:3001${req.url}`);
  }
}));

// Serve static files from dist/public
const staticPath = path.join(__dirname, '../dist/public');
app.use(express.static(staticPath));

// Catch-all handler for SPA routing
app.get('*', (req, res) => {
  console.log(`📄 Serving SPA for route: ${req.path}`);
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Proxy server error:', err);
  res.status(500).json({ error: 'Proxy server error' });
});

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ================================');
  console.log('🚀 PROXY SERVER STARTED');
  console.log('🚀 ================================');
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`🔄 API Proxy: http://localhost:${PORT}/api/* -> http://localhost:3001/api/*`);
  console.log(`📁 Static files: ${staticPath}`);
  console.log(`⏰ Started: ${new Date().toLocaleString()}`);
  console.log('🚀 ================================');
  console.log('');
  console.log('Make sure the backend server is running on port 3001!');
  console.log('');
});

module.exports = app;