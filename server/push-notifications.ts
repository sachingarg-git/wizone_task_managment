// Push Notification Service for sending FCM notifications
// Uses Firebase Cloud Messaging HTTP v1 API or Local Notifications

import { storage } from './storage';
import { db } from './db';
import { pushNotificationQueue } from '../shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

// Check if Firebase Admin SDK is available
let firebaseAdmin: any = null;
let isFirebaseInitialized = false;

// Try to initialize Firebase Admin
async function initializeFirebase() {
  if (isFirebaseInitialized) return;
  
  try {
    let serviceAccount: any = null;
    
    // Method 1: Check environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log('📱 Loading Firebase credentials from environment variable...');
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    }
    
    // Method 2: Check for service account file
    if (!serviceAccount) {
      const possiblePaths = [
        path.join(process.cwd(), 'firebase-service-account.json'),
        path.join(process.cwd(), 'serviceAccountKey.json'),
        path.join(process.cwd(), 'firebase-adminsdk.json'),
      ];
      
      for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
          console.log(`📱 Loading Firebase credentials from ${filePath}...`);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          serviceAccount = JSON.parse(fileContent);
          break;
        }
      }
    }
    
    if (serviceAccount) {
      const admin = await import('firebase-admin');
      
      admin.default.initializeApp({
        credential: admin.default.credential.cert(serviceAccount),
      });
      
      firebaseAdmin = admin.default;
      isFirebaseInitialized = true;
      console.log('✅ Firebase Admin SDK initialized successfully');
      console.log('🔔 Push notifications will be sent via FCM (works when phone locked!)');
    } else {
      console.log('ℹ️ Firebase not configured - using database queue for notifications');
      console.log('   To enable background push notifications:');
      console.log('   1. Create firebase-service-account.json in project root, OR');
      console.log('   2. Set FIREBASE_SERVICE_ACCOUNT environment variable');
    }
  } catch (error: any) {
    console.log('⚠️ Firebase initialization failed:', error.message);
    console.log('   Falling back to database queue for notifications');
  }
}

// Initialize on module load
initializeFirebase();

interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  icon?: string;
  click_action?: string;
}

// Store notification in database queue for polling
async function storeNotificationInQueue(
  userId: number,
  payload: PushNotificationPayload
): Promise<void> {
  try {
    await db.insert(pushNotificationQueue).values({
      userId,
      title: payload.title,
      body: payload.body,
      type: payload.data?.type || 'general',
      taskId: payload.data?.taskId ? parseInt(payload.data.taskId) : null,
      ticketNumber: payload.data?.ticketNumber || null,
      data: payload.data,
      isRead: false,
      isShown: false,
    });
    console.log(`📬 Notification stored in queue for user ${userId}`);
  } catch (error) {
    console.error('Error storing notification in queue:', error);
  }
}

// Get unread/unshown notifications for a user
export async function getUnshownNotifications(userId: number) {
  try {
    const notifications = await db
      .select()
      .from(pushNotificationQueue)
      .where(and(
        eq(pushNotificationQueue.userId, userId),
        eq(pushNotificationQueue.isShown, false)
      ))
      .orderBy(desc(pushNotificationQueue.createdAt))
      .limit(20);
    return notifications;
  } catch (error) {
    console.error('Error getting unshown notifications:', error);
    return [];
  }
}

// Mark notification as shown
export async function markNotificationShown(notificationId: number) {
  try {
    await db
      .update(pushNotificationQueue)
      .set({ isShown: true })
      .where(eq(pushNotificationQueue.id, notificationId));
  } catch (error) {
    console.error('Error marking notification as shown:', error);
  }
}

