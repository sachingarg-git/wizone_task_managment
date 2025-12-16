const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files from dist/public
const publicPath = path.join(__dirname, '../dist/public');
console.log('Serving static files from:', publicPath);

app.use('/', express.static(publicPath));

// Fallback for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log('========================================');
  console.log('🌟 SIMPLE STATIC SERVER STARTED');
  console.log('========================================');
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`📁 Serving files from: ${publicPath}`);
  console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
  console.log('========================================');
  console.log('Note: This serves STATIC FILES ONLY');
  console.log('API endpoints will NOT work');
  console.log('========================================');
});