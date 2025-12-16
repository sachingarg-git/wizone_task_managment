const http = require('http');

const data = JSON.stringify({
  name: "Test Tower API",
  targetIP: "8.8.8.8",
  location: "Test Location Via Script",
  totalDevices: 15,
  bandwidth: "2 Gbps",
  expectedLatency: "10ms",
  description: "Test tower created via direct API call"
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/network-monitoring/towers',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`Response: ${chunk}`);
  });
  
  res.on('end', () => {
    console.log('Request completed');
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();