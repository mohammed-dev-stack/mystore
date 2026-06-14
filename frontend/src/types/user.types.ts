// frontend/src/types/user.types.ts
/**
 * Why this file?
 * - Centralized TypeScript types/interfaces for user-related data
 * - Used across authentication, profile, and admin components
 * - Ensures type safety for user objects, addresses, and API responses
 */

export interface Address {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export type UserRole = 'user' | 'admin' | 'moderator';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  profilePicture?: string | null;
  lastLogin?: string;
  addresses?: Address[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile extends User {
  // Additional fields that might be needed for profile update
}

export interface UpdateProfileData {
  fullName?: string;
  profilePicture?: string;
  addresses?: Address[];
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  profilePicture?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface UsersListResponse {
  success: boolean;
  users: User[];
  total: number;
  totalPages: number;
  currentPage: number;
}