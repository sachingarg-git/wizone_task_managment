const http = require('http');
const url = require('url');

// Simple server that actually works
const server = http.createServer((req, res) => {
    console.log(`📱 ${new Date().toLocaleTimeString()} - ${req.method} ${req.url} from ${req.socket.remoteAddress}`);
    
    // Set CORS headers for APK access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    const parsedUrl = url.parse(req.url, true);
    
    // Health check endpoint
    if (parsedUrl.pathname === '/api/health') {
        console.log('✅ Health check requested');
        res.writeHead(200);
        res.end(JSON.stringify({
            status: 'ok',
            message: 'Server is running!',
            timestamp: new Date().toISOString()
        }));
        return;
    }
    
    // Login endpoint
    if (parsedUrl.pathname === '/api/auth/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                console.log(`🔐 Login attempt: ${data.username} / ${data.password ? '***' : 'NO PASSWORD'}`);
                
                // Valid credentials
                if (data.username === 'admin' && data.password === 'admin123') {
                    console.log('✅ LOGIN SUCCESS for admin');
                    res.writeHead(200);
                    res.end(JSON.stringify({
                        id: 1,
                        username: 'admin',
                        firstName: 'Admin',
                        lastName: 'User',
                        email: 'admin@wizone.com',
                        role: 'admin',
                        message: 'Login successful!'
                    }));
                    return;
                } else {
                    console.log('❌ LOGIN FAILED - Invalid credentials');
                    res.writeHead(401);
                    res.end(JSON.stringify({
                        message: 'Invalid username or password'
                    }));
                    return;
                }
            } catch (e) {
                console.log('❌ LOGIN ERROR - Invalid JSON');
                res.writeHead(400);
                res.end(JSON.stringify({ message: 'Invalid request' }));
                return;
            }
        });
        return;
    }
    
    // Tasks endpoint
    if (parsedUrl.pathname === '/api/tasks') {
        console.log('📋 Tasks requested');
        res.writeHead(200);
        res.end(JSON.stringify([
            {
                id: 1,
                title: 'System Maintenance',
                description: 'Regular system maintenance and updates',
                status: 'pending',
                priority: 'high',
                assignedTo: 'admin',
                createdAt: '2025-10-12T10:00:00Z'
            },
            {
                id: 2,
                title: 'Database Backup',
                description: 'Weekly database backup procedure',
                status: 'in-progress',
                priority: 'medium',
                assignedTo: 'admin',
                createdAt: '2025-10-12T09:00:00Z'
            },
            {
                id: 3,
                title: 'Security Audit',
                description: 'Monthly security audit and review',
                status: 'completed',
                priority: 'high',
                assignedTo: 'admin',
                createdAt: '2025-10-12T08:00:00Z'
            }
        ]));
        return;
    }
    
    // Users endpoint
    if (parsedUrl.pathname === '/api/users') {
        console.log('👥 Users requested');
        res.writeHead(200);
        res.end(JSON.stringify([
            {
                id: 1,
                username: 'admin',
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@wizone.com',
                role: 'admin',
                isActive: true
            },
            {
                id: 2,
                username: 'engineer1',
                firstName: 'John',
                lastName: 'Engineer',
                email: 'john@wizone.com',
                role: 'engineer',
                isActive: true
            }
        ]));
        return;
    }
    
    // Default 404
    console.log(`❌ 404 - Not found: ${req.url}`);
    res.writeHead(404);
    res.end(JSON.stringify({ message: 'Not Found' }));
});

const port = 3001;

server.listen(port, '0.0.0.0', (err) => {
    if (err) {
        console.error('❌ Server failed to start:', err);
        process.exit(1);
    }
    
    console.log('🚀 WORKING SERVER STARTED SUCCESSFULLY!');
    console.log(`📡 Listening on ALL interfaces: 0.0.0.0:${port}`);
    console.log('');
    console.log('🌐 Test endpoints:');
    console.log(`   http://localhost:${port}/api/health`);
    console.log(`   http://192.168.11.9:${port}/api/health`);
    console.log(`   http://192.168.5.254:${port}/api/health`);
    console.log('');
    console.log('🔐 Login credentials: admin / admin123');
    console.log('📱 Ready for APK connections!');
    console.log('🔍 Monitoring all requests...');
    console.log('');
});

// Handle server errors
server.on('error', (err) => {
    console.error('❌ Server error:', err);
    if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is already in use. Kill the process using:`);
        console.log(`tasklist | findstr :${port}`);
        console.log(`taskkill /F /PID <process_id>`);
    }
    process.exit(1);
});