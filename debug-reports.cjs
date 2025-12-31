const postgres = require("postgres");

// Use the same connection string as check-db-columns.cjs
const client = postgres('postgresql://appuser:jksdj%24%26%5E%26*YUG*%5E%25%26THJHIO4546GHG%26j@72.61.170.243:9095/WIZONEIT_SUPPORT', { ssl: false });

async function checkTasksAndCustomers() {
  try {
    // Count total tasks
    const taskCount = await client`SELECT COUNT(*) as count FROM tasks`;
    console.log("📋 Total tasks in database:", taskCount[0].count);
    
    // Count total customers
    const customerCount = await client`SELECT COUNT(*) as count FROM customers`;
    console.log("👥 Total customers in database:", customerCount[0].count);
    
    // Check task-customer relationships
    const tasksWithCustomers = await client`
      SELECT COUNT(*) as count FROM tasks WHERE customer_id IS NOT NULL
    `;
    console.log("🔗 Tasks with customer_id:", tasksWithCustomers[0].count);
    
    // Get sample task with customer info
    console.log("\n📋 Sample tasks with customer info:");
    const sampleTasks = await client`
      SELECT t.id, t.ticket_number, t.customer_id, t.customer_name, t.category,
             c.id as cust_table_id, c.name as cust_table_name
      FROM tasks t
      LEFT JOIN customers c ON t.customer_id = c.id
      ORDER BY t.id DESC
      LIMIT 10
    `;
    sampleTasks.forEach(t => {
      console.log(`  Task ${t.ticket_number}: customer_id=${t.customer_id}, customer_name="${t.customer_name}", category="${t.category}"`);
      console.log(`    → Customer table: id=${t.cust_table_id}, name="${t.cust_table_name}"`);
    });
    
    // Check if customer_ids in tasks actually exist in customers table
    const orphanedTasks = await client`
      SELECT COUNT(*) as count FROM tasks t
      WHERE t.customer_id IS NOT NULL 
      AND NOT EXISTS (SELECT 1 FROM customers c WHERE c.id = t.customer_id)
    `;
    console.log("\n⚠️ Tasks with invalid customer_id:", orphanedTasks[0].count);
    
    // Count tasks by category
    console.log("\n📊 Tasks by category:");
    const byCategory = await client`
      SELECT category, COUNT(*) as count 
      FROM tasks 
      WHERE category IS NOT NULL 
      GROUP BY category 
      ORDER BY count DESC
      LIMIT 15
    `;
    byCategory.forEach(c => {
      console.log(`  - "${c.category}": ${c.count}`);
    });
    
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

checkTasksAndCustomers();
