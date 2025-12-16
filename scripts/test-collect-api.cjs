const https = require('http');

const data = JSON.stringify({
  username: 'ravi',
  password: 'ravi@123',
  customerName: 'Multani Pharmaceuticals Limited',
  systemUserName: 'Test User',
  systemInfo: {
    systemName: 'TEST-PC-001',
    systemType: 'Desktop',
    processor: 'Intel Core i5-10400',
    processorCores: '6',
    processorSpeed: '2900 MHz',
    ram: '16 GB',
    ramType: 'DDR4',
    ramFrequency: '3200 MHz',
    ramSlots: '2',
    motherboard: 'ASUS PRIME B460M-A',
    motherboardManufacturer: 'ASUSTeK COMPUTER INC.',
    hardDisk: 'WDC WD10EZEX-08WN4A0',
    hddCapacity: '1000 GB',
    ssd: 'Samsung SSD 870 EVO',
    ssdCapacity: '500 GB',
    graphicsCard: 'Intel UHD Graphics 630',
    graphicsMemory: '1024 MB',
    operatingSystem: 'Microsoft Windows 10 Pro',
    osVersion: '10.0.19045',
    osArchitecture: '64-bit',
    macAddress: '00:1A:2B:3C:4D:5E',
    ipAddress: '192.168.1.100',
    serialNumber: 'ABC123456789',
    biosVersion: '1.00',
    antivirus: 'Windows Defender',
    msOffice: 'Microsoft Office Installed'
  }
});

const options = {
  hostname: 'localhost',
  port: 3007,
  path: '/api/system-info/collect',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

console.log('Sending test request to localhost:3007...\n');

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('\nResponse Body:');
    try {
      console.log(JSON.stringify(JSON.parse(body), null, 2));
    } catch (e) {
      console.log(body);
    }
  });
});

req.on('error', (e) => {
  console.error(`Error: ${e.message}`);
});

req.write(data);
req.end();
