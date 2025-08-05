#!/usr/bin/env node

const SERVER_URL = 'http://194.238.19.19:5000';

async function testHealthEndpoint() {
    console.log('🔍 Testing health endpoint...');
    try {
        const response = await fetch(`${SERVER_URL}/api/health`);
        const data = await response.json();
        
        if (response.ok) {
            console.log(`✅ Health endpoint success: ${JSON.stringify(data, null, 2)}`);
            return true;
        } else {
            console.log(`❌ Health endpoint failed: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Health endpoint error: ${error.message}`);
        return false;
    }
}

async function testAuthentication() {
    console.log('🔍 Testing authentication...');
    try {
        const response = await fetch(`${SERVER_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
            })
        });

        if (response.ok) {
            const userData = await response.json();
            console.log(`✅ Authentication success: ${userData.username} (${userData.role})`);
            return true;
        } else {
            const errorData = await response.text();
            console.log(`❌ Authentication failed: ${response.status} - ${errorData}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Authentication error: ${error.message}`);
        return false;
    }
}

async function testMainPage() {
    console.log('🔍 Testing main page...');
    try {
        const response = await fetch(SERVER_URL);
        if (response.ok) {
            console.log('✅ Main page accessible');
            return true;
        } else {
            console.log(`❌ Main page failed: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Main page error: ${error.message}`);
        return false;
    }
}

async function runFullTest() {
    console.log('🚀 Mobile APK Connection Test');
    console.log(`🎯 Testing production server: ${SERVER_URL}`);
    console.log('='.repeat(50));
    
    let allPassed = true;
    
    // Test 1: Health
    const health = await testHealthEndpoint();
    allPassed = allPassed && health;
    
    console.log('-'.repeat(30));
    
    // Test 2: Authentication
    const auth = await testAuthentication();
    allPassed = allPassed && auth;
    
    console.log('-'.repeat(30));
    
    // Test 3: Main page
    const main = await testMainPage();
    allPassed = allPassed && main;
    
    console.log('='.repeat(50));
    console.log(`🎯 Full connection test ${allPassed ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (allPassed) {
        console.log('');
        console.log('📱 MOBILE APK STATUS:');
        console.log('✅ Production server is fully working');
        console.log('✅ Health endpoint responds correctly');
        console.log('✅ Authentication working (admin/admin123)');
        console.log('✅ Main page accessible');
        console.log('');
        console.log('🎉 Your mobile APK should connect successfully!');
    } else {
        console.log('');
        console.log('❌ ISSUES FOUND:');
        console.log('- Check network connectivity to 194.238.19.19:5000');
        console.log('- Verify server is running properly');
    }
    
    return allPassed;
}

runFullTest().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
});