// Mark notification as read
export async function markNotificationRead(notificationId: number) {
  try {
    await db
      .update(pushNotificationQueue)
      .set({ isRead: true })
      .where(eq(pushNotificationQueue.id, notificationId));
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

// Get all notifications for a user
export async function getUserNotifications(userId: number, limit = 50) {
  try {
    const notifications = await db
      .select()
      .from(pushNotificationQueue)
      .where(eq(pushNotificationQueue.userId, userId))
      .orderBy(desc(pushNotificationQueue.createdAt))
      .limit(limit);
    return notifications;
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return [];
  }
}

// Send push notification to a specific user
export async function sendPushNotificationToUser(
  userId: number,
  payload: PushNotificationPayload
): Promise<boolean> {
  try {
    // Always store in queue for polling (works even without Firebase)
    await storeNotificationInQueue(userId, payload);
    
    // Try to send via Firebase if available
    const user = await storage.getUser(userId);
    if (user?.fcmToken && isFirebaseInitialized && firebaseAdmin) {
      await sendFirebasePush(user.fcmToken, payload);
    }
    
    return true;
  } catch (error) {
    console.error('Error sending push notification to user:', error);
    return false;
  }
}

// Send Firebase push notification
async function sendFirebasePush(
  fcmToken: string,
  payload: PushNotificationPayload
): Promise<boolean> {
  if (!isFirebaseInitialized || !firebaseAdmin) {
    return false;
  }
  
  try {
    const message = {
      token: fcmToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      android: {
        priority: 'high' as const,
        notification: {
          channelId: 'wizone_tasks',
          sound: 'default',
          priority: 'high' as const,
          defaultVibrateTimings: true,
        },
      },
    };

    const response = await firebaseAdmin.messaging().send(message);
    console.log('✅ Push notification sent via Firebase:', response);
    return true;
  } catch (error: any) {
    console.error('❌ Firebase push error:', error.message);
    return false;
  }
}

// Send push notification to a specific FCM token (legacy compatibility)
export async function sendPushNotification(
  fcmToken: string,
  payload: PushNotificationPayload
): Promise<boolean> {
  return await sendFirebasePush(fcmToken, payload);
}

// Send task assignment notification
export async function sendTaskAssignmentNotification(
  assignedUserId: number,
  taskDetails: {
    taskId: number;
    ticketNumber: string;
    title: string;
    customerName: string;
    priority: string;
  }
): Promise<void> {
  const priorityEmoji = 
    taskDetails.priority === 'critical' ? '🔴' :
    taskDetails.priority === 'high' ? '🟠' :
    taskDetails.priority === 'medium' ? '🟡' : '🟢';

  await sendPushNotificationToUser(assignedUserId, {
    title: `${priorityEmoji} New Task Assigned`,
    body: `Task #${taskDetails.ticketNumber}: ${taskDetails.title}\nCustomer: ${taskDetails.customerName}`,
    data: {
      taskId: String(taskDetails.taskId),
      ticketNumber: taskDetails.ticketNumber,
      type: 'task_assignment',
    },
  });
}

// Send task status update notification
export async function sendTaskStatusNotification(
  userId: number,
  taskDetails: {
    taskId: number;
    ticketNumber: string;
    title: string;
    status: string;
    updatedBy: string;
  }
): Promise<void> {
  const statusEmoji = 
    taskDetails.status === 'completed' ? '✅' :
    taskDetails.status === 'approved' ? '🎉' :
    taskDetails.status === 'in_progress' ? '🔄' :
    taskDetails.status === 'cancelled' ? '❌' : '📋';

  await sendPushNotificationToUser(userId, {
    title: `${statusEmoji} Task Updated`,
    body: `Task #${taskDetails.ticketNumber} is now ${taskDetails.status.replace('_', ' ')}\nUpdated by: ${taskDetails.updatedBy}`,
    data: {
      taskId: String(taskDetails.taskId),
      ticketNumber: taskDetails.ticketNumber,
      type: 'task_status_update',
      status: taskDetails.status,
    },
  });
}

// Send task reminder notification
export async function sendTaskReminderNotification(
  userId: number,
  taskDetails: {
    taskId: number;
    ticketNumber: string;
    title: string;
    customerName: string;
    dueDate?: string;
  }
): Promise<void> {
  await sendPushNotificationToUser(userId, {
    title: '⏰ Task Reminder',
    body: `Task #${taskDetails.ticketNumber}: ${taskDetails.title}\nCustomer: ${taskDetails.customerName}`,
    data: {
      taskId: String(taskDetails.taskId),
      ticketNumber: taskDetails.ticketNumber,
      type: 'task_reminder',
    },
  });
}

console.log('📱 Push notification service loaded');
