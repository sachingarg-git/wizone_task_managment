// Field Engineer Mobile App Server - MS SQL Only
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { storage } from './storage-mssql.js';
import { getConnection } from './db-mssql.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload configuration
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Static files
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    database: 'MS SQL Server',
    server: '14.102.70.90:1433',
    database_name: 'TASK_SCORE_WIZONE',
    app: 'Field Engineer Mobile'
  });
});

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password required' 
      });
    }

    const user = await storage.authenticateUser(username, password);
    
    if (user) {
      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          department: user.department
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Dashboard stats
app.get('/api/dashboard/stats/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const stats = await storage.getFieldEngineerStats(username);
    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get tasks for field engineer
app.get('/api/tasks/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const tasks = await storage.getTasksForUser(username);
    res.json(tasks);
  } catch (error) {
    console.error('Tasks fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get single task details
app.get('/api/task/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const task = await storage.getTask(taskId);
    
    if (task) {
      res.json(task);
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (error) {
    console.error('Task fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Update task status
app.post('/api/task/:id/status', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { status, username } = req.body;
    
    const success = await storage.updateTaskStatus(taskId, status, username);
    
    if (success) {
      res.json({ success: true, message: 'Task status updated' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to update task' });
    }
  } catch (error) {
    console.error('Task update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update task' });
  }
});

// Add task note with optional file
app.post('/api/task/:id/note', upload.single('file'), async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { content, username } = req.body;
    const filePath = req.file ? req.file.path : undefined;
    
    const success = await storage.addTaskNote(taskId, content, username, filePath);
    
    if (success) {
      res.json({ 
        success: true, 
        message: 'Note added successfully',
        file: filePath ? `/uploads/${path.basename(filePath)}` : null
      });
    } else {
      res.status(500).json({ success: false, message: 'Failed to add note' });
    }
  } catch (error) {
    console.error('Note add error:', error);
    res.status(500).json({ success: false, message: 'Failed to add note' });
  }
});

// Get task history
app.get('/api/task/:id/history', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const updates = await storage.getTaskUpdates(taskId);
    res.json(updates);
  } catch (error) {
    console.error('Task history error:', error);
    res.status(500).json({ error: 'Failed to fetch task history' });
  }
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query('SELECT COUNT(*) as count FROM users');
    res.json({ 
      status: 'Connected',
      user_count: result.recordset[0].count
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Start server
const PORT = process.env.PORT || 3002;
const server = createServer(app);

server.listen(PORT, () => {
  console.log(`🚀 Field Engineer Mobile Server running on port ${PORT}`);
  console.log(`📱 MS SQL Database: 14.102.70.90:1433/TASK_SCORE_WIZONE`);
  console.log(`🔧 Endpoints available for field engineer mobile app`);
});