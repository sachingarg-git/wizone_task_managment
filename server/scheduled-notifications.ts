import { storage } from "./storage";
import { db, sql, schema } from "./database-init.js";
import { eq, and, gte, lte, or } from "drizzle-orm";

// Daily report summary notification scheduler
// Runs at 8 PM IST every day

interface DailySummaryData {
  totalFieldEngineers: number;
  reportSubmittedCount: number;
  reportNotSubmittedCount: number;
  engineersSubmitted: { name: string }[];
  engineersNotSubmitted: { name: string }[];
  totalPendingTasks: number;
  totalInProgressTasks: number;
}

// Get today's date boundaries for IST (Indian Standard Time - UTC+5:30)
function getTodayBoundariesIST(): { startOfDay: Date; endOfDay: Date } {
  const now = new Date();
  
  // Convert to IST
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const istNow = new Date(now.getTime() + istOffset);
  
  // Get start of today in IST
  const startOfDay = new Date(istNow);
  startOfDay.setHours(0, 0, 0, 0);
  
  // Get end of today in IST  
  const endOfDay = new Date(istNow);
  endOfDay.setHours(23, 59, 59, 999);
  
  // Convert back to UTC for database queries
  const startUTC = new Date(startOfDay.getTime() - istOffset);
  const endUTC = new Date(endOfDay.getTime() - istOffset);
  
  return { startOfDay: startUTC, endOfDay: endUTC };
}

