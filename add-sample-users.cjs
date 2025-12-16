const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { users } = require('./shared/schema.ts');
const { eq } = require('drizzle-orm');
const crypto = require('crypto');
const { scrypt } = require('crypto');
const { promisify } = require('util');

const scryptAsync = promisify(scrypt);

const connectionString = process.env.DATABASE_URL || 'postgresql://wizone_user:wizone_secure_2024@localhost:5432/wizone_db';
const sql = postgres(connectionString);
const db = drizzle(sql);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scryptAsync(password, salt, 64);
  return `${hash.toString('hex')}.${salt}`;
}

async function addSampleUsers() {
  try {
    console.log('🔄 Adding sample users to database...');

    const sampleUsers = [
      {
        username: 'manager1',
        email: 'manager1@wizoneit.com',
        firstName: 'John',
        lastName: 'Manager',
        role: 'manager',
        password: 'manager123'
      },
      {
        username: 'engineer1',
        email: 'engineer1@wizoneit.com',
        firstName: 'Alice',
        lastName: 'Engineer',
        role: 'engineer',
        password: 'engineer123'
      },
      {
        username: 'field1',
        email: 'field1@wizoneit.com',
        firstName: 'Bob',
        lastName: 'Field',
        role: 'field_engineer',
        password: 'field123'
      },
      {
        username: 'field2',
        email: 'field2@wizoneit.com',
        firstName: 'Charlie',
        lastName: 'Field',
        role: 'field_engineer',
        password: 'field123'
      },
      {
        username: 'backend1',
        email: 'backend1@wizoneit.com',
        firstName: 'David',
        lastName: 'Backend',
        role: 'backend_engineer',
        password: 'backend123'
      },
      {
        username: 'support1',
        email: 'support1@wizoneit.com',
        firstName: 'Eva',
        lastName: 'Support',
        role: 'support',
        password: 'support123'
      }
    ];

    for (const user of sampleUsers) {
      // Check if user already exists
      const existing = await db.select().from(users).where(eq(users.username, user.username));
      
      if (existing.length === 0) {
        const passwordHash = await hashPassword(user.password);
        
        await db.insert(users).values({
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          passwordHash: passwordHash,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        console.log(`✅ Added user: ${user.username} (${user.role})`);
      } else {
        console.log(`⚠️  User ${user.username} already exists`);
      }
    }

    // Check total users now
    const allUsers = await db.select().from(users);
    console.log(`\n📊 Total users in database: ${allUsers.length}`);
    console.log('Users:');
    allUsers.forEach(user => {
      console.log(`   - ${user.username} (${user.role}) - ${user.firstName} ${user.lastName}`);
    });

    await sql.end();
    console.log('\n🎉 Sample users added successfully!');
  } catch (error) {
    console.error('❌ Error adding sample users:', error.message);
    process.exit(1);
  }
}

addSampleUsers();