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
  // DISABLED: Daily 8 PM report is no longer needed
  console.log(`\n📅 ========== DAILY NOTIFICATION SCHEDULER ==========`);
  console.log(`⚠️  Daily 8 PM report has been DISABLED`);
  console.log(`✅ 3-hour pending/in-progress task report is now active`);
  console.log(`=======================================================\n`);
  
  // Don't start the old scheduler
  // scheduleNextNotification();
}

// Export for manual triggering/testing
export { sendDailySummaryNotification, getDailySummaryData };

// ========== NEW: 3-HOUR PENDING/IN-PROGRESS TASK NOTIFICATION ==========

interface PendingTasksReport {
  totalPending: number;
  totalInProgress: number;
  tasks: {
    ticketNumber: string;
    customerName: string;
    issueType: string;
    description: string;
    backendEngineer: string;
    fieldEngineer: string;
    createdAt: string;
    status: string;
  }[];
}

// Get pending and in-progress tasks
async function getPendingInProgressTasks(): Promise<PendingTasksReport> {
  try {
    console.log(`📊 Fetching pending and in-progress tasks...`);
    
    // Query tasks with status 'pending' or 'in_progress'
    const tasks = await db.select({
      id: schema.tasks.id,
      ticketNumber: schema.tasks.ticketNumber,
      title: schema.tasks.title,
      description: schema.tasks.description,
      category: schema.tasks.category,
      status: schema.tasks.status,
      customerId: schema.tasks.customerId,
      customerName: schema.tasks.customerName,
      assignedToName: schema.tasks.assignedToName,
      fieldEngineerName: schema.tasks.fieldEngineerName,
      createdAt: schema.tasks.createdAt,
    })
    .from(schema.tasks)
    .where(
      or(
        eq(schema.tasks.status, 'pending'),
        eq(schema.tasks.status, 'in_progress')
      )
    )
    .orderBy(schema.tasks.createdAt);

    const pendingCount = tasks.filter(t => t.status === 'pending').length;
    const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;

    const formattedTasks = tasks.map(task => ({
      ticketNumber: task.ticketNumber || 'N/A',
      customerName: task.customerName || 'Unknown Customer',
      issueType: task.category || 'Not specified',
      description: task.description || task.title || 'No description',
      backendEngineer: task.assignedToName || 'Not assigned',
      fieldEngineer: task.fieldEngineerName || 'Not assigned',
      createdAt: task.createdAt ? new Date(task.createdAt).toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short'
      }) : 'Unknown',
      status: task.status || 'Unknown'
    }));

    console.log(`✅ Found ${pendingCount} pending, ${inProgressCount} in-progress tasks`);

    return {
      totalPending: pendingCount,
      totalInProgress: inProgressCount,
      tasks: formattedTasks
    };
  } catch (error) {
    console.error('❌ Error fetching pending/in-progress tasks:', error);
    return {
      totalPending: 0,
      totalInProgress: 0,
      tasks: []
    };
  }
}

// Send 3-hour pending/in-progress task notification
async function send3HourTaskNotification(): Promise<boolean> {
  try {
    console.log(`\n🔔 ========== 3-HOUR TASK NOTIFICATION ==========`);
    
    const report = await getPendingInProgressTasks();
    
    if (report.tasks.length === 0) {
      console.log(`✅ No pending or in-progress tasks. Skipping notification.`);
      console.log(`=======================================================\n`);
      return true;
    }

    // Get bot configuration from database (same as working task notifications)
    let botConfigs = [];
    try {
      botConfigs = await storage.getAllBotConfigurations();
    } catch (error) {
      console.log(`⚠️ Bot configurations table not found, skipping notification`);
      return false;
    }

    // Get first active Telegram bot configuration
    const telegramConfig = botConfigs.find(config => 
      config.isActive && 
      config.botType === 'telegram' && 
      config.telegramBotToken && 
      config.telegramChatId
    );

    if (!telegramConfig) {
      console.log(`⚠️ No active Telegram bot configuration found`);
      return false;
    }

    console.log(`✅ Using bot config: ${telegramConfig.id}`);

    // Build Telegram message
    let message = `🚨 *PENDING & IN-PROGRESS TASKS REPORT*\n\n`;
    message += `📊 *Summary:*\n`;
    message += `⏳ Pending Tasks: *${report.totalPending}*\n`;
    message += `🔄 In-Progress Tasks: *${report.totalInProgress}*\n`;
    message += `📝 Total Tasks: *${report.tasks.length}*\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // Add each task
    report.tasks.forEach((task, index) => {
      const statusEmoji = task.status === 'pending' ? '⏳' : '🔄';
      message += `${statusEmoji} *Task ${index + 1}*\n`;
      message += `🎫 Ticket: \`${task.ticketNumber}\`\n`;
      message += `� Customer: ${task.customerName}\n`;
      message += `�🔧 Issue: ${task.issueType}\n`;
      message += `📝 Description: ${task.description.substring(0, 100)}${task.description.length > 100 ? '...' : ''}\n`;
      message += `👨‍💻 Backend: ${task.backendEngineer}\n`;
      message += `👷 Field: ${task.fieldEngineer}\n`;
      message += `📅 Created: ${task.createdAt}\n`;
      message += `📌 Status: *${task.status.toUpperCase()}*\n`;
      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    });

    message += `⏰ Report generated at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n`;
    message += `🔄 Next report in 3 hours`;

    // Send to Telegram using bot config from database
    const telegramUrl = `https://api.telegram.org/bot${telegramConfig.telegramBotToken}/sendMessage`;
    
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramConfig.telegramChatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Telegram API error:`, errorText);
      return false;
    }

    console.log(`✅ 3-hour task notification sent successfully!`);
    console.log(`=======================================================\n`);
    return true;

  } catch (error) {
    console.error('❌ Error sending 3-hour task notification:', error);
    return false;
  }
}

// Schedule the 3-hour notification
function schedule3HourNotification() {
  const threeHoursInMs = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
  
  console.log(`⏰ Next 3-hour task report scheduled in 3 hours`);
  
  setTimeout(async () => {
    console.log(`\n🔔 Triggering 3-hour task notification...`);
    
    await send3HourTaskNotification();
    
    // Schedule the next notification
    schedule3HourNotification();
    
  }, threeHoursInMs);
}

// Initialize the 3-hour notification scheduler
export function initialize3HourTaskScheduler() {
  console.log(`\n📅 ========== 3-HOUR TASK NOTIFICATION SCHEDULER ==========`);
  console.log(`⏰ Initializing 3-hour pending/in-progress task scheduler...`);
  console.log(`🕐 Notifications will be sent every 3 hours`);
  console.log(`📊 Tracking: PENDING and IN-PROGRESS tasks only`);
  
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  
  console.log(`📍 Current IST Time: ${istNow.toLocaleString('en-IN')}`);
  console.log(`⏳ First notification in: 3 hours`);
  console.log(`=======================================================\n`);
  
  // Send first notification immediately, then every 3 hours
  send3HourTaskNotification().then(() => {
    schedule3HourNotification();
  });
}

// Export for manual triggering/testing
export { send3HourTaskNotification, getPendingInProgressTasks };

