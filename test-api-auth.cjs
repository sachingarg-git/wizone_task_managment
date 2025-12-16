// Test script to verify API authentication with PostgreSQL
const fetch = require('node-fetch');
const API_BASE_URL = 'http://192.168.11.9:3001/api';

async function testLogin() {
    console.log('🔐 Testing API authentication...');
    console.log('📡 API URL:', `${API_BASE_URL}/auth/login`);
    
    // Test with known working credentials
    const testCredentials = [
        { username: 'admin', password: 'admin123' },
        { username: 'sachin', password: 'admin123' },
        { username: 'vikash', password: 'admin123' }
    ];
    
    for (const creds of testCredentials) {
        try {
            console.log(`\n🔍 Testing: ${creds.username} / ${creds.password}`);
            
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Mobile-App': 'WizoneTaskManager',
                    'X-Requested-With': 'mobile'
                },
                credentials: 'omit',
                body: JSON.stringify(creds)
            });
            
            console.log(`📊 Response status: ${response.status}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Login successful!');
                console.log('👤 User data:', JSON.stringify(data, null, 2));
                break; // Success, stop testing
            } else {
                const errorText = await response.text();
                console.log('❌ Login failed:', errorText);
            }
        } catch (error) {
            console.error('❌ Request failed:', error.message);
        }
    }
}

testLogin();