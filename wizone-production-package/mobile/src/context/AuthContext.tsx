import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../utils/api';

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
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        setLoading(false);
        return;
      }

      // Check if the user is still authenticated
      const response = await apiRequest('GET', '/api/auth/user');
      setUser(response);
    } catch (error) {
      // If auth check fails, clear stored token
      await AsyncStorage.removeItem('authToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await apiRequest('POST', '/api/auth/login', {
        username,
        password,
      });

      // Store auth token (assuming the API returns one)
      if (response.token) {
        await AsyncStorage.setItem('authToken', response.token);
      }
      
      setUser(response.user || response);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      await AsyncStorage.removeItem('authToken');
      setUser(null);
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