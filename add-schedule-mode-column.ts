import postgres from "postgres";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function addScheduleModeColumn() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not found in environment variables");
    process.exit(1);
  }

  const sql = postgres(process.env.DATABASE_URL, {
    ssl: false,
    max: 1,
  });

  try {
    console.log("🔧 Adding schedule_mode column to maintenance_schedule table...");
    
    // Add the schedule_mode column if it doesn't exist
    await sql`
      ALTER TABLE maintenance_schedule 
      ADD COLUMN IF NOT EXISTS schedule_mode VARCHAR DEFAULT 'one-time'
    `;
    
    console.log("✅ Successfully added schedule_mode column");
    
    // Verify the column was added
    const result = await sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'maintenance_schedule'
      AND column_name = 'schedule_mode'
    `;
    
    if (result.length > 0) {
      console.log("✅ Column verified:", result[0]);
    } else {
      console.log("⚠️ Column not found after adding");
    }
    
  } catch (error) {
    console.error("❌ Error adding column:", error);
    process.exit(1);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

addScheduleModeColumn();
