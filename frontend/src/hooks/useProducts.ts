import { useState, useEffect, useCallback, useRef } from 'react';
import { getProducts } from '../services/product.service';
import type { ProductFilters, Product } from '../services/product.service';

interface UseProductsOptions {
  initialFilters?: ProductFilters;
  debounceMs?: number;
}

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  total: number;
  totalPages: number;
  currentPage: number;
  filters: ProductFilters;
  setFilters: (filters: ProductFilters) => void;
  updateFilter: <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) => void;
  goToPage: (page: number) => void;
  clearFilters: () => void;
  refetch: () => Promise<void>;
}

const defaultFilters: ProductFilters = {
  page: 1,
  limit: 12,
  sort: '-createdAt',
  isActive: true,
};

export const useProducts = (options: UseProductsOptions = {}): UseProductsReturn => {
  const { initialFilters = {}, debounceMs = 300 } = options;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(initialFilters.page || 1);
  const [filters, setFilters] = useState<ProductFilters>({ ...defaultFilters, ...initialFilters });
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchProducts = useCallback(async (currentFilters: ProductFilters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getProducts(currentFilters);
      setProducts(response.products);
      setTotal(response.total);
      setTotalPages(response.totalPages);
      setCurrentPage(response.currentPage);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch products');
      console.error('useProducts error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect مع debounce للفلترة
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchProducts(filters);
    }, debounceMs);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [filters, fetchProducts, debounceMs]);

  const updateFilter = useCallback(<K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 })); // إعادة تعيين الصفحة إلى 1 عند تغيير أي فلتر
  }, []);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setFilters(prev => ({ ...prev, page }));
    }
  }, [totalPages]);

  const clearFilters = useCallback(() => {
    setFilters({ ...defaultFilters, isActive: true });
  }, []);

  const refetch = useCallback(async () => {
    await fetchProducts(filters);
  }, [fetchProducts, filters]);

  return {
    products,
    loading,
    error,
    total,
    totalPages,
    currentPage,
    filters,
    setFilters,
    updateFilter,
    goToPage,
    clearFilters,
    refetch,
  };
};