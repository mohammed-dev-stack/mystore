/**
 * Why this service?
 * - Business logic for authentication (register, login, password reset, profile)
 * - Uses User model and JWT utilities
 * - Handles password hashing explicitly (not in model pre-save to avoid "next is not a function")
 * - Implements brute force protection (login attempts + lock)
 * - Separated from controllers for testability and clean architecture
 * - Throws AppError for operational errors
 */

import mongoose from 'mongoose';
import User, { IUser } from '../models/user.model.js';
import { generateToken } from './token.service.js';
import { AppError } from '../middleware/error.middleware.js';
import logger from '../utils/logger.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  profilePicture?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  profilePicture?: string;
  addresses?: IUser['addresses'];
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export const registerUser = async (input: RegisterInput) => {
  const { fullName, email, password, profilePicture } = input;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppError('Email already registered', 400);
  }

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    password: hashedPassword,
    profilePicture: profilePicture || null,
  });

  const token = generateToken({ id: user._id.toString(), role: user.role });

  return {
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
    },
  };
};

export const loginUser = async (input: LoginInput) => {
  const { email, password } = input;

  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +loginAttempts +lockUntil');
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  if (user.isLocked && user.isLocked()) {
    const remainingTime = Math.ceil((user.lockUntil!.getTime() - Date.now()) / 60000);
    throw new AppError(`Account locked. Try again in ${remainingTime} minutes.`, 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.incrementLoginAttempts();
    throw new AppError('Invalid credentials', 401);
  }

  await user.resetLoginAttempts();
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken({ id: user._id.toString(), role: user.role });

  return {
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      lastLogin: user.lastLogin,
    },
  };
};

export const getProfile = async (userId: string) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user;
};

export const updateProfile = async (userId: string, input: UpdateProfileInput) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (input.fullName) user.fullName = input.fullName;
  if (input.profilePicture) user.profilePicture = input.profilePicture;
  if (input.addresses) user.addresses = input.addresses;

  await user.save();

  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    profilePicture: user.profilePicture,
    addresses: user.addresses,
  };
};

export const changePassword = async (userId: string, input: ChangePasswordInput) => {
  const { currentPassword, newPassword } = input;

  if (!currentPassword || !newPassword) {
    throw new AppError('Please provide current and new password', 400);
  }

  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Current password is incorrect', 401);
  }

  const salt = await bcrypt.genSalt(12);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  return { success: true, message: 'Password changed successfully' };
};

export const forgotPassword = async (email: string) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return { success: true, message: 'If email exists, reset link sent' };
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl) {
    throw new AppError('FRONTEND_URL environment variable is not set', 500);
  }

  const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
  logger.info(`Password reset link generated for ${email}: ${resetUrl}`);

  return {
    success: true,
    message: 'Password reset link sent to email',
    devResetLink: resetUrl,
  };
};

export const resetPassword = async (token: string, newPassword: string) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  const salt = await bcrypt.genSalt(12);
  user.password = await bcrypt.hash(newPassword, salt);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  const newToken = generateToken({ id: user._id.toString(), role: user.role });
  return { token: newToken, message: 'Password reset successful' };
};

// Admin services
export const getAllUsers = async (page = 1, limit = 20, role?: string) => {
  // ✅ Use `any` for filter to avoid TypeScript issues with mongoose.FilterQuery
  const filter: any = {};
  if (role && ['user', 'admin', 'moderator'].includes(role)) {
    filter.role = role as 'user' | 'admin' | 'moderator';
  }

  const skip = (page - 1) * limit;
  const users = await User.find(filter)
    .select('-password')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(filter);

  return {
    users,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
};

export const getUserById = async (userId: string) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user;
};

export const updateUserRole = async (userId: string, role: string) => {
  if (!['user', 'admin', 'moderator'].includes(role)) {
    throw new AppError('Invalid role', 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.role = role as 'user' | 'admin' | 'moderator';
  await user.save();

  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
  };
};

export const deleteUser = async (userId: string, requestingUserId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user._id.toString() === requestingUserId) {
    throw new AppError('Cannot delete your own account via admin panel', 400);
  }

  await user.deleteOne();
  return { success: true, message: 'User deleted successfully' };
};