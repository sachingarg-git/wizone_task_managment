// Test database connection with different password encodings
import postgres from 'postgres';

const configs = [
  {
    name: "URL-encoded password",
    url: "postgresql://appuser:jksdj%24%26%5E%26YUG%5E%25%26THJHIO4546GHG%26j@72.61.170.243:9095/WIZONEIT_SUPPORT"
  },
  {
    name: "Raw password",
    url: "postgresql://appuser:jksdj$&^&YUG^%&THJHIO4546GHG&j@72.61.170.243:9095/WIZONEIT_SUPPORT"
  },
  {
    name: "Connection object with raw password",
    config: {
      host: '72.61.170.243',
      port: 9095,
      database: 'WIZONEIT_SUPPORT',
      username: 'appuser',
      password: 'jksdj$&^&YUG^%&THJHIO4546GHG&j',
      ssl: false,
      connect_timeout: 10
    }
  }
];

async function testConnection(config) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${config.name}`);
  console.log(`${'='.repeat(60)}`);
  
  let sql;
  try {
    if (config.url) {
      console.log(`URL: ${config.url.replace(/:[^:@]+@/, ':****@')}`);
      sql = postgres(config.url, { 
        connect_timeout: 10,
        idle_timeout: 10,
        max: 1
      });
    } else {
      console.log(`Config: ${JSON.stringify({...config.config, password: '****'}, null, 2)}`);
      sql = postgres(config.config);
    }
    
    console.log('Attempting connection...');
    const result = await sql`SELECT current_database(), current_user, version()`;
    console.log('✅ SUCCESS!');
    console.log('Database:', result[0].current_database);
    console.log('User:', result[0].current_user);
    console.log('Version:', result[0].version.split('\n')[0]);
    
    // Test if tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    console.log(`\nFound ${tables.length} tables:`, tables.map(t => t.table_name).join(', '));
    
    await sql.end();
    return true;
  } catch (error) {
    console.log('❌ FAILED');
    console.log('Error:', error.message);
    console.log('Code:', error.code);
    if (error.routine) console.log('Routine:', error.routine);
    if (sql) await sql.end({ timeout: 1 });
    return false;
  }
}

console.log('Starting database connection tests...\n');
console.log('Target: 72.61.170.243:9095');
console.log('Database: WIZONEIT_SUPPORT');
console.log('Username: appuser');

for (const config of configs) {
  const success = await testConnection(config);
  if (success) {
    console.log('\n✅ This configuration works! Use this one.\n');
    break;
  }
}

console.log('\n' + '='.repeat(60));
console.log('If all tests failed, please verify:');
console.log('1. Database credentials are exactly correct');
console.log('2. Your IP address is whitelisted on the database server');
console.log('3. The database server is accessible from your network');
console.log('4. The PostgreSQL service is running');
console.log('='.repeat(60));
