import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users, customers, tasks, taskUpdates, customerSystemDetails, sessions } from '../shared/schema';

// Database configuration
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT';

console.log('🔌 Initializing PostgreSQL connection...');

// Create postgres client
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create drizzle instance
export const db = drizzle(client, {
  schema: {
    users,
    customers,
    tasks,
    taskUpdates,
    customerSystemDetails,
    sessions
  }
});

// Test connection function
export async function testDatabaseConnection() {
  try {
    const result = await client`SELECT version()`;
    console.log('✅ PostgreSQL connection successful');
    console.log('📊 Database version:', result[0].version.split(' ')[0] + ' ' + result[0].version.split(' ')[1]);
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error);
    return false;
  }
}

// Initialize database connection
export async function initializeDatabase() {
  console.log('🏗️  Initializing database connection...');
  
  try {
    // Test the connection
    const isConnected = await testDatabaseConnection();
    
    if (!isConnected) {
      throw new Error('Failed to connect to PostgreSQL database');
    }
    
    // Check if tables exist by querying users table
    const userCount = await client`SELECT COUNT(*) as count FROM users`;
    console.log(`👥 Found ${userCount[0].count} users in database`);
    
    // Check customers
    const customerCount = await client`SELECT COUNT(*) as count FROM customers`;
    console.log(`🏢 Found ${customerCount[0].count} customers in database`);
    
    // Check tasks
    const taskCount = await client`SELECT COUNT(*) as count FROM tasks`;
    console.log(`📝 Found ${taskCount[0].count} tasks in database`);
    
    console.log('🎉 Database initialized successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.error('💡 Make sure the database tables are created using the setup-database.cjs script');
    return false;
  }
}

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

export default db;