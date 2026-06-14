
'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";

// Types
export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
  imageThumbnail: string | null;
  selectedAttributes: Record<string, string>;
  maxStock: number;
}

export interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  itemCount: number;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  isEmpty: boolean;
  addToCart: (product: any, quantity?: number, selectedAttributes?: Record<string, string>) => void;
  removeFromCart: (productId: string, selectedAttributes?: Record<string, string>) => void;
  updateQuantity: (productId: string, newQuantity: number, selectedAttributes?: Record<string, string>) => void;
  clearCart: () => void;
  getCheckoutPayload: () => any;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart:', e);
      }
    }
    setLoading(false);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    }
  }, [cartItems, loading]);

  const getItemKey = (productId: string, selectedAttributes: Record<string, string> = {}) => {
    const attrString = JSON.stringify(selectedAttributes);
    return `${productId}|${attrString}`;
  };

  const addToCart = useCallback(
    (product: any, quantity = 1, selectedAttributes: Record<string, string> = {}) => {
      setCartItems((prevItems) => {
        const existingIndex = prevItems.findIndex(
          (item) => item.productId === product._id && getItemKey(item.productId, item.selectedAttributes) === getItemKey(product._id, selectedAttributes)
        );

        const maxStock = product.inventory?.quantity || 99;

        if (existingIndex > -1) {
          const updated = [...prevItems];
const newQuantity = (updated[existingIndex]?.quantity || 0) + quantity;          if (updated[existingIndex]) if (updated[existingIndex]) updated[existingIndex].quantity = Math.min(newQuantity, maxStock);
          if (updated[existingIndex]) updated[existingIndex].total = updated[existingIndex].price * updated[existingIndex].quantity;
          return updated;
        } else {
          const newItem: CartItem = {
            productId: product._id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            quantity: Math.min(quantity, maxStock),
            total: product.price * Math.min(quantity, maxStock),
            imageThumbnail: product.images?.find((img: any) => img.isPrimary)?.thumbnail || product.images?.[0]?.thumbnail || null,
            selectedAttributes,
            maxStock,
          };
          return [...prevItems, newItem];
        }
      });
    },
    []
  );

  const removeFromCart = useCallback((productId: string, selectedAttributes: Record<string, string> = {}) => {
    setCartItems((prevItems) =>
      prevItems.filter(
        (item) => !(item.productId === productId && getItemKey(item.productId, item.selectedAttributes) === getItemKey(productId, selectedAttributes))
      )
    );
  }, []);

  const updateQuantity = useCallback(
    (productId: string, newQuantity: number, selectedAttributes: Record<string, string> = {}) => {
      if (newQuantity < 1) {
        removeFromCart(productId, selectedAttributes);
        return;
      }
      setCartItems((prevItems) =>
        prevItems.map((item) => {
          if (item.productId === productId && getItemKey(item.productId, item.selectedAttributes) === getItemKey(productId, selectedAttributes)) {
            const validQuantity = Math.min(newQuantity, item.maxStock);
            return {
              ...item,
              quantity: validQuantity,
              total: item.price * validQuantity,
            };
          }
          return item;
        })
      );
    },
    [removeFromCart]
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const shippingCost = subtotal > 100 ? 0 : 10;
  const tax = subtotal * 0.1;
  const total = subtotal + shippingCost + tax;
  const isEmpty = cartItems.length === 0;

  const getCheckoutPayload = () => {
    return {
      items: cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        selectedAttributes: item.selectedAttributes,
      })),
      subtotal,
      shippingCost,
      tax,
      total,
    };
  };

  const value: CartContextType = {
    cartItems,
    loading,
    itemCount,
    subtotal,
    shippingCost,
    tax,
    total,
    isEmpty,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCheckoutPayload,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export { CartContext };