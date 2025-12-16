import postgres from 'postgres';

const sql = postgres({
  host: "103.122.85.61",
  port: 9095,
  database: "WIZONEIT_SUPPORT",
  username: "WIZONEIT_SUPPORT",
  password: "SaCu3QaC+7sD",
  ssl: false,
});

async function checkConstraints() {
  try {
    console.log("🔍 Checking users table constraints...");
    
    // Query all check constraints on the users table
    const constraints = await sql`
      SELECT 
        con.conname as constraint_name,
        pg_get_constraintdef(con.oid) as constraint_definition
      FROM pg_constraint con
      INNER JOIN pg_class rel ON rel.oid = con.conrelid
      INNER JOIN pg_namespace nsp ON nsp.oid = connamespace
      WHERE nsp.nspname = 'public'
        AND rel.relname = 'users'
        AND con.contype = 'c'
    `;
    
    console.log("✅ Constraints found:", constraints);
    
    // Also check the table structure
    const columns = await sql`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    
    console.log("📋 Table structure:", columns);
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await sql.end();
  }
}

checkConstraints();