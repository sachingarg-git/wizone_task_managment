const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Simple health check endpoint
app.get('/api/health', (req, res) => {
    console.log('🏥 Health check requested from:', req.ip);
    res.json({ 
        status: 'ok', 
        message: 'Server is running!',
        timestamp: new Date().toISOString(),
        clientIp: req.ip
    });
});

// Simple login endpoint for testing
app.post('/api/auth/login', (req, res) => {
    console.log('🔐 Login attempt from:', req.ip, 'User:', req.body.username);
    
    if (req.body.username === 'admin' && req.body.password === 'admin123') {
        res.json({
            id: 1,
            username: 'admin',
            firstName: 'Admin',
            lastName: 'User',
            message: 'Login successful!'
        });
    } else {
        res.status(401).json({
            message: 'Invalid credentials'
        });
    }
});

// Get user's IP addresses
app.get('/api/network-info', (req, res) => {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    const addresses = [];
    
    for (const name of Object.keys(interfaces)) {
        for (const interface of interfaces[name]) {
            if (interface.family === 'IPv4' && !interface.internal) {
                addresses.push({
                    name: name,
                    address: interface.address
                });
            }
        }
    }
    
    res.json({
        serverIPs: addresses,
        clientIP: req.ip,
        timestamp: new Date().toISOString()
    });
});

const port = 3001;

// Listen on all interfaces (0.0.0.0)
app.listen(port, '0.0.0.0', () => {
    console.log('🚀 Simple test server running on:');
    console.log(`   http://localhost:${port}`);
    console.log(`   http://0.0.0.0:${port}`);
    
    // Show all available IP addresses
    const os = require('os');
    const interfaces = os.networkInterfaces();
    
    console.log('\n🌐 Available on these IP addresses:');
    for (const name of Object.keys(interfaces)) {
        for (const interface of interfaces[name]) {
            if (interface.family === 'IPv4' && !interface.internal) {
                console.log(`   http://${interface.address}:${port}`);
            }
        }
    }
    
    console.log('\n📱 Test from mobile browser: http://YOUR_IP:3001/api/health');
    console.log('\n🔍 Waiting for connections...\n');
});