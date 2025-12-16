/**
 * Test Customer Portal System Info API
 * Tests the batch script login and data collection endpoints
 */

const http = require('http');

const SERVER = '103.122.85.61';
const PORT = 3007;

// Test credentials - Multani Pharmaceuticals Limited
const TEST_USERNAME = 'multani';
const TEST_PASSWORD = 'admin123';

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
      }
    };

    console.log(`\n📡 ${method} ${path}`);
    console.log('📤 Request:', JSON.stringify(data, null, 2));

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`📥 Status: ${res.statusCode}`);
        try {
          const json = JSON.parse(body);
          console.log('📥 Response:', JSON.stringify(json, null, 2));
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          console.log('📥 Response (raw):', body.substring(0, 500));
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ Request failed:', e.message);
      reject(e);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('Customer Portal System Info API Test');
  console.log(`Server: ${SERVER}:${PORT}`);
  console.log(`Test User: ${TEST_USERNAME}`);
  console.log('='.repeat(60));

  // Test 1: Customer Portal Login
  console.log('\n\n🔐 TEST 1: Customer Portal Login');
  console.log('-'.repeat(40));
  
  try {
    const loginResult = await makeRequest('/api/system-info/login', 'POST', {
      username: TEST_USERNAME,
      password: TEST_PASSWORD
    });

    if (loginResult.status === 200 && loginResult.data.success) {
      console.log('\n✅ Login test PASSED!');
      console.log(`   Customer ID: ${loginResult.data.customerId}`);
      console.log(`   Customer Name: ${loginResult.data.customerName}`);
      console.log(`   Message: ${loginResult.data.message}`);
    } else {
      console.log('\n❌ Login test FAILED!');
      console.log(`   Status: ${loginResult.status}`);
      console.log(`   Error: ${loginResult.data.message || 'Unknown error'}`);
      return; // Don't continue if login fails
    }
  } catch (err) {
    console.log('\n❌ Login test FAILED with error:', err.message);
    return;
  }

  // Test 2: System Info Collection
  console.log('\n\n📊 TEST 2: System Info Collection');
  console.log('-'.repeat(40));
  
  try {
    const collectResult = await makeRequest('/api/system-info/collect', 'POST', {
      username: TEST_USERNAME,
      password: TEST_PASSWORD,
      engineerName: 'Test Engineer',
      systemUserName: 'Test PC User',
      systemInfo: {
        systemName: 'TEST-PC-001',
        systemType: 'Desktop',
        processor: 'Intel Core i5-10400',
        processorCores: '6 Cores',
        processorSpeed: '2.90GHz',
        ram: '16 GB',
        ramType: 'DDR4',
        ramFrequency: '2666 MHz',
        ramSlots: '2 of 4',
        motherboard: 'ASUS PRIME B460-PLUS',
        motherboardManufacturer: 'ASUSTeK COMPUTER INC.',
        hardDisk: 'WD Blue 1TB',
        hddCapacity: '1 TB',
        ssd: 'Samsung 860 EVO 500GB',
        ssdCapacity: '500 GB',
        graphicsCard: 'NVIDIA GeForce GTX 1650',
        graphicsMemory: '4 GB GDDR6',
        operatingSystem: 'Microsoft Windows 10 Pro',
        osVersion: '10.0.19045',
        osArchitecture: '64-bit',
        macAddress: '00-1A-2B-3C-4D-5E',
        ipAddress: '192.168.1.100',
        serialNumber: 'TEST-SN-123456',
        biosVersion: 'American Megatrends F10',
        antivirus: 'Windows Defender',
        msOffice: 'Microsoft Office 365'
      }
    });

    if (collectResult.status === 200 && collectResult.data.success) {
      console.log('\n✅ Collection test PASSED!');
      console.log(`   Record ID: ${collectResult.data.recordId}`);
      console.log(`   Customer: ${collectResult.data.customer}`);
      console.log(`   Engineer: ${collectResult.data.engineer}`);
    } else {
      console.log('\n❌ Collection test FAILED!');
      console.log(`   Status: ${collectResult.status}`);
      console.log(`   Error: ${collectResult.data.message || 'Unknown error'}`);
    }
  } catch (err) {
    console.log('\n❌ Collection test FAILED with error:', err.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Tests completed!');
  console.log('='.repeat(60));
}

runTests().catch(console.error);
