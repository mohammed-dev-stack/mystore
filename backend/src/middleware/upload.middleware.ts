// backend/src/middleware/upload.middleware.ts
/**
 * Why this middleware?
 * - Handles multipart/form-data file uploads (product images, profile pictures)
 * - Memory storage: keeps file in buffer (no disk I/O, faster for base64 conversion)
 * - File validation: size limit (5MB), allowed MIME types (images)
 * - Custom error handler for Multer errors (LIMIT_FILE_SIZE, LIMIT_FILE_COUNT, etc.)
 * - Supports single file upload (field 'image') and multiple files (field 'images', max 5)
 * - Provides utility to convert buffer to base64 for Ollama API
 * - Fully typed error handling (no `any`)
 */

import multer, { MulterError } from 'multer';
import { Request, Response, NextFunction } from 'express';

// Allowed image MIME types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'] as const;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Configure memory storage (no disk writing)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype as typeof ALLOWED_MIME_TYPES[number])) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WEBP images are allowed.'));
  }
};

/**
 * Type guard to check if an error is a MulterError
 */
const isMulterError = (err: unknown): err is MulterError => {
  return err instanceof MulterError;
};

/**
 * Multer instance for single image upload (field name: 'image')
 */
export const uploadSingle = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
}).single('image');

/**
 * Multer instance for multiple images (field name: 'images', max 5)
 */
export const uploadMultiple = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
}).array('images', 5);

/**
 * Middleware to handle Multer errors gracefully.
 * Must be used after uploadSingle or uploadMultiple.
 */
export const handleUploadError = (err: unknown, req: Request, res: Response, next: NextFunction): void => {
  if (isMulterError(err)) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ success: false, message: 'File too large. Max size 5MB.' });
      return;
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({ success: false, message: 'Too many files. Max 5 allowed.' });
      return;
    }
    res.status(400).json({ success: false, message: err.message });
    return;
  }
  if (err) {
    // Generic error (could be from fileFilter)
    const errorMessage = err instanceof Error ? err.message : 'Upload failed';
    res.status(400).json({ success: false, message: errorMessage });
    return;
  }
  next();
};

/**
 * Convert uploaded file buffer to base64 string with data URL prefix (for frontend display)
 * @param buffer - File buffer
 * @param mimeType - MIME type of the file (e.g., 'image/jpeg')
 * @returns Base64 data URL string
 */
export const bufferToBase64 = (buffer: Buffer, mimeType: string): string => {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
};

/**
 * Convert buffer to raw base64 string (without data: prefix) for Ollama API
 * @param buffer - File buffer
 * @returns Raw base64 string
 */
export const bufferToRawBase64 = (buffer: Buffer): string => {
  return buffer.toString('base64');
};