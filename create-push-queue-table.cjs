const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS push_notification_queue (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        body TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        task_id INTEGER,
        ticket_number VARCHAR(50),
        data JSONB,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        is_shown BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✅ push_notification_queue table created!');
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_push_notification_queue_user_id ON push_notification_queue(user_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_push_notification_queue_is_shown ON push_notification_queue(is_shown);
    `);
    console.log('✅ Indexes created!');
    
  } catch (error) {
    console.error('Error creating table:', error.message);
  } finally {
    await pool.end();
  }
}

createTable();
