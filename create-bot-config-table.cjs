const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT'
});

async function createTables() {
  try {
    // Create bot_configurations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bot_configurations (
        id SERIAL PRIMARY KEY,
        config_name VARCHAR NOT NULL,
        bot_type VARCHAR NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        telegram_bot_token VARCHAR,
        telegram_chat_id VARCHAR,
        telegram_parse_mode VARCHAR DEFAULT 'HTML',
        whatsapp_api_url VARCHAR,
        whatsapp_api_key VARCHAR,
        whatsapp_phone_number VARCHAR,
        whatsapp_business_id VARCHAR,
        webhook_url VARCHAR,
        webhook_method VARCHAR DEFAULT 'POST',
        webhook_headers JSON,
        webhook_auth VARCHAR,
        notify_on_task_create BOOLEAN DEFAULT true,
        notify_on_task_update BOOLEAN DEFAULT true,
        notify_on_task_complete BOOLEAN DEFAULT true,
        notify_on_task_assign BOOLEAN DEFAULT true,
        notify_on_task_status_change BOOLEAN DEFAULT true,
        notify_on_high_priority BOOLEAN DEFAULT true,
        task_create_template TEXT,
        task_update_template TEXT,
        task_complete_template TEXT,
        task_assign_template TEXT,
        status_change_template TEXT,
        filter_by_priority TEXT[],
        filter_by_status TEXT[],
        filter_by_department TEXT[],
        filter_by_user TEXT[],
        max_notifications_per_hour INTEGER DEFAULT 100,
        retry_count INTEGER DEFAULT 3,
        retry_delay INTEGER DEFAULT 5,
        last_test_result VARCHAR,
        last_test_time TIMESTAMP,
        test_message TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ bot_configurations table created successfully');

    // Create notification_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notification_logs (
        id SERIAL PRIMARY KEY,
        config_id INTEGER REFERENCES bot_configurations(id) ON DELETE CASCADE,
        event_type VARCHAR NOT NULL,
        task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
        message_content TEXT,
        response_status VARCHAR,
        response_body TEXT,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        retry_attempt INTEGER DEFAULT 0,
        error_message TEXT
      )
    `);
    console.log('✅ notification_logs table created successfully');

    // Verify tables exist
    const result = await pool.query(`SELECT COUNT(*) FROM bot_configurations`);
    console.log('✅ Bot configurations count:', result.rows[0].count);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

createTables();
