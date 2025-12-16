const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT'
});

async function updateChatId() {
  try {
    // Update chat ID to the channel
    await pool.query(
      "UPDATE bot_configurations SET telegram_chat_id = $1 WHERE config_name = $2",
      ['-1003431580267', 'Wizone IT Support Bot']
    );
    
    console.log('✅ Chat ID updated to: -1003431580267');
    console.log('📢 Channel: WIZONE PORTAL NOTIFICATION (@wizone_helpdesk)');
    
    // Verify the update
    const result = await pool.query(
      "SELECT id, config_name, telegram_chat_id FROM bot_configurations WHERE bot_type = 'telegram'"
    );
    
    console.log('\n📋 Current Configuration:');
    result.rows.forEach(row => {
      console.log(`  ID: ${row.id}`);
      console.log(`  Name: ${row.config_name}`);
      console.log(`  Chat ID: ${row.telegram_chat_id}`);
    });
    
    // Send test message to channel
    const https = require('https');
    const testMessage = `🔔 *Wizone Portal Notification Test*\n\n✅ Bot configured to send notifications to this channel.\n\n📅 Configured: ${new Date().toLocaleString()}`;
    
    const data = JSON.stringify({
      chat_id: '-1003431580267',
      text: testMessage,
      parse_mode: 'Markdown'
    });
    
    const req = https.request({
      hostname: 'api.telegram.org',
      port: 443,
      path: '/bot8567692067:AAFihyoUTSkCVfZUai46wh1-TNn_PLcVpYU/sendMessage',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        const result = JSON.parse(responseData);
        if (result.ok) {
          console.log('\n✅ Test message sent to channel successfully!');
        } else {
          console.log('\n❌ Failed to send test message:', result.description);
        }
        pool.end();
      });
    });
    
    req.write(data);
    req.end();
    
  } catch (error) {
    console.error('Error:', error.message);
    pool.end();
  }
}

updateChatId();
