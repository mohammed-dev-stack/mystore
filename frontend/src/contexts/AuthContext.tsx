// frontend/src/contexts/AuthContext.tsx
/**
 * Why this context?
 * - Manages authentication state (user, token, isAuthenticated, isAdmin)
 * - Provides login/logout/register functions that update localStorage and state atomically
 * - Used by ChatContext to gate API requests until user is authenticated
 * - Fully typed with no `any`, aligned with backend API responses
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';

// --------------------------------------------
// Type definitions matching backend responses
// --------------------------------------------
export interface User {
  _id: string;
  fullName: string;
  email: string;
  role: 'user' | 'admin' | 'moderator';
  isActive: boolean;
}

interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}

interface RegisterResponse {
  success: boolean;
  token: string;
  user: User;
}

interface ProfileResponse {
  success: boolean;
  data: User;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (userData: { fullName: string; email: string; password: string }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Load user profile using the stored token (token is automatically attached by axios interceptor)
  const loadUser = useCallback(async (): Promise<boolean> => {
    try {
      const response = await api.get<ProfileResponse>('/auth/profile');
      const userData = response.data?.data;
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
        setIsAdmin(userData.role === 'admin');
        return true;
      }
      throw new Error('No user data received');
    } catch (error) {
      // Token invalid or expired – clear local state
      localStorage.removeItem('token');
      setToken(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setUser(null);
      return false;
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadUser();
    } else {
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
    }
  }, [token, loadUser]);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await api.post<LoginResponse>('/auth/login', { email, password });
      const { token: jwt, user: userData } = response.data;
      
      localStorage.setItem('token', jwt);
      setToken(jwt);
      setUser(userData);
      setIsAuthenticated(true);
      setIsAdmin(userData.role === 'admin');
      
      return { success: true };
    } catch (error) {
      // Type-safe error handling
      let message = 'Login failed. Please check your credentials.';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          message = axiosError.response.data.message;
        }
      }
      return { success: false, message };
    }
  };

  const register = async (userData: { fullName: string; email: string; password: string }): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await api.post<RegisterResponse>('/auth/register', userData);
      const { token: jwt, user: userDataRes } = response.data;
      
      localStorage.setItem('token', jwt);
      setToken(jwt);
      setUser(userDataRes);
      setIsAuthenticated(true);
      setIsAdmin(userDataRes.role === 'admin');
      
      return { success: true };
    } catch (error) {
      let message = 'Registration failed. Please try again.';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          message = axiosError.response.data.message;
        }
      }
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isAdmin,
    token,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};