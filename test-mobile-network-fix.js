// Test mobile network connectivity fix
const testMobileNetworkFix = async () => {
  console.log('🔧 Testing mobile network connectivity fix...');
  
  try {
    // Test health endpoint
    console.log('\n🏥 Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:5000/api/health', {
      headers: {
        'User-Agent': 'WizoneFieldEngineerApp/1.0 (Mobile)',
        'X-Requested-With': 'mobile'
      }
    });
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health endpoint working:', healthData.status);
      console.log('  📱 Mobile supported:', healthData.mobile_supported);
      console.log('  🔍 Request source:', healthData.request_source);
    }
    
    // Test mobile health endpoint
    console.log('\n📱 Testing mobile-specific health endpoint...');
    const mobileHealthResponse = await fetch('http://localhost:5000/api/mobile/health', {
      headers: {
        'User-Agent': 'WizoneFieldEngineerApp/1.0 (Mobile)',
        'X-Requested-With': 'mobile'
      }
    });
    
    if (mobileHealthResponse.ok) {
      const mobileHealthData = await mobileHealthResponse.json();
      console.log('✅ Mobile health endpoint working:', mobileHealthData.status);
      console.log('  💾 Database:', mobileHealthData.database);
      console.log('  🔐 Authentication:', mobileHealthData.authentication);
      console.log('  🌐 CORS:', mobileHealthData.cors);
    }
    
    // Test mobile login
    console.log('\n🔐 Testing mobile login...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WizoneFieldEngineerApp/1.0 (Mobile)',
        'X-Requested-With': 'mobile'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    if (loginResponse.ok) {
      const userData = await loginResponse.json();
      console.log('✅ Mobile login successful:', userData.username);
      console.log('  🎭 Role:', userData.role);
      console.log('  🆔 ID:', userData.id);
      
      // Get session cookie for further requests
      const sessionCookie = loginResponse.headers.get('set-cookie')?.split(';')[0] || '';
      console.log('  🍪 Session cookie received:', sessionCookie ? 'Yes' : 'No');
      
      // Test field engineers endpoint with mobile session
      console.log('\n👨‍💻 Testing field engineers API with mobile session...');
      const engineersResponse = await fetch('http://localhost:5000/api/field-engineers', {
        headers: {
          'User-Agent': 'WizoneFieldEngineerApp/1.0 (Mobile)',
          'X-Requested-With': 'mobile',
          'Cookie': sessionCookie
        }
      });
      
      if (engineersResponse.ok) {
        const engineers = await engineersResponse.json();
        console.log(`✅ Field engineers API working: ${engineers.length} engineers found`);
        if (engineers.length > 0) {
          console.log(`  📝 Sample engineer: ${engineers[0].firstName} ${engineers[0].lastName} (${engineers[0].username})`);
        }
      } else {
        console.log(`❌ Field engineers API failed: ${engineersResponse.status}`);
      }
      
    } else {
      const error = await loginResponse.text();
      console.log(`❌ Mobile login failed: ${loginResponse.status} - ${error}`);
    }
    
    console.log('\n🎉 Mobile network connectivity test complete!');
    console.log('\n📋 Next steps for APK:');
    console.log('1. Update mobile/src/utils/mobile-network.ts with your actual server IP');
    console.log('2. Replace "YOUR_ACTUAL_SERVER_IP" with your computer\'s IP address');
    console.log('3. Rebuild APK: cd mobile && npx cap sync android && npx cap build android');
    console.log('4. Install APK on real device and test login');
    
  } catch (error) {
    console.error('❌ Mobile network test error:', error.message);
  }
};

testMobileNetworkFix();