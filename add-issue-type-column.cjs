const postgres = require("postgres");
require("dotenv").config();

const client = postgres(process.env.DATABASE_URL, { ssl: false });

async function addIssueTypeColumn() {
  try {
    console.log("🔧 Adding issue_type column to tasks table...");
    
    // Check if column already exists
    const checkColumn = await client`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name = 'issue_type'
    `;
    
    if (checkColumn.length > 0) {
      console.log("✅ issue_type column already exists");
    } else {
      // Add the column
      await client`ALTER TABLE tasks ADD COLUMN issue_type VARCHAR(100)`;
      console.log("✅ Added issue_type column to tasks table");
    }
    
    // Copy category values to issue_type where issue_type is null
    const updateResult = await client`
      UPDATE tasks 
      SET issue_type = category 
      WHERE issue_type IS NULL AND category IS NOT NULL
    `;
    console.log(`✅ Updated ${updateResult.count || 0} tasks with issue_type from category`);
    
    // Show sample of tasks with their issue types
    const sample = await client`
      SELECT id, ticket_number, title, category, issue_type 
      FROM tasks 
      LIMIT 10
    `;
    console.log("\n📋 Sample tasks:");
    sample.forEach(t => {
      console.log(`  - ${t.ticket_number}: category="${t.category}", issue_type="${t.issue_type}"`);
    });
    
    // Count distinct issue types
    const issueTypes = await client`
      SELECT DISTINCT issue_type, COUNT(*) as count 
      FROM tasks 
      WHERE issue_type IS NOT NULL 
      GROUP BY issue_type 
      ORDER BY count DESC
    `;
    console.log("\n📊 Issue Type Distribution:");
    issueTypes.forEach(t => {
      console.log(`  - ${t.issue_type}: ${t.count} tasks`);
    });
    
    console.log("\n✅ Migration complete!");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.end();
  }
}

addIssueTypeColumn();
