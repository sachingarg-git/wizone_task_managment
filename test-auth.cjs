const postgres = require('postgres');
const { scrypt, randomBytes, timingSafeEqual } = require('crypto');
const { promisify } = require('util');

const scryptAsync = promisify(scrypt);

// Your PostgreSQL database credentials
const DATABASE_URL = "postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT";

console.log("🔐 Testing user authentication...");

async function comparePasswords(supplied, stored) {
  try {
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      return false;
    }
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = await scryptAsync(supplied, salt, 64);
    
    if (hashedBuf.length !== suppliedBuf.length) {
      return false;
    }
    
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
}

async function testAuthentication() {
  try {
    const sql = postgres(DATABASE_URL, {
      ssl: 'prefer',
      max: 10,
      connect_timeout: 30,
      prepare: false,
    });

    // Get all users with their password hashes
    console.log("📊 Getting all users with password information...");
    const users = await sql`
      SELECT id, username, email, first_name, last_name, role, active, password_hash 
      FROM users 
      ORDER BY username
    `;
    
    console.log(`👤 Found ${users.length} users in database:`);
    
    for (const user of users) {
      console.log(`\n🔍 User: ${user.username} (${user.email})`);
      console.log(`   - Role: ${user.role}, Active: ${user.active}`);
      console.log(`   - Password Hash: ${user.password_hash ? 'EXISTS' : 'MISSING'}`);
      
      if (user.password_hash) {
        // Test common passwords
        const commonPasswords = ['password', '123456', 'admin', user.username, user.first_name?.toLowerCase(), 'wizone123', 'admin123', 'ravi', 'Ravi', 'ravi123', 'Ravi123', 'ravi2005'];
        
        for (const testPassword of commonPasswords) {
          try {
            const isMatch = await comparePasswords(testPassword, user.password_hash);
            if (isMatch) {
              console.log(`   ✅ PASSWORD FOUND: "${testPassword}"`);
              break;
            }
          } catch (error) {
            // Silent fail for password tests
          }
        }
      }
    }

    await sql.end();
    console.log("\n🎉 Authentication test completed!");

  } catch (error) {
    console.error("❌ Authentication test failed:", error.message);
  }
}

testAuthentication();