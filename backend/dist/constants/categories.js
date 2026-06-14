// backend/src/constants/categories.ts
/**
 * Why this file?
 * - Centralized constants for category restrictions and allowed categories.
 * - Used by product controller and potentially other modules (e.g., validation).
 * - Separates business rules from controller logic for better maintainability.
 */
/**
 * Categories that are restricted from appearing in the store for business or compliance reasons.
 * These are typically sensitive categories that should not be shown to customers.
 * Marked as readonly to prevent accidental mutations.
 */
export const RESTRICTED_CATEGORIES = ["ملابس نسائية", "فساتين", "أزياء غير لائقة"];
/**
 * List of allowed product categories that can be used in the store.
 * Used for validation and UI filtering.
 * `as const` ensures the array is treated as a readonly tuple.
 */
export const ALLOWED_CATEGORIES = [
    "electronics",
    "clothing",
    "books",
    "home",
    "beauty",
    "sports",
    "toys",
    "other"
];
/**
 * Checks whether a given category is restricted.
 * @param category - The category to check.
 * @returns True if the category is in the restricted list, false otherwise.
 */
export const isRestrictedCategory = (category) => {
    return RESTRICTED_CATEGORIES.includes(category);
};
/**
 * Checks whether a given category is allowed.
 * @param category - The category to check.
 * @returns True if the category is in the allowed list, false otherwise.
 * Also acts as a type guard: if returns true, TypeScript narrows `category` to `AllowedCategory`.
 */
export const isAllowedCategory = (category) => {
    return ALLOWED_CATEGORIES.includes(category);
};
//# sourceMappingURL=categories.js.map