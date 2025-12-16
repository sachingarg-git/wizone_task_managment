const http = require('http');

const server = http.createServer((req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    
    console.log(`${new Date().toLocaleTimeString()} - ${req.method} ${req.url} from ${req.socket.remoteAddress}`);
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    if (req.url === '/api/health') {
        res.writeHead(200);
        res.end(JSON.stringify({
            status: 'ok',
            message: 'Test server is working!',
            timestamp: new Date().toISOString(),
            clientIP: req.socket.remoteAddress
        }));
        return;
    }
    
    if (req.url === '/api/auth/login') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                console.log('Login attempt:', data.username);
                
                if (data.username === 'admin' && data.password === 'admin123') {
                    res.writeHead(200);
                    res.end(JSON.stringify({
                        id: 1,
                        username: 'admin',
                        firstName: 'Admin',
                        lastName: 'User',
                        message: 'Test login successful!'
                    }));
                } else {
                    res.writeHead(401);
                    res.end(JSON.stringify({
                        message: 'Invalid credentials'
                    }));
                }
            } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ message: 'Invalid JSON' }));
            }
        });
        return;
    }
    
    res.writeHead(404);
    res.end(JSON.stringify({ message: 'Not Found' }));
});

const port = 3001;
server.listen(port, '0.0.0.0', (err) => {
    if (err) {
        console.error('Failed to start server:', err);
        return;
    }
    
    console.log('🚀 Test Server Started Successfully!');
    console.log(`📡 Listening on ALL interfaces (0.0.0.0:${port})`);
    console.log('');
    console.log('🌐 Available endpoints:');
    console.log(`   http://localhost:${port}/api/health`);
    console.log(`   http://192.168.11.9:${port}/api/health`);
    console.log(`   http://192.168.5.254:${port}/api/health`);
    console.log(`   http://103.122.85.61:${port}/api/health`);
    console.log('');
    console.log('📱 Test from mobile browser with any of the above URLs');
    console.log('🔍 Waiting for connections...');
    console.log('');
});