import express from "express";
import { createServer } from "http";
import { pool } from "./db.js";
import { storage } from "./mssql-storage.js";

const app = express();
app.use(express.json());

// Basic auth endpoint for testing
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = await storage.getUserByUsername(username);
    if (user && user.password === password) {
      res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Test users endpoint
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.request().query('SELECT id, username, role, department FROM users');
    res.json(result.recordset);
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Test customers endpoint  
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await storage.getCustomers();
    res.json(customers);
  } catch (error) {
    console.error('Customers fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Test tasks endpoint
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await storage.getTasks();
    res.json(tasks);
  } catch (error) {
    console.error('Tasks fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    database: 'MS SQL Server',
    server: '14.102.70.90:1433',
    database_name: 'TASK_SCORE_WIZONE'
  });
});

const server = createServer(app);
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 MS SQL Server running on port ${PORT}`);
  console.log(`✅ Connected to MS SQL: 14.102.70.90:1433/TASK_SCORE_WIZONE`);
});