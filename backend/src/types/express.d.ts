// backend/src/types/express.d.ts
/**
 * Why this file?
 * - Extends Express Request type to include custom user property (attached by auth middleware)
 * - Ensures TypeScript recognizes req.user in controllers and middleware
 * - Provides type safety for the authenticated user object (IUser from User model)
 */

import { IUser } from '../models/user.model.ts';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}