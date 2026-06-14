// backend/src/routes/auth.routes.ts
/**
 * Why these routes?
 * - Public routes: register, login, forgot-password, reset-password
 * - Protected routes: profile, change-password, logout (require authentication)
 * - Admin routes: get all users, get user by id, update role, delete user
 * - Uses protect, adminOnly middleware for authorization
 */
import express from 'express';
import { register, login, getProfile, updateProfile, changePassword, forgotPassword, resetPassword, logout, getAllUsers, getUserById, updateUserRole, deleteUser, } from '../controllers/auth.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
const router = express.Router();
// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
// Protected routes (require authentication)
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/change-password', protect, changePassword);
router.post('/logout', protect, logout);
// Admin-only routes
router.get('/admin/users', protect, adminOnly, getAllUsers);
router.get('/admin/users/:id', protect, adminOnly, getUserById);
router.put('/admin/users/:id/role', protect, adminOnly, updateUserRole);
router.delete('/admin/users/:id', protect, adminOnly, deleteUser);
export default router;
//# sourceMappingURL=auth.routes.js.map