#!/usr/bin/env tsx

import { db } from '../server/db.js';
import { users } from '../shared/schema.js';

async function checkDatabase() {
  console.log('🔍 Testing database connection...');
  
  try {
    // Test basic query
    const userCount = await db.select().from(users).limit(1);
    console.log('✅ Database connection successful!');
    console.log(`📊 Found ${userCount.length > 0 ? 'existing' : 'no'} users in database`);
    
    if (userCount.length > 0) {
      console.log(`👤 Sample user: ${userCount[0].username || userCount[0].email}`);
    }
    
    console.log('🎉 Database is ready for local development!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error);
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Check your DATABASE_URL in .env file');
    console.log('2. Ensure PostgreSQL is running');
    console.log('3. Run: npm run db:push to create tables');
    process.exit(1);
  }
}

checkDatabase();