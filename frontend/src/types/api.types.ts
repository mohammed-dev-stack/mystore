// frontend/src/types/api.types.ts
/**
 * Why this file?
 * - Centralized TypeScript types for API request/response structures
 * - Reusable pagination, error, and generic response types
 * - Used by all service files to ensure consistent API contracts
 */

// Generic API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

// Paginated response (used for products, users, orders lists)
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  totalPages: number;
  currentPage: number;
  count?: number;
}

// Error response from API
export interface ApiErrorResponse {
  success: false;
  message: string;
  stack?: string; // Only in development
  error?: any;
}

// Request query parameters for pagination and sorting
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
}

// Product search query parameters
export interface SearchParams extends PaginationParams {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
}

// Image upload request (base64)
export interface ImageUploadRequest {
  imageBase64: string;
  textHint?: string;
}

// Combined search request
export interface CombinedSearchRequest {
  textQuery?: string;
  imageBase64?: string;
}

// Chat message request
export interface ChatSendRequest {
  message: string;
  sessionId?: string;
  imageBase64?: string;
}

// Order creation request
export interface CreateOrderRequest {
  items: Array<{
    productId: string;
    quantity: number;
    selectedAttributes?: Record<string, string>;
  }>;
  shippingAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  billingAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  paymentMethod: 'stripe' | 'paypal' | 'cash_on_delivery';
  paymentMethodId?: string;
  customerNotes?: string;
}