import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL || '');

async function seedIspData() {
  console.log('🌱 Seeding ISP Management data...');

  // Seed ISP Clients
  console.log('📌 Seeding ISP Clients...');
  await sql`
    INSERT INTO isp_clients (client_id, name, email, phone, address, city, state, plan, plan_speed, monthly_fee, connection_type, installation_date, billing_cycle, due_date, status, notes)
    VALUES 
      ('ISP-001', 'Rajesh Kumar', 'rajesh.kumar@email.com', '9876543210', '123 MG Road, Sector 5', 'Bangalore', 'Karnataka', 'Premium', '100 Mbps', 1999.00, 'Fiber', '2024-01-15', 'monthly', 5, 'active', 'VIP customer with priority support'),
      ('ISP-002', 'Priya Sharma', 'priya.sharma@email.com', '9876543211', '456 Brigade Road', 'Bangalore', 'Karnataka', 'Standard', '50 Mbps', 999.00, 'Fiber', '2024-02-20', 'monthly', 10, 'active', 'Regular customer'),
      ('ISP-003', 'Tech Solutions Pvt Ltd', 'admin@techsolutions.com', '9876543212', '789 Electronic City', 'Bangalore', 'Karnataka', 'Business', '200 Mbps', 4999.00, 'Fiber', '2023-11-10', 'yearly', 1, 'active', 'Corporate account with static IP'),
      ('ISP-004', 'Mohammed Ali', 'mali@email.com', '9876543213', '321 Koramangala', 'Bangalore', 'Karnataka', 'Basic', '25 Mbps', 499.00, 'Wireless', '2024-03-05', 'monthly', 15, 'active', 'Wireless connection'),
      ('ISP-005', 'Anita Desai', 'anita.d@email.com', '9876543214', '654 HSR Layout', 'Bangalore', 'Karnataka', 'Standard', '50 Mbps', 999.00, 'Fiber', '2024-01-25', 'quarterly', 1, 'suspended', 'Payment pending'),
      ('ISP-006', 'CloudNet Services', 'support@cloudnet.in', '9876543215', '987 Whitefield', 'Bangalore', 'Karnataka', 'Enterprise', '500 Mbps', 9999.00, 'Fiber', '2023-06-15', 'yearly', 1, 'active', 'Data center connection'),
      ('ISP-007', 'Suresh Reddy', 'suresh.r@email.com', '9876543216', '111 Marathahalli', 'Bangalore', 'Karnataka', 'Premium', '100 Mbps', 1999.00, 'Cable', '2024-04-01', 'monthly', 20, 'active', 'Upgraded from basic plan'),
      ('ISP-008', 'Digital Academy', 'info@digitalacademy.edu', '9876543217', '222 Jayanagar', 'Bangalore', 'Karnataka', 'Business', '200 Mbps', 3999.00, 'Fiber', '2023-09-10', 'yearly', 1, 'active', 'Educational institution')
    ON CONFLICT (client_id) DO NOTHING
  `;
  console.log('✅ ISP Clients seeded');

  // Seed Network Devices
  console.log('📌 Seeding Network Devices...');
  await sql`
    INSERT INTO network_devices (device_id, name, type, model, manufacturer, ip_address, mac_address, serial_number, installation_date, warranty_expiry, firmware_version, connected_clients, max_capacity, status, notes)
    VALUES 
      ('DEV-001', 'Core Router 1', 'Router', 'RB4011', 'MikroTik', '192.168.1.1', 'AA:BB:CC:DD:EE:01', 'SN-RT-001', '2023-01-15', '2026-01-15', 'v7.11.2', 45, 100, 'active', 'Main core router'),
      ('DEV-002', 'Core Router 2', 'Router', 'CCR1036', 'MikroTik', '192.168.1.2', 'AA:BB:CC:DD:EE:02', 'SN-RT-002', '2023-01-15', '2026-01-15', 'v7.11.2', 38, 100, 'active', 'Backup core router'),
      ('DEV-003', 'Main Switch', 'Switch', 'CRS328-24P', 'MikroTik', '192.168.1.10', 'AA:BB:CC:DD:EE:03', 'SN-SW-001', '2023-02-20', '2026-02-20', 'v7.10', 24, 24, 'active', '24 Port PoE Switch'),
      ('DEV-004', 'Distribution Switch', 'Switch', 'CRS326-24G', 'MikroTik', '192.168.1.11', 'AA:BB:CC:DD:EE:04', 'SN-SW-002', '2023-02-20', '2026-02-20', 'v7.10', 18, 24, 'active', 'Distribution layer switch'),
      ('DEV-005', 'OLT Unit 1', 'OLT', 'MA5608T', 'Huawei', '192.168.1.20', 'AA:BB:CC:DD:EE:05', 'SN-OLT-001', '2023-03-10', '2026-03-10', 'V800R020', 128, 256, 'active', 'GPON OLT'),
      ('DEV-006', 'Wireless AP 1', 'Access Point', 'UniFi AP AC Pro', 'Ubiquiti', '192.168.1.100', 'AA:BB:CC:DD:EE:06', 'SN-AP-001', '2023-06-15', '2026-06-15', 'v6.5.28', 15, 50, 'active', 'Office WiFi'),
      ('DEV-007', 'Firewall', 'Firewall', 'FortiGate 60F', 'Fortinet', '192.168.1.254', 'AA:BB:CC:DD:EE:07', 'SN-FW-001', '2023-01-10', '2026-01-10', 'v7.4.1', 0, 0, 'active', 'Edge firewall'),
      ('DEV-008', 'NMS Server', 'Server', 'PowerEdge R640', 'Dell', '192.168.1.50', 'AA:BB:CC:DD:EE:08', 'SN-SRV-001', '2023-01-05', '2026-01-05', 'Ubuntu 22.04', 0, 0, 'active', 'Network monitoring server'),
      ('DEV-009', 'Backup Router', 'Router', 'RB3011', 'MikroTik', '192.168.2.1', 'AA:BB:CC:DD:EE:09', 'SN-RT-003', '2024-01-10', '2027-01-10', 'v7.11.2', 0, 50, 'maintenance', 'Standby router under maintenance'),
      ('DEV-010', 'ONT Terminal 1', 'ONT', 'HG8245H', 'Huawei', '192.168.100.1', 'AA:BB:CC:DD:EE:10', 'SN-ONT-001', '2024-02-15', '2027-02-15', 'V5R020', 1, 1, 'active', 'Customer premises equipment')
    ON CONFLICT (device_id) DO NOTHING
  `;
  console.log('✅ Network Devices seeded');

  // Seed Network Segments
  console.log('📌 Seeding Network Segments...');
  await sql`
    INSERT INTO network_segments (name, type, ip_range, gateway, subnet_mask, dns1, dns2, vlan_id, description, total_devices, active_devices, utilization, last_ping, status)
    VALUES 
      ('WAN Primary', 'WAN', '203.0.113.0/24', '203.0.113.1', '255.255.255.0', '8.8.8.8', '8.8.4.4', 1, 'Primary internet uplink', 2, 2, 45, 12, 'active'),
      ('WAN Secondary', 'WAN', '198.51.100.0/24', '198.51.100.1', '255.255.255.0', '1.1.1.1', '1.0.0.1', 2, 'Backup internet uplink', 2, 1, 15, 18, 'active'),
      ('Core LAN', 'LAN', '192.168.1.0/24', '192.168.1.1', '255.255.255.0', '192.168.1.1', '8.8.8.8', 10, 'Core network infrastructure', 10, 9, 65, 8, 'active'),
      ('Customer VLAN 100', 'VLAN', '10.100.0.0/22', '10.100.0.1', '255.255.252.0', '192.168.1.1', '8.8.8.8', 100, 'Residential customers segment 1', 150, 142, 72, 15, 'active'),
      ('Customer VLAN 200', 'VLAN', '10.200.0.0/22', '10.200.0.1', '255.255.252.0', '192.168.1.1', '8.8.8.8', 200, 'Residential customers segment 2', 120, 115, 58, 11, 'active'),
      ('Business VLAN', 'VLAN', '10.50.0.0/24', '10.50.0.1', '255.255.255.0', '192.168.1.1', '1.1.1.1', 50, 'Business customers with SLA', 25, 24, 35, 5, 'active'),
      ('Management VPN', 'VPN', '172.16.0.0/24', '172.16.0.1', '255.255.255.0', '192.168.1.1', '8.8.8.8', 999, 'Remote management VPN tunnel', 5, 3, 10, 22, 'active'),
      ('Guest Network', 'VLAN', '192.168.200.0/24', '192.168.200.1', '255.255.255.0', '8.8.8.8', '8.8.4.4', 999, 'Guest WiFi network', 20, 8, 25, 45, 'active')
    ON CONFLICT DO NOTHING
  `;
  console.log('✅ Network Segments seeded');

  // Seed Maintenance Schedule
  console.log('📌 Seeding Maintenance Schedule...');
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  await sql`
    INSERT INTO maintenance_schedule (task_id, title, description, scheduled_date, scheduled_time, estimated_duration, assigned_to_name, type, priority, status, checklist, notes)
    VALUES 
      ('MAINT-001', 'Core Router Firmware Update', 'Update MikroTik RouterOS to latest stable version', ${tomorrow.toISOString()}, '02:00', '2 hours', 'Network Admin', 'preventive', 'high', 'scheduled', '[{"item": "Backup configuration", "completed": false}, {"item": "Download firmware", "completed": false}, {"item": "Test on backup router", "completed": false}, {"item": "Update core router", "completed": false}, {"item": "Verify connectivity", "completed": false}]', 'Schedule during low traffic hours'),
      ('MAINT-002', 'OLT Health Check', 'Monthly inspection of OLT unit and fiber connections', ${nextWeek.toISOString()}, '10:00', '4 hours', 'Field Engineer', 'inspection', 'medium', 'scheduled', '[{"item": "Check power levels", "completed": false}, {"item": "Inspect fiber connections", "completed": false}, {"item": "Clean ports", "completed": false}, {"item": "Document readings", "completed": false}]', 'Monthly routine check'),
      ('MAINT-003', 'Switch Port Cleanup', 'Disable unused ports and update VLAN assignments', ${nextWeek.toISOString()}, '14:00', '3 hours', 'Network Admin', 'preventive', 'low', 'scheduled', '[{"item": "Audit port usage", "completed": false}, {"item": "Disable unused ports", "completed": false}, {"item": "Update documentation", "completed": false}]', 'Security audit follow-up'),
      ('MAINT-004', 'Firewall Rule Review', 'Review and optimize firewall rules', ${lastWeek.toISOString()}, '09:00', '6 hours', 'Security Admin', 'preventive', 'high', 'completed', '[{"item": "Export current rules", "completed": true}, {"item": "Identify redundant rules", "completed": true}, {"item": "Test optimized ruleset", "completed": true}, {"item": "Deploy changes", "completed": true}]', 'Completed successfully'),
      ('MAINT-005', 'Emergency UPS Repair', 'Replace failed UPS battery in server room', ${today.toISOString()}, '11:00', '1 hour', 'Facilities Team', 'emergency', 'critical', 'in_progress', '[{"item": "Shutdown non-critical systems", "completed": true}, {"item": "Replace battery", "completed": false}, {"item": "Test failover", "completed": false}]', 'UPS showing battery failure warning'),
      ('MAINT-006', 'Wireless AP Coverage Survey', 'Survey and optimize WiFi coverage in office area', ${nextWeek.toISOString()}, '09:00', '5 hours', 'Wireless Engineer', 'inspection', 'medium', 'scheduled', '[{"item": "Conduct site survey", "completed": false}, {"item": "Analyze coverage gaps", "completed": false}, {"item": "Recommend improvements", "completed": false}]', 'Complaints about WiFi dead zones')
    ON CONFLICT (task_id) DO NOTHING
  `;
  console.log('✅ Maintenance Schedule seeded');

  // Seed Client Assignments (link clients to devices)
  console.log('📌 Seeding Client Assignments...');
  
  // First create a tower if none exists
  let towerId: number;
  const existingTowers = await sql`SELECT id FROM network_towers LIMIT 1`;
  
  if (existingTowers.length === 0) {
    console.log('📌 Creating a sample tower first...');
    const newTower = await sql`
      INSERT INTO network_towers (name, target_ip, location, ssid, total_devices, address, latitude, longitude, bandwidth, expected_latency, actual_latency, description, status)
      VALUES ('Main Tower', '192.168.1.1', 'Bangalore Central', 'WIZONE-MAIN', 50, '123 Tech Park, Electronic City', 12.9716, 77.5946, '1 Gbps', '10ms', '8ms', 'Main distribution tower for residential area', 'online')
      RETURNING id
    `;
    towerId = newTower[0].id;
    console.log('✅ Created sample tower with ID:', towerId);
  } else {
    towerId = existingTowers[0].id;
    console.log('✅ Using existing tower ID:', towerId);
  }
  
  // Now get client and device IDs
  const clients = await sql`SELECT id FROM isp_clients ORDER BY id LIMIT 5`;
  const devices = await sql`SELECT id FROM network_devices WHERE type IN ('OLT', 'Switch') ORDER BY id LIMIT 2`;
  
  if (clients.length > 0 && devices.length > 0) {
    // Check if assignments already exist
    const existingAssignments = await sql`SELECT COUNT(*) as count FROM client_assignments`;
    if (parseInt(existingAssignments[0].count) === 0) {
      await sql`
        INSERT INTO client_assignments (client_id, tower_id, device_id, port, ip_assigned, mac_address, bandwidth, vlan_id, assigned_date, status, notes)
        VALUES 
          (${clients[0]?.id}, ${towerId}, ${devices[0]?.id}, 'PON 1/1', '10.100.0.10', 'CC:DD:EE:FF:00:01', '100 Mbps', '100', '2024-01-15', 'active', 'Premium customer - dedicated PON port'),
          (${clients[1]?.id}, ${towerId}, ${devices[0]?.id}, 'PON 1/2', '10.100.0.11', 'CC:DD:EE:FF:00:02', '50 Mbps', '100', '2024-02-20', 'active', 'Standard plan customer'),
          (${clients[2]?.id}, ${towerId}, ${devices[1]?.id}, 'Eth 1', '10.50.0.10', 'CC:DD:EE:FF:00:03', '200 Mbps', '50', '2023-11-10', 'active', 'Business customer - static IP'),
          (${clients[3]?.id}, ${towerId}, ${devices[0]?.id}, 'Wireless', '10.100.0.50', 'CC:DD:EE:FF:00:04', '25 Mbps', '100', '2024-03-05', 'active', 'Wireless connection via AP'),
          (${clients[4]?.id}, ${towerId}, ${devices[0]?.id}, 'PON 1/5', '10.100.0.15', 'CC:DD:EE:FF:00:05', '50 Mbps', '100', '2024-01-25', 'disconnected', 'Payment pending - disconnected')
        ON CONFLICT DO NOTHING
      `;
      console.log('✅ Client Assignments seeded');
    } else {
      console.log('✅ Client Assignments already exist, skipping');
    }
  } else {
    console.log('⚠️ Skipped Client Assignments - no clients or devices found');
  }

  console.log('🎉 ISP Management data seeding complete!');
  await sql.end();
}

seedIspData().catch(err => {
  console.error('Error seeding ISP data:', err);
  process.exit(1);
});
