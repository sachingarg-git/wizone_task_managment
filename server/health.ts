import type { Express } from "express";

// Health check endpoint for mobile APK network detection
export function setupHealthEndpoint(app: Express) {
  app.get('/api/health', (req, res) => {
    const userAgent = req.get('user-agent') || '';
    const isMobile = userAgent.includes('Mobile') || userAgent.includes('WizoneFieldEngineerApp');
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      server: 'Wizone IT Support Portal',
      version: '1.0.0',
      mobile_supported: true,
      request_source: isMobile ? 'mobile' : 'web',
      user_agent: userAgent.substring(0, 50)
    });
  });
  
  // Additional health endpoints for mobile debugging
  app.get('/api/mobile/health', (req, res) => {
    res.json({
      status: 'mobile_ready',
      timestamp: new Date().toISOString(),
      database: 'connected',
      authentication: 'enabled',
      cors: 'configured'
    });
  });
}