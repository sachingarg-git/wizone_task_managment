/**
 * Real-time Tasks Screen for Mobile Web Interface
 * Uses the RealTimeTaskManager component for live task updates
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { RealTimeTaskManager } from '../components/RealTimeTaskManager';

export default function RealTimeTasksScreen() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', color: '#666', marginBottom: '10px' }}>
            Loading...
          </div>
          <div style={{ fontSize: '14px', color: '#999' }}>
            Connecting to real-time system
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', color: '#dc2626', marginBottom: '10px' }}>
            Authentication Required
          </div>
          <div style={{ fontSize: '14px', color: '#999' }}>
            Please log in to access the real-time task system
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc',
      fontFamily: 'Arial, sans-serif'
    }}>
      <RealTimeTaskManager 
        userId={user.id} 
        userRole={user.role}
      />
    </div>
  );
}