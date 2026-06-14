// backend/src/services/token.service.ts
/**
 * Why this service?
 * - Centralized JWT token generation and verification
 * - Separates token logic from middleware for better testability
 * - Used by auth.service.ts and optionally by auth.middleware
 * - Provides typed payload interface
 */
import jwt from 'jsonwebtoken';
/**
 * Generate a JWT token for a user
 * @param payload - object containing user id and role
 * @returns signed JWT token string
 */
export const generateToken = (payload) => {
    return jwt.sign({ id: payload.id, role: payload.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};
/**
 * Verify and decode a JWT token
 * @param token - JWT token string
 * @returns decoded payload or null if invalid
 */
export const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    }
    catch {
        return null;
    }
};
//# sourceMappingURL=token.service.js.map