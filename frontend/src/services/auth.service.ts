// frontend/src/services/auth.service.ts
/**
 * Why this service?
 * - Centralized authentication API calls
 * - Separates API logic from components/context
 * - Provides typed methods for login, register, profile, password reset
 * - Uses the api instance from './api'
 */

import api from './api';

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  profilePicture?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'user' | 'admin' | 'moderator';
  profilePicture?: string | null;
  lastLogin?: string;
  addresses?: Array<{
    street: string;
    city: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }>;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface UpdateProfileData {
  fullName?: string;
  profilePicture?: string;
  addresses?: User['addresses'];
}

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', data);
  return response.data;
};

export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
};

export const getProfile = async (): Promise<{ success: boolean; data: User }> => {
  const response = await api.get('/auth/profile');
  return response.data;
};

export const updateProfile = async (data: UpdateProfileData): Promise<{ success: boolean; data: User }> => {
  const response = await api.put('/auth/profile', data);
  return response.data;
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.post('/auth/change-password', { currentPassword, newPassword });
  return response.data;
};

export const forgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token: string, password: string): Promise<{ success: boolean; token: string; message: string }> => {
  const response = await api.post(`/auth/reset-password/${token}`, { password });
  return response.data;
};

// Admin services
export const getAllUsers = async (page = 1, limit = 20, role?: string): Promise<any> => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (role) params.append('role', role);
  const response = await api.get(`/auth/admin/users?${params.toString()}`);
  return response.data;
};

export const getUserById = async (userId: string): Promise<{ success: boolean; data: User }> => {
  const response = await api.get(`/auth/admin/users/${userId}`);
  return response.data;
};

export const updateUserRole = async (userId: string, role: string): Promise<{ success: boolean; data: User }> => {
  const response = await api.put(`/auth/admin/users/${userId}/role`, { role });
  return response.data;
};

export const deleteUser = async (userId: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/auth/admin/users/${userId}`);
  return response.data;
};