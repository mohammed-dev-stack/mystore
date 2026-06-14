/**
 * Why these routes?
 * - Public GET endpoints: list, single product by id/slug, featured, category
 * - Protected POST/PUT/DELETE endpoints: require authentication + admin role
 * - GET /admin/low-stock: admin only for inventory monitoring
 * - Uses protect and adminOnly middleware from auth middleware
 */
import express from 'express';
import { getAllProducts, getProductById, getProductBySlug, createProduct, updateProduct, deleteProduct, getFeaturedProducts, getProductsByCategory, getLowStockProducts, } from '../controllers/product.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
const router = express.Router();
// Public routes
router.get('/', getAllProducts);
router.get('/featured', getFeaturedProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProductById);
// Admin-only routes (create, update, delete, low-stock)
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);
router.get('/admin/low-stock', protect, adminOnly, getLowStockProducts);
export default router;
//# sourceMappingURL=product.routes.js.map