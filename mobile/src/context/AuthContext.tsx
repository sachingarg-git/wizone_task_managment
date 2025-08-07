import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '../utils/api';
import { mobileWebSocket } from '../services/websocket';

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      
      // For mobile APK, check if user session exists on server
      // Don't rely on local token storage, use session cookies
      const response = await apiRequest('GET', '/api/auth/user');
      setUser(response as User);
    } catch (error) {
      // If auth check fails, user is not authenticated
      setUser(null);
      console.log('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      console.log('🔐 Mobile APK login attempt:', username);
      
      const response = await apiRequest('POST', '/api/auth/login', {
        username,
        password,
      });

      console.log('✅ Mobile APK login successful:', response);
      
      // Server uses session cookies, no token storage needed
      // Session cookie will be automatically stored by WebView
      setUser(response as User);
      
      // Connect to WebSocket for real-time updates
      console.log('🔗 Connecting to real-time WebSocket...');
      mobileWebSocket.connect((response as User).id, (response as User).role);
    } catch (error) {
      console.error('❌ Mobile APK login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      
      // Disconnect WebSocket
      mobileWebSocket.disconnect();
      
      // Clear user state
      setUser(null);
      console.log('✅ Mobile APK logout successful');
    } catch (error) {
      console.error('❌ Mobile APK logout error:', error);
      setUser(null); // Clear user state even if logout request fails
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}