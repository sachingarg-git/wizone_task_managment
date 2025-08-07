/**
 * Real-time WebSocket service for mobile field engineer app
 * Provides instant synchronization with server and web portal
 */

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export class MobileWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private userId: string | null = null;
  private userRole: string | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private isConnecting = false;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupEventListeners();
  }

  connect(userId: string, userRole: string, token?: string) {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      console.log('🔗 WebSocket already connected or connecting');
      return;
    }

    this.isConnecting = true;
    this.userId = userId;
    this.userRole = userRole;

    try {
      // Determine WebSocket URL based on current location
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log(`🚀 Connecting to WebSocket: ${wsUrl}`);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Authenticate the connection
        this.send({
          type: 'authenticate',
          userId: this.userId,
          userRole: this.userRole,
          clientType: 'mobile',
          token: token
        });

        // Start ping interval to keep connection alive
        this.startPingInterval();
        this.emit('connected', { userId, userRole });
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📩 WebSocket message received:', message.type);
          this.handleMessage(message);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        this.isConnecting = false;
        this.stopPingInterval();
        
        if (event.code !== 1000) { // Not a normal closure
          this.attemptReconnect();
        }
        
        this.emit('disconnected', { code: event.code, reason: event.reason });
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.isConnecting = false;
        this.emit('error', { error });
      };

    } catch (error) {
      console.error('❌ WebSocket connection error:', error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'authenticated':
        console.log('✅ WebSocket authentication confirmed');
        this.emit('authenticated', message);
        break;

      case 'task_assigned':
        console.log('📝 New task assigned:', message.task?.title);
        this.emit('task_assigned', message);
        this.showNotification('New Task Assigned', message.message || 'You have a new task assignment');
        break;

      case 'task_updated':
        console.log('📋 Task updated:', message.task?.title);
        this.emit('task_updated', message);
        if (message.task?.assignedTo === this.userId) {
          this.showNotification('Task Updated', `Task "${message.task.title}" has been updated`);
        }
        break;

      case 'task_update_notification':
        console.log('🔔 Task notification:', message.message);
        this.emit('task_notification', message);
        this.showNotification('Task Update', message.message);
        break;

      case 'user_status':
        console.log(`👤 User ${message.userId} is now ${message.status}`);
        this.emit('user_status', message);
        break;

      case 'system_notification':
        console.log('🔔 System notification:', message.message);
        this.emit('system_notification', message);
        this.showNotification('System Notification', message.message);
        break;

      case 'pong':
        // Keep-alive response, no action needed
        break;

      default:
        console.log('📨 Unknown message type:', message.type);
        this.emit('unknown_message', message);
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Max reconnection attempts reached');
      this.emit('reconnect_failed', { attempts: this.reconnectAttempts });
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.userId && this.userRole) {
        this.connect(this.userId, this.userRole);
      }
    }, this.reconnectInterval * this.reconnectAttempts);
  }

  private startPingInterval() {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: new Date().toISOString() });
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  send(message: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    } else {
      console.warn('⚠️ WebSocket not connected, message not sent:', message.type);
      return false;
    }
  }

  // Real-time task updates
  sendTaskUpdate(taskId: number, updates: any) {
    this.send({
      type: 'task_update',
      taskId,
      updates,
      timestamp: new Date().toISOString()
    });
  }

  // Real-time location updates for field engineers
  sendLocationUpdate(location: { latitude: number; longitude: number; accuracy?: number; }) {
    this.send({
      type: 'location_update',
      location: {
        ...location,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Event listener management
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in event callback for ${event}:`, error);
        }
      });
    }
  }

  private showNotification(title: string, body: string) {
    // Check if notifications are supported and permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/src/assets/wizone-logo.jpg',
        tag: 'wizone-task-notification'
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      // Request permission for notifications
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, {
            body,
            icon: '/src/assets/wizone-logo.jpg',
            tag: 'wizone-task-notification'
          });
        }
      });
    }

    // Also show browser alert as fallback
    console.log(`🔔 ${title}: ${body}`);
  }

  private setupEventListeners() {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('📱 App went to background');
      } else {
        console.log('📱 App returned to foreground');
        // Reconnect if needed when app comes back to foreground
        if (this.ws?.readyState !== WebSocket.OPEN && this.userId && this.userRole) {
          this.connect(this.userId, this.userRole);
        }
      }
    });

    // Handle online/offline events
    window.addEventListener('online', () => {
      console.log('🌐 Network connection restored');
      if (this.userId && this.userRole) {
        this.connect(this.userId, this.userRole);
      }
    });

    window.addEventListener('offline', () => {
      console.log('📵 Network connection lost');
      if (this.ws) {
        this.ws.close();
      }
    });
  }

  disconnect() {
    this.stopPingInterval();
    if (this.ws) {
      this.ws.close(1000, 'User disconnected');
      this.ws = null;
    }
    this.userId = null;
    this.userRole = null;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionStatus(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'unknown';
    }
  }
}

// Export singleton instance
export const mobileWebSocket = new MobileWebSocketService();