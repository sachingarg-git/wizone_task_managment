/**
 * ISP Management Tables Migration Script
 * Run this script to create the ISP/Network Management tables in your database
 * 
 * Usage: node create-isp-tables.js
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createTables() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting ISP Management tables migration...\n');

    // Create ISP Clients table
    console.log('📋 Creating isp_clients table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS isp_clients (
        id SERIAL PRIMARY KEY,
        client_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        plan VARCHAR(100),
        plan_speed VARCHAR(50),
        monthly_fee DECIMAL(10, 2),
        connection_type VARCHAR(50),
        installation_date TIMESTAMP,
        billing_cycle VARCHAR(50) DEFAULT 'monthly',
        due_date INTEGER DEFAULT 1,
        status VARCHAR(50) DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ isp_clients table created');

    // Create Network Devices table
    console.log('📋 Creating network_devices table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS network_devices (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(50) UNIQUE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        model VARCHAR(255),
        manufacturer VARCHAR(255),
        ip_address VARCHAR(50),
        mac_address VARCHAR(50),
        serial_number VARCHAR(100),
        tower_id INTEGER REFERENCES network_towers(id),
        installation_date TIMESTAMP,
        warranty_expiry TIMESTAMP,
        firmware_version VARCHAR(100),
        connected_clients INTEGER DEFAULT 0,
        max_capacity INTEGER,
        status VARCHAR(50) DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ network_devices table created');

    // Create Client Assignments table
    console.log('📋 Creating client_assignments table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS client_assignments (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES isp_clients(id) NOT NULL,
        tower_id INTEGER REFERENCES network_towers(id) NOT NULL,
        device_id INTEGER REFERENCES network_devices(id),
        port VARCHAR(50),
        ip_assigned VARCHAR(50),
        mac_address VARCHAR(50),
        bandwidth VARCHAR(50),
        vlan_id VARCHAR(50),
        assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ client_assignments table created');

    // Create Maintenance Schedule table
    console.log('📋 Creating maintenance_schedule table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS maintenance_schedule (
        id SERIAL PRIMARY KEY,
        task_id VARCHAR(50) UNIQUE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        tower_id INTEGER REFERENCES network_towers(id),
        device_id INTEGER REFERENCES network_devices(id),
        scheduled_date TIMESTAMP NOT NULL,
        scheduled_time VARCHAR(20),
        estimated_duration VARCHAR(50),
        assigned_to INTEGER REFERENCES users(id),
        assigned_to_name VARCHAR(255),
        type VARCHAR(50) DEFAULT 'preventive',
        priority VARCHAR(50) DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'scheduled',
        checklist JSONB DEFAULT '[]',
        notes TEXT,
        completed_date TIMESTAMP,
        completed_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ maintenance_schedule table created');

    // Create Network Segments table
    console.log('📋 Creating network_segments table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS network_segments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        ip_range VARCHAR(50) NOT NULL,
        gateway VARCHAR(50) NOT NULL,
        subnet_mask VARCHAR(50) DEFAULT '255.255.255.0',
        dns1 VARCHAR(50),
        dns2 VARCHAR(50),
        vlan_id INTEGER,
        description TEXT,
        total_devices INTEGER DEFAULT 0,
        active_devices INTEGER DEFAULT 0,
        utilization INTEGER DEFAULT 0,
        last_ping INTEGER,
        status VARCHAR(50) DEFAULT 'online',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ network_segments table created');

    // Create indexes
    console.log('\n📊 Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_isp_clients_status ON isp_clients(status)',
      'CREATE INDEX IF NOT EXISTS idx_isp_clients_plan ON isp_clients(plan)',
      'CREATE INDEX IF NOT EXISTS idx_network_devices_tower ON network_devices(tower_id)',
      'CREATE INDEX IF NOT EXISTS idx_network_devices_type ON network_devices(type)',
      'CREATE INDEX IF NOT EXISTS idx_network_devices_status ON network_devices(status)',
      'CREATE INDEX IF NOT EXISTS idx_client_assignments_client ON client_assignments(client_id)',
      'CREATE INDEX IF NOT EXISTS idx_client_assignments_tower ON client_assignments(tower_id)',
      'CREATE INDEX IF NOT EXISTS idx_client_assignments_status ON client_assignments(status)',
      'CREATE INDEX IF NOT EXISTS idx_maintenance_schedule_tower ON maintenance_schedule(tower_id)',
      'CREATE INDEX IF NOT EXISTS idx_maintenance_schedule_status ON maintenance_schedule(status)',
      'CREATE INDEX IF NOT EXISTS idx_maintenance_schedule_date ON maintenance_schedule(scheduled_date)',
      'CREATE INDEX IF NOT EXISTS idx_network_segments_type ON network_segments(type)',
      'CREATE INDEX IF NOT EXISTS idx_network_segments_status ON network_segments(status)',
    ];

    for (const indexQuery of indexes) {
      await client.query(indexQuery);
    }
    console.log('   ✅ All indexes created');

    // Insert sample data
    console.log('\n📦 Inserting sample data...');

    // Sample ISP Clients
    await client.query(`
      INSERT INTO isp_clients (client_id, name, email, phone, address, city, plan, plan_speed, monthly_fee, connection_type, status)
      VALUES 
        ('ISP-001', 'Rajesh Kumar', 'rajesh@email.com', '+91 98765 43210', '123 Main Street', 'Mumbai', 'Premium 100Mbps', '100', 1499.00, 'Fiber', 'active'),
        ('ISP-002', 'Priya Sharma', 'priya@email.com', '+91 98765 43211', '456 Park Avenue', 'Delhi', 'Standard 50Mbps', '50', 799.00, 'Fiber', 'active'),
        ('ISP-003', 'Amit Patel', 'amit@email.com', '+91 98765 43212', '789 Lake View', 'Bangalore', 'Basic 25Mbps', '25', 499.00, 'Wireless', 'active'),
        ('ISP-004', 'Sunita Verma', 'sunita@email.com', '+91 98765 43213', '321 Business Park', 'Hyderabad', 'Business 200Mbps', '200', 2999.00, 'Fiber', 'active'),
        ('ISP-005', 'Vikram Singh', 'vikram@email.com', '+91 98765 43214', '654 Tech Hub', 'Pune', 'Premium 100Mbps', '100', 1499.00, 'Fiber', 'suspended')
      ON CONFLICT (client_id) DO NOTHING;
    `);
    console.log('   ✅ ISP clients sample data inserted');

    // Sample Network Devices
    await client.query(`
      INSERT INTO network_devices (device_id, name, type, model, ip_address, mac_address, status)
      VALUES 
        ('DEV-001', 'Core-Router-01', 'Router', 'Cisco 4451-X', '192.168.1.1', 'AA:BB:CC:DD:EE:01', 'active'),
        ('DEV-002', 'Distribution-Switch-01', 'Switch', 'HP ProCurve 5412', '192.168.1.2', 'AA:BB:CC:DD:EE:02', 'active'),
        ('DEV-003', 'OLT-Main-01', 'OLT', 'Huawei MA5800-X7', '192.168.2.1', 'AA:BB:CC:DD:EE:03', 'active'),
        ('DEV-004', 'Wireless-AP-01', 'Access Point', 'Ubiquiti UAP-AC-HD', '192.168.4.1', 'AA:BB:CC:DD:EE:04', 'active'),
        ('DEV-005', 'Firewall-01', 'Firewall', 'Fortinet FortiGate 100F', '192.168.1.254', 'AA:BB:CC:DD:EE:05', 'active'),
        ('DEV-006', 'Server-Backup-01', 'Server', 'Dell PowerEdge R740', '192.168.3.10', 'AA:BB:CC:DD:EE:06', 'maintenance')
      ON CONFLICT (device_id) DO NOTHING;
    `);
    console.log('   ✅ Network devices sample data inserted');

    // Sample Network Segments
    await client.query(`
      INSERT INTO network_segments (name, type, ip_range, gateway, subnet_mask, dns1, dns2, total_devices, active_devices, utilization, last_ping, status)
      VALUES 
        ('Primary WAN', 'WAN', '203.0.113.0/24', '203.0.113.1', '255.255.255.0', '8.8.8.8', '8.8.4.4', 15, 14, 65, 12, 'online'),
        ('Secondary WAN', 'WAN', '198.51.100.0/24', '198.51.100.1', '255.255.255.0', '1.1.1.1', '1.0.0.1', 8, 8, 35, 18, 'online'),
        ('Office LAN', 'LAN', '192.168.1.0/24', '192.168.1.1', '255.255.255.0', '192.168.1.1', '8.8.8.8', 120, 98, 45, 2, 'online'),
        ('Guest VLAN', 'VLAN', '192.168.100.0/24', '192.168.100.1', '255.255.255.0', '8.8.8.8', '8.8.4.4', 50, 15, 20, 3, 'online'),
        ('Server VLAN', 'VLAN', '10.0.1.0/24', '10.0.1.1', '255.255.255.0', '10.0.1.10', '8.8.8.8', 25, 24, 82, 5, 'degraded'),
        ('Site-to-Site VPN', 'VPN', '172.16.0.0/16', '172.16.0.1', '255.255.0.0', '172.16.0.10', '172.16.0.11', 200, 156, 40, 45, 'online')
      ON CONFLICT DO NOTHING;
    `);
    console.log('   ✅ Network segments sample data inserted');

    // Sample Maintenance Schedule
    await client.query(`
      INSERT INTO maintenance_schedule (task_id, title, description, scheduled_date, scheduled_time, type, priority, status, checklist)
      VALUES 
        ('MAINT-001', 'Quarterly Router Inspection', 'Routine quarterly inspection of core router and network equipment', CURRENT_DATE + INTERVAL '7 days', '09:00', 'preventive', 'medium', 'scheduled', '[{"item": "Visual inspection of equipment", "completed": false}, {"item": "Check cable connections", "completed": false}, {"item": "Test power supply", "completed": false}]'),
        ('MAINT-002', 'Fiber Cable Repair', 'Repair damaged fiber cable reported by monitoring system', CURRENT_DATE + INTERVAL '2 days', '10:30', 'corrective', 'high', 'in_progress', '[{"item": "Locate damage point", "completed": true}, {"item": "Prepare splice equipment", "completed": true}, {"item": "Perform fiber splice", "completed": false}]'),
        ('MAINT-003', 'Emergency Power Backup Check', 'Emergency inspection after power fluctuation incident', CURRENT_DATE - INTERVAL '5 days', '14:00', 'emergency', 'critical', 'completed', '[{"item": "Check UPS status", "completed": true}, {"item": "Test generator", "completed": true}, {"item": "Verify power logs", "completed": true}]'),
        ('MAINT-004', 'Wireless AP Optimization', 'Optimize wireless access points for better coverage', CURRENT_DATE + INTERVAL '14 days', '11:00', 'inspection', 'low', 'scheduled', '[{"item": "Survey current coverage", "completed": false}, {"item": "Analyze interference", "completed": false}, {"item": "Adjust AP positions", "completed": false}]')
      ON CONFLICT (task_id) DO NOTHING;
    `);
    console.log('   ✅ Maintenance schedule sample data inserted');

    // Verify tables
    console.log('\n📊 Verifying tables...');
    const result = await client.query(`
      SELECT 'isp_clients' AS table_name, COUNT(*) AS row_count FROM isp_clients
      UNION ALL
      SELECT 'network_devices', COUNT(*) FROM network_devices
      UNION ALL
      SELECT 'client_assignments', COUNT(*) FROM client_assignments
      UNION ALL
      SELECT 'maintenance_schedule', COUNT(*) FROM maintenance_schedule
      UNION ALL
      SELECT 'network_segments', COUNT(*) FROM network_segments;
    `);

    console.log('\n📈 Table Summary:');
    console.log('   ┌─────────────────────────┬───────────┐');
    console.log('   │ Table Name              │ Row Count │');
    console.log('   ├─────────────────────────┼───────────┤');
    result.rows.forEach(row => {
      console.log(`   │ ${row.table_name.padEnd(23)} │ ${String(row.row_count).padStart(9)} │`);
    });
    console.log('   └─────────────────────────┴───────────┘');

    console.log('\n✅ ISP Management tables migration completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
createTables().catch(console.error);
