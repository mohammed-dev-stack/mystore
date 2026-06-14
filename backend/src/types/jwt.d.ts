// backend/src/types/jwt.d.ts
/**
 * Why this file?
 * - Extends the JwtPayload interface from jsonwebtoken with custom fields
 * - Provides type safety when working with decoded JWT tokens
 * - Used in auth middleware and token utility functions
 */

import { JwtPayload as BaseJwtPayload } from 'jsonwebtoken';

export interface JwtPayload extends BaseJwtPayload {
  id: string;        // User ID
  iat?: number;      // Issued at timestamp
  exp?: number;      // Expiration timestamp
}