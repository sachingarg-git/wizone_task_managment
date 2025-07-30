import express from 'express';
import { testConnection, saveDatabaseConfig, loadDatabaseConfig } from './database/mssql-connection';
import { createAllTables, validateAllTables } from './database/table-creator';
import { initializeDatabase, AdminUserConfig } from './database/admin-seeder';

const router = express.Router();

// Test database connection
router.post('/test-connection', async (req, res) => {
  try {
    const config = req.body;
    
    if (!config.host || !config.username || !config.password) {
      return res.status(400).json({
        success: false,
        error: 'Host, username, and password are required'
      });
    }

    const isConnected = await testConnection(config);
    
    if (isConnected) {
      res.json({ success: true, message: 'Connection successful' });
    } else {
      res.status(400).json({ 
        success: false, 
        error: 'Failed to connect to database. Please check your credentials.' 
      });
    }
  } catch (error) {
    console.error('Connection test error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Connection test failed: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
});

// Create database tables
router.post('/create-tables', async (req, res) => {
  try {
    const config = req.body;
    
    // Save configuration first
    await saveDatabaseConfig(config);
    
    // Create all tables
    const results = await createAllTables();
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    if (successCount === totalCount) {
      res.json({ 
        success: true, 
        message: `All ${totalCount} tables created successfully`,
        tablesCreated: successCount,
        results 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: `Only ${successCount}/${totalCount} tables created successfully`,
        results 
      });
    }
  } catch (error) {
    console.error('Table creation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create tables: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
});

// Create admin user and initialize database
router.post('/create-admin', async (req, res) => {
  try {
    const { admin, ...dbConfig } = req.body;
    
    // Ensure database configuration is saved
    await saveDatabaseConfig(dbConfig);
    
    // Initialize database with admin user
    const result = await initializeDatabase(admin as AdminUserConfig);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Admin user and sample data created successfully',
        adminCreated: result.adminCreated,
        usersCreated: result.usersCreated,
        customersCreated: result.customersCreated
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: 'Failed to initialize database with admin user'
      });
    }
  } catch (error) {
    console.error('Admin creation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create admin user: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
});

// Check if database is configured and initialized
router.get('/status', async (req, res) => {
  try {
    const config = await loadDatabaseConfig();
    
    if (!config) {
      return res.json({ 
        configured: false, 
        initialized: false,
        message: 'Database not configured'
      });
    }

    // Test if we can connect and validate tables
    const isConnected = await testConnection(config);
    if (!isConnected) {
      return res.json({ 
        configured: true, 
        initialized: false,
        message: 'Database configured but connection failed'
      });
    }

    const validation = await validateAllTables();
    
    res.json({ 
      configured: true, 
      initialized: validation.isValid,
      message: validation.isValid ? 'Database fully initialized' : 'Missing tables',
      missingTables: validation.missingTables
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ 
      configured: false, 
      initialized: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get current database configuration (without sensitive data)
router.get('/config', async (req, res) => {
  try {
    const config = await loadDatabaseConfig();
    
    if (!config) {
      return res.status(404).json({ 
        error: 'No database configuration found' 
      });
    }

    // Return config without password
    const { password, ...safeConfig } = config;
    res.json(safeConfig);
  } catch (error) {
    console.error('Config retrieval error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as setupRoutes };