// Get daily summary data
async function getDailySummaryData(): Promise<DailySummaryData> {
  const { startOfDay, endOfDay } = getTodayBoundariesIST();
  
  console.log(`📊 Fetching daily summary for: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);
  
  // Get all field engineers (role = 'field_engineer' or 'engineer')
  const allFieldEngineers = await db.select({
    id: schema.users.id,
    firstName: schema.users.firstName,
    lastName: schema.users.lastName,
    username: schema.users.username,
  })
  .from(schema.users)
  .where(
    or(
      eq(schema.users.role, 'field_engineer'),
      eq(schema.users.role, 'engineer')
    )
  );
  
  console.log(`👷 Total field engineers: ${allFieldEngineers.length}`);
  
  // Get today's daily reports
  const todaysReports = await db.select({
    engineerId: schema.dailyReports.engineerId,
    engineerName: schema.dailyReports.engineerName,
  })
  .from(schema.dailyReports)
  .where(
    and(
      gte(schema.dailyReports.reportDate, startOfDay),
      lte(schema.dailyReports.reportDate, endOfDay)
    )
  );
  
  console.log(`📝 Reports submitted today: ${todaysReports.length}`);
  
  // Get engineers who submitted reports
  const submittedEngineerIds = new Set(todaysReports.map(r => r.engineerId));
  
  const engineersSubmitted = allFieldEngineers
    .filter(e => submittedEngineerIds.has(e.id))
    .map(e => ({ name: `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.username || 'Unknown' }));
  
  const engineersNotSubmitted = allFieldEngineers
    .filter(e => !submittedEngineerIds.has(e.id))
    .map(e => ({ name: `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.username || 'Unknown' }));
  
  // Get pending and in-progress task counts
  const pendingTasksResult = await db.select()
    .from(schema.tasks)
    .where(eq(schema.tasks.status, 'pending'));
  
  const inProgressTasksResult = await db.select()
    .from(schema.tasks)
    .where(
      or(
        eq(schema.tasks.status, 'in_progress'),
        eq(schema.tasks.status, 'in-progress')
      )
    );
  
  return {
    totalFieldEngineers: allFieldEngineers.length,
    reportSubmittedCount: engineersSubmitted.length,
    reportNotSubmittedCount: engineersNotSubmitted.length,
    engineersSubmitted,
    engineersNotSubmitted,
    totalPendingTasks: pendingTasksResult.length,
    totalInProgressTasks: inProgressTasksResult.length,
  };
}

// Format the daily summary message for Telegram
function formatDailySummaryMessage(data: DailySummaryData): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  const dateStr = istNow.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Escape special characters for Markdown
  const escapeMarkdown = (text: string) => {
    if (!text) return text;
    return text.toString().replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
  };
  
  let message = `📊 *DAILY REPORT SUMMARY*\n`;
  message += `📅 ${escapeMarkdown(dateStr)}\n`;
  message += `⏰ 8:00 PM IST\n\n`;
  
  message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `👷 *ENGINEER DAILY REPORT STATUS*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  message += `📊 *Total Field Engineers:* ${data.totalFieldEngineers}\n`;
  message += `✅ *Reports Submitted:* ${data.reportSubmittedCount}\n`;
  message += `❌ *Reports Not Submitted:* ${data.reportNotSubmittedCount}\n\n`;
  
  if (data.engineersSubmitted.length > 0) {
    message += `✅ *Submitted Report:*\n`;
    data.engineersSubmitted.forEach(eng => {
      message += `   • ${escapeMarkdown(eng.name)}\n`;
    });
    message += `\n`;
  }
  
  if (data.engineersNotSubmitted.length > 0) {
    message += `❌ *Not Submitted Report:*\n`;
    data.engineersNotSubmitted.forEach(eng => {
      message += `   • ${escapeMarkdown(eng.name)}\n`;
    });
    message += `\n`;
  }
  
  message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📋 *TASK STATUS OVERVIEW*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  message += `⏳ *Pending Tasks:* ${data.totalPendingTasks}\n`;
  message += `🔄 *In Progress Tasks:* ${data.totalInProgressTasks}\n\n`;
  
  message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🤖 *Wizone IT Support System*\n`;
  
  return message;
}

// Send the daily summary notification via Telegram
async function sendDailySummaryNotification(): Promise<boolean> {
  try {
    console.log(`\n🔔 ========== DAILY SUMMARY NOTIFICATION ==========`);
    console.log(`⏰ Time: ${new Date().toISOString()}`);
    
    // Get bot configurations
    let botConfigs: any[] = [];
    try {
      botConfigs = await storage.getAllBotConfigurations();
    } catch (error) {
      console.log(`⚠️ Bot configurations table not found`);
      return false;
    }
    
    // Find active Telegram configuration
    const telegramConfig = botConfigs.find(
      (config: any) => config.isActive && 
                config.botType === 'telegram' && 
                config.telegramBotToken && 
                config.telegramChatId
    );
    
    if (!telegramConfig) {
      console.log(`⚠️ No active Telegram bot configuration found`);
      return false;
    }
    
    console.log(`✅ Found Telegram configuration: ${telegramConfig.configName}`);
    
    // Get the summary data
    const summaryData = await getDailySummaryData();
    console.log(`📊 Summary Data:`, JSON.stringify(summaryData, null, 2));
    
    // Format the message
    const message = formatDailySummaryMessage(summaryData);
    
    // Send to Telegram
    const response = await fetch(`https://api.telegram.org/bot${telegramConfig.telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: telegramConfig.telegramChatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
    
    const result = await response.json();
    
    if (result.ok) {
      console.log(`✅ Daily summary notification sent successfully!`);
      
      // Log the notification
      try {
        await storage.createNotificationLog({
          configId: telegramConfig.id,
          eventType: 'daily_summary',
          taskId: null,
          customerId: null,
          userId: null,
          messageText: message,
          messageTemplateUsed: 'daily_summary_template',
          status: 'sent',
          responseData: result,
          sentAt: new Date(),
        });
      } catch (logError) {
        console.log(`⚠️ Could not log notification:`, logError);
      }
      
      return true;
    } else {
      console.error(`❌ Failed to send notification:`, result);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Error sending daily summary notification:`, error);
    return false;
  }
}

// Calculate milliseconds until 8 PM IST
function getMillisecondsUntil8PMIST(): number {
  const now = new Date();
  
  // IST is UTC+5:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  
  // Target time: 8 PM IST (20:00)
  const target8PM = new Date(istNow);
  target8PM.setHours(20, 0, 0, 0);
  
  // If 8 PM has passed today, schedule for tomorrow
  if (istNow >= target8PM) {
    target8PM.setDate(target8PM.getDate() + 1);
  }
  
  // Calculate difference in milliseconds
  const msUntil8PM = target8PM.getTime() - istNow.getTime();
  
  return msUntil8PM;
}

// Format time for logging
function formatTimeUntil(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  return `${hours}h ${minutes}m ${seconds}s`;
}

// Schedule the daily notification
function scheduleNextNotification() {
  const msUntil8PM = getMillisecondsUntil8PMIST();
  
  console.log(`⏰ Next daily summary scheduled in: ${formatTimeUntil(msUntil8PM)}`);
  
  setTimeout(async () => {
    console.log(`\n🔔 Triggering scheduled daily summary notification...`);
    
    await sendDailySummaryNotification();
    
    // Schedule the next day's notification (24 hours from now)
    setTimeout(() => {
      scheduleNextNotification();
    }, 1000); // Small delay before scheduling next
    
  }, msUntil8PM);
}

// Initialize the scheduler
export function initializeDailyNotificationScheduler() {
  console.log(`\n📅 ========== DAILY NOTIFICATION SCHEDULER ==========`);
  console.log(`⏰ Initializing daily summary notification scheduler...`);
  console.log(`🕐 Notifications will be sent at 8:00 PM IST daily`);
  
  const msUntil8PM = getMillisecondsUntil8PMIST();
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  
  console.log(`📍 Current IST Time: ${istNow.toLocaleString('en-IN')}`);
  console.log(`⏳ Next notification in: ${formatTimeUntil(msUntil8PM)}`);
  console.log(`=======================================================\n`);
  
  // Start the scheduler
  scheduleNextNotification();
}

// Export for manual triggering/testing
export { sendDailySummaryNotification, getDailySummaryData };
