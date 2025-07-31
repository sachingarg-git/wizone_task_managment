import { Router } from 'express';
import { storage } from '../storage/mssql-storage';

const router = Router();

// Mobile-specific login endpoint (no sessions required)
router.post('/mobile/login', async (req, res) => {
  try {
    console.log('📱 MOBILE LOGIN REQUEST');
    console.log('Username:', req.body.username);
    console.log('User Agent:', req.get('User-Agent'));
    console.log('Origin:', req.get('Origin') || 'No Origin');
    
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Missing credentials', 
        message: 'Username and password are required' 
      });
    }
    
    // Get user from database
    const user = await storage.getUserByUsername(username.trim());
    
    if (!user) {
      console.log('❌ User not found:', username);
      return res.status(401).json({ 
        error: 'Invalid credentials', 
        message: 'User not found' 
      });
    }
    
    if (!user.isActive) {
      console.log('❌ User inactive:', username);
      return res.status(401).json({ 
        error: 'Account disabled', 
        message: 'Account is not active' 
      });
    }
    
    // Verify password using the storage method
    const isValidPassword = await storage.verifyUserPassword(username, password);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password for:', username);
      return res.status(401).json({ 
        error: 'Invalid credentials', 
        message: 'Incorrect password' 
      });
    }
    
    console.log('✅ Mobile login successful:', username);
    
    // Return user data without password
    const { password: pwd, ...safeUser } = user;
    res.status(200).json(safeUser);
    
  } catch (error) {
    console.error('❌ Mobile login error:', error);
    res.status(500).json({ 
      error: 'Login failed', 
      message: 'Internal server error' 
    });
  }
});

// Mobile-specific user info endpoint
router.get('/mobile/user/:userId', async (req, res) => {
  try {
    const user = await storage.getUser(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    console.error('Mobile user fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;