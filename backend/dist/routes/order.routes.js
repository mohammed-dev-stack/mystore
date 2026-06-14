// backend/src/routes/order.routes.ts
/**
 * Why these routes?
 * - Create order: POST for checkout process (protected, requires auth)
 * - Get user orders: GET /my-orders for customer order history
 * - Get single order: GET /:id for order details
 * - Admin routes: GET all orders, update status, cancel order (admin)
 * - Payment webhook: POST for Stripe/PayPal callbacks (public, signature verified in controller)
 */
import express from 'express';
import { createOrder, getUserOrders, getOrderById, getAllOrders, updateOrderStatus, cancelOrder, paymentWebhook, } from '../controllers/order.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
const router = express.Router();
// Protected user routes
router.post('/', protect, createOrder);
router.get('/my-orders', protect, getUserOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/cancel', protect, cancelOrder);
// Admin only routes
router.get('/admin/all', protect, adminOnly, getAllOrders);
router.put('/admin/:id/status', protect, adminOnly, updateOrderStatus);
// Public webhook (no auth, signature validation inside controller)
// Must use express.raw for Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), paymentWebhook);
export default router;
//# sourceMappingURL=order.routes.js.map