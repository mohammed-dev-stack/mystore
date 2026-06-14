// backend/src/utils/validators.ts
/**
 * Why this utility?
 * - Centralized validation functions for common data types (email, password, phone, etc.)
 * - Reusable across controllers, services, and middleware
 * - Helps maintain consistency and reduces duplication
 * - Returns boolean or throws with specific error messages
 */

/**
 * Validate email format
 * @param email - Email string to validate
 * @returns True if valid, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param password - Password string
 * @returns Object with isValid and optional message
 */
export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  return { isValid: true };
};

/**
 * Validate required fields exist and are not empty strings
 * @param obj - Object to check
 * @param fields - Array of field names
 * @returns True if all fields present and non-empty, false otherwise
 */
export const hasRequiredFields = (obj: Record<string, any>, fields: string[]): boolean => {
  for (const field of fields) {
    const value = obj[field];
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
      return false;
    }
  }
  return true;
};

/**
 * Validate MongoDB ObjectId format (basic)
 * @param id - String to check
 * @returns True if looks like a valid ObjectId (24 hex chars)
 */
export const isValidObjectId = (id: string): boolean => {
  return /^[a-fA-F0-9]{24}$/.test(id);
};

/**
 * Validate phone number (basic international format)
 * @param phone - Phone number string
 * @returns True if valid
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,6}[-\s\.]?[0-9]{1,6}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate URL format
 * @param url - URL string
 * @returns True if valid URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate price (positive number with max 2 decimal places)
 * @param price - Number or string
 * @returns True if valid price
 */
export const isValidPrice = (price: any): boolean => {
  const num = parseFloat(price);
  if (isNaN(num)) return false;
  if (num < 0) return false;
  const decimalMatch = price.toString().match(/\.(\d+)$/);
  if (decimalMatch && decimalMatch[1].length > 2) return false;
  return true;
};