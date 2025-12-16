import { sql } from 'drizzle-orm';
import { db } from './db.ts';

async function checkConstraint() {
  try {
    const result = await db.execute(sql`
      SELECT pg_get_constraintdef(oid) as constraint_def 
      FROM pg_constraint 
      WHERE conname = 'tasks_status_check'
    `);
    console.log('Status constraint:', result[0]?.constraint_def);
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkConstraint();