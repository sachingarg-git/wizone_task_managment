const http = require('http');

// Make a request to the local API to see actual task data
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/tasks',
  method: 'GET',
  headers: {
    'Cookie': 'connect.sid=test' // This won't work, we need a different approach
  }
};

// Let's directly check the database instead
const postgres = require("postgres");

// Use the same connection string as check-db-columns.cjs
const client = postgres('postgresql://appuser:jksdj%24%26%5E%26*YUG*%5E%25%26THJHIO4546GHG%26j@72.61.170.243:9095/WIZONEIT_SUPPORT', { ssl: false });

async function checkTasks() {
  try {
    // Get the columns in the tasks table
    console.log("\n📋 Checking tasks table columns...");
    const columns = await client`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tasks'
      ORDER BY ordinal_position
    `;
    console.log("Columns in tasks table:");
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    // Get sample tasks to see what values are in category
    console.log("\n📋 Sample tasks with category values:");
    const tasks = await client`
      SELECT id, ticket_number, title, category
      FROM tasks 
      ORDER BY id DESC
      LIMIT 20
    `;
    tasks.forEach(t => {
      console.log(`  - ${t.ticket_number}: category="${t.category}"`);
    });
    
    // Get distinct category values
    console.log("\n📋 Distinct category values in database:");
    const categories = await client`
      SELECT DISTINCT category, COUNT(*) as count 
      FROM tasks 
      WHERE category IS NOT NULL 
      GROUP BY category 
      ORDER BY count DESC
    `;
    categories.forEach(c => {
      console.log(`  - "${c.category}": ${c.count} tasks`);
    });
    
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

checkTasks();
