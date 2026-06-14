// backend/src/controllers/order.controller.ts
/**
 * Why this controller?
 * - Handles HTTP requests for order management (create, view, cancel, admin)
 * - Calls order service for business logic (inventory, payment, order creation)
 * - Validates input data (items, addresses, payment method)
 * - Formats responses and passes errors to errorHandler
 * - Webhook endpoint for payment gateways (raw body, signature verification)
 * - Uses catchAsync to centralize error handling
 */

import { Request, Response, NextFunction } from 'express';
import * as orderService from '../services/order.service.js';
import { catchAsync } from '../middleware/error.middleware.js';
import logger from '../utils/logger.js';

// Helper to ensure param is string (not array)
const ensureString = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
};

// Extend Express Request type for rawBody (set by express.raw middleware)
interface RequestWithRawBody extends Request {
  rawBody?: string;
}

/**
 * Create a new order (protected)
 */
export const createOrder = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user._id) {
    res.status(401).json({ success: false, message: 'User not authenticated' });
    return;
  }

  const userId = req.user._id.toString();
  const {
    items,
    shippingAddress,
    billingAddress,
    paymentMethod,
    paymentMethodId,
    customerNotes,
  } = req.body;

  // Validate items
  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ success: false, message: 'No items in cart or invalid items format' });
    return;
  }

  // Validate shipping address
  if (!shippingAddress?.street || !shippingAddress?.city || !shippingAddress?.postalCode || !shippingAddress?.country) {
    res.status(400).json({ success: false, message: 'Complete shipping address is required' });
    return;
  }

  // Validate payment method
  if (!paymentMethod) {
    res.status(400).json({ success: false, message: 'Payment method is required' });
    return;
  }

  // Validate each item
  for (const item of items) {
    if (!item.productId || typeof item.quantity !== 'number' || item.quantity < 1) {
      res.status(400).json({
        success: false,
        message: 'Invalid item format: each item must have productId and positive quantity',
      });
      return;
    }
  }

  const result = await orderService.createOrder({
    userId,
    items,
    shippingAddress,
    billingAddress: billingAddress || shippingAddress,
    paymentMethod,
    paymentMethodId,
    customerNotes,
  });

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    order: result.order,
    payment: result.payment,
  });
});

/**
 * Get current user's orders (paginated)
 */
export const getUserOrders = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user._id) {
    res.status(401).json({ success: false, message: 'User not authenticated' });
    return;
  }

  const userId = req.user._id.toString();
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const result = await orderService.getUserOrders(userId, page, limit);
  res.status(200).json({ success: true, ...result });
});

/**
 * Get a single order by ID (user or admin)
 */
export const getOrderById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user._id) {
    res.status(401).json({ success: false, message: 'User not authenticated' });
    return;
  }

  const id = ensureString(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, message: 'Invalid order ID' });
    return;
  }

  const userId = req.user._id.toString();
  const userRole = req.user.role;

  const order = await orderService.getOrderById(id, userId, userRole);
  res.status(200).json({ success: true, data: order });
});

/**
 * Cancel an order (user) and restore inventory
 */
export const cancelOrder = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user._id) {
    res.status(401).json({ success: false, message: 'User not authenticated' });
    return;
  }

  const id = ensureString(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, message: 'Invalid order ID' });
    return;
  }

  const userId = req.user._id.toString();
  const { reason } = req.body;

  const order = await orderService.cancelOrder(id, userId, reason);
  res.status(200).json({ success: true, message: 'Order cancelled successfully', order });
});

// ============================
// Admin controllers
// ============================

/**
 * Get all orders (admin only) with optional status filter
 */
export const getAllOrders = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string | undefined;

  const result = await orderService.getAllOrders(page, limit, status);
  res.status(200).json({ success: true, ...result });
});

/**
 * Update order status (admin only) – e.g., shipped, delivered
 */
export const updateOrderStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const id = ensureString(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, message: 'Invalid order ID' });
    return;
  }

  const { status, trackingNumber, carrier, estimatedDelivery } = req.body;

  const order = await orderService.updateOrderStatus(id, status, {
    trackingNumber,
    carrier,
    estimatedDelivery,
  });
  res.status(200).json({ success: true, message: 'Order status updated', order });
});

/**
 * Webhook for payment gateways (Stripe, PayPal)
 * Raw body is expected; signature is verified in service.
 */
export const paymentWebhook = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // Use type-safe access to rawBody (added by express.raw middleware)
  const rawReq = req as RequestWithRawBody;
  const signature = req.get('stripe-signature');

  if (!signature) {
    logger.warn('Webhook called without stripe-signature header');
    res.status(400).json({ error: 'Missing signature header' });
    return;
  }

  const rawBody = rawReq.rawBody || JSON.stringify(req.body);
  await orderService.handlePaymentWebhook(rawBody, signature);
  res.status(200).json({ received: true });
});