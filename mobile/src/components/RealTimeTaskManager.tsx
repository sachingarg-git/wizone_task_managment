/**
 * Real-time Task Manager for Mobile Field Engineers
 * Provides live task updates, notifications, and real-time synchronization
 */

import React, { useState, useEffect } from 'react';
import { mobileWebSocket } from '../services/websocket';
import { apiRequest } from '../utils/api';

interface Task {
  id: number;
  title: string;
  ticketNumber: string;
  status: string;
  priority: string;
  customerName: string;
  customerId: number | null;
  description: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RealTimeTaskManagerProps {
  userId: string;
  userRole: string;
}

export const RealTimeTaskManager: React.FC<RealTimeTaskManagerProps> = ({ userId, userRole }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    loadTasks();
    setupWebSocketListeners();
    
    return () => {
      // Cleanup listeners when component unmounts
      mobileWebSocket.off('task_assigned', handleTaskAssigned);
      mobileWebSocket.off('task_updated', handleTaskUpdated);
      mobileWebSocket.off('task_notification', handleTaskNotification);
    };
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('GET', '/api/tasks/my-tasks');
      setTasks(response as Task[]);
      console.log(`📋 Loaded ${response.length} tasks for field engineer`);
    } catch (error) {
      console.error('❌ Error loading tasks:', error);
      addNotification('Failed to load tasks. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocketListeners = () => {
    // Connection status updates
    mobileWebSocket.on('connected', () => {
      setConnectionStatus('connected');
      addNotification('✅ Real-time sync activated');
    });

    mobileWebSocket.on('disconnected', () => {
      setConnectionStatus('disconnected');
      addNotification('⚠️ Real-time sync disconnected');
    });

    // Task event listeners
    mobileWebSocket.on('task_assigned', handleTaskAssigned);
    mobileWebSocket.on('task_updated', handleTaskUpdated);
    mobileWebSocket.on('task_notification', handleTaskNotification);
    mobileWebSocket.on('system_notification', handleSystemNotification);
  };

  const handleTaskAssigned = (data: any) => {
    console.log('📝 New task assigned:', data.task?.title);
    
    // Add new task to the list
    if (data.task && data.task.assignedTo === userId) {
      setTasks(prevTasks => {
        const existingTask = prevTasks.find(t => t.id === data.task.id);
        if (!existingTask) {
          return [data.task, ...prevTasks];
        }
        return prevTasks;
      });
      
      addNotification(`🆕 New task assigned: ${data.task.title}`);
    }
  };

  const handleTaskUpdated = (data: any) => {
    console.log('📋 Task updated:', data.task?.title);
    
    // Update existing task in the list
    if (data.task) {
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === data.task.id ? { ...task, ...data.task } : task
        )
      );
      
      if (data.task.assignedTo === userId) {
        addNotification(`📋 Task updated: ${data.task.title}`);
      }
    }
  };

  const handleTaskNotification = (data: any) => {
    console.log('🔔 Task notification:', data.message);
    addNotification(data.message);
  };

  const handleSystemNotification = (data: any) => {
    console.log('🔔 System notification:', data.message);
    addNotification(`🔔 ${data.message}`);
  };

  const addNotification = (message: string) => {
    setNotifications(prev => [...prev, message].slice(-5)); // Keep last 5 notifications
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);
  };

  const updateTaskStatus = async (taskId: number, newStatus: string, notes?: string) => {
    try {
      console.log(`🔄 Updating task ${taskId} status to ${newStatus}`);
      
      const updateData: any = { status: newStatus };
      if (notes) {
        updateData.notes = notes;
      }

      const response = await apiRequest('PUT', `/api/tasks/${taskId}`, updateData);
      
      // Update local state
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, ...response } : task
        )
      );

      // Send real-time update via WebSocket
      mobileWebSocket.sendTaskUpdate(taskId, updateData);
      
      addNotification(`✅ Task "${response.title}" updated to ${newStatus}`);
      
    } catch (error) {
      console.error('❌ Error updating task:', error);
      addNotification('❌ Failed to update task. Please try again.');
    }
  };

  const sendLocationUpdate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          
          mobileWebSocket.sendLocationUpdate(location);
          console.log('📍 Location update sent:', location);
        },
        (error) => {
          console.error('❌ Location error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#fbbf24';
      case 'in_progress': return '#3b82f6';
      case 'completed': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#666' }}>Loading tasks...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      {/* Header with connection status */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ margin: 0, color: '#1e293b' }}>My Tasks</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={sendLocationUpdate}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            📍 Update Location
          </button>
          <div style={{ 
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            backgroundColor: connectionStatus === 'connected' ? '#dcfce7' : '#fee2e2',
            color: connectionStatus === 'connected' ? '#166534' : '#dc2626'
          }}>
            {connectionStatus === 'connected' ? '🟢 Live Sync' : '🔴 Offline'}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          {notifications.map((notification, index) => (
            <div
              key={index}
              style={{
                padding: '12px',
                marginBottom: '8px',
                backgroundColor: '#f0f9ff',
                border: '1px solid #0ea5e9',
                borderRadius: '6px',
                color: '#0c4a6e',
                fontSize: '14px'
              }}
            >
              {notification}
            </div>
          ))}
        </div>
      )}

      {/* Task List */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {tasks.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#64748b',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>No tasks assigned</div>
            <div>Tasks will appear here when assigned to you</div>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              style={{
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '18px' }}>
                    {task.title}
                  </h3>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
                    Ticket: {task.ticketNumber} • Customer: {task.customerName}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: getPriorityColor(task.priority),
                    color: 'white'
                  }}>
                    {task.priority.toUpperCase()}
                  </span>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: getStatusColor(task.status),
                    color: 'white'
                  }}>
                    {task.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <p style={{ margin: '12px 0', color: '#475569', lineHeight: '1.5' }}>
                {task.description}
              </p>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {task.status === 'pending' && (
                  <button
                    onClick={() => updateTaskStatus(task.id, 'in_progress')}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ▶️ Start Task
                  </button>
                )}
                
                {task.status === 'in_progress' && (
                  <>
                    <button
                      onClick={() => {
                        const notes = prompt('Add completion notes (optional):');
                        updateTaskStatus(task.id, 'completed', notes || undefined);
                      }}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      ✅ Complete
                    </button>
                    <button
                      onClick={() => {
                        const notes = prompt('Add update notes:');
                        if (notes) {
                          updateTaskStatus(task.id, 'in_progress', notes);
                        }
                      }}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      📝 Add Notes
                    </button>
                  </>
                )}
              </div>

              <div style={{ 
                marginTop: '12px', 
                fontSize: '12px', 
                color: '#94a3b8',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
                <span>Updated: {new Date(task.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Refresh Button */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          onClick={loadTasks}
          style={{
            padding: '12px 24px',
            backgroundColor: '#f1f5f9',
            color: '#475569',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          🔄 Refresh Tasks
        </button>
      </div>
    </div>
  );
};