// frontend/src/services/order.service.ts
/**
 * Why this service?
 * - Centralized order API calls (create, get user orders, get by id, cancel, admin)
 * - Provides typed methods for order management
 * - Used by Checkout page, Dashboard, and Order history pages
 * - Handles order creation, payment, and status updates
 */

import api from './api';

export interface OrderItem {
  productId: string;
  productSlug: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
  imageThumbnail: string | null;
  attributes: Record<string, string>;
}

export interface Address {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: {
    _id: string;
    fullName: string;
    email: string;
  };
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  status: 'pending' | 'payment_failed' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentMethod: 'stripe' | 'paypal' | 'cash_on_delivery' | 'bank_transfer';
  paymentGatewayId: string | null;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paidAt: string | null;
  shippingAddress: Address;
  billingAddress: Address;
  customerNotes: string;
  trackingNumber: string | null;
  carrier: 'fedex' | 'ups' | 'usps' | 'dhl' | 'other' | null;
  estimatedDelivery: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderData {
  items: Array<{
    productId: string;
    quantity: number;
    selectedAttributes?: Record<string, string>;
  }>;
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: 'stripe' | 'paypal' | 'cash_on_delivery';
  paymentMethodId?: string;
  customerNotes?: string;
}

export interface OrderResponse {
  success: boolean;
  order: Order;
  payment?: any;
}

export interface OrdersListResponse {
  success: boolean;
  orders: Order[];
  total: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Create a new order (checkout)
 */
export const createOrder = async (data: CreateOrderData): Promise<OrderResponse> => {
  const response = await api.post('/orders', data);
  return response.data;
};

/**
 * Get current user's orders with pagination
 */
export const getUserOrders = async (page = 1, limit = 10): Promise<OrdersListResponse> => {
  const response = await api.get(`/orders/my-orders?page=${page}&limit=${limit}`);
  return response.data;
};

/**
 * Get a single order by ID (user or admin)
 */
export const getOrderById = async (id: string): Promise<{ success: boolean; data: Order }> => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

/**
 * Cancel an order (user)
 */
export const cancelOrder = async (id: string, reason?: string): Promise<{ success: boolean; message: string; order: Order }> => {
  const response = await api.put(`/orders/${id}/cancel`, { reason });
  return response.data;
};

// Admin only
/**
 * Get all orders (admin)
 */
export const getAllOrders = async (page = 1, limit = 20, status?: string, sort?: string): Promise<OrdersListResponse> => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (status) params.append('status', status);
  if (sort) params.append('sort', sort);
  const response = await api.get(`/orders/admin/all?${params.toString()}`);
  return response.data;
};

/**
 * Update order status (admin)
 */
export const updateOrderStatus = async (id: string, status: string, shippingInfo?: {
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: Date;
}): Promise<{ success: boolean; message: string; order: Order }> => {
  const response = await api.put(`/orders/admin/${id}/status`, { status, ...shippingInfo });
  return response.data;
};