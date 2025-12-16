const postgres = require('postgres');

// Your PostgreSQL database credentials
const DATABASE_URL = "postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT";

console.log("🔗 Testing PostgreSQL connection...");
console.log("📋 Database URL:", DATABASE_URL);

async function testConnection() {
  try {
    console.log("🌐 Connecting to PostgreSQL database...");
    
    const sql = postgres(DATABASE_URL, {
      ssl: 'prefer',
      max: 10,
      connect_timeout: 30,
      prepare: false,
    });

    // Test basic connection
    console.log("📡 Testing basic connection...");
    const result = await sql`SELECT 1 as test`;
    console.log("✅ Basic connection successful:", result);

    // Check if users table exists and get structure
    console.log("📊 Checking users table...");
    try {
      const userTable = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position
      `;
      console.log("📋 Users table structure:", userTable);
    } catch (tableError) {
      console.log("⚠️ Users table structure check failed:", tableError.message);
    }

    // Try to get sample users
    console.log("👥 Getting user data...");
    try {
      const users = await sql`SELECT id, username, email, first_name, last_name, role, active FROM users LIMIT 5`;
      console.log("👤 Sample users found:", users.length);
      users.forEach(user => {
        console.log(`   - ${user.username} (${user.email}) - Role: ${user.role}, Active: ${user.active}`);
      });
    } catch (userError) {
      console.log("⚠️ User query failed:", userError.message);
      
      // Try alternative field names
      try {
        console.log("🔄 Trying alternative field names...");
        const usersAlt = await sql`SELECT * FROM users LIMIT 3`;
        console.log("📊 Users with all fields:", usersAlt);
      } catch (altError) {
        console.log("❌ Alternative query failed:", altError.message);
      }
    }

    await sql.end();
    console.log("🎉 Database connection test completed!");

  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.error("📋 Full error:", error);
  }
}

testConnection();