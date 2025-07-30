// Simple Mobile Server Starter for MS SQL
const express = require('express');
const cors = require('cors');
const mssql = require('mssql');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('client'));

// MS SQL Configuration
const sqlConfig = {
  server: '14.102.70.90',
  port: 1433,
  database: 'TASK_SCORE_WIZONE',
  user: 'sa',
  password: 'ss123456',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  }
};

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    database: 'MS SQL Server',
    server: '14.102.70.90:1433',
    database_name: 'TASK_SCORE_WIZONE',
    app: 'Field Engineer Mobile',
    port: PORT
  });
});

// Test authentication
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password required' 
      });
    }

    const pool = new mssql.ConnectionPool(sqlConfig);
    await pool.connect();
    
    const result = await pool.request()
      .input('username', mssql.VarChar, username)
      .input('password', mssql.VarChar, password)
      .query('SELECT * FROM users WHERE username = @username AND password = @password');
    
    await pool.close();
    
    if (result.recordset.length > 0) {
      const user = result.recordset[0];
      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          department: user.department,
          firstName: user.firstName,
          lastName: user.lastName
        },
        message: 'Login successful'
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
      message: 'Database connection error'
    });
  }
});

// Get tasks for user
app.get('/api/tasks', async (req, res) => {
  try {
    const pool = new mssql.ConnectionPool(sqlConfig);
    await pool.connect();
    
    const result = await pool.request()
      .query(`
        SELECT t.*, c.name as customerName, c.phone as customerPhone
        FROM tasks t
        LEFT JOIN customers c ON t.customerId = c.id
        ORDER BY t.createdAt DESC
      `);
    
    await pool.close();
    
    res.json({
      success: true,
      tasks: result.recordset
    });
  } catch (error) {
    console.error('Tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Database error'
    });
  }
});

// Update task status
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const pool = new mssql.ConnectionPool(sqlConfig);
    await pool.connect();
    
    const result = await pool.request()
      .input('id', mssql.Int, id)
      .input('status', mssql.VarChar, status)
      .query('UPDATE tasks SET status = @status, updatedAt = GETDATE() WHERE id = @id');
    
    await pool.close();
    
    res.json({
      success: true,
      message: 'Task updated successfully'
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Database error'
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Field Engineer Mobile Server running on port ${PORT}`);
  console.log(`📱 Mobile app available at: http://localhost:${PORT}`);
  console.log(`🗄️ Database: MS SQL Server (14.102.70.90:1433/TASK_SCORE_WIZONE)`);
});

module.exports = app;