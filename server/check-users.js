import { storage } from './storage.ts';

async function checkUsers() {
    try {
        console.log('🔍 Checking users in database...');
        const users = await storage.getAllUsers();
        
        console.log('\n📋 Users in database:');
        users.forEach(user => {
            console.log(`  • ${user.username} (${user.role}) - Active: ${user.isActive}`);
            console.log(`    Name: ${user.firstName} ${user.lastName}`);
            console.log(`    Email: ${user.email}`);
            console.log(`    Has Password: ${user.passwordHash ? '✅' : '❌'}`);
            console.log('');
        });
        
        console.log(`\n📊 Total users: ${users.length}`);
        
        // Test login for huzaifa specifically
        if (users.find(u => u.username === 'huzaifa')) {
            console.log('\n🔐 Testing huzaifa password verification...');
            try {
                const result = await storage.verifyUserPassword('huzaifa', '123456');
                console.log(`   Result: ${result ? '✅ SUCCESS' : '❌ FAILED'}`);
            } catch (e) {
                console.log(`   Error: ${e.message}`);
            }
        }
        
    } catch (error) {
        console.log('❌ Error:', error.message);
        console.log('\n💡 This might be because:');
        console.log('  • Database connection is not available');
        console.log('  • Users table is empty');
        console.log('  • Database credentials are incorrect');
    }
    
    process.exit(0);
}

checkUsers();