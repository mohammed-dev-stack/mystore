// frontend/src/hooks/useDebounce.ts
/**
 * Why this hook?
 * - Delays updating a value until after a specified delay
 * - Useful for search inputs, form validation, resize handlers
 * - Prevents excessive API calls or expensive operations
 * - Returns debounced value that only changes after user stops typing
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default 500ms)
 * @returns Debounced value
 */

import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}