// backend/src/controllers/auth.controller.ts
/**
 * Why this controller?
 * - HTTP request/response handling only (thin layer)
 * - Calls auth service for business logic
 * - Formats responses and handles errors using catchAsync wrapper
 * - Uses centralized logger instead of console
 * - Input validation (basic presence, email format)
 */

import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service.js';
import { catchAsync } from '../middleware/error.middleware.js';
import logger from '../utils/logger.js';

// Helper to ensure param is string (not array)
const ensureString = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
};

/**
 * Simple email format validation (basic)
 */
const isValidEmailFormat = (email: string): boolean => {
  return email.includes('@') && email.includes('.');
};

/**
 * Register a new user
 */
export const register = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { fullName, email, password, profilePicture } = req.body;

  if (!fullName || !email || !password) {
    res.status(400).json({ success: false, message: 'Full name, email, and password are required' });
    return;
  }

  if (!isValidEmailFormat(email)) {
    res.status(400).json({ success: false, message: 'Invalid email format' });
    return;
  }

  const result = await authService.registerUser({ fullName, email, password, profilePicture });
  res.status(201).json({ success: true, ...result });
});

/**
 * Login user
 */
export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, message: 'Email and password are required' });
    return;
  }

  const result = await authService.loginUser({ email, password });
  res.status(200).json({ success: true, ...result });
});

/**
 * Get current user profile
 */
export const getProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }
  const userId = req.user._id.toString();
  const user = await authService.getProfile(userId);
  res.status(200).json({ success: true, data: user });
});

/**
 * Update current user profile
 */
export const updateProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }
  const userId = req.user._id.toString();
  const { fullName, profilePicture, addresses } = req.body;
  const updated = await authService.updateProfile(userId, {
    fullName,
    profilePicture,
    addresses,
  });
  res.status(200).json({ success: true, data: updated, message: 'Profile updated successfully' });
});

/**
 * Change user password
 */
export const changePassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }
  const userId = req.user._id.toString();
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ success: false, message: 'Current password and new password are required' });
    return;
  }
  await authService.changePassword(userId, { currentPassword, newPassword });
  res.status(200).json({ success: true, message: 'Password changed successfully' });
});

/**
 * Request password reset (sends email with reset link)
 */
export const forgotPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ success: false, message: 'Email is required' });
    return;
  }
  const result = await authService.forgotPassword(email);
  res.status(200).json({ success: true, message: result.message, devResetLink: result.devResetLink });
});

/**
 * Reset password using token
 */
export const resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const token = ensureString(req.params.token);
  if (!token) {
    res.status(400).json({ success: false, message: 'Invalid token' });
    return;
  }
  const { password } = req.body;
  if (!password) {
    res.status(400).json({ success: false, message: 'New password is required' });
    return;
  }
  const result = await authService.resetPassword(token, password);
  res.status(200).json({ success: true, token: result.token, message: result.message });
});

// ============================
// Admin controllers
// ============================

/**
 * Get all users (admin only)
 */
export const getAllUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const role = req.query.role as string | undefined;
  const result = await authService.getAllUsers(page, limit, role);
  res.status(200).json({ success: true, ...result });
});

/**
 * Get a single user by ID (admin only)
 */
export const getUserById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const id = ensureString(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, message: 'Invalid user ID' });
    return;
  }
  const user = await authService.getUserById(id);
  res.status(200).json({ success: true, data: user });
});

/**
 * Update user role (admin only)
 */
export const updateUserRole = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const id = ensureString(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, message: 'Invalid user ID' });
    return;
  }
  const { role } = req.body;
  if (!role) {
    res.status(400).json({ success: false, message: 'Role is required' });
    return;
  }
  const updated = await authService.updateUserRole(id, role);
  res.status(200).json({ success: true, data: updated, message: 'User role updated' });
});

/**
 * Delete a user (admin only, cannot delete own account)
 */
export const deleteUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const id = ensureString(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, message: 'Invalid user ID' });
    return;
  }
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }
  const requestingUserId = req.user._id.toString();
  await authService.deleteUser(id, requestingUserId);
  res.status(200).json({ success: true, message: 'User deleted successfully' });
});

/**
 * Logout user (client-side token removal)
 */
export const logout = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // Client-side should clear token; optional server-side token blacklist can be added
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});