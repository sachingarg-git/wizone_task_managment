// Script to clear only ISP-related data from the database
// This will NOT delete: users, tasks, customers, or any other non-ISP data

import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || 'postgresql://appuser:jksdj%24%26%5E%26*YUG*%5E%25%26THJHIO4546GHG%26j@72.61.170.243:9095/WIZONEIT_SUPPORT';

const client = postgres(connectionString, {
  ssl: false,
  connect_timeout: 30,
});

async function clearIspData() {
  console.log('🗑️  Clearing ISP-related data only...\n');

  try {
    // Clear client_assignments first (has foreign keys)
    const assignmentResult = await client`DELETE FROM client_assignments RETURNING id`;
    console.log(`✅ Deleted ${assignmentResult.length} records from client_assignments`);

    // Clear maintenance_schedule
    const maintenanceResult = await client`DELETE FROM maintenance_schedule RETURNING id`;
    console.log(`✅ Deleted ${maintenanceResult.length} records from maintenance_schedule`);

    // Clear network_devices (has foreign key to network_towers)
    const devicesResult = await client`DELETE FROM network_devices RETURNING id`;
    console.log(`✅ Deleted ${devicesResult.length} records from network_devices`);

    // Clear network_segments
    const segmentsResult = await client`DELETE FROM network_segments RETURNING id`;
    console.log(`✅ Deleted ${segmentsResult.length} records from network_segments`);

    // Clear isp_clients
    const clientsResult = await client`DELETE FROM isp_clients RETURNING id`;
    console.log(`✅ Deleted ${clientsResult.length} records from isp_clients`);

    // Note: network_towers might be shared with other modules - only clearing ISP-specific tower (ID 19)
    const towersResult = await client`DELETE FROM network_towers WHERE id = 19 RETURNING id`;
    console.log(`✅ Deleted ${towersResult.length} ISP-specific tower(s) from network_towers`);

    console.log('\n✨ ISP data cleared successfully!');
    console.log('📋 Preserved: users, tasks, customers, and all other data');

  } catch (error) {
    console.error('❌ Error clearing ISP data:', error);
    throw error;
  } finally {
    await client.end();
  }
}

clearIspData();
