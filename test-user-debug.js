// Debug script to check user existence and password verification
import { storage } from './server/storage/mssql-storage.js';

async function debugUser(username) {
    console.log(`\n=== DEBUGGING USER: ${username} ===`);
    
    try {
        // Check if user exists
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
            console.log(`❌ User '${username}' NOT FOUND in database`);
            return;
        }
        
        console.log(`✅ User '${username}' found in database`);
        console.log('User details:');
        console.log('- ID:', user.id);
        console.log('- Username:', user.username);
        console.log('- Password hash:', user.password ? user.password.substring(0, 50) + '...' : 'NO PASSWORD');
        console.log('- Role:', user.role);
        console.log('- Active:', user.isActive);
        console.log('- Created:', user.createdAt);
        
        // Test password verification
        if (user.password) {
            const testPassword = 'admin123';
            console.log(`\n🔐 Testing password verification for '${testPassword}':`);
            
            try {
                const verifyResult = await storage.verifyUserPassword(username, testPassword);
                if (verifyResult) {
                    console.log('✅ Password verification: SUCCESS');
                } else {
                    console.log('❌ Password verification: FAILED');
                }
            } catch (error) {
                console.log('❌ Password verification error:', error.message);
            }
        }
        
    } catch (error) {
        console.log(`❌ Error checking user '${username}':`, error.message);
    }
}

// Test both users
debugUser('ashu').then(() => {
    return debugUser('radha');
}).then(() => {
    console.log('\n=== DEBUG COMPLETE ===');
    process.exit(0);
}).catch(error => {
    console.error('Debug error:', error);
    process.exit(1);
});