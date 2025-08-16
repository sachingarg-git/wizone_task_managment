import type { Express } from "express";

// Health check endpoint for mobile APK network detection
export function setupHealthEndpoint(app: Express) {
  app.get('/api/health', (req, res) => {
    const userAgent = req.get('user-agent') || '';
    const isMobile = userAgent.includes('Mobile') || userAgent.includes('WizoneFieldEngineerApp') || userAgent.includes('WebView');
    
    if (isMobile) {
      console.log(`📱 Mobile APK request: ${req.method} ${req.path} - UA: ${userAgent.substring(0, 50)}...`);
      console.log(`📱 Mobile Headers:`, {
        'X-Requested-With': req.get('X-Requested-With'),
        'X-Mobile-Debug': req.get('X-Mobile-Debug'),
        'X-APK-Version': req.get('X-APK-Version'),
        'X-Mobile-APK': req.get('X-Mobile-APK')
      });
      console.log(`📱 Mobile Session:`, req.session ? 'EXISTS' : 'NO SESSION');
      console.log(`📱 Mobile Authentication:`, req.isAuthenticated ? req.isAuthenticated() : 'NO AUTH METHOD');
    }
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      server: 'Wizone IT Support Portal',
      version: '2.0.0',
      mobile_supported: true,
      request_source: isMobile ? 'mobile' : 'web',
      user_agent: userAgent.substring(0, 100),
      session_active: !!req.session,
      mobile_debug: isMobile,
      authentication_status: req.isAuthenticated ? (req.isAuthenticated() ? 'authenticated' : 'not_authenticated') : 'no_auth_method'
    });
  });
  
  // Additional health endpoints for mobile debugging
  app.get('/api/mobile/health', (req, res) => {
    console.log(`📱 MOBILE HEALTH CHECK:`);
    console.log(`📱 Headers:`, req.headers);
    console.log(`📱 Session:`, req.session ? 'EXISTS' : 'NO SESSION');
    
    res.json({
      status: 'mobile_ready',
      timestamp: new Date().toISOString(),
      database: 'connected',
      authentication: 'enabled',
      cors: 'configured',
      session_support: 'enabled',
      debug_mode: 'active'
    });
  });

  // Mobile debugging endpoint
  app.post('/api/mobile/debug', (req, res) => {
    console.log(`📱 MOBILE DEBUG REQUEST:`);
    console.log(`📱 Headers:`, req.headers);
    console.log(`📱 Body:`, req.body);
    console.log(`📱 Session:`, req.session);
    console.log(`📱 User:`, req.user);
    
    res.json({
      status: 'debug_ok',
      timestamp: new Date().toISOString(),
      headers_received: req.headers,
      body_received: req.body,
      session_data: req.session,
      user_data: req.user,
      message: 'Mobile debug successful'
    });
  });

  // DEBUG: Create test mobile engineers for immediate login access
  app.post("/api/debug/create-mobile-users", async (req, res) => {
    try {
      const { storage } = require('./storage/mssql-storage');
      
      const testUsers = [
        { username: 'engineer1', password: 'engineer1', role: 'field_engineer', firstName: 'राज', lastName: 'शर्मा' },
        { username: 'engineer2', password: 'engineer2', role: 'field_engineer', firstName: 'विकास', lastName: 'गुप्ता' },
        { username: 'mobile_test', password: 'mobile123', role: 'field_engineer', firstName: 'टेस्ट', lastName: 'इंजीनियर' }
      ];
      
      const createdUsers = [];
      for (const userData of testUsers) {
        try {
          const existingUser = await storage.getUserByUsername(userData.username);
          if (!existingUser) {
            const user = await storage.createUser({
              id: `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              ...userData,
              email: `${userData.username}@wizone.com`,
              department: 'FIELD ENGINEERING',
              isActive: true
            });
            createdUsers.push(user);
            console.log(`✅ Created mobile user: ${userData.username}`);
          } else {
            console.log(`ℹ️ User already exists: ${userData.username}`);
          }
        } catch (error) {
          console.error(`❌ Failed to create user ${userData.username}:`, error);
        }
      }
      
      res.json({ 
        message: 'Mobile test users created successfully',
        created_users: createdUsers.length,
        usernames: testUsers.map(u => ({ username: u.username, password: u.password }))
      });
    } catch (error) {
      console.error('Create mobile users error:', error);
      res.status(500).json({ error: error.message });
    }
  });
}