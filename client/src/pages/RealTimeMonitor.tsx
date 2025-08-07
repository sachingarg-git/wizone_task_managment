/**
 * Real-time Monitoring Dashboard for Admin Web Portal
 * Provides live monitoring of field engineer activities and system status
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Activity, MapPin, Bell, Wifi, WifiOff } from "lucide-react";

interface ConnectedUser {
  userId: string;
  userRole: string;
  clientType: 'mobile' | 'web';
  lastActivity: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

interface TaskActivity {
  type: string;
  taskId: number;
  taskTitle: string;
  updatedBy: string;
  timestamp: string;
  changes?: any;
}

interface LocationUpdate {
  userId: string;
  username?: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp: string;
  };
}

export default function RealTimeMonitor() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [recentActivity, setRecentActivity] = useState<TaskActivity[]>([]);
  const [locationUpdates, setLocationUpdates] = useState<LocationUpdate[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    try {
      setConnectionStatus('connecting');
      
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('🔗 Admin dashboard connecting to WebSocket:', wsUrl);
      const websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        console.log('✅ Admin WebSocket connected');
        setConnectionStatus('connected');
        setWs(websocket);
        
        // Authenticate as admin web client
        websocket.send(JSON.stringify({
          type: 'authenticate',
          userId: 'admin_dashboard',
          userRole: 'admin',
          clientType: 'web'
        }));
      };

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      websocket.onclose = () => {
        console.log('🔌 Admin WebSocket disconnected');
        setConnectionStatus('disconnected');
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };

      websocket.onerror = (error) => {
        console.error('❌ Admin WebSocket error:', error);
        setConnectionStatus('disconnected');
      };

    } catch (error) {
      console.error('❌ WebSocket connection error:', error);
      setConnectionStatus('disconnected');
    }
  };

  const handleWebSocketMessage = (message: any) => {
    console.log('📩 Admin dashboard received:', message.type);

    switch (message.type) {
      case 'authenticated':
        addNotification('✅ Real-time monitoring activated');
        break;

      case 'user_status':
        handleUserStatusUpdate(message);
        break;

      case 'task_created':
      case 'task_updated':
        handleTaskActivity(message);
        break;

      case 'user_created':
        addNotification(`👤 New ${message.user.role} created: ${message.user.firstName} ${message.user.lastName}`);
        if (message.canLoginImmediately) {
          addNotification(`🔓 User ${message.user.username} can login immediately on mobile app`);
        }
        break;

      case 'engineer_location':
        handleLocationUpdate(message);
        break;

      case 'system_notification':
        addNotification(`🔔 ${message.message}`);
        break;
    }
  };

  const handleUserStatusUpdate = (message: any) => {
    const { userId, status, userRole, clientType } = message;
    
    if (status === 'online') {
      setConnectedUsers(prev => {
        const existing = prev.find(u => u.userId === userId && u.clientType === clientType);
        if (!existing) {
          return [...prev, {
            userId,
            userRole,
            clientType,
            lastActivity: new Date().toISOString()
          }];
        }
        return prev;
      });
      addNotification(`🟢 ${userRole} ${userId} connected via ${clientType}`);
    } else if (status === 'offline') {
      setConnectedUsers(prev => 
        prev.filter(u => !(u.userId === userId && u.clientType === clientType))
      );
      addNotification(`🔴 ${userRole} ${userId} disconnected from ${clientType}`);
    }
  };

  const handleTaskActivity = (message: any) => {
    const activity: TaskActivity = {
      type: message.type,
      taskId: message.task?.id || message.taskId,
      taskTitle: message.task?.title || 'Unknown Task',
      updatedBy: message.updatedBy || message.createdBy,
      timestamp: message.timestamp,
      changes: message.changes
    };

    setRecentActivity(prev => [activity, ...prev].slice(0, 20)); // Keep last 20 activities
    
    if (message.type === 'task_created') {
      addNotification(`📝 New task created: ${activity.taskTitle}`);
    } else if (message.type === 'task_updated') {
      addNotification(`📋 Task updated: ${activity.taskTitle}`);
    }
  };

  const handleLocationUpdate = (message: any) => {
    const locationUpdate: LocationUpdate = {
      userId: message.userId,
      location: message.location
    };

    setLocationUpdates(prev => {
      const filtered = prev.filter(u => u.userId !== message.userId);
      return [locationUpdate, ...filtered].slice(0, 10); // Keep last 10 location updates
    });

    addNotification(`📍 Location update from engineer ${message.userId}`);
  };

  const addNotification = (message: string) => {
    setNotifications(prev => [message, ...prev].slice(0, 10)); // Keep last 10 notifications
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi className="h-4 w-4 text-green-500" />;
      case 'connecting': return <Activity className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'disconnected': return <WifiOff className="h-4 w-4 text-red-500" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Real-time Monitoring Active';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected - Attempting to reconnect';
    }
  };

  const fieldEngineers = connectedUsers.filter(u => u.userRole === 'field_engineer');
  const webUsers = connectedUsers.filter(u => u.clientType === 'web');
  const mobileUsers = connectedUsers.filter(u => u.clientType === 'mobile');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Real-time Monitoring Dashboard</h1>
        <div className="flex items-center gap-2">
          {getConnectionStatusIcon()}
          <span className={`text-sm font-medium ${
            connectionStatus === 'connected' ? 'text-green-600' : 
            connectionStatus === 'connecting' ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {getConnectionStatusText()}
          </span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Connected Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              {fieldEngineers.length} field engineers online
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mobile Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{mobileUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              Field engineers on mobile app
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Web Portal Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{webUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              Admins/managers on web portal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activities</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{recentActivity.length}</div>
            <p className="text-xs text-muted-foreground">
              Task updates and activities
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connected Users */}
        <Card>
          <CardHeader>
            <CardTitle>Connected Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {connectedUsers.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No users currently connected</p>
              ) : (
                connectedUsers.map((user, index) => (
                  <div key={`${user.userId}_${user.clientType}`} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <div className="font-medium">{user.userId}</div>
                      <div className="text-sm text-muted-foreground">{user.userRole}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.clientType === 'mobile' ? 'default' : 'secondary'}>
                        {user.clientType}
                      </Badge>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Task Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No recent activity</p>
              ) : (
                recentActivity.map((activity, index) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{activity.taskTitle}</span>
                      <Badge variant={activity.type === 'task_created' ? 'default' : 'secondary'}>
                        {activity.type === 'task_created' ? 'Created' : 'Updated'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      By {activity.updatedBy} • {new Date(activity.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location Updates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Field Engineer Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {locationUpdates.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No location updates</p>
              ) : (
                locationUpdates.map((update, index) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <div className="font-medium">{update.userId}</div>
                    <div className="text-sm text-muted-foreground">
                      Lat: {update.location.latitude.toFixed(6)}, 
                      Lng: {update.location.longitude.toFixed(6)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(update.location.timestamp).toLocaleString()}
                      {update.location.accuracy && ` • Accuracy: ${Math.round(update.location.accuracy)}m`}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Live Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Live Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No notifications</p>
              ) : (
                notifications.map((notification, index) => (
                  <div key={index} className="p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                    {notification}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}