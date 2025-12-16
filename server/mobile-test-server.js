// Simple mobile APK server for testing task updates
const express = require('express');
const cors = require('cors');
const app = express();

// CORS configuration for mobile APK
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cookie', 'User-Agent', 'X-Mobile-App', 'x-mobile-app', 'x-requested-with'],
    credentials: false
}));

app.use(express.json());

// Mock users for testing
const mockUsers = {
    'ravi': { id: 12, username: 'Ravi', role: 'field_engineer' },
    'huzaifa': { id: 10, username: 'huzaifa', role: 'field_engineer' }
};

// Mock tasks data
const mockTasks = {
    31: {
        id: 31,
        ticketNumber: 'T1762501913999',
        title: 'Speed Issues - wizoneit HARIDWAR',
        description: 'Customer experiencing speed issues with system performance. Field engineer required to diagnose and resolve connectivity problems.',
        status: 'pending',
        priority: 'medium',
        customerId: 2,
        customerName: 'wizoneit HARIDWAR',
        createdAt: new Date().toISOString(),
        assignedTo: 14,
        assignedToName: 'ashutosh',
        fieldEngineerId: 12,
        fieldEngineerName: 'ravi saini',
        field_engineer_id: 12,
        category: 'Speed Issues',
        estimatedHours: 4,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        updates: []
    },
    32: {
        id: 32,
        ticketNumber: 'T1762503314173',
        title: 'Configuration - GULMOHAR SOCIETY ROORKEE',
        description: 'Customer requires system configuration assistance. Field engineer needed to setup and configure network infrastructure for society management.',
        status: 'pending',
        priority: 'high',
        customerId: 3,
        customerName: 'GULMOHAR SOCIETY ROORKEE',
        createdAt: new Date().toISOString(),
        assignedTo: 14,
        assignedToName: 'ashutosh',
        fieldEngineerId: 10,
        fieldEngineerName: 'HUZAIFA RAO',
        field_engineer_id: 10,
        category: 'Configuration',
        estimatedHours: 6,
        dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        updates: []
    }
};

// Session storage
const sessions = {};

// Login endpoint
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    console.log('📱 Mobile login attempt:', username);
    
    const user = mockUsers[username.toLowerCase()];
    if (user && (password === 'ravi@123' || password === 'huzaifa@123')) {
        // Create session
        const sessionId = Math.random().toString(36).substr(2, 9);
        sessions[sessionId] = user;
        
        console.log('✅ Login successful for:', username);
        res.json({
            success: true,
            user: user,
            sessionId: sessionId
        });
    } else {
        console.log('❌ Login failed for:', username);
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// Get tasks endpoint
app.get('/api/tasks', (req, res) => {
    console.log('📋 Tasks request');
    
    // For simplicity, return all tasks
    const tasks = Object.values(mockTasks);
    res.json(tasks);
});

// Get single task endpoint
app.get('/api/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const task = mockTasks[taskId];
    
    if (task) {
        console.log('✅ Task found:', taskId);
        res.json(task);
    } else {
        console.log('❌ Task not found:', taskId);
        res.status(404).json({ message: 'Task not found' });
    }
});

// Update task endpoint
app.put('/api/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const task = mockTasks[taskId];
    
    console.log('🔄 Task update request:', { taskId, body: req.body });
    
    if (!task) {
        return res.status(404).json({ message: 'Task not found' });
    }
    
    // Update status if provided
    if (req.body.status) {
        const oldStatus = task.status;
        task.status = req.body.status;
        
        // Add update record
        const updateRecord = {
            id: Date.now(),
            message: `Status changed from ${oldStatus} to ${req.body.status}`,
            createdAt: new Date().toISOString(),
            createdByName: 'Mobile User',
            type: 'status_update'
        };
        task.updates.unshift(updateRecord);
        
        console.log('✅ Status updated:', oldStatus, '->', req.body.status);
    }
    
    // Add notes if provided
    if (req.body.notes) {
        const updateRecord = {
            id: Date.now(),
            message: req.body.notes,
            createdAt: new Date().toISOString(),
            createdByName: 'Mobile User',
            type: 'comment'
        };
        task.updates.unshift(updateRecord);
        
        console.log('✅ Notes added:', req.body.notes);
    }
    
    res.json({ success: true, task });
});

// Get task updates endpoint
app.get('/api/tasks/:id/updates', (req, res) => {
    const taskId = parseInt(req.params.id);
    const task = mockTasks[taskId];
    
    if (task) {
        console.log('📋 Task history request for:', taskId, '- Updates:', task.updates.length);
        res.json(task.updates || []);
    } else {
        res.status(404).json({ message: 'Task not found' });
    }
});

// Dashboard stats endpoint
app.get('/api/dashboard/stats', (req, res) => {
    const tasks = Object.values(mockTasks);
    const stats = {
        totalTasks: tasks.length,
        pendingTasks: tasks.filter(t => t.status === 'pending').length,
        inProgressTasks: tasks.filter(t => t.status === 'in-progress').length,
        completedTasks: tasks.filter(t => t.status === 'completed').length
    };
    
    console.log('📊 Stats request:', stats);
    res.json(stats);
});

// Notifications endpoint
app.get('/api/notifications', (req, res) => {
    console.log('🔔 Notifications request');
    res.json([]);
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log('🚀 Mobile APK Test Server running on port', PORT);
    console.log('📱 Ready to handle mobile requests');
    console.log('🔐 Available users: ravi (ravi@123), huzaifa (huzaifa@123)');
    console.log('📋 Mock tasks: 31 (Ravi), 32 (Huzaifa)');
});