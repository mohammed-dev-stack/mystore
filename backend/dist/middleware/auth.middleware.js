// backend/src/middleware/auth.middleware.ts
/**
 * Why this middleware?
 * - Authentication middleware: protect routes, admin-only access, optional auth
 * - Uses token.service.ts for JWT operations (separation of concerns)
 * - No longer contains generateToken (moved to token.service)
 * - Uses Express Request type augmentation (src/types/express.d.ts) for `user` property
 */
import User from '../models/user.model.js';
import { verifyToken } from '../services/token.service.js';
import logger from '../utils/logger.js';
// Note: The Express Request type is extended in src/types/express.d.ts to include `user` property.
// This eliminates the need for `(req as any).user`.
/**
 * Middleware to protect routes that require authentication.
 * Extracts JWT from Authorization header, verifies it, and attaches user to req.user.
 * If token is invalid or user not found, returns 401.
 */
export const protect = async (req, res, next) => {
    try {
        let token;
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer')) {
            token = authHeader.split(' ')[1];
        }
        if (!token) {
            res.status(401).json({ success: false, message: 'Not authorized, no token' });
            return;
        }
        const decoded = verifyToken(token);
        if (!decoded || !decoded.id) {
            res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
            return;
        }
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            res.status(401).json({ success: false, message: 'User not found' });
            return;
        }
        // Attach user to request (type augmentation ensures req.user is typed)
        req.user = user;
        next();
    }
    catch (error) {
        logger.error('Auth middleware error:', error);
        res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
};
/**
 * Middleware to restrict access to admin users only.
 * Must be used after `protect` middleware.
 */
export const adminOnly = (req, res, next) => {
    const user = req.user;
    if (!user || user.role !== 'admin') {
        res.status(403).json({ success: false, message: 'Admin access required' });
        return;
    }
    next();
};
/**
 * Optional authentication middleware.
 * If token is present and valid, attaches user to req.user.
 * If token is missing or invalid, proceeds without user (does not block).
 */
export const optionalAuth = async (req, _res, next) => {
    try {
        let token;
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer')) {
            token = authHeader.split(' ')[1];
        }
        if (token) {
            const decoded = verifyToken(token);
            if (decoded?.id) {
                const user = await User.findById(decoded.id).select('-password');
                if (user) {
                    req.user = user;
                }
            }
        }
        next();
    }
    catch (error) {
        // On any error, proceed without user (optional auth)
        next();
    }
};
//# sourceMappingURL=auth.middleware.js.map