import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';

// Push Notification Service for WIZONE Task Manager
export class PushNotificationService {
  private static instance: PushNotificationService;
  private isRegistered = false;
  private fcmToken: string | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPollingActive = false;

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  // Check if running on native platform
  isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  // Initialize push notifications
  async initialize(): Promise<void> {
    if (!this.isNativePlatform()) {
      console.log('📱 Push notifications only available on native platforms');
      return;
    }

    try {
      console.log('🔔 Initializing notifications...');
      
      // Request Android notification permission first (Android 13+)
      await this.requestAndroidNotificationPermission();
      
      // Setup local notifications first (always works)
      await this.setupLocalNotifications();
      
      // Try to setup push notifications
      await this.setupPushNotifications();
      
      // Start polling for notifications
      this.startNotificationPolling();
      
      // Setup app state listener for background/foreground transitions
      this.setupAppStateListener();
      
      console.log('✅ Notification system initialized');

    } catch (error) {
      console.error('❌ Error initializing notifications:', error);
      // Even if push fails, local notifications should work
    }
  }

  // Request Android notification permission (required for Android 13+)
  private async requestAndroidNotificationPermission(): Promise<boolean> {
    try {
      // Check current permission status
      let permStatus = await LocalNotifications.checkPermissions();
      console.log('📋 Current notification permission:', permStatus.display);
      
      if (permStatus.display === 'prompt' || permStatus.display === 'prompt-with-rationale') {
        // Request permission
        console.log('🔔 Requesting notification permission...');
        const result = await LocalNotifications.requestPermissions();
        console.log('📋 Permission result:', result.display);
        return result.display === 'granted';
      }
      
      return permStatus.display === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Setup local notifications
  private async setupLocalNotifications(): Promise<void> {
    try {
      // Create notification channel for Android (must be done before showing notifications)
      await LocalNotifications.createChannel({
        id: 'wizone_tasks',
        name: 'Task Notifications',
        description: 'Notifications for task assignments and updates',
        importance: 5, // Max importance - shows heads-up notification
        visibility: 1, // Public - show on lock screen
        vibration: true,
        sound: 'default',
        lights: true,
        lightColor: '#2563EB',
      });
      
      console.log('✅ Notification channel created');

      // Listen for notification actions
      LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        console.log('👆 Local notification tapped:', notification);
        this.handleNotificationTap(notification.notification.extra);
      });

      console.log('✅ Local notifications ready');
    } catch (error) {
      console.error('Error setting up local notifications:', error);
    }
  }

