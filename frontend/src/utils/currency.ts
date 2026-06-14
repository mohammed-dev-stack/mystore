// frontend/src/utils/currency.ts
/**
 * Why this utility?
 * - Centralized currency formatting for consistent display across the app
 * - Uses Intl.NumberFormat for locale-aware formatting
 * - Supports USD, EUR, GBP, SAR, etc.
 * - Helper functions for price calculations (discount, tax)
 */

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'SAR';

/**
 * Format a number as currency
 * @param amount - Amount to format
 * @param currency - Currency code (default USD)
 * @param locale - Locale (default en-US)
 * @returns Formatted string (e.g., "$19.99")
 */
export const formatCurrency = (
  amount: number,
  currency: CurrencyCode = 'USD',
  locale = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Calculate discounted price
 * @param originalPrice - Original price
 * @param discountPercent - Discount percentage (0-100)
 * @returns Discounted price
 */
export const applyDiscount = (originalPrice: number, discountPercent: number): number => {
  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error('Discount percent must be between 0 and 100');
  }
  return originalPrice * (1 - discountPercent / 100);
};

/**
 * Calculate tax amount
 * @param subtotal - Order subtotal
 * @param taxRate - Tax rate as percentage (e.g., 10 for 10%)
 * @returns Tax amount
 */
export const calculateTax = (subtotal: number, taxRate: number): number => {
  if (taxRate < 0) {
    throw new Error('Tax rate cannot be negative');
  }
  return subtotal * (taxRate / 100);
};

/**
 * Calculate shipping cost based on subtotal (free over threshold)
 * @param subtotal - Order subtotal
 * @param freeShippingThreshold - Amount above which shipping is free (default 100)
 * @param baseShippingCost - Base shipping cost (default 10)
 * @returns Shipping cost
 */
export const calculateShipping = (
  subtotal: number,
  freeShippingThreshold = 100,
  baseShippingCost = 10
): number => {
  return subtotal >= freeShippingThreshold ? 0 : baseShippingCost;
};

/**
 * Format price range
 * @param minPrice - Minimum price
 * @param maxPrice - Maximum price
 * @param currency - Currency code
 * @returns Formatted range (e.g., "$10 - $50")
 */
export const formatPriceRange = (
  minPrice: number,
  maxPrice: number,
  currency: CurrencyCode = 'USD'
): string => {
  return `${formatCurrency(minPrice, currency)} - ${formatCurrency(maxPrice, currency)}`;
};