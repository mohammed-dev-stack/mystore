// frontend/src/services/search.service.ts
/**
 * Why this service?
 * - Centralized search API calls (text, image, combined, autocomplete)
 * - Provides typed methods for search operations
 * - Supports text search, image-based search (using Ollama), and combined search
 * - Used by SearchBar component and SearchResults page
 */

import api from './api';

export interface ProductSearchResult {
  _id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  images?: Array<{ thumbnail?: string; isPrimary?: boolean }>;
  inventory?: { quantity: number };
  ratings?: { average: number; count: number };
}

export interface TextSearchResponse {
  success: boolean;
  count: number;
  query: string;
  data: ProductSearchResult[];
}

export interface ImageSearchResponse {
  success: boolean;
  count: number;
  extractedDescription: string | null;
  usedQuery: string;
  data: ProductSearchResult[];
}

export interface CombinedSearchResponse {
  success: boolean;
  count: number;
  extractedDescription: string | null;
  usedQuery: string;
  data: ProductSearchResult[];
}

export interface AutocompleteResponse {
  success: boolean;
  data: Array<{ _id: string; name: string; slug: string; images?: string[] }>;
}

/**
 * Text search by keyword
 * @param query - Search keyword
 * @param limit - Max results (default 20)
 */
export const textSearch = async (query: string, limit = 20): Promise<TextSearchResponse> => {
  const response = await api.get(`/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  return response.data;
};

/**
 * Image search: upload base64 image, analyze with Ollama, then search products
 * @param imageBase64 - Base64 encoded image (without data prefix)
 * @param textHint - Optional text hint to combine with image analysis
 */
export const imageSearch = async (imageBase64: string, textHint?: string): Promise<ImageSearchResponse> => {
  const response = await api.post('/search/image', { imageBase64, textHint });
  return response.data;
};

/**
 * Combined search: text + optional image
 * @param textQuery - Text search query
 * @param imageBase64 - Optional base64 image
 */
export const combinedSearch = async (textQuery?: string, imageBase64?: string): Promise<CombinedSearchResponse> => {
  const response = await api.post('/search/combined', { textQuery, imageBase64 });
  return response.data;
};

/**
 * Autocomplete suggestions (fast prefix matching)
 * @param prefix - Partial product name (min 2 chars)
 * @param limit - Max suggestions (default 5)
 */
export const autocomplete = async (prefix: string, limit = 5): Promise<AutocompleteResponse> => {
  const response = await api.get(`/search/suggest?q=${encodeURIComponent(prefix)}&limit=${limit}`);
  return response.data;
};