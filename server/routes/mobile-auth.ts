// Mobile-specific authentication routes for WebView/APK
import { Router } from 'express';
import { storage } from '../storage/mssql-storage';

const router = Router();

// Mobile login endpoint with direct storage verification
router.post('/api/mobile/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log(`📱 MOBILE LOGIN ATTEMPT: ${username}`);
    
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Missing credentials',
        message: 'Username and password are required' 
      });
    }
    
    // Direct storage verification for mobile
    const isValid = await storage.verifyUserPassword(username, password);
    
    if (isValid) {
      const user = await storage.getUserByUsername(username);
      
      if (user && user.isActive) {
        // Create mobile session
        req.session.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          department: user.department,
          isActive: user.isActive,
          isMobile: true
        };
        
        console.log(`✅ MOBILE LOGIN SUCCESS: ${username} (${user.role})`);
        
        res.json({
          success: true,
          user: req.session.user,
          message: 'Login successful'
        });
      } else {
        console.log(`❌ MOBILE LOGIN - User inactive: ${username}`);
        res.status(401).json({ 
          error: 'User inactive',
          message: 'User account is inactive' 
        });
      }
    } else {
      console.log(`❌ MOBILE LOGIN - Invalid credentials: ${username}`);
      res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Invalid username or password' 
      });
    }
  } catch (error) {
    console.error('Mobile login error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'Login failed due to server error' 
    });
  }
});

// Mobile user info endpoint
router.get('/api/mobile/auth/user', async (req, res) => {
  try {
    if (req.session && req.session.user) {
      console.log(`📱 MOBILE USER INFO: ${req.session.user.username}`);
      res.json(req.session.user);
    } else {
      console.log(`📱 MOBILE USER INFO: No session found`);
      res.status(401).json({ 
        error: 'Not authenticated',
        message: 'No active session' 
      });
    }
  } catch (error) {
    console.error('Mobile user info error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'Failed to get user info' 
    });
  }
});

// Mobile field engineer tasks
router.get('/api/mobile/field-engineers/:id/tasks', async (req, res) => {
  try {
    const fieldEngineerId = req.params.id;
    console.log(`📱 MOBILE FIELD TASKS REQUEST: ${fieldEngineerId}`);
    
    const tasks = await storage.getFieldTasksByEngineer(fieldEngineerId);
    console.log(`📱 Found ${tasks.length} tasks for field engineer ${fieldEngineerId}`);
    
    res.json(tasks);
  } catch (error) {
    console.error('Mobile field tasks error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'Failed to fetch tasks' 
    });
  }
});

// Mobile task status update
router.post('/api/mobile/tasks/:id/status', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { status, note } = req.body;
    const userId = req.session?.user?.id || 'mobile_user';
    
    console.log(`📱 MOBILE TASK STATUS UPDATE: Task ${taskId} → ${status}`);
    
    const task = await storage.updateFieldTaskStatus(taskId, status, userId, note);
    
    console.log(`✅ Mobile task status updated successfully`);
    res.json(task);
  } catch (error) {
    console.error('Mobile task status update error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'Failed to update task status' 
    });
  }
});

export default router;