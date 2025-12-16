const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: '103.122.85.61',
  port: 9095,
  database: 'WIZONEIT_SUPPORT',
  user: 'postgres',
  password: 'ss123456',
  ssl: false
});

async function configureTelegramBot() {
  const client = await pool.connect();
  
  try {
    console.log('🤖 Configuring Telegram Bot...\n');
    
    // Telegram bot details from user
    const telegramBotToken = '8567692067:AAFihyoUTSkCVfZUai46wh1-TNn_PLcVpYU';
    const telegramChatId = '7014001486';
    
    // Check if a telegram configuration already exists
    const existingConfig = await client.query(
      `SELECT * FROM bot_configurations WHERE bot_type = 'telegram' AND config_name = 'Wizone IT Support Bot'`
    );
    
    if (existingConfig.rows.length > 0) {
      console.log('📝 Updating existing Telegram bot configuration...');
      
      // Update existing configuration
      await client.query(`
        UPDATE bot_configurations SET
          telegram_bot_token = $1,
          telegram_chat_id = $2,
          is_active = true,
          notify_on_task_create = true,
          notify_on_task_update = true,
          notify_on_task_complete = true,
          notify_on_task_assign = true,
          notify_on_task_status_change = true,
          notify_on_high_priority = true,
          updated_at = NOW()
        WHERE bot_type = 'telegram' AND config_name = 'Wizone IT Support Bot'
      `, [telegramBotToken, telegramChatId]);
      
      console.log('✅ Telegram bot configuration updated!');
    } else {
      console.log('➕ Creating new Telegram bot configuration...');
      
      // Insert new configuration with all notification templates
      await client.query(`
        INSERT INTO bot_configurations (
          config_name,
          bot_type,
          is_active,
          telegram_bot_token,
          telegram_chat_id,
          telegram_parse_mode,
          notify_on_task_create,
          notify_on_task_update,
          notify_on_task_complete,
          notify_on_task_assign,
          notify_on_task_status_change,
          notify_on_high_priority,
          task_create_template,
          task_update_template,
          task_complete_template,
          task_assign_template,
          status_change_template,
          max_notifications_per_hour,
          retry_count,
          retry_delay,
          test_message,
          created_at,
          updated_at
        ) VALUES (
          'Wizone IT Support Bot',
          'telegram',
          true,
          $1,
          $2,
          'HTML',
          true,
          true,
          true,
          true,
          true,
          true,
          '🆕 <b>New Task Created - Wizone IT Support</b>

📋 <b>Task ID:</b> {taskNumber}
👤 <b>Customer:</b> {customerName}
📧 <b>Email:</b> {customerEmail}
📱 <b>Contact:</b> {customerPhone}
⚡ <b>Priority:</b> {priority}
📝 <b>Description:</b> {description}
👷 <b>Assigned to:</b> {assignedTo}
🏢 <b>Department:</b> {department}
📅 <b>Created:</b> {createdAt}

🔗 <a href="{taskUrl}">View Task</a>',
          '📝 <b>Task Updated - Wizone IT Support</b>

📋 <b>Task ID:</b> {taskNumber}
👤 <b>Customer:</b> {customerName}
🔄 <b>Status:</b> {status}
💬 <b>Latest Notes:</b> {notes}
👷 <b>Updated by:</b> {updatedBy}
📅 <b>Updated:</b> {updatedAt}

🔗 <a href="{taskUrl}">View Task</a>',
          '✅ <b>Task Completed - Wizone IT Support</b>

📋 <b>Task ID:</b> {taskNumber}
👤 <b>Customer:</b> {customerName}
⏱️ <b>Duration:</b> {duration}
✅ <b>Completed by:</b> {completedBy}
📝 <b>Resolution:</b> {resolution}
📅 <b>Completed:</b> {completedAt}

🎉 Task successfully resolved!',
          '👷 <b>Task Assigned - Wizone IT Support</b>

📋 <b>Task ID:</b> {taskNumber}
👤 <b>Customer:</b> {customerName}
⚡ <b>Priority:</b> {priority}
👷 <b>Assigned to:</b> {assignedTo}
🏢 <b>Department:</b> {department}
📅 <b>Assigned:</b> {assignedAt}

📝 <b>Description:</b> {description}
🔗 <a href="{taskUrl}">View Task</a>',
          '🔄 <b>Status Changed - Wizone IT Support</b>

📋 <b>Task ID:</b> {taskNumber}
👤 <b>Customer:</b> {customerName}
📊 <b>Status:</b> {oldStatus} → {newStatus}
👷 <b>Updated by:</b> {updatedBy}
📅 <b>Changed:</b> {changedAt}
💬 <b>Notes:</b> {notes}

🔗 <a href="{taskUrl}">View Task</a>',
          100,
          3,
          5,
          '🔔 Test notification from Wizone IT Support Bot!',
          NOW(),
          NOW()
        )
      `, [telegramBotToken, telegramChatId]);
      
      console.log('✅ Telegram bot configuration created!');
    }
    
    // Verify the configuration
    const verifyConfig = await client.query(
      `SELECT id, config_name, bot_type, is_active, telegram_chat_id, 
              notify_on_task_create, notify_on_task_update, notify_on_task_complete,
              notify_on_task_assign, notify_on_task_status_change, notify_on_high_priority
       FROM bot_configurations WHERE bot_type = 'telegram'`
    );
    
    console.log('\n📋 Current Telegram Bot Configuration:');
    console.log('=====================================');
    verifyConfig.rows.forEach(config => {
      console.log(`ID: ${config.id}`);
      console.log(`Name: ${config.config_name}`);
      console.log(`Type: ${config.bot_type}`);
      console.log(`Active: ${config.is_active ? '✅ Yes' : '❌ No'}`);
      console.log(`Chat ID: ${config.telegram_chat_id}`);
      console.log(`\nNotification Settings:`);
      console.log(`  • Task Create: ${config.notify_on_task_create ? '✅' : '❌'}`);
      console.log(`  • Task Update: ${config.notify_on_task_update ? '✅' : '❌'}`);
      console.log(`  • Task Complete: ${config.notify_on_task_complete ? '✅' : '❌'}`);
      console.log(`  • Task Assign: ${config.notify_on_task_assign ? '✅' : '❌'}`);
      console.log(`  • Status Change: ${config.notify_on_task_status_change ? '✅' : '❌'}`);
      console.log(`  • High Priority: ${config.notify_on_high_priority ? '✅' : '❌'}`);
    });
    
    // Test sending a message to verify the bot works
    console.log('\n📤 Sending test notification to Telegram...');
    
    const https = require('https');
    const testMessage = `🔔 <b>Wizone IT Support Bot Configured!</b>

✅ Your Telegram notifications are now active.

<b>Enabled Notifications:</b>
• 🆕 Task Created
• 📝 Task Updated
• ✅ Task Completed
• 👷 Task Assigned
• 🔄 Status Changed
• ⚡ High Priority Alerts

📅 Configured: ${new Date().toLocaleString()}`;

    const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
    const postData = JSON.stringify({
      chat_id: telegramChatId,
      text: testMessage,
      parse_mode: 'HTML'
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const result = JSON.parse(data);
          if (result.ok) {
            console.log('✅ Test message sent successfully!');
            console.log(`📱 Message ID: ${result.result.message_id}`);
          } else {
            console.log('❌ Failed to send test message:', result.description);
          }
          client.release();
          pool.end();
          resolve();
        });
      });
      
      req.on('error', (e) => {
        console.log('❌ Error sending message:', e.message);
        client.release();
        pool.end();
        resolve();
      });
      
      req.write(postData);
      req.end();
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    client.release();
    pool.end();
  }
}

configureTelegramBot();
