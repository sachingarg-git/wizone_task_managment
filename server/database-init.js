import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as schema from '../shared/schema.js';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT';

// Initialize client and db immediately
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

const db = drizzle(client, { schema });

export async function initializeDatabase() {
  try {
    console.log('🔌 Connecting to PostgreSQL database...');
    console.log('📍 Connection string:', connectionString.replace(/:[^:@]*@/, ':***@'));
    
    // Test the connection
    const result = await client`SELECT version()`;
    console.log('✅ PostgreSQL connection successful');
    console.log('📊 Database version:', result[0].version.split(' ')[0] + ' ' + result[0].version.split(' ')[1]);
    
    // Verify tables exist
    const tableCheck = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    console.log('📋 Available tables:', tableCheck.map(t => t.table_name).join(', '));
    
    // Check if we have data
    try {
      const userCount = await client`SELECT COUNT(*) as count FROM users`;
      const customerCount = await client`SELECT COUNT(*) as count FROM customers`;
      const taskCount = await client`SELECT COUNT(*) as count FROM tasks`;
      
      console.log(`👥 Users: ${userCount[0].count}`);
      console.log(`🏢 Customers: ${customerCount[0].count}`);
      console.log(`📝 Tasks: ${taskCount[0].count}`);
      
      if (userCount[0].count === '0' || customerCount[0].count === '0') {
        console.log('⚠️ Database tables are empty. Run the setup-database.cjs script to populate them.');
      } else {
        console.log('✅ Database has data and is ready to use!');
      }
    } catch (error) {
      console.log('⚠️ Could not verify table data:', error.message);
    }
    
    return db;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error);
    console.error('💡 Make sure:');
    console.error('  1. PostgreSQL server is running and accessible');
    console.error('  2. Database credentials are correct');
    console.error('  3. Database tables exist (run setup-database.cjs)');
    console.error('  4. Network connectivity to database server');
    throw error;
  }
}

export function getDatabase() {
  return db;
}

export function getClient() {
  return client;
}

// Export required objects for routes
export { db, sql, schema, client };

// Graceful shutdown
export async function closeDatabaseConnection() {
  try {
    await client.end();
    console.log('🔌 Database connection closed gracefully');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
}

// Handle process termination
process.on('SIGINT', closeDatabaseConnection);
process.on('SIGTERM', closeDatabaseConnection);