import postgres from 'postgres';

async function checkAllDatabases() {
  const baseConnection = postgres('postgresql://postgres:ss123456@103.122.85.61:9095/postgres', {
    ssl: 'prefer'
  });
  
  try {
    console.log('🔍 SEARCHING FOR YOUR 300+ CUSTOMERS IN ALL DATABASES\n');
    
    // Get all databases
    const databases = await baseConnection`
      SELECT datname 
      FROM pg_database 
      WHERE datistemplate = false
      ORDER BY datname
    `;
    
    for (const db of databases) {
      try {
        console.log(`\n📊 Checking database: ${db.datname}`);
        
        const dbConnection = postgres(`postgresql://postgres:ss123456@103.122.85.61:9095/${db.datname}`, {
          ssl: 'prefer',
          connect_timeout: 5
        });
        
        try {
          // Check if customers table exists
          const tableExists = await dbConnection`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'customers'
            ) as exists
          `;
          
          if (tableExists[0].exists) {
            const count = await dbConnection`SELECT COUNT(*) as count FROM customers`;
            const userCount = await dbConnection`
              SELECT COUNT(*) as count FROM users
            `.catch(() => [{count: 'N/A'}]);
            
            const taskCount = await dbConnection`
              SELECT COUNT(*) as count FROM tasks
            `.catch(() => [{count: 'N/A'}]);
            
            console.log(`  ✅ FOUND: ${count[0].count} customers, ${userCount[0].count} users, ${taskCount[0].count} tasks`);
            
            if (parseInt(count[0].count) > 50) {
              console.log(`  🎯 THIS MIGHT BE YOUR DATABASE WITH 300+ CUSTOMERS!`);
              
              // Get sample customer data
              const samples = await dbConnection`
                SELECT customer_id, name, created_at 
                FROM customers 
                ORDER BY created_at DESC 
                LIMIT 5
              `;
              console.log('  📋 Recent customers:');
              samples.forEach(c => console.log(`     • ${c.customer_id} - ${c.name}`));
            }
          } else {
            console.log('  ⚠️ No customers table found');
          }
        } catch (err) {
          console.log(`  ❌ Error querying: ${err.message}`);
        } finally {
          await dbConnection.end();
        }
        
      } catch (err) {
        console.log(`  ❌ Cannot connect: ${err.message}`);
      }
    }
    
    await baseConnection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await baseConnection.end();
    process.exit(1);
  }
}

checkAllDatabases();
