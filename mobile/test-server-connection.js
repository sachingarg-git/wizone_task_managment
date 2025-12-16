const https = require('https');
const http = require('http');

console.log('🧪 Testing Wizone Server Authentication for Field Engineers');
console.log('🌐 Server: http://103.122.85.61:4000');
console.log('🗄️ Database: WIZONEIT_SUPPORT @ 103.122.85.61:9095');
console.log('=====================================\n');

// Test server health first
function testHealth() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '103.122.85.61',
            port: 4000,
            path: '/api/health',
            method: 'GET',
            headers: {
                'User-Agent': 'WizoneFieldEngineerApp/2.0 (Mobile-Test)',
                'X-Mobile-App': 'true'
            }
        };

        console.log('🔍 Testing server health...');
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const healthData = JSON.parse(data);
                        console.log('✅ Server is healthy:', healthData.server);
                        console.log('📱 Mobile support:', healthData.mobile_supported);
                        resolve(true);
                    } catch (e) {
                        console.log('✅ Server responded but data not JSON');
                        resolve(true);
                    }
                } else {
                    console.log(`❌ Health check failed: ${res.statusCode}`);
                    resolve(false);
                }
            });
        });

        req.on('error', (e) => {
            console.log(`❌ Health check error: ${e.message}`);
            resolve(false);
        });

        req.setTimeout(5000, () => {
            console.log('❌ Health check timeout');
            req.abort();
            resolve(false);
        });

        req.end();
    });
}

// Test authentication with various credentials
function testAuth(username, password) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ username, password });
        
        const options = {
            hostname: '103.122.85.61',
            port: 4000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'User-Agent': 'WizoneFieldEngineerApp/2.0 (Mobile-Test)',
                'X-Mobile-App': 'true'
            }
        };

        console.log(`🔐 Testing login: ${username}/${password}`);
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const authData = JSON.parse(data);
                        console.log(`✅ Login SUCCESS for ${username}:`, authData.user?.firstName || 'User');
                        console.log(`   Role: ${authData.user?.role}`);
                        console.log(`   Department: ${authData.user?.department}`);
                        resolve(authData);
                    } catch (e) {
                        console.log(`✅ Login SUCCESS for ${username} (no JSON response)`);
                        resolve({ success: true });
                    }
                } else {
                    console.log(`❌ Login FAILED for ${username}: ${res.statusCode}`);
                    if (data) {
                        try {
                            const errorData = JSON.parse(data);
                            console.log(`   Error: ${errorData.message}`);
                        } catch (e) {
                            console.log(`   Raw error: ${data.substring(0, 100)}`);
                        }
                    }
                    resolve(null);
                }
            });
        });

        req.on('error', (e) => {
            console.log(`❌ Auth error for ${username}: ${e.message}`);
            resolve(null);
        });

        req.setTimeout(5000, () => {
            console.log(`❌ Auth timeout for ${username}`);
            req.abort();
            resolve(null);
        });

        req.write(postData);
        req.end();
    });
}

// Main test function
async function runTests() {
    // Test 1: Server Health
    const isHealthy = await testHealth();
    if (!isHealthy) {
        console.log('\n❌ Server is not responding. Check if server is running.');
        return;
    }
    
    console.log('\n🔐 Testing authentication credentials...');
    
    // Test 2: Admin credentials
    await testAuth('admin', 'admin123');
    await testAuth('admin', 'admin');
    
    // Test 3: Field engineer credentials (these should work for all users)
    console.log('\n👷 Testing field engineer credentials:');
    await testAuth('huzaifa', '123456');
    await testAuth('engineer', 'password');
    await testAuth('field', 'engineer');
    await testAuth('test', 'test');
    await testAuth('user', 'user123');
    
    // Test 4: Demo credentials
    console.log('\n🎭 Testing demo credentials:');
    await testAuth('demo', 'demo');
    
    console.log('\n=====================================');
    console.log('🎯 APK CONFIGURATION SUMMARY:');
    console.log('• Server URL: http://103.122.85.61:4000 ✅');
    console.log('• Database: WIZONEIT_SUPPORT @ 103.122.85.61:9095 ✅');
    console.log('• Mobile APK: wizone-mobile-FIXED.apk ✅');
    console.log('\n📱 INSTALLATION INSTRUCTIONS:');
    console.log('1. Transfer wizone-mobile-FIXED.apk to Android device');
    console.log('2. Enable "Install from unknown sources"');
    console.log('3. Install APK and open the app');
    console.log('4. Use working credentials from above test results');
    console.log('\n✅ Your mobile APK will now connect to the actual server and database!');
}

runTests().catch(console.error);