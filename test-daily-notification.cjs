/**
 * Test Daily Summary Notification
 * 
 * This script manually triggers the daily summary notification for testing purposes.
 * Run this script to test the Telegram notification without waiting for 8 PM.
 * 
 * Usage: node test-daily-notification.cjs
 */

const { Pool } = require('pg');

const DATABASE_URL = "postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT";

async function testDailySummaryNotification() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    console.log('\n🔔 ========== TESTING DAILY SUMMARY NOTIFICATION ==========');
    console.log(`⏰ Time: ${new Date().toISOString()}`);
    
    // Get today's boundaries for IST
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    
    const startOfDay = new Date(istNow);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(istNow);
    endOfDay.setHours(23, 59, 59, 999);
    
    const startUTC = new Date(startOfDay.getTime() - istOffset);
    const endUTC = new Date(endOfDay.getTime() - istOffset);
    
    console.log(`📅 Checking reports for: ${startUTC.toISOString()} to ${endUTC.toISOString()}`);
    
    // Get all field engineers
    const engineersResult = await pool.query(`
      SELECT id, first_name, last_name, username 
      FROM users 
      WHERE role IN ('field_engineer', 'engineer')
    `);
    const allFieldEngineers = engineersResult.rows;
    console.log(`👷 Total field engineers: ${allFieldEngineers.length}`);
    
    // Get today's daily reports
    const reportsResult = await pool.query(`
      SELECT engineer_id, engineer_name 
      FROM daily_reports 
      WHERE report_date >= $1 AND report_date <= $2
    `, [startUTC, endUTC]);
    const todaysReports = reportsResult.rows;
    console.log(`📝 Reports submitted today: ${todaysReports.length}`);
    
    // Get engineers who submitted reports
    const submittedEngineerIds = new Set(todaysReports.map(r => r.engineer_id));
    
    const engineersSubmitted = allFieldEngineers
      .filter(e => submittedEngineerIds.has(e.id))
      .map(e => `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.username || 'Unknown');
    
    const engineersNotSubmitted = allFieldEngineers
      .filter(e => !submittedEngineerIds.has(e.id))
      .map(e => `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.username || 'Unknown');
    
    // Get pending and in-progress task counts
    const pendingResult = await pool.query(`
      SELECT COUNT(*) FROM tasks WHERE status = 'pending'
    `);
    const inProgressResult = await pool.query(`
      SELECT COUNT(*) FROM tasks WHERE status IN ('in_progress', 'in-progress')
    `);
    
    const totalPendingTasks = parseInt(pendingResult.rows[0].count);
    const totalInProgressTasks = parseInt(inProgressResult.rows[0].count);
    
    console.log('\n📊 SUMMARY DATA:');
    console.log(`   Total Field Engineers: ${allFieldEngineers.length}`);
    console.log(`   Reports Submitted: ${engineersSubmitted.length}`);
    console.log(`   Reports Not Submitted: ${engineersNotSubmitted.length}`);
    console.log(`   Pending Tasks: ${totalPendingTasks}`);
    console.log(`   In Progress Tasks: ${totalInProgressTasks}`);
    
    if (engineersSubmitted.length > 0) {
      console.log('\n✅ Engineers who submitted report:');
      engineersSubmitted.forEach(name => console.log(`   • ${name}`));
    }
    
    if (engineersNotSubmitted.length > 0) {
      console.log('\n❌ Engineers who did NOT submit report:');
      engineersNotSubmitted.forEach(name => console.log(`   • ${name}`));
    }
    
    // Get bot configuration
    const botConfigResult = await pool.query(`
      SELECT * FROM bot_configurations 
      WHERE is_active = true AND bot_type = 'telegram'
      LIMIT 1
    `);
    
    if (botConfigResult.rows.length === 0) {
      console.log('\n⚠️ No active Telegram bot configuration found');
      return;
    }
    
    const config = botConfigResult.rows[0];
    console.log(`\n✅ Found Telegram config: ${config.config_name}`);
    
    // Format message
    const dateStr = istNow.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const escapeMarkdown = (text) => {
      if (!text) return text;
      return text.toString().replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
    };
    
    let message = `📊 *DAILY REPORT SUMMARY*\n`;
    message += `📅 ${escapeMarkdown(dateStr)}\n`;
    message += `⏰ 8:00 PM IST\n\n`;
    
    message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `👷 *ENGINEER DAILY REPORT STATUS*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    message += `📊 *Total Field Engineers:* ${allFieldEngineers.length}\n`;
    message += `✅ *Reports Submitted:* ${engineersSubmitted.length}\n`;
    message += `❌ *Reports Not Submitted:* ${engineersNotSubmitted.length}\n\n`;
    
    if (engineersSubmitted.length > 0) {
      message += `✅ *Submitted Report:*\n`;
      engineersSubmitted.forEach(name => {
        message += `   • ${escapeMarkdown(name)}\n`;
      });
      message += `\n`;
    }
    
    if (engineersNotSubmitted.length > 0) {
      message += `❌ *Not Submitted Report:*\n`;
      engineersNotSubmitted.forEach(name => {
        message += `   • ${escapeMarkdown(name)}\n`;
      });
      message += `\n`;
    }
    
    message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📋 *TASK STATUS OVERVIEW*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    message += `⏳ *Pending Tasks:* ${totalPendingTasks}\n`;
    message += `🔄 *In Progress Tasks:* ${totalInProgressTasks}\n\n`;
    
    message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🤖 *Wizone IT Support System*\n`;
    
    console.log('\n📤 Sending notification to Telegram...');
    
    // Send to Telegram
    const response = await fetch(`https://api.telegram.org/bot${config.telegram_bot_token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.telegram_chat_id,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
    
    const result = await response.json();
    
    if (result.ok) {
      console.log('✅ Daily summary notification sent successfully!');
    } else {
      console.error('❌ Failed to send notification:', result);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testDailySummaryNotification();
