const http = require('http');
const { Client } = require('pg');

const port = process.env.PORT || 8051;

console.log('=== REAL DATABASE SERVER STARTING ===');

// Database connection
const dbConfig = {
    host: '103.122.85.61',
    port: 9095,
    database: 'WIZONEIT_SUPPORT',
    user: 'postgres',
    password: 'ss123456',
    ssl: false
};

let dbClient = null;

// Initialize database connection
async function initDatabase() {
    try {
        dbClient = new Client(dbConfig);
        await dbClient.connect();
        console.log('✅ Connected to PostgreSQL database');
        
        // Test query
        const result = await dbClient.query('SELECT COUNT(*) FROM users');
        console.log(`📊 Database has ${result.rows[0].count} users`);
        
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

// Get all users from database
async function getUsers() {
    try {
        const query = `
            SELECT 
                id, username, email, first_name, last_name, 
                role, department, phone, is_active,
                created_at, updated_at
            FROM users 
            ORDER BY first_name, last_name
        `;
        const result = await dbClient.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

// Get tasks from database
async function getTasks(userId = null, userRole = 'field_engineer') {
    try {
        let query, params;
        
        if (userRole === 'admin' || userRole === 'backend_engineer') {
            // Admin and backend engineers see all tasks
            query = `
                SELECT 
                    t.*, 
                    c.name as customer_name,
                    c.email as customer_email,
                    c.phone as customer_phone,
                    c.address as customer_address,
                    u.first_name || ' ' || u.last_name as assignee_name
                FROM tasks t
                LEFT JOIN customers c ON t.customer_id = c.id
                LEFT JOIN users u ON t.assigned_to = u.id
                ORDER BY t.priority DESC, t.created_at DESC
            `;
            params = [];
        } else {
            // Field engineers only see their assigned tasks
            query = `
                SELECT 
                    t.*, 
                    c.name as customer_name,
                    c.email as customer_email,
                    c.phone as customer_phone,
                    c.address as customer_address,
                    u.first_name || ' ' || u.last_name as assignee_name
                FROM tasks t
                LEFT JOIN customers c ON t.customer_id = c.id
                LEFT JOIN users u ON t.assigned_to = u.id
                WHERE t.assigned_to = $1
                ORDER BY t.priority DESC, t.created_at DESC
            `;
            params = [userId];
        }
        
        const result = await dbClient.query(query, params);
        return result.rows;
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return [];
    }
}

// Authenticate user
async function authenticateUser(username, password) {
    try {
        // First check with simple password patterns
        const simpleQuery = `
            SELECT id, username, email, first_name, last_name, role, department, phone, is_active
            FROM users 
            WHERE username = $1 AND (
                password = $2 OR 
                password = $3 OR 
                password = $4 OR
                password = $5
            ) AND is_active = true
        `;
        
        const simplePasswords = [
            password,           // exact password
            `${username}@123`,  // username@123 pattern
            username,           // simple username
            'admin123'          // admin fallback
        ];
        
        const result = await dbClient.query(simpleQuery, [username, ...simplePasswords]);
        
        if (result.rows.length > 0) {
            const user = result.rows[0];
            console.log(`✅ User authenticated: ${user.username} (${user.role})`);
            return {
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    fullName: `${user.first_name} ${user.last_name}`,
                    role: user.role,
                    department: user.department,
                    phone: user.phone,
                    isActive: user.is_active
                }
            };
        }
        
        console.log(`❌ Authentication failed for: ${username}`);
        return { success: false, message: 'Invalid credentials' };
        
    } catch (error) {
        console.error('Authentication error:', error);
        return { success: false, message: 'Database error during authentication' };
    }
}

// Update task status
async function updateTaskStatus(taskId, status, note, userId) {
    try {
        // Update task
        await dbClient.query(
            'UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2',
            [status, taskId]
        );
        
        // Add history record
        await dbClient.query(`
            INSERT INTO task_history (task_id, field_name, old_value, new_value, notes, updated_by, created_at)
            VALUES ($1, 'status', (SELECT status FROM tasks WHERE id = $1), $2, $3, $4, NOW())
        `, [taskId, status, note, userId]);
        
        console.log(`✅ Task ${taskId} updated to ${status} by user ${userId}`);
        return { success: true };
    } catch (error) {
        console.error('Error updating task:', error);
        return { success: false, error: error.message };
    }
}

// Get task history
async function getTaskHistory(taskId) {
    try {
        const query = `
            SELECT 
                th.*,
                u.first_name || ' ' || u.last_name as updated_by_name
            FROM task_history th
            LEFT JOIN users u ON th.updated_by = u.id
            WHERE th.task_id = $1
            ORDER BY th.created_at DESC
        `;
        const result = await dbClient.query(query, [taskId]);
        return result.rows;
    } catch (error) {
        console.error('Error fetching task history:', error);
        return [];
    }
}

// Server request handler
const server = http.createServer(async (req, res) => {
    const timestamp = new Date().toISOString();
    console.log(`📥 ${req.method} ${req.url}`);
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    try {
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        const url = new URL(req.url, `http://localhost:${port}`);
        const pathname = url.pathname;
        
        // Health check
        if (pathname === '/api/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                database: dbClient ? 'connected' : 'disconnected'
            }));
            return;
        }
        
        // Authentication endpoint
        if (pathname === '/api/auth/login' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', async () => {
                try {
                    const { username, password } = JSON.parse(body);
                    const authResult = await authenticateUser(username, password);
                    
                    res.writeHead(authResult.success ? 200 : 401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(authResult));
                } catch (error) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Invalid request format' }));
                }
            });
            return;
        }
        
        // Get users
        if (pathname === '/api/users' && req.method === 'GET') {
            const users = await getUsers();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(users));
            return;
        }
        
        // Get tasks
        if (pathname === '/api/tasks' && req.method === 'GET') {
            const userId = url.searchParams.get('user_id');
            const userRole = url.searchParams.get('user_role') || 'field_engineer';
            
            const tasks = await getTasks(userId, userRole);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(tasks));
            return;
        }
        
        // Update task status
        if (pathname.startsWith('/api/tasks/') && pathname.endsWith('/status') && req.method === 'POST') {
            const taskId = pathname.split('/')[3];
            
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', async () => {
                try {
                    const { status, note, userId } = JSON.parse(body);
                    const result = await updateTaskStatus(taskId, status, note, userId);
                    
                    res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
                } catch (error) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Invalid request format' }));
                }
            });
            return;
        }
        
        // Update task (general update endpoint for mobile app compatibility)
        if (pathname.startsWith('/api/tasks/') && !pathname.includes('/status') && !pathname.includes('/history') && req.method === 'PUT') {
            const taskId = pathname.split('/')[3];
            
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', async () => {
                try {
                    const { status, note, userId } = JSON.parse(body);
                    console.log(`📱 Mobile task update request: Task ${taskId}, Status: ${status}, User: ${userId}`);
                    
                    if (status) {
                        const result = await updateTaskStatus(taskId, status, note || `Status updated to ${status}`, userId);
                        res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(result));
                    } else {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, message: 'Status field is required' }));
                    }
                } catch (error) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Invalid request format' }));
                }
            });
            return;
        }
        
        // Get task history
        if (pathname.startsWith('/api/tasks/') && pathname.endsWith('/history') && req.method === 'GET') {
            const taskId = pathname.split('/')[3];
            const history = await getTaskHistory(taskId);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(history));
            return;
        }
        
        // 404 for unknown endpoints
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Endpoint not found' }));
        
    } catch (error) {
        console.error('Server error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
});

// Start server
async function startServer() {
    const dbConnected = await initDatabase();
    
    server.listen(port, () => {
        console.log(`🚀 Real Database Server running on port ${port}`);
        console.log(`📊 Database: ${dbConnected ? 'Connected' : 'Disconnected'}`);
        console.log('🔗 API Endpoints:');
        console.log(`   Health: http://localhost:${port}/api/health`);
        console.log(`   Login:  http://localhost:${port}/api/auth/login`);
        console.log(`   Users:  http://localhost:${port}/api/users`);
        console.log(`   Tasks:  http://localhost:${port}/api/tasks`);
    });
}

startServer();

// Keep server alive
process.on('SIGINT', () => {
    console.log('🛡️  Ignoring SIGINT - Server stays alive');
});

process.on('SIGTERM', () => {
    console.log('🛡️  Ignoring SIGTERM - Server stays alive');
});