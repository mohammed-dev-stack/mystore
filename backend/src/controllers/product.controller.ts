// backend/src/controllers/product.controller.ts
/**
 * Why this controller?
 * - HTTP request/response handling for product CRUD and filtering
 * - Calls product service for business logic
 * - Validates query parameters and request body
 * - Uses catchAsync wrapper to centralize error handling
 */

import { Request, Response, NextFunction } from 'express';
import * as productService from '../services/product.service.js';
import { RESTRICTED_CATEGORIES } from '../constants/categories.js';
import { catchAsync } from '../middleware/error.middleware.js';

const ensureString = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
};

/**
 * Get all products with filtering, pagination, and sorting
 */
export const getAllProducts = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const category = req.query.category as string | undefined;
  const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
  const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
  const search = req.query.search as string | undefined;
  const isActive = req.query.isActive !== 'false';
  const isFeatured = req.query.isFeatured === 'true';
  const tags = req.query.tags ? (req.query.tags as string).split(',') : undefined;
  const sort = req.query.sort as string | undefined;

  const result = await productService.getAllProducts(
    { category, minPrice, maxPrice, search, isActive, isFeatured, tags },
    { page, limit, sort }
  );

  res.set('Cache-Control', 'public, max-age=60');
  res.status(200).json({ success: true, ...result });
});

/**
 * Get a single product by its MongoDB ID
 */
export const getProductById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const id = ensureString(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, message: 'Invalid product ID' });
    return;
  }
  const product = await productService.getProductById(id);
  res.status(200).json({ success: true, data: product });
});

/**
 * Get a single product by its SEO-friendly slug
 */
export const getProductBySlug = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const slug = ensureString(req.params.slug);
  if (!slug) {
    res.status(400).json({ success: false, message: 'Invalid product slug' });
    return;
  }
  const product = await productService.getProductBySlug(slug);
  res.status(200).json({ success: true, data: product });
});

/**
 * Create a new product (admin only)
 */
export const createProduct = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // `req.user` is guaranteed by `protect` + `adminOnly` middleware
  const userId = req.user!._id.toString();
  const product = await productService.createProduct(req.body, userId);
  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product,
  });
});

/**
 * Update an existing product (admin only)
 */
export const updateProduct = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const id = ensureString(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, message: 'Invalid product ID' });
    return;
  }
  const userId = req.user!._id.toString();
  const updated = await productService.updateProduct(id, req.body, userId);
  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: updated,
  });
});

/**
 * Delete a product (admin only)
 */
export const deleteProduct = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const id = ensureString(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, message: 'Invalid product ID' });
    return;
  }
  await productService.deleteProduct(id);
  res.status(200).json({
    success: true,
    message: 'Product deleted permanently',
  });
});

/**
 * Get featured products (shown on home page)
 */
export const getFeaturedProducts = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const limit = parseInt(req.query.limit as string) || 8;
  const products = await productService.getFeaturedProducts(limit);
  res.status(200).json({ success: true, data: products });
});

/**
 * Get products by category (with pagination)
 * Restricted categories are filtered out
 */
export const getProductsByCategory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const category = ensureString(req.params.category);
  if (!category || RESTRICTED_CATEGORIES.includes(category)) {
    res.status(400).json({ success: false, message: 'Category not available' });
    return;
  }
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await productService.getProductsByCategory(category, page, limit);
  res.status(200).json({ success: true, ...result });
});

/**
 * Get low stock products (admin only, for inventory monitoring)
 */
export const getLowStockProducts = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const threshold = parseInt(req.query.threshold as string) || 5;
  const products = await productService.getLowStockProducts(threshold);
  res.status(200).json({ success: true, data: products });
});