// backend/src/utils/imageHelper.ts
/**
 * Why this utility?
 * - Centralized image processing functions
 * - Resize and optimize images for product thumbnails (responsive)
 * - Convert buffers to base64 for Ollama API
 * - Validate image size and format before processing
 * - Uses sharp library for high-performance image manipulation
 * - In production, could integrate with cloud storage (S3, Cloudinary)
 */
import sharp from 'sharp';
import { AppError } from '../middleware/error.middleware.js';
// Default thumbnail sizes for product images
export const THUMBNAIL_SIZES = {
    thumbnail: { width: 150, height: 150, fit: 'cover' },
    small: { width: 300, height: 300, fit: 'cover' },
    medium: { width: 600, height: 600, fit: 'contain' },
    large: { width: 1200, height: 1200, fit: 'contain' },
};
// ✅ إضافة ثابت MIME types مستخدم فعلاً في validateImage
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
/**
 * Validate image buffer (size, type)
 * @param buffer - Image buffer
 * @param mimeType - MIME type of the image (e.g., 'image/jpeg')
 * @returns boolean
 * @throws AppError if invalid
 */
export const validateImage = (buffer, mimeType) => {
    if (buffer.length > MAX_IMAGE_SIZE) {
        throw new AppError(`Image too large. Max size ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`, 400);
    }
    if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType)) {
        throw new AppError(`Invalid image type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`, 400);
    }
    return true;
};
/**
 * Resize a single image to specified dimensions
 * @param buffer - Input image buffer
 * @param options - Resize options
 * @returns Processed image buffer
 */
export const resizeImage = async (buffer, options) => {
    const { width, height, fit = 'cover', quality = 80, format = 'jpeg' } = options;
    let pipeline = sharp(buffer);
    if (width || height) {
        pipeline = pipeline.resize(width, height, { fit });
    }
    switch (format) {
        case 'jpeg':
            pipeline = pipeline.jpeg({ quality });
            break;
        case 'png':
            pipeline = pipeline.png({ quality });
            break;
        case 'webp':
            pipeline = pipeline.webp({ quality });
            break;
        default:
            pipeline = pipeline.jpeg({ quality });
    }
    return pipeline.toBuffer();
};
/**
 * Generate multiple thumbnail sizes for a product image
 * @param buffer - Original image buffer
 * @returns Object containing buffers for each size
 */
export const generateThumbnails = async (buffer) => {
    const [thumbnail, small, medium] = await Promise.all([
        resizeImage(buffer, {
            width: THUMBNAIL_SIZES.thumbnail.width,
            height: THUMBNAIL_SIZES.thumbnail.height,
            fit: THUMBNAIL_SIZES.thumbnail.fit,
            quality: 70,
            format: 'webp',
        }),
        resizeImage(buffer, {
            width: THUMBNAIL_SIZES.small.width,
            height: THUMBNAIL_SIZES.small.height,
            fit: THUMBNAIL_SIZES.small.fit,
            quality: 80,
            format: 'webp',
        }),
        resizeImage(buffer, {
            width: THUMBNAIL_SIZES.medium.width,
            height: THUMBNAIL_SIZES.medium.height,
            fit: THUMBNAIL_SIZES.medium.fit,
            quality: 85,
            format: 'webp',
        }),
    ]);
    return { thumbnail, small, medium, original: buffer };
};
/**
 * Convert image buffer to base64 string (with data URL prefix)
 * @param buffer - Image buffer
 * @param mimeType - MIME type (e.g., 'image/jpeg')
 * @returns Base64 data URL
 */
export const bufferToBase64 = (buffer, mimeType) => {
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
};
/**
 * Convert image buffer to raw base64 (without prefix) for Ollama
 * @param buffer - Image buffer
 * @returns Raw base64 string
 */
export const bufferToRawBase64 = (buffer) => {
    return buffer.toString('base64');
};
/**
 * Get image metadata (width, height, format)
 * @param buffer - Image buffer
 * @returns Metadata object
 */
export const getImageMetadata = async (buffer) => {
    return sharp(buffer).metadata();
};
/**
 * Extract dominant color from image (for UI placeholders)
 * @param buffer - Image buffer
 * @returns Hex color string (e.g., '#8B4513')
 */
export const getDominantColor = async (buffer) => {
    const { dominant } = await sharp(buffer).stats();
    const r = Math.round(dominant.r);
    const g = Math.round(dominant.g);
    const b = Math.round(dominant.b);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};
//# sourceMappingURL=imageHelper.js.map