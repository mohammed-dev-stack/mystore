// frontend/src/utils/validators.ts
/**
 * Why this utility?
 * - Centralized validation functions for forms and user input
 * - Reusable across components (login, register, checkout, profile)
 * - Provides email, password, phone, URL, and required field validation
 * - Returns boolean or detailed error messages
 */

/**
 * Validate email format
 * @param email - Email string
 * @returns True if valid email format
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
  const hasNumber = /\d/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  if (!hasNumber || !hasUpper || !hasLower) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    };
  }
  return { isValid: true };
};

/**
 * Check if passwords match
 * @param password - First password
 * @param confirmPassword - Second password
 * @returns True if match
 */
export const doPasswordsMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword;
};

/**
 * Validate phone number (basic international)
 * @param phone - Phone number string
 * @returns True if valid phone format
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
 * Check if all required fields are present and non-empty
 * @param obj - Object to check
 * @param fields - Array of field names
 * @returns True if all fields have truthy values
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
 * Validate postal/zip code (basic, alphanumeric with optional space/dash)
 * @param postalCode - Postal code string
 * @returns True if valid format
 */
export const isValidPostalCode = (postalCode: string): boolean => {
  const postalRegex = /^[A-Za-z0-9]{3,}(?:[-\s]?[A-Za-z0-9]{3,})?$/;
  return postalRegex.test(postalCode);
};

/**
 * Validate that a string is not empty after trim
 * @param value - String value
 * @returns True if non-empty
 */
export const isNotEmpty = (value: string): boolean => {
  return value.trim().length > 0;
};