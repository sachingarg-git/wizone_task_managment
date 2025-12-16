/**
 * Simulate Batch Script Flow - Full Test
 * This simulates the exact flow the batch script uses
 */

const http = require('http');
const postgres = require('postgres');

const SERVER = '103.122.85.61';
const PORT = 3007;
const DB_URL = 'postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT';

// Test credentials
const TEST_USERNAME = 'multani';
const TEST_PASSWORD = 'admin123';
const ENGINEER_NAME = 'Test Engineer';
const SYSTEM_USER = 'Test PC User';

function makeRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: SERVER,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 30000
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

async function testAPIFlow() {
  console.log('='.repeat(60));
  console.log('Testing API Flow (simulates batch script)');
  console.log('='.repeat(60));
  console.log(`Server: ${SERVER}:${PORT}`);
  console.log('');

  // Step 1: Test Login
  console.log('📍 STEP 1: Login to Customer Portal');
  console.log('-'.repeat(40));
  
  try {
    const loginResult = await makeRequest('/api/system-info/login', 'POST', {
      username: TEST_USERNAME,
      password: TEST_PASSWORD
    });

    console.log('Status:', loginResult.status);
    console.log('Response:', JSON.stringify(loginResult.data, null, 2));

    if (loginResult.status !== 200 || !loginResult.data.success) {
      console.log('❌ Login failed - API endpoint may not be updated');
      return false;
    }

    console.log('✅ Login successful!');
    console.log('');

    // Step 2: Collect System Info
    console.log('📍 STEP 2: Send System Information');
    console.log('-'.repeat(40));

    const collectResult = await makeRequest('/api/system-info/collect', 'POST', {
      username: TEST_USERNAME,
      password: TEST_PASSWORD,
      engineerName: ENGINEER_NAME,
      systemUserName: SYSTEM_USER,
      systemInfo: {
        systemName: 'API-TEST-PC-' + Date.now(),
        systemType: 'Desktop',
        processor: 'Intel Core i7-10700',
        processorCores: '8 Cores',
        processorSpeed: '3800 MHz',
        ram: '32 GB',
        ramType: 'DDR4',
        ramFrequency: '3200 MHz',
        ramSlots: '4',
        motherboard: 'MSI B460 TOMAHAWK',
        motherboardManufacturer: 'Micro-Star International',
        hardDisk: 'Seagate Barracuda 2TB',
        hddCapacity: '2000 GB',
        ssd: 'Samsung 970 EVO Plus 1TB',
        ssdCapacity: '1000 GB',
        graphicsCard: 'NVIDIA GeForce RTX 3060',
        graphicsMemory: '12288 MB',
        operatingSystem: 'Microsoft Windows 11 Pro',
        osVersion: '10.0.22621',
        osArchitecture: '64-bit',
        macAddress: 'AA-BB-CC-DD-EE-FF',
        ipAddress: '192.168.1.200',
        serialNumber: 'API-TEST-SN-' + Date.now(),
        biosVersion: 'E7C82IMS.A10',
        antivirus: 'Windows Defender + Malwarebytes',
        msOffice: 'Microsoft 365 Business Premium'
      }
    });

    console.log('Status:', collectResult.status);
    console.log('Response:', JSON.stringify(collectResult.data, null, 2));

    if (collectResult.status !== 200 || !collectResult.data.success) {
      console.log('❌ Data collection failed');
      return false;
    }

    console.log('✅ System info saved! Record ID:', collectResult.data.recordId);
    return collectResult.data.recordId;

  } catch (err) {
    console.log('❌ API request failed:', err.message);
    console.log('   The production server may not have the updated code.');
    return false;
  }
}

async function verifyInDatabase(recordId) {
  console.log('');
  console.log('📍 STEP 3: Verify Record in Database');
  console.log('-'.repeat(40));

  const client = postgres(DB_URL);
  
  try {
    if (recordId) {
      const record = await client`
        SELECT id, customer_name, system_name, processor, ram, created_at
        FROM customer_system_details
        WHERE id = ${recordId}
      `;
      
      if (record.length > 0) {
        console.log('✅ Record found in database:');
        console.log('   ID:', record[0].id);
        console.log('   Customer:', record[0].customer_name);
        console.log('   System:', record[0].system_name);
        console.log('   Processor:', record[0].processor);
        console.log('   RAM:', record[0].ram);
        console.log('   Created:', record[0].created_at);
      } else {
        console.log('❌ Record not found in database');
      }
    }

    // Get total count
    const count = await client`
      SELECT COUNT(*) as total FROM customer_system_details
    `;
    console.log('');
    console.log('📊 Total records in customer_system_details:', count[0].total);

    // Show recent records
    const recent = await client`
      SELECT id, customer_name, system_name, created_at
      FROM customer_system_details
      ORDER BY created_at DESC
      LIMIT 5
    `;
    console.log('');
    console.log('📋 Recent records:');
    recent.forEach(r => {
      console.log(`   [${r.id}] ${r.customer_name} - ${r.system_name} (${r.created_at})`);
    });

  } catch (err) {
    console.error('❌ Database error:', err.message);
  } finally {
    await client.end();
  }
}

async function main() {
  const recordId = await testAPIFlow();
  await verifyInDatabase(recordId);
  
  console.log('');
  console.log('='.repeat(60));
  console.log('Test completed!');
  console.log('='.repeat(60));
}

main();
