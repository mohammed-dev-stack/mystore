// frontend/src/components/common/SearchBar.tsx
/**
 * Why this component?
 * - Integrated search bar supporting text input + image upload (base64)
 * - Debounced text search to avoid excessive API calls
 * - Image preview and analysis using Ollama (via backend)
 * - Loading states for both text and image search
 * - FontAwesome icons for camera, search, close, spinner
 * - Responsive design (full width, adapts to container)
 * - Can be used on any page (home, store, search results)
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faCamera, faTimes, faSpinner, faImage } from '@fortawesome/free-solid-svg-icons';
import api from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';

interface SearchBarProps {
  initialQuery?: string;
  onSearch?: (results: any[], query: string, isImageSearch?: boolean) => void;
  className?: string;
  placeholder?: string;
}

const SearchBar = ({ initialQuery = '', onSearch, className = '', placeholder = 'Search products...' }: SearchBarProps) => {
  const [query, setQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageSearching, setIsImageSearching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 500);

  // Debounced text search
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      performTextSearch(debouncedQuery);
    }
  }, [debouncedQuery]);

  const performTextSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    try {
      const response = await api.get(`/search?q=${encodeURIComponent(searchQuery)}&limit=20`);
      if (onSearch) {
        onSearch(response.data.data, searchQuery, false);
      } else {
        navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      }
    } catch (error) {
      console.error('Text search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const performImageSearch = async (base64Image: string) => {
    setIsImageSearching(true);
    try {
      const response = await api.post('/search/image', { imageBase64: base64Image });
      const extractedDescription = response.data.extractedDescription || 'image search';
      const results = response.data.data || [];
      if (onSearch) {
        onSearch(results, extractedDescription, true);
      } else {
        navigate(`/search?q=${encodeURIComponent(extractedDescription)}&fromImage=true`);
      }
    } catch (error) {
      console.error('Image search failed:', error);
      alert('Image analysis failed. Please try a different image or use text search.');
    } finally {
      setIsImageSearching(false);
      clearImage();
    }
  };

  const handleTextInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault();
      performTextSearch(query);
    } else if (e.key === 'Escape') {
      clearSearch();
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSelectedImage(null);
    setImagePreview(null);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, WEBP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image too large (max 5MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      setSelectedImage(base64 ?? null);
      setImagePreview(event.target?.result as string);
      performImageSearch(base64 ?? "");
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <div className="relative flex items-center bg-white dark:bg-gray-800 rounded-full shadow-md border border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition">
        <div className="absolute left-4 text-gray-400">
          {isLoading ? (
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
          ) : (
            <FontAwesomeIcon icon={faSearch} />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleTextInput}
          onKeyDown={handleKeyDown}
          placeholder={selectedImage ? 'Image ready for search...' : placeholder}
          className="w-full pl-10 pr-24 py-3 bg-transparent rounded-full focus:outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400"
          disabled={isImageSearching}
        />

        {imagePreview && (
          <div className="absolute right-14 flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-1">
            <img src={imagePreview} alt="preview" className="w-6 h-6 rounded-full object-cover" />
            <button onClick={clearImage} className="text-gray-500 hover:text-red-500">
              <FontAwesomeIcon icon={faTimes} size="sm" />
            </button>
          </div>
        )}

        <button
          onClick={triggerFileInput}
          disabled={isImageSearching}
          className={`absolute right-3 flex items-center justify-center w-8 h-8 rounded-full transition ${
            isImageSearching
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
          }`}
          aria-label="Search by image"
        >
          {isImageSearching ? (
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-gray-500" />
          ) : (
            <FontAwesomeIcon icon={faCamera} className="text-gray-600 dark:text-gray-300" />
          )}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
        />
      </div>

      {isImageSearching && (
        <div className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400 animate-pulse">
          <FontAwesomeIcon icon={faImage} className="mr-1" />
          Analyzing image with AI...
        </div>
      )}
      {selectedImage && !isImageSearching && !imagePreview && (
        <div className="mt-2 text-center text-sm text-green-600">
          Image ready. Click search icon to analyze.
        </div>
      )}
    </div>
  );
};

export default SearchBar;