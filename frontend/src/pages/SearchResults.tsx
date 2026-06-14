// frontend/src/pages/SearchResults.tsx
/**
 * صفحة نتائج البحث (نصي / بالصورة) - نسخة عربية محسّنة.
 * - دعم كامل لـ RTL (من اليمين لليسار) باستخدام Tailwind Utilities (me, ms, pe, ps).
 * - ترجمة جميع النصوص الثابتة إلى العربية.
 * - استخدام أيقونات FontAwesome بشكل متسق.
 * - إضافة Skeleton Loader أثناء تحميل النتائج (شبكة منتجات وهمية).
 * - عرض النتائج على شكل شبكة باستخدام مكون ProductCard.
 * - دعم البحث النصي والبحث بالصورة (مع وصف مستخرج).
 * - شريط بحث مدمج لإعادة الصقل.
 * - رسائل خطأ واضحة وحالة "لا توجد نتائج".
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faCamera, faArrowRight,  } from '@fortawesome/free-solid-svg-icons';
import ProductCard from '../components/common/ProductCard';
import SearchBar from '../components/common/SearchBar';
import { textSearch } from '../services/search.service';
import type { ProductSearchResult } from '../services/search.service';

// مكون Skeleton لشبكة النتائج (4 بطاقات وهمية)
const ResultsSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {Array(8)
      .fill(0)
      .map((_, i) => (
        <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl shadow-md overflow-hidden animate-pulse">
          <div className="w-full h-48 bg-gray-200 dark:bg-gray-700"></div>
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          </div>
        </div>
      ))}
  </div>
);

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const fromImage = searchParams.get('fromImage') === 'true';
  const [products, setProducts] = useState<ProductSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await textSearch(query, 24);
        setProducts(response.data || []);
      } catch (err) {
        console.error('فشل البحث:', err);
        setError('فشل تحميل نتائج البحث. يرجى المحاولة مرة أخرى.');
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query]);

  const handleNewSearch = (_results: any[], newQuery: string, isImageSearch: boolean = false) => {
    if (newQuery.trim()) {
      const url = isImageSearch
        ? `/search?q=${encodeURIComponent(newQuery)}&fromImage=true`
        : `/search?q=${encodeURIComponent(newQuery)}`;
      navigate(url);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* رأس الصفحة */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 mb-4 transition"
        >
          <FontAwesomeIcon icon={faArrowRight} />
          رجوع
        </button>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">نتائج البحث</h1>
        {query && (
          <p className="text-gray-600 dark:text-gray-400">
            {fromImage ? (
              <>
                <FontAwesomeIcon icon={faCamera} className="ml-2 text-primary-600" />
                البحث عن منتجات مشابهة لـ: <span className="font-medium">{query}</span>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSearch} className="ml-2 text-primary-600" />
                عرض النتائج لـ: <span className="font-medium">"{query}"</span>
              </>
            )}
          </p>
        )}
      </div>

      {/* شريط البحث لإعادة الصقل */}
      <div className="mb-8">
        <SearchBar initialQuery={query} onSearch={handleNewSearch} />
      </div>

      {/* النتائج */}
      {loading ? (
        <ResultsSkeleton />
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">لا توجد منتجات</h2>
          <p className="text-gray-600 dark:text-gray-400">
            لم نعثر على أي منتجات تطابق بحثك. جرّب كلمات مختلفة أو تصفح الأقسام.
          </p>
          <button
            onClick={() => navigate('/store')}
            className="mt-6 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            تصفح جميع المنتجات
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
          <div className="mt-8 text-center text-gray-500 text-sm">
            تم العثور على {products.length} منتج
          </div>
        </>
      )}
    </div>
  );
};

export default SearchResults;