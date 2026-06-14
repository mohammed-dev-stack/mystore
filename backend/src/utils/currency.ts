// backend/src/utils/currency.ts
/**
 * Why this utility?
 * - Centralized currency formatting and conversion logic
 * - Supports multiple currencies (USD, EUR, GBP, SAR, etc.)
 * - Provides helper for discount calculation and tax estimation
 * - Useful for order totals, product prices, and reports
 */

/**
 * Format currency amount with symbol
 * @param amount - Number to format
 * @param currency - Currency code (USD, EUR, GBP, SAR)
 * @returns Formatted string (e.g., "$19.99", "€19.99")
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
};

/**
 * Calculate discount amount
 * @param originalPrice - Original price
 * @param discountPercent - Discount percentage (0-100)
 * @returns Discounted price
 */
export const applyDiscount = (originalPrice: number, discountPercent: number): number => {
  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error('Discount percent must be between 0 and 100');
  }
  const discountAmount = (originalPrice * discountPercent) / 100;
  return Math.max(0, originalPrice - discountAmount);
};

/**
 * Calculate tax amount
 * @param subtotal - Order subtotal before tax
 * @param taxRate - Tax rate as percentage (e.g., 10 for 10%)
 * @returns Tax amount
 */
export const calculateTax = (subtotal: number, taxRate: number): number => {
  if (taxRate < 0) {
    throw new Error('Tax rate cannot be negative');
  }
  return (subtotal * taxRate) / 100;
};

/**
 * Calculate shipping cost based on subtotal (free over threshold)
 * @param subtotal - Order subtotal
 * @param freeShippingThreshold - Amount above which shipping is free (default 100)
 * @param baseShippingCost - Base shipping cost (default 10)
 * @returns Shipping cost
 */
export const calculateShipping = (subtotal: number, freeShippingThreshold: number = 100, baseShippingCost: number = 10): number => {
  return subtotal >= freeShippingThreshold ? 0 : baseShippingCost;
};

/**
 * Convert amount between currencies (placeholder - integrates with external API in production)
 * @param amount - Amount to convert
 * @param fromCurrency - Source currency
 * @param toCurrency - Target currency
 * @returns Converted amount (same as input if not implemented)
 */
export const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
  if (fromCurrency === toCurrency) return amount;
  console.warn(`Currency conversion from ${fromCurrency} to ${toCurrency} not implemented, returning original amount`);
  return amount;
};

/**
 * Format price range for display
 * @param minPrice - Minimum price
 * @param maxPrice - Maximum price
 * @param currency - Currency code
 * @returns Formatted range string (e.g., "$10 - $50")
 */
export const formatPriceRange = (minPrice: number, maxPrice: number, currency: string = 'USD'): string => {
  return `${formatCurrency(minPrice, currency)} - ${formatCurrency(maxPrice, currency)}`;
};