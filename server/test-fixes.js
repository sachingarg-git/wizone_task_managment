// Test script to validate the fixes
const { db } = require('./db.ts');
const { count } = require('drizzle-orm');
const { customers, taskUpdates } = require('../shared/schema.ts');

async function testFixes() {
  try {
    console.log("🧪 Testing Customer Count Fix...");
    
    // Test customer count
    const [totalCustomers] = await db
      .select({ count: count() })
      .from(customers);
    
    console.log(`✅ Total customers in database: ${totalCustomers.count}`);
    
    console.log("\n🧪 Testing Task History Fix...");
    
    // Test task updates to see if createdByName is properly stored
    const recentUpdates = await db
      .select()
      .from(taskUpdates)
      .limit(5)
      .orderBy(desc(taskUpdates.createdAt));
    
    console.log("✅ Recent task updates:");
    recentUpdates.forEach(update => {
      console.log(`  - Task ${update.taskId}: "${update.message}" by ${update.createdByName || 'Unknown'} (ID: ${update.createdBy})`);
    });
    
    console.log("\n🎉 All tests completed!");
    process.exit(0);
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

testFixes();