import postgres from 'postgres';

// Database connection
const DATABASE_URL = "postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT";

console.log("🔗 Testing PostgreSQL connection...");
console.log("URL:", DATABASE_URL);

const sql = postgres(DATABASE_URL, {
  ssl: 'require',
  max: 1,
  connect_timeout: 10000,
  idle_timeout: 10000,
});

async function testConnection() {
  try {
    console.log("🔌 Attempting to connect...");
    const result = await sql`SELECT 1 as test, version() as version`;
    console.log("✅ Connection successful!");
    console.log("Result:", result[0]);
    
    console.log("🔍 Checking for existing tables...");
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log("📋 Found tables:", tables.map(t => t.table_name));
    
  } catch (error) {
    console.error("❌ Connection failed:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      errno: error.errno,
      syscall: error.syscall
    });
  } finally {
    await sql.end();
    process.exit(0);
  }
}

testConnection();