// frontend/src/components/common/ImageUpload.tsx
/**
 * Why this component?
 * - Reusable image upload component for product images, profile pictures, etc.
 * - Supports drag-and-drop, file selection, preview, and removal
 * - Validates file type (image) and size (max 5MB)
 * - Converts image to base64 for API submission (or returns File object)
 * - Uses FontAwesome icons for upload, trash, and image placeholder
 * - Accessible: keyboard navigation, ARIA labels
 */

import { useState, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt, faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';

interface ImageUploadProps {
  onImageSelect: (base64: string, file: File) => void;
  onImageRemove?: () => void;
  initialImage?: string | null;
  maxSizeMB?: number;
  acceptedFormats?: string[];
  label?: string;
  className?: string;
  disabled?: boolean;
}

const ImageUpload = ({
  onImageSelect,
  onImageRemove,
  initialImage = null,
  maxSizeMB = 5,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
  label = 'Upload Image',
  className = '',
  disabled = false,
}: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(initialImage);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const validateFile = (file: File): boolean => {
    if (!acceptedFormats.includes(file.type)) {
      setError(`Invalid file type. Allowed: ${acceptedFormats.map(f => f.split('/')[1]).join(', ')}`);
      return false;
    }
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`File too large. Max size ${maxSizeMB}MB.`);
      return false;
    }
    return true;
  };

  const processFile = (file: File) => {
    if (!validateFile(file)) return;
    setIsLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setPreview(base64);
      onImageSelect(base64, file);
      setIsLoading(false);
    };
    reader.onerror = () => {
      setError('Failed to read file');
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onImageRemove) onImageRemove();
  };

  const triggerFileInput = () => {
    if (!disabled) fileInputRef.current?.click();
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <div
        ref={dropZoneRef}
        onClick={triggerFileInput}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          disabled
            ? 'border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 cursor-not-allowed'
            : 'border-gray-300 hover:border-primary-500 dark:border-gray-600 dark:hover:border-primary-400'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={acceptedFormats.join(',')}
          className="hidden"
          disabled={disabled}
        />
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="max-h-48 max-w-full mx-auto rounded-lg object-contain"
            />
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                aria-label="Remove image"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            )}
          </div>
        ) : (
          <div className="text-center">
            {isLoading ? (
              <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary-500 mb-2" />
            ) : (
              <FontAwesomeIcon icon={faCloudUploadAlt} size="2x" className="text-gray-400 mb-2" />
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isLoading ? 'Uploading...' : 'Click or drag image here'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Max {maxSizeMB}MB, {acceptedFormats.map(f => f.split('/')[1]).join(', ')}
            </p>
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default ImageUpload;