  // Setup push notifications
  private async setupPushNotifications(): Promise<void> {
    try {
      const permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        const newStatus = await PushNotifications.requestPermissions();
        if (newStatus.receive !== 'granted') {
          console.log('❌ Push notification permission denied');
          return;
        }
      } else if (permStatus.receive !== 'granted') {
        console.log('❌ Push notification permission not granted');
        return;
      }

      // Register for push notifications
      await PushNotifications.register();
      this.isRegistered = true;
      console.log('✅ Push notifications registered');

      // Setup listeners
      this.setupPushListeners();

    } catch (error) {
      console.error('Push notification setup failed:', error);
    }
  }

  // Setup push notification listeners
  private setupPushListeners(): void {
    // On registration success
    PushNotifications.addListener('registration', (token) => {
      console.log('📱 FCM Token received:', token.value);
      this.fcmToken = token.value;
      this.sendTokenToServer(token.value);
    });

    // On registration error
    PushNotifications.addListener('registrationError', (error) => {
      console.error('❌ Push registration error:', error);
    });

    // On push notification received (app in foreground)
    PushNotifications.addListener('pushNotificationReceived', async (notification) => {
      console.log('📬 Push notification received:', notification);
      
      // Show local notification when app is in foreground
      await this.showLocalNotification(
        notification.title || 'WIZONE Task Manager',
        notification.body || 'You have a new notification',
        notification.data
      );
    });

    // On notification action performed (user tapped notification)
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('👆 Push notification tapped:', notification);
      this.handleNotificationTap(notification.notification.data);
    });
  }

  // Setup app state listener for background polling
  private setupAppStateListener(): void {
    App.addListener('appStateChange', async ({ isActive }) => {
      console.log(`📱 App state changed: ${isActive ? 'FOREGROUND' : 'BACKGROUND'}`);
      
      if (isActive) {
        // App came to foreground - check for notifications immediately
        await this.checkForNewNotifications();
        this.startNotificationPolling();
      } else {
        // App went to background - schedule pending notifications
        await this.scheduleBackgroundCheck();
      }
    });
  }

  // Schedule background notification check using LocalNotifications
  private async scheduleBackgroundCheck(): Promise<void> {
    try {
      // Schedule a series of notification checks for when app is in background
      // These will trigger even when app is minimized
      const pending = await LocalNotifications.getPending();
      
      // Cancel any existing scheduled checks
      if (pending.notifications.length > 0) {
        const scheduledCheckIds = pending.notifications
          .filter(n => n.extra?.type === 'background_check')
          .map(n => n.id);
        
        if (scheduledCheckIds.length > 0) {
          await LocalNotifications.cancel({ notifications: scheduledCheckIds.map(id => ({ id })) });
        }
      }

      // Schedule checks every minute for next 30 minutes
      const notifications = [];
      for (let i = 1; i <= 30; i++) {
        notifications.push({
          id: 900000 + i, // Reserved IDs for background checks
          title: '',
          body: '',
          extra: { type: 'background_check' },
          schedule: { at: new Date(Date.now() + i * 60000) }, // Every minute
          silent: true,
        });
      }

      // The actual check happens in notification received listener
      console.log('📅 Scheduled background notification checks');
    } catch (error) {
      console.error('Error scheduling background check:', error);
    }
  }

  // Start polling for notifications
  private startNotificationPolling(): void {
    if (this.isPollingActive) return;
    
    this.isPollingActive = true;
    
    // Poll every 15 seconds for new notifications (faster polling)
    this.pollingInterval = setInterval(async () => {
      await this.checkForNewNotifications();
    }, 15000);
    
    // Also check immediately
    this.checkForNewNotifications();
  }

  // Check for new notifications via API
  private async checkForNewNotifications(): Promise<void> {
    try {
      const response = await fetch('/api/notifications/unread', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const notifications = await response.json();
        console.log(`📬 Polling: Found ${notifications.length} unshown notifications`);
        
        // Show local notification for each unread notification
        for (const notif of notifications) {
          // Use isShown from database
          if (!notif.isShown) {
            await this.showLocalNotification(
              notif.title || 'WIZONE Notification',
              notif.body || notif.message,
              { taskId: notif.taskId, notificationId: notif.id, ticketNumber: notif.ticketNumber }
            );
            
            // Mark as shown
            await fetch(`/api/notifications/${notif.id}/mark-shown`, {
              method: 'POST',
              credentials: 'include',
            }).catch(() => {});
          }
        }
      }
    } catch (error) {
      // Silent fail - network may not be available
      console.log('📵 Notification polling failed - network unavailable');
    }
  }

  // Send FCM token to server for storing
  async sendTokenToServer(token: string): Promise<void> {
    try {
      const response = await fetch('/api/push-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ token, platform: 'android' }),
      });

      if (response.ok) {
        console.log('✅ FCM token sent to server');
      } else {
        console.error('❌ Failed to send FCM token to server');
      }
    } catch (error) {
      console.error('❌ Error sending FCM token:', error);
    }
  }

  // Show local notification
  async showLocalNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      const notificationId = Math.floor(Math.random() * 2147483647); // Random ID within int range
      
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: notificationId,
            extra: data,
            sound: 'default',
            smallIcon: 'ic_launcher',
            largeIcon: 'ic_launcher',
            channelId: 'wizone_tasks',
            autoCancel: true,
          },
        ],
      });
      console.log('✅ Local notification shown:', title);
    } catch (error) {
      console.error('❌ Error showing local notification:', error);
    }
  }

  // Handle notification tap
  private handleNotificationTap(data: any): void {
    if (data?.taskId) {
      window.location.href = `/portal?taskId=${data.taskId}`;
    } else {
      window.location.href = '/portal';
    }
  }

  // Get the FCM token
  getToken(): string | null {
    return this.fcmToken;
  }

  // Check if registered
  isNotificationRegistered(): boolean {
    return this.isRegistered;
  }

  // Remove all listeners (cleanup)
  async cleanup(): Promise<void> {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    if (this.isNativePlatform()) {
      await PushNotifications.removeAllListeners();
      await LocalNotifications.removeAllListeners();
      this.isRegistered = false;
      this.fcmToken = null;
    }
  }
}

// Export singleton instance
export const pushNotificationService = PushNotificationService.getInstance();

// Initialize on app load (call from main.tsx or App.tsx)
export async function initializePushNotifications(): Promise<void> {
  await pushNotificationService.initialize();
}
