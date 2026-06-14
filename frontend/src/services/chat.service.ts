// frontend/src/services/chat.service.ts
/**
 * Why this service?
 * - Centralized chat API calls (send message, history, sessions, delete)
 * - Provides typed methods for AI chat functionality
 * - Used by ChatWidget and Chat page components
 * - Handles session management and message history
 * - v3: Enhanced enrichment with batch product fetching and better error handling
 */

import api from './api';
import type { Product } from './product.service';

// ------------------------------
// Type Definitions
// ------------------------------

/**
 * Search result can be either a product ID with score or a full product object.
 * For immediate display, we prefer full product objects.
 */
export type SearchResultItem = 
  | { productId: string; score: number }
  | Product;

export interface ChatMessage {
  _id: string;
  sessionId: string;
  sender: 'user' | 'ai';
  message: string;
  createdAt: string;
  triggeredSearch?: boolean;
  searchResults?: SearchResultItem[];
  aiModel?: string;
}

export interface SendMessageResponse {
  success: boolean;
  sessionId: string;
  userMessage: ChatMessage;
  aiMessage: ChatMessage;
}

export interface ChatSession {
  sessionId: string;
  lastMessage: string;
  lastMessageDate: string;
  messageCount: number;
}

export interface ConversationHistoryResponse {
  success: boolean;
  sessionId: string;
  count: number;
  data: ChatMessage[];
}

export interface SessionsResponse {
  success: boolean;
  count: number;
  data: ChatSession[];
}

// ------------------------------
// Helper Functions
// ------------------------------

/**
 * Type guard: Check if a search result is a full product object.
 */
export const isFullProduct = (item: SearchResultItem): item is Product => {
  return (item as Product).name !== undefined && (item as Product).price !== undefined;
};

/**
 * Extract product ID from a search result (whether ID object or full product).
 */
export const extractProductId = (item: SearchResultItem): string => {
  if (isFullProduct(item)) return item._id;
  return item.productId;
};

/**
 * Fetch a single product by ID (used by enrichSearchResults).
 * This avoids circular dependency with product.service.ts.
 */
export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const response = await api.get(`/products/${id}`);
    return response.data.data as Product;
  } catch (error) {
    console.error(`Failed to fetch product ${id}:`, error);
    return null;
  }
};

/**
 * Batch fetch products by IDs using individual requests (fallback).
 * In a production environment, consider a batch endpoint like POST /products/batch.
 */
export const batchGetProducts = async (ids: string[]): Promise<Product[]> => {
  const results = await Promise.allSettled(ids.map(id => getProductById(id)));
  return results
    .filter((result): result is PromiseFulfilledResult<Product> => result.status === 'fulfilled' && result.value !== null)
    .map(result => result.value);
};

/**
 * Enrich search results by fetching full product details if only IDs are provided.
 * Returns the same array if already enriched.
 */
export const enrichSearchResults = async (results: SearchResultItem[]): Promise<Product[]> => {
  if (!results.length) return [];

  // Check if already enriched (first item is a full product)
  const firstItem = results[0];
  if (firstItem && isFullProduct(firstItem)) {
    return results as Product[];
  }

  // Extract product IDs
  const productIds = results.map(extractProductId).filter(Boolean);
  if (productIds.length === 0) return [];

  // Fetch products in batch
  const products = await batchGetProducts(productIds);
  return products;
};

// ------------------------------
// API Methods
// ------------------------------

/**
 * Send a message to the AI assistant.
 * @param message - User message text
 * @param sessionId - Optional existing session ID (creates new if not provided)
 * @param imageBase64 - Optional base64 image for analysis
 */
export const sendMessage = async (
  message: string,
  sessionId?: string,
  imageBase64?: string
): Promise<SendMessageResponse> => {
  const response = await api.post('/chat/send', { message, sessionId, imageBase64 });
  return response.data;
};

/**
 * Get conversation history for a specific session.
 * @param sessionId - Chat session ID
 */
export const getConversationHistory = async (sessionId: string): Promise<ConversationHistoryResponse> => {
  const response = await api.get(`/chat/history/${sessionId}`);
  return response.data;
};

/**
 * Get all chat sessions for the current user.
 */
export const getUserSessions = async (): Promise<SessionsResponse> => {
  const response = await api.get('/chat/sessions');
  return response.data;
};

/**
 * Delete a specific chat session.
 * @param sessionId - Chat session ID
 */
export const deleteSession = async (sessionId: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/chat/session/${sessionId}`);
  return response.data;
};

/**
 * Clear all chat history for the current user.
 */
export const clearAllHistory = async (): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete('/chat/history');
  return response.data;
};