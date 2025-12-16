const express = require('express');
const path = require('path');

const app = express();
const PORT = 7777;

// Serve static files from the dist/public directory
app.use(express.static(path.join(__dirname, '../dist/public')));

// Handle all routes by serving index.html (for SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/public/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Serving files from: ${path.join(__dirname, '../dist/public')}`);
});

app.on('error', (err) => {
  console.error('Server error:', err);
});