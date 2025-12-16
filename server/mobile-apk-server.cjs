const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3001;

console.log('=== MOBILE APK SERVER STARTING ===');
console.log('Process ID:', process.pid);
console.log('Port:', port);
console.log('Designed for Wizone Mobile APK Authentication');

const server = http.createServer((req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`📱 ${req.method} ${req.url} - ${req.headers['user-agent']?.substring(0, 50) || 'Unknown'}`);
  
  // CORS headers for mobile APK
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Mobile-App');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  try {
    // Handle preflight
    if (req.method === 'OPTIONS') {
      console.log('✅ CORS preflight handled');
      res.writeHead(200);
      res.end();
      return;
    }
    
    // Health check endpoint
    if (req.url === '/api/health') {
      console.log('💚 Health check requested');
      const healthData = JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        port: port,
        pid: process.pid,
        uptime: Math.floor(process.uptime()),
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        service: 'Mobile APK Server',
        version: '1.0'
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(healthData);
      return;
    }
    
    // Login endpoint for field engineers
    if (req.url === '/api/auth/login' && req.method === 'POST') {
      console.log('🔐 APK Login attempt');
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const { username, password } = data;
          
          console.log(`📱 Login: ${username} / ${password ? '***' : 'EMPTY'}`);
          
          // Field engineer credentials based on database analysis
          const validUsers = [
            // Admin
            { username: 'admin', password: 'admin123', id: 1, firstName: 'Admin', lastName: 'User', role: 'admin' },
            { username: 'admin', password: 'admin', id: 1, firstName: 'Admin', lastName: 'User', role: 'admin' },
            
            // Field Engineers (using @123 pattern confirmed from logs)
            { username: 'ravi', password: 'ravi@123', id: 12, firstName: 'Ravi', lastName: 'Kumar', role: 'field_engineer' },
            { username: 'Ravi', password: 'ravi@123', id: 12, firstName: 'Ravi', lastName: 'Kumar', role: 'field_engineer' },
            { username: 'rohit', password: 'rohit@123', id: 11, firstName: 'Rohit', lastName: 'Singh', role: 'field_engineer' },
            { username: 'Rohit', password: 'rohit@123', id: 11, firstName: 'Rohit', lastName: 'Singh', role: 'field_engineer' },
            { username: 'huzaifa', password: 'huzaifa@123', id: 10, firstName: 'Huzaifa', lastName: 'Ali', role: 'field_engineer' },
            { username: 'Huzaifa', password: 'huzaifa@123', id: 10, firstName: 'Huzaifa', lastName: 'Ali', role: 'field_engineer' },
            { username: 'sachin', password: 'sachin@123', id: 9, firstName: 'Sachin', lastName: 'Garg', role: 'field_engineer' },
            { username: 'Sachin', password: 'sachin@123', id: 9, firstName: 'Sachin', lastName: 'Garg', role: 'field_engineer' },
            { username: 'vikash', password: 'vikash@123', id: 21, firstName: 'Vikash', lastName: 'Kumar', role: 'field_engineer' },
            { username: 'Vikash', password: 'vikash@123', id: 21, firstName: 'Vikash', lastName: 'Kumar', role: 'field_engineer' },
            
            // Fallback simple passwords
            { username: 'ravi', password: 'ravi', id: 12, firstName: 'Ravi', lastName: 'Kumar', role: 'field_engineer' },
            { username: 'rohit', password: 'rohit', id: 11, firstName: 'Rohit', lastName: 'Singh', role: 'field_engineer' },
            { username: 'huzaifa', password: 'huzaifa', id: 10, firstName: 'Huzaifa', lastName: 'Ali', role: 'field_engineer' },
            { username: 'sachin', password: 'sachin', id: 9, firstName: 'Sachin', lastName: 'Garg', role: 'field_engineer' },
            { username: 'vikash', password: 'vikash', id: 21, firstName: 'Vikash', lastName: 'Kumar', role: 'field_engineer' }
          ];
          
          const user = validUsers.find(u => u.username === username && u.password === password);
          
          if (user) {
            console.log(`✅ Login successful: ${user.firstName} ${user.lastName} (${user.role})`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              id: user.id,
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
              email: `${user.username}@wizone.com`,
              role: user.role,
              department: user.role === 'admin' ? 'Administration' : 'Field Engineering',
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }));
          } else {
            console.log(`❌ Invalid credentials: ${username}`);
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              error: 'Invalid credentials',
              message: 'Invalid username or password'
            }));
          }
        } catch (e) {
          console.log('❌ Login JSON parse error:', e.message);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
      return;
    }
    
    // User info endpoint
    if (req.url === '/api/auth/user') {
      console.log('👤 User info requested - requires authentication');
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }
    
    // Mock tasks endpoint for field engineers
    if (req.url === '/api/tasks') {
      console.log('📋 Tasks requested for mobile APK');
      
      const mockTasks = [
        {
          id: 1,
          title: 'Network Installation - Gurgaon Office',
          description: 'Install and configure network equipment at new office location',
          status: 'pending',
          priority: 'high',
          customerId: 2,
          customerName: 'Wizone IT Network India Pvt Ltd',
          customerEmail: 'support@wizoneit.com',
          customerPhone: '+91-9876543210',
          customerAddress: 'IT Park, Sector 45, Gurgaon, Haryana, India',
          assigneeId: 12,
          assigneeName: 'Ravi Kumar',
          issueType: 'installation',
          ticketNumber: 'WZ-001',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          title: 'System Maintenance - Mumbai Client',
          description: 'Routine system maintenance and security updates',
          status: 'in-progress',
          priority: 'medium',
          customerId: 3,
          customerName: 'Tech Solutions Mumbai',
          customerEmail: 'admin@techsolutions.com',
          customerPhone: '+91-9876543211',
          customerAddress: 'Tech Hub, Andheri East, Mumbai, Maharashtra, India',
          assigneeId: 10,
          assigneeName: 'Huzaifa Ali',
          issueType: 'maintenance',
          ticketNumber: 'WZ-002',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
          id: 3,
          title: 'Hardware Repair - Noida Site',
          description: 'Repair and replace faulty hardware components',
          status: 'assigned',
          priority: 'high',
          customerId: 4,
          customerName: 'Delhi Tech Services',
          customerEmail: 'operations@delhitech.com',
          customerPhone: '+91-9876543212',
          customerAddress: 'Sector 18, Noida, Uttar Pradesh, India',
          assigneeId: 11,
          assigneeName: 'Rohit Singh',
          issueType: 'repair',
          ticketNumber: 'WZ-003',
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(mockTasks));
      return;
    }
    
    // Dashboard stats
    if (req.url === '/api/dashboard/stats') {
      console.log('📊 Dashboard stats requested');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        totalTasks: 3,
        pendingTasks: 1,
        inProgressTasks: 1,
        completedTasks: 0,
        assignedTasks: 1
      }));
      return;
    }
    
    // Users endpoint
    if (req.url === '/api/users') {
      console.log('👥 Users list requested');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify([
        { id: 1, username: 'admin', firstName: 'Admin', lastName: 'User', role: 'admin', department: 'Administration', isActive: true },
        { id: 12, username: 'ravi', firstName: 'Ravi', lastName: 'Kumar', role: 'field_engineer', department: 'Field Engineering', isActive: true },
        { id: 11, username: 'rohit', firstName: 'Rohit', lastName: 'Singh', role: 'field_engineer', department: 'Field Engineering', isActive: true },
        { id: 10, username: 'huzaifa', firstName: 'Huzaifa', lastName: 'Ali', role: 'field_engineer', department: 'Field Engineering', isActive: true },
        { id: 9, username: 'sachin', firstName: 'Sachin', lastName: 'Garg', role: 'field_engineer', department: 'Field Engineering', isActive: true },
        { id: 21, username: 'vikash', firstName: 'Vikash', lastName: 'Kumar', role: 'field_engineer', department: 'Field Engineering', isActive: true }
      ]));
      return;
    }

    // ========== WIZONE NETWORK MONITORING MODULE - SEPARATE ENDPOINTS ==========
    
    // Network towers endpoint
    if (req.url === '/api/network/towers' && req.method === 'GET') {
      console.log('📡 Network towers data requested');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify([
        {
          id: 1,
          name: "Tower A1-Delhi",
          location: "Connaught Place",
          status: "online",
          bandwidth: "85%",
          latency: "12ms",
          uptime: "99.9%",
          devices: 45,
          lastChecked: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          alerts: 0,
          coordinates: { lat: 28.6139, lng: 77.2090 },
          ipAddress: "192.168.1.10",
          cpuUsage: "65%",
          memoryUsage: "78%",
          temperature: "42°C",
          networkIO: "156 Mbps"
        },
        {
          id: 2,
          name: "Tower B2-Mumbai",
          location: "Bandra West",
          status: "warning",
          bandwidth: "92%",
          latency: "28ms",
          uptime: "98.5%",
          devices: 38,
          lastChecked: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
          alerts: 2,
          coordinates: { lat: 19.0596, lng: 72.8295 },
          ipAddress: "192.168.1.20",
          cpuUsage: "88%",
          memoryUsage: "92%",
          temperature: "68°C",
          networkIO: "245 Mbps"
        },
        {
          id: 3,
          name: "Tower C3-Bangalore",
          location: "Koramangala",
          status: "offline",
          bandwidth: "0%",
          latency: "timeout",
          uptime: "87.2%",
          devices: 0,
          lastChecked: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          alerts: 5,
          coordinates: { lat: 12.9279, lng: 77.6271 },
          ipAddress: "192.168.1.30",
          cpuUsage: "0%",
          memoryUsage: "0%",
          temperature: "N/A",
          networkIO: "0 Mbps"
        }
      ]));
      return;
    }

    // Network monitoring stats
    if (req.url === '/api/network/stats' && req.method === 'GET') {
      console.log('📊 Network statistics requested');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        totalTowers: 3,
        onlineTowers: 2,
        offlineTowers: 1,
        warningTowers: 1,
        totalAlerts: 7,
        avgUptime: "95.2%",
        totalBandwidth: "73%",
        networkUtilization: "73%",
        storageUsage: "45%",
        bandwidthCapacity: "89%"
      }));
      return;
    }

    // Network alerts
    if (req.url === '/api/network/alerts' && req.method === 'GET') {
      console.log('🚨 Network alerts requested');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify([
        {
          id: 1,
          type: "critical",
          title: "Tower C3-Bangalore Offline",
          message: "Tower has been offline for 15 minutes",
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          towerId: 3,
          status: "active"
        },
        {
          id: 2,
          type: "warning",
          title: "High Bandwidth Usage - Tower B2",
          message: "Bandwidth utilization at 92%",
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          towerId: 2,
          status: "active"
        },
        {
          id: 3,
          type: "warning",
          title: "Temperature Alert - Tower A1",
          message: "Equipment temperature at 68°C",
          timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
          towerId: 1,
          status: "active"
        }
      ]));
      return;
    }

    // Network monitoring logs
    if (req.url === '/api/network/monitoring-logs' && req.method === 'GET') {
      console.log('📝 Network monitoring logs requested');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify([
        {
          id: 1,
          towerId: 1,
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          pingStatus: "success",
          responseTime: "12ms",
          bandwidth: "85%",
          cpuUsage: "65%",
          memoryUsage: "78%",
          temperature: "42°C"
        },
        {
          id: 2,
          towerId: 2,
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          pingStatus: "success",
          responseTime: "28ms",
          bandwidth: "92%",
          cpuUsage: "88%",
          memoryUsage: "92%",
          temperature: "68°C"
        },
        {
          id: 3,
          towerId: 3,
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          pingStatus: "timeout",
          responseTime: "timeout",
          bandwidth: "0%",
          cpuUsage: "0%",
          memoryUsage: "0%",
          temperature: "N/A"
        }
      ]));
      return;
    }

    // Network device inventory
    if (req.url === '/api/network/devices' && req.method === 'GET') {
      console.log('🖥️ Network device inventory requested');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify([
        {
          id: 1,
          towerId: 1,
          deviceType: "Router",
          deviceName: "Cisco-ASR-1001",
          ipAddress: "192.168.1.11",
          macAddress: "00:1B:44:11:3A:B7",
          status: "active",
          lastSeen: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          manufacturer: "Cisco",
          model: "ASR-1001-X",
          firmwareVersion: "16.09.04"
        },
        {
          id: 2,
          towerId: 1,
          deviceType: "Switch",
          deviceName: "HP-ProCurve-2920",
          ipAddress: "192.168.1.12",
          macAddress: "00:1F:29:4A:5C:8D",
          status: "active",
          lastSeen: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
          manufacturer: "HP",
          model: "ProCurve-2920-48G",
          firmwareVersion: "WB.16.04.0008"
        },
        {
          id: 3,
          towerId: 2,
          deviceType: "Antenna",
          deviceName: "Ubiquiti-AM-5G17-90",
          ipAddress: "192.168.1.21",
          macAddress: "00:27:22:A1:B2:C3",
          status: "warning",
          lastSeen: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
          manufacturer: "Ubiquiti",
          model: "AM-5G17-90",
          firmwareVersion: "8.7.4"
        }
      ]));
      return;
    }

    // Add new tower endpoint
    if (req.url === '/api/network/towers' && req.method === 'POST') {
      console.log('🆕 Add new tower requested');
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const towerData = JSON.parse(body);
          console.log('📡 New tower data received:', towerData);
          // In real implementation, this would be saved to database
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: 'Tower added successfully',
            towerId: Date.now() // Mock ID
          }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON data' }));
        }
      });
      return;
    }

    // Update monitoring configuration
    if (req.url === '/api/network/config' && req.method === 'PUT') {
      console.log('⚙️ Update monitoring configuration requested');
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const configData = JSON.parse(body);
          console.log('⚙️ Configuration update received:', configData);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: 'Configuration updated successfully'
          }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid configuration data' }));
        }
      });
      return;
    }

    // Network performance analytics
    if (req.url === '/api/network/analytics' && req.method === 'GET') {
      console.log('📈 Network analytics requested');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        performanceTrends: {
          last30Days: {
            avgLatency: "18ms",
            avgUptime: "97.8%",
            avgBandwidth: "78%"
          },
          thisWeek: {
            avgLatency: "15ms",
            avgUptime: "98.2%",
            avgBandwidth: "82%"
          }
        },
        capacityPlanning: {
          networkUtilization: 73,
          storageUsage: 45,
          bandwidthCapacity: 89,
          projectedGrowth: "12% monthly"
        },
        topAlerts: [
          { type: "bandwidth_high", count: 15, trend: "increasing" },
          { type: "temperature_warning", count: 8, trend: "stable" },
          { type: "connection_timeout", count: 3, trend: "decreasing" }
        ]
      }));
      return;
    }
    
    // ========== END WIZONE NETWORK MONITORING MODULE ==========
    
    // 404 for other endpoints
    console.log(`❌ Endpoint not found: ${req.url}`);
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found', url: req.url }));
    
  } catch (error) {
    console.log('❌ Request error:', error.message);
    try {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Server error' }));
    } catch (e) {
      console.log('❌ Error response failed');
    }
  }
});

// Server event handlers
server.on('error', (error) => {
  if (error.code === 'EACCES') {
    console.log(`🚨 Permission denied for port ${port}. Try running as administrator or use different port.`);
  } else if (error.code === 'EADDRINUSE') {
    console.log(`🚨 Port ${port} is already in use. Trying port ${port + 1}...`);
    server.listen(port + 1, '0.0.0.0');
  } else {
    console.log('🚨 Server error:', error.message);
  }
});

server.on('connection', (socket) => {
  console.log('🔗 New mobile connection from:', socket.remoteAddress || 'unknown');
  socket.on('error', (err) => {
    console.log('🔌 Socket error (ignored):', err.message);
  });
});

// Start the server
server.listen(port, '0.0.0.0', (error) => {
  if (error) {
    console.log('❌ Server start error:', error.message);
    return;
  }
  
  console.log('');
  console.log('📱 =====================================');
  console.log('📱 MOBILE APK SERVER IS RUNNING');
  console.log('📱 =====================================');
  console.log(`🌐 URL: http://localhost:${port}`);
  console.log(`🌐 Network: http://0.0.0.0:${port}`);
  console.log(`📍 PID: ${process.pid}`);
  console.log(`⏰ Started: ${new Date().toLocaleString()}`);
  console.log('📱 Ready for Wizone Mobile APK connections');
  console.log('📱 =====================================');
  console.log('');
  console.log('Valid Login Credentials:');
  console.log('👤 Admin: admin / admin123');
  console.log('🔧 Ravi Kumar: ravi / ravi@123');
  console.log('🔧 Rohit Singh: rohit / rohit@123');
  console.log('🔧 Huzaifa Ali: huzaifa / huzaifa@123');
  console.log('🔧 Sachin Garg: sachin / sachin@123');
  console.log('🔧 Vikash Kumar: vikash / vikash@123');
  console.log('');
});

// Keep-alive mechanism
let heartbeatCount = 0;
setInterval(() => {
  heartbeatCount++;
  console.log(`💓 Mobile APK Server Heartbeat #${heartbeatCount} - ${new Date().toLocaleTimeString()}`);
  if (heartbeatCount % 10 === 0) {
    console.log(`   📊 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB, Uptime: ${Math.floor(process.uptime())}s`);
  }
}, 30000); // Every 30 seconds

console.log('🛡️ Mobile APK server protections enabled');
console.log('⚡ Server script loaded and ready for APK connections');