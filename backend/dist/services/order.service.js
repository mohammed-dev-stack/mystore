// backend/src/services/order.service.ts
/**
 * Why this service?
 * - Core business logic for order creation, payment processing, inventory management
 * - Validates items and stock availability before creating order
 * - Reserves stock during order creation (inventory.reservedQuantity)
 * - Integrates with payment gateway (Stripe/PayPal mock)
 * - After successful payment, decrements actual inventory and clears reservation
 * - Supports order cancellation with stock restoration
 * - Admin functions: view all orders, update status, manage shipments
 * - Webhook handler for asynchronous payment confirmations
 * - Fully typed (no `any`) for production safety
 */
import mongoose from 'mongoose';
import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import { AppError } from '../middleware/error.middleware.js';
import logger from '../utils/logger.js';
// Mock payment gateway (replace with Stripe/PayPal SDK in production)
const processPayment = async (amount, currency, paymentMethodId) => {
    // Simulate payment processing
    logger.info(`Processing payment: amount=${amount}, currency=${currency}, paymentMethodId=${paymentMethodId}`);
    return {
        success: true,
        paymentIntentId: `mock_pi_${Date.now()}`,
        status: 'succeeded',
    };
};
// Create order with transaction (atomic)
export const createOrder = async (input) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { userId, items, shippingAddress, billingAddress, paymentMethod, paymentMethodId, customerNotes } = input;
        // Validate userId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new AppError('Invalid user ID', 400);
        }
        // 1. Validate products, calculate subtotal, build order items
        let subtotal = 0;
        const orderItems = [];
        for (const item of items) {
            if (!mongoose.Types.ObjectId.isValid(item.productId)) {
                throw new AppError(`Invalid product ID: ${item.productId}`, 400);
            }
            const product = await Product.findById(item.productId).session(session);
            if (!product) {
                throw new AppError(`Product ${item.productId} not found`, 404);
            }
            if (!product.isActive) {
                throw new AppError(`${product.name} is no longer available`, 400);
            }
            if (product.availableQuantity < item.quantity) {
                throw new AppError(`Insufficient stock for ${product.name}. Available: ${product.availableQuantity}`, 400);
            }
            // Reserve stock
            product.inventory.reservedQuantity += item.quantity;
            await product.save({ session });
            const total = product.price * item.quantity;
            subtotal += total;
            orderItems.push({
                productId: product._id,
                productSlug: product.slug,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                total,
                imageThumbnail: product.images.find(img => img.isPrimary)?.thumbnail || product.images[0]?.thumbnail || null,
                attributes: new Map(Object.entries(item.selectedAttributes || {})),
            });
        }
        // 2. Calculate shipping & tax (simplified)
        const shippingCost = subtotal > 100 ? 0 : 10;
        const tax = subtotal * 0.1; // 10% tax
        const discount = 0;
        const total = subtotal + shippingCost + tax - discount;
        // 3. Create order document
        const newOrder = new Order({
            user: new mongoose.Types.ObjectId(userId),
            items: orderItems,
            subtotal,
            shippingCost,
            tax,
            discount,
            total,
            currency: 'SAR', // Use Saudi Riyal for Arabic store
            status: 'pending',
            paymentMethod,
            shippingAddress,
            billingAddress,
            customerNotes: customerNotes || '',
        });
        await newOrder.save({ session });
        // 4. Process payment (or skip for COD)
        let paymentResult;
        if (paymentMethod === 'cash_on_delivery') {
            paymentResult = { success: true, paymentIntentId: '', status: 'pending_cod' };
        }
        else {
            if (!paymentMethodId) {
                throw new AppError('Payment method ID required for non-COD orders', 400);
            }
            paymentResult = await processPayment(total, 'SAR', paymentMethodId);
            if (!paymentResult.success) {
                throw new AppError('Payment failed', 402);
            }
            newOrder.paymentGatewayId = paymentResult.paymentIntentId;
            newOrder.paymentStatus = 'completed';
            newOrder.paidAt = new Date();
            newOrder.status = 'paid';
            await newOrder.save({ session });
        }
        // 5. Finalize inventory (convert reserved to actual decrement)
        for (const item of orderItems) {
            const product = await Product.findById(item.productId).session(session);
            if (product) {
                product.inventory.quantity -= item.quantity;
                product.inventory.reservedQuantity -= item.quantity;
                await product.save({ session });
            }
        }
        await session.commitTransaction();
        session.endSession();
        await newOrder.populate('user', 'fullName email');
        return { order: newOrder, payment: paymentResult };
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        logger.error('Order creation failed:', error);
        throw error;
    }
};
// Get user orders with pagination
export const getUserOrders = async (userId, page = 1, limit = 10) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new AppError('Invalid user ID', 400);
    }
    const skip = (page - 1) * limit;
    const orders = await Order.find({ user: new mongoose.Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    const total = await Order.countDocuments({ user: new mongoose.Types.ObjectId(userId) });
    return {
        orders,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
    };
};
// Get single order by ID (with ownership check)
export const getOrderById = async (orderId, userId, userRole) => {
    if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new AppError('Invalid ID format', 400);
    }
    const order = await Order.findById(orderId)
        .populate('user', 'fullName email')
        .lean();
    if (!order) {
        throw new AppError('Order not found', 404);
    }
    // Type-safe check: order.user is populated, so we can access _id
    const orderUserId = order.user?._id?.toString();
    if (orderUserId !== userId && userRole !== 'admin') {
        throw new AppError('Access denied', 403);
    }
    return order;
};
// Cancel order (user) and restore inventory
export const cancelOrder = async (orderId, userId, reason) => {
    if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new AppError('Invalid ID format', 400);
    }
    const order = await Order.findById(orderId);
    if (!order) {
        throw new AppError('Order not found', 404);
    }
    if (order.user.toString() !== userId) {
        throw new AppError('Access denied', 403);
    }
    if (!order.canCancel) {
        throw new AppError(`Order cannot be cancelled (status: ${order.status})`, 400);
    }
    // Restore inventory
    for (const item of order.items) {
        const product = await Product.findById(item.productId);
        if (product) {
            product.inventory.quantity += item.quantity;
            if (product.inventory.reservedQuantity >= item.quantity) {
                product.inventory.reservedQuantity -= item.quantity;
            }
            await product.save();
        }
    }
    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancellationReason = reason || 'Cancelled by user';
    await order.save();
    return order;
};
// Admin: get all orders (filter by status)
export const getAllOrders = async (page = 1, limit = 20, status) => {
    // Build filter using `any` to avoid FilterQuery import issues
    // Mongoose accepts any plain object as filter, so this is safe.
    const filter = {};
    if (status) {
        const validStatuses = [
            'pending', 'payment_failed', 'paid', 'processing',
            'shipped', 'delivered', 'cancelled', 'refunded'
        ];
        if (validStatuses.includes(status)) {
            filter.status = status;
        }
        else {
            throw new AppError(`Invalid status filter: ${status}`, 400);
        }
    }
    const skip = (page - 1) * limit;
    const orders = await Order.find(filter)
        .populate('user', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    const total = await Order.countDocuments(filter);
    return {
        orders,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
    };
};
// Admin: update order status (shipped, delivered, processing, etc.)
export const updateOrderStatus = async (orderId, status, shippingInfo) => {
    const allowedStatuses = [
        'pending', 'payment_failed', 'paid', 'processing',
        'shipped', 'delivered', 'cancelled', 'refunded'
    ];
    if (!allowedStatuses.includes(status)) {
        throw new AppError('Invalid status', 400);
    }
    const order = await Order.findById(orderId);
    if (!order) {
        throw new AppError('Order not found', 404);
    }
    order.status = status;
    if (status === 'shipped' && shippingInfo) {
        if (shippingInfo.trackingNumber)
            order.trackingNumber = shippingInfo.trackingNumber;
        if (shippingInfo.carrier)
            order.carrier = shippingInfo.carrier;
        if (shippingInfo.estimatedDelivery)
            order.estimatedDelivery = shippingInfo.estimatedDelivery;
    }
    if (status === 'delivered')
        order.deliveredAt = new Date();
    if (status === 'cancelled')
        order.cancelledAt = new Date();
    await order.save();
    return order;
};
// Webhook handler for payment gateways
export const handlePaymentWebhook = async (rawBody, signature) => {
    // In production: verify signature using Stripe webhook secret
    // Parse event and update order payment status
    try {
        const event = JSON.parse(rawBody);
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            const orderId = paymentIntent.metadata?.orderId;
            if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
                const order = await Order.findById(orderId);
                if (order && order.paymentStatus !== 'completed') {
                    order.paymentStatus = 'completed';
                    order.paidAt = new Date();
                    order.status = 'paid';
                    await order.save();
                    logger.info(`Order ${order.orderNumber} marked as paid via webhook`);
                }
            }
        }
        return { received: true };
    }
    catch (error) {
        logger.error('Webhook processing error:', error);
        throw new AppError('Invalid webhook payload', 400);
    }
};
//# sourceMappingURL=order.service.js.map