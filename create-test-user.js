// Create test user "radha" directly using storage
import { storage } from './server/storage/mssql-storage.js';

async function createTestUser() {
    console.log('\n🧪 CREATING TEST USER: radha');
    
    try {
        // Check if user already exists
        const existingUser = await storage.getUserByUsername('radha');
        
        if (existingUser) {
            console.log('✅ User "radha" already exists:');
            console.log('- ID:', existingUser.id);
            console.log('- Role:', existingUser.role);
            console.log('- Active:', existingUser.isActive);
            console.log('- Password exists:', existingUser.password ? 'YES' : 'NO');
            
            // Test password verification
            console.log('\n🔐 Testing password verification:');
            const verifyResult = await storage.verifyUserPassword('radha', 'admin123');
            console.log('Password verification result:', verifyResult ? 'SUCCESS' : 'FAILED');
            
            return;
        }
        
        // Create new user
        console.log('📝 Creating new user "radha"...');
        const newUser = await storage.createUser({
            username: 'radha',
            password: 'admin123',
            email: 'radha@wizone.com',
            firstName: 'Radha',
            lastName: 'Sharma',
            role: 'field_engineer',
            isActive: true
        });
        
        console.log('✅ User created successfully:');
        console.log('- ID:', newUser.id);
        console.log('- Username:', newUser.username);
        console.log('- Role:', newUser.role);
        
        // Test login immediately
        console.log('\n🔐 Testing login immediately after creation:');
        const loginResult = await storage.verifyUserPassword('radha', 'admin123');
        console.log('Login test result:', loginResult ? 'SUCCESS' : 'FAILED');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

createTestUser().then(() => {
    console.log('\n✅ Test complete');
    process.exit(0);
}).catch(err => {
    console.error('❌ Script error:', err);
    process.exit(1);
});