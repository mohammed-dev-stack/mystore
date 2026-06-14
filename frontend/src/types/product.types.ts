// frontend/src/types/product.types.ts
/**
 * Why this file?
 * - Centralized TypeScript types/interfaces for product-related data
 * - Used across components, services, and contexts
 * - Ensures type safety and consistency in product data structures
 */

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
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
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
  createdBy: {
    _id: string;
    fullName: string;
    email: string;
  };
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  // Virtuals
  availableQuantity: number;
  isOnSale: boolean;
  discountPercent: number;
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

export interface ProductListResponse {
  success: boolean;
  products: Product[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface CreateProductData {
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

export interface UpdateProductData extends Partial<CreateProductData> {
  isActive?: boolean;
}