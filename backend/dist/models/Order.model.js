// backend/src/models/Order.model.ts
/**
 * Why this model?
 * - Tracks order lifecycle from pending to delivered/cancelled/refunded
 * - Embedded order items as snapshots (preserves product details at purchase time)
 * - Denormalized totals: subtotal, shippingCost, tax, discount, total (fast reporting)
 * - Payment tracking: paymentMethod, paymentGatewayId, paymentStatus, paidAt
 * - Shipping/billing addresses stored separately for historical accuracy
 * - Status transitions: pending → paid → processing → shipped → delivered (or cancelled)
 * - Indexes: user+createdAt for user history, status for admin dashboards, orderNumber unique
 */
import mongoose, { Schema, Types } from 'mongoose';
const orderItemSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productSlug: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, max: 99 },
    total: { type: Number, required: true, min: 0 },
    imageThumbnail: { type: String, default: null },
    attributes: { type: Map, of: String, default: {} },
});
const addressSchema = new Schema({
    street: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String, required: true },
});
const orderSchema = new Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true,
        index: true,
        default: function () {
            const date = new Date();
            const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            return `ORD-${dateStr}-${random}`;
        },
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, required: true, min: 0, default: 0 },
    tax: { type: Number, required: true, min: 0, default: 0 },
    discount: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
        validate: {
            // Use `this: any` to avoid Mongoose type conflicts
            validator: function (value) {
                return value <= this.subtotal;
            },
            message: 'Discount cannot exceed subtotal',
        },
    },
    total: {
        type: Number,
        required: true,
        min: 0,
        validate: {
            // Use `this: any` to avoid Mongoose type conflicts
            validator: function (value) {
                const calculated = this.subtotal + this.shippingCost + this.tax - this.discount;
                return Math.abs(value - calculated) < 0.01;
            },
            message: 'Total does not match calculation',
        },
    },
    currency: {
        type: String,
        default: 'USD',
        uppercase: true,
        enum: ['USD', 'EUR', 'GBP', 'SAR'],
    },
    status: {
        type: String,
        enum: [
            'pending',
            'payment_failed',
            'paid',
            'processing',
            'shipped',
            'delivered',
            'cancelled',
            'refunded',
        ],
        default: 'pending',
        index: true,
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['stripe', 'paypal', 'cash_on_delivery', 'bank_transfer'],
    },
    paymentGatewayId: { type: String, default: null, index: true },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending',
    },
    paidAt: { type: Date, default: null },
    shippingAddress: { type: addressSchema, required: true },
    billingAddress: { type: addressSchema, required: true },
    customerNotes: { type: String, maxlength: 500, default: '' },
    adminNotes: { type: String, maxlength: 1000, default: '', select: false },
    trackingNumber: { type: String, default: null },
    carrier: {
        type: String,
        enum: ['fedex', 'ups', 'usps', 'dhl', 'other'],
        default: null,
    },
    estimatedDelivery: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, default: null },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Virtuals
orderSchema.virtual('isPaid').get(function () {
    return this.paymentStatus === 'completed';
});
orderSchema.virtual('isDelivered').get(function () {
    return this.status === 'delivered';
});
orderSchema.virtual('canCancel').get(function () {
    return ['pending', 'paid'].includes(this.status);
});
// Instance methods with proper `this: IOrder` typing
orderSchema.methods.markAsPaid = async function (paymentGatewayId) {
    this.paymentStatus = 'completed';
    this.paymentGatewayId = paymentGatewayId;
    this.paidAt = new Date();
    this.status = 'paid';
    await this.save();
    return this;
};
orderSchema.methods.markAsShipped = async function (trackingNumber, carrier) {
    this.status = 'shipped';
    this.trackingNumber = trackingNumber;
    this.carrier = carrier;
    // Estimate delivery 7 days from now
    this.estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.save();
    return this;
};
orderSchema.methods.markAsDelivered = async function () {
    this.status = 'delivered';
    this.deliveredAt = new Date();
    await this.save();
    return this;
};
orderSchema.methods.cancelOrder = async function (reason) {
    if (!this.canCancel) {
        throw new Error(`Cannot cancel order with status: ${this.status}`);
    }
    this.status = 'cancelled';
    this.cancelledAt = new Date();
    this.cancellationReason = reason;
    await this.save();
    return this;
};
// Static methods
orderSchema.statics.getUserOrders = async function (userId, limit = 50, skip = 0) {
    return this.find({ user: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('items.productId', 'name slug images.thumbnail');
};
orderSchema.statics.getSalesReport = async function (startDate, endDate) {
    const result = await this.aggregate([
        {
            $match: {
                status: { $in: ['paid', 'shipped', 'delivered'] },
                paidAt: { $gte: startDate, $lte: endDate },
            },
        },
        {
            $group: {
                _id: null,
                totalSales: { $sum: '$total' },
                totalOrders: { $sum: 1 },
                averageOrderValue: { $avg: '$total' },
            },
        },
    ]);
    return result.length > 0 ? result[0] : null;
};
// Additional indexes for performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paidAt: 1 });
orderSchema.index({ orderNumber: 1 }, { unique: true });
const Order = mongoose.model('Order', orderSchema);
export default Order;
//# sourceMappingURL=order.model.js.map