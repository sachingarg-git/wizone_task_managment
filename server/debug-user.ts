// Debug script to check and create user 'radha'
import { storage } from './storage/mssql-storage';

async function debugAndCreateUser() {
    console.log('\n🔍 DEBUGGING USER: radha');
    
    try {
        // Check if user exists
        const existingUser = await storage.getUserByUsername('radha');
        
        if (existingUser) {
            console.log('✅ User "radha" exists in database:');
            console.log('- ID:', existingUser.id);
            console.log('- Username:', existingUser.username);
            console.log('- Role:', existingUser.role);
            console.log('- Active:', existingUser.isActive);
            console.log('- Password hash exists:', existingUser.password ? 'YES' : 'NO');
            console.log('- Created:', existingUser.createdAt);
            
            // Test password verification
            console.log('\n🔐 Testing password "admin123":');
            const verifyResult = await storage.verifyUserPassword('radha', 'admin123');
            if (verifyResult) {
                console.log('✅ Password verification: SUCCESS');
                console.log('✅ User can login - the issue might be elsewhere');
            } else {
                console.log('❌ Password verification: FAILED');
                console.log('🔧 Will reset password...');
                
                // Delete and recreate user with correct password
                await storage.deleteUser(existingUser.id);
                console.log('🗑️ Deleted existing user');
            }
        } else {
            console.log('❌ User "radha" NOT found in database');
        }
        
        // Create/recreate user if needed
        if (!existingUser || !(await storage.verifyUserPassword('radha', 'admin123'))) {
            console.log('\n📝 Creating user "radha" with password "admin123"...');
            
            const newUser = await storage.createUser({
                username: 'radha',
                password: 'admin123',
                email: 'radha@wizone.com',
                firstName: 'Radha',
                lastName: 'Sharma',
                phone: '9876543210',
                role: 'field_engineer',
                isActive: true
            });
            
            console.log('✅ User created successfully:');
            console.log('- ID:', newUser.id);
            console.log('- Username:', newUser.username);
            console.log('- Role:', newUser.role);
            
            // Immediate verification test
            console.log('\n🧪 Immediate login test:');
            const immediateTest = await storage.verifyUserPassword('radha', 'admin123');
            console.log('Immediate test result:', immediateTest ? '✅ SUCCESS' : '❌ FAILED');
        }
        
        console.log('\n✅ DEBUG COMPLETE - radha user should be ready for mobile login');
        
    } catch (error) {
        console.error('❌ Debug error:', error.message);
        console.error('Stack:', error.stack);
    }
}

debugAndCreateUser().then(() => {
    console.log('\n🎯 Testing mobile login now...');
    process.exit(0);
}).catch(err => {
    console.error('❌ Script error:', err);
    process.exit(1);
});