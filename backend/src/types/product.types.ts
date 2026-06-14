// backend/src/types/product.types.ts
/**
 * Why this file?
 * - Centralized type definitions for product-related data
 * - Used across models, services, controllers, and validators
 * - Ensures consistency in product data structures
 * - Includes DTOs (Data Transfer Objects) for API responses
 */

// Product image variant sizes
export interface ProductImage {
  url: string;
  thumbnail: string;
  small: string;
  medium: string;
  alt: string;
  isPrimary: boolean;
}

// Inventory tracking
export interface Inventory {
  quantity: number;
  lowStockThreshold: number;
  reservedQuantity: number;
}

// Product dimensions (for shipping)
export interface Dimensions {
  length: number;
  width: number;
  height: number;
  unit: string; // 'cm', 'in'
}

// Rating distribution (how many 1-star, 2-star, etc.)
export interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

// Product ratings summary
export interface ProductRatings {
  average: number;
  count: number;
  distribution: RatingDistribution;
}

// SEO metadata for product page
export interface ProductSeo {
  title: string;
  description: string;
  keywords: string[];
}

// Full product interface (matches MongoDB document)
export interface IProductDocument {
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
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  // Virtuals
  availableQuantity: number;
  isOnSale: boolean;
  discountPercent: number;
}

// DTO for creating a product (admin input)
export interface CreateProductDto {
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  subcategory?: string;
  tags?: string[];
  images?: ProductImage[];
  inventory?: Partial<Inventory>;
  weight?: number;
  dimensions?: Dimensions;
  attributes?: Record<string, any>;
  seo?: Partial<ProductSeo>;
  isFeatured?: boolean;
}

// DTO for updating a product (admin input)
export interface UpdateProductDto extends Partial<CreateProductDto> {
  isActive?: boolean;
}

// DTO for product list response (paginated)
export interface ProductListResponse {
  products: IProductDocument[];
  total: number;
  totalPages: number;
  currentPage: number;
}

// Filter options for product queries
export interface ProductFilterOptions {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  tags?: string[];
}

// Sort options
export type ProductSortField = 'price' | 'createdAt' | 'views' | 'ratings.average' | 'name';
export type SortOrder = 'asc' | 'desc';
export interface ProductSortOptions {
  field: ProductSortField;
  order: SortOrder;
}