// backend/src/services/token.service.ts
/**
 * Why this service?
 * - Centralized JWT token generation and verification
 * - Separates token logic from middleware for better testability
 * - Used by auth.service.ts and optionally by auth.middleware
 * - Provides typed payload interface
 */

import jwt from 'jsonwebtoken';

export interface TokenPayload {
  id: string;
  role: string;
}

/**
 * Generate a JWT token for a user
 * @param payload - object containing user id and role
 * @returns signed JWT token string
 */
export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(
    { id: payload.id, role: payload.role },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRE || '7d' } as jwt.SignOptions
  );
};

/**
 * Verify and decode a JWT token
 * @param token - JWT token string
 * @returns decoded payload or null if invalid
 */
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
};