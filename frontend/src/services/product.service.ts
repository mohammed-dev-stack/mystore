// frontend/src/services/product.service.ts
/**
 * Why this service?
 * - Centralized product API calls (list, details, create, update, delete)
 * - Provides typed methods for fetching products with filters, pagination
 * - Used by Store page, Home page (featured), ProductCard, Dashboard
 * - Handles image uploads, inventory management, and admin operations
 */

import api from './api';

export interface ProductImage {
  url: string;
  thumbnail: string;
  small: string;
  medium: string;
  alt: string;
  isPrimary: boolean;
}

export interface Inventory {
  quantity: number;
  lowStockThreshold: number;
  reservedQuantity: number;
}

export interface Dimensions {
  length: number;
  width: number;
  height: number;
  unit: string;
}

export interface ProductRatings {
  average: number;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface ProductSeo {
  title: string;
  description: string;
  keywords: string[];
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice: number | null;
  category: string;
  subcategory: string | null;
  tags: string[];
  images: ProductImage[];
  inventory: Inventory;
  weight: number;
  dimensions: Dimensions;
  attributes: Record<string, any>;
  ratings: ProductRatings;
  isActive: boolean;
  isFeatured: boolean;
  views: number;
  seo: ProductSeo;
  createdBy: { _id: string; fullName: string; email: string };
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  // Virtuals
  availableQuantity: number;
  isOnSale: boolean;
  discountPercent: number;
}

export interface ProductsResponse {
  success: boolean;
  products: Product[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  page?: number;
  limit?: number;
  sort?: string;
}

export const getProducts = async (filters: ProductFilters = {}): Promise<ProductsResponse> => {
  const params = new URLSearchParams();
  if (filters.category) params.append('category', filters.category);
  if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
  if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
  if (filters.search) params.append('search', filters.search);
  if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
  if (filters.isFeatured !== undefined) params.append('isFeatured', filters.isFeatured.toString());
  if (filters.tags?.length) params.append('tags', filters.tags.join(','));
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.sort) params.append('sort', filters.sort);
  const response = await api.get(`/products?${params.toString()}`);
  return response.data;
};

export const getProductById = async (id: string): Promise<{ success: boolean; data: Product }> => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const getProductBySlug = async (slug: string): Promise<{ success: boolean; data: Product }> => {
  const response = await api.get(`/products/slug/${slug}`);
  return response.data;
};

export const getFeaturedProducts = async (limit = 8): Promise<{ success: boolean; data: Product[] }> => {
  const response = await api.get(`/products/featured?limit=${limit}`);
  return response.data;
};

export const getProductsByCategory = async (
  category: string,
  page = 1,
  limit = 20
): Promise<{ success: boolean; products: Product[]; total: number; totalPages: number; currentPage: number }> => {
  const response = await api.get(`/products/category/${category}?page=${page}&limit=${limit}`);
  return response.data;
};

export const createProduct = async (productData: Partial<Product>): Promise<{ success: boolean; data: Product }> => {
  const response = await api.post('/products', productData);
  return response.data;
};

export const updateProduct = async (id: string, productData: Partial<Product>): Promise<{ success: boolean; data: Product }> => {
  const response = await api.put(`/products/${id}`, productData);
  return response.data;
};

export const deleteProduct = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};

export const getLowStockProducts = async (threshold = 5): Promise<{ success: boolean; data: Product[] }> => {
  const response = await api.get(`/products/admin/low-stock?threshold=${threshold}`);
  return response.data;
};