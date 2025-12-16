const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { users } = require('./shared/schema.ts');

const connectionString = process.env.DATABASE_URL || 'postgresql://wizone_user:wizone_secure_2024@localhost:5432/wizone_db';
const sql = postgres(connectionString);
const db = drizzle(sql);

async function checkUsers() {
  try {
    const allUsers = await db.select().from(users);
    console.log('Total users in database:', allUsers.length);
    console.log('Users:');
    allUsers.forEach(user => {
      console.log(`- ID: ${user.id}, Username: ${user.username}, Role: ${user.role}, Active: ${user.active}`);
    });
    await sql.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUsers();