// backend/src/utils/hash.ts
/**
 * Why this utility?
 * - Centralized password hashing and comparison functions
 * - Uses bcryptjs with configurable salt rounds
 * - Can be used for any password-like hashing needs (reset tokens, API keys)
 * - Separates hashing logic from models or services for testability
 */

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash a plain text password
 * @param plainPassword - The password to hash
 * @returns Promise resolving to hashed password
 */
export const hashPassword = async (plainPassword: string): Promise<string> => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(plainPassword, salt);
};

/**
 * Compare a plain text password with a hash
 * @param plainPassword - The password to verify
 * @param hashedPassword - The stored hash
 * @returns Promise resolving to true if match, false otherwise
 */
export const comparePassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hashedPassword);
};