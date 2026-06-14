// frontend/src/pages/Store.tsx
/**
 * صفحة المتجر – نسخة احترافية مع استخدام useProducts hook
 * - فصل كامل بين منطق البيانات (hook) وعرض الواجهة (component)
 * - دعم debounce للبحث وتغيير الفلاتر (يمنع تكرار طلبات API)
 * - مزامنة الفلاتر مع رابط URL (قابل للمشاركة)
 * - تأثيرات حركية سلسة (Framer Motion) مع RTL
 * - تحميل متقطع (Skeleton) وأنimation عند تغيير الفلاتر
 * - متوافق مع الوضع المظلم وأفضل الممارسات
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilter,
  faSlidersH,
  faTimes,
  faChevronLeft,
  faChevronRight,
  faSearch,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import ProductCard from '../components/common/ProductCard';
import { useProducts } from '../hooks/useProducts';

// مكون Skeleton لشبكة المنتجات (يظهر أثناء التحميل)
const ProductsGridSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array(6)
      .fill(0)
      .map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden animate-pulse">
          <div className="w-full h-56 bg-gray-200 dark:bg-gray-700"></div>
          <div className="p-5 space-y-3">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-full w-full"></div>
          </div>
        </div>
      ))}
  </div>
);

const Store = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // تهيئة الفلاتر الأولية من رابط URL
  const initialFilters = {
    category: searchParams.get('category') || undefined,
    minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
    maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
    sort: searchParams.get('sort') || '-createdAt',
    search: searchParams.get('search') || undefined,
    page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
  };

  // استخدام الـ Hook المتطور (يحتوي على debounce و fetch وإدارة الحالة)
  const {
    products,
    loading,
    total,
    totalPages,
    currentPage,
    filters,
    updateFilter,
    goToPage,
    clearFilters,
  } = useProducts({
    initialFilters,
    debounceMs: 500, // تأخير 0.5 ثانية قبل إرسال طلب البحث
  });

  // مزامنة الفلاتر مع رابط URL (عند تغيير أي فلتر)
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.minPrice !== undefined) params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice !== undefined) params.set('maxPrice', filters.maxPrice.toString());
    if (filters.sort && filters.sort !== '-createdAt') params.set('sort', filters.sort);
    if (filters.search) params.set('search', filters.search);
    if (currentPage > 1) params.set('page', currentPage.toString());
    setSearchParams(params, { replace: true });
  }, [filters, currentPage, setSearchParams]);

  // قائمة الأقسام (للفلاتر)
  const categories = [
    { value: '', label: 'جميع الأقسام', icon: '📦' },
    { value: 'electronics', label: 'إلكترونيات', icon: '💻' },
    { value: 'clothing', label: 'أزياء', icon: '👕' },
    { value: 'books', label: 'كتب', icon: '📚' },
    { value: 'home', label: 'المنزل والمطبخ', icon: '🏠' },
    { value: 'beauty', label: 'جمال وعناية', icon: '💄' },
    { value: 'sports', label: 'رياضة', icon: '⚽' },
    { value: 'toys', label: 'ألعاب', icon: '🎮' },
  ];

  const sortOptions = [
    { value: '-createdAt', label: 'الأحدث أولاً' },
    { value: 'createdAt', label: 'الأقدم أولاً' },
    { value: '-price', label: 'السعر: الأعلى إلى الأقل' },
    { value: 'price', label: 'السعر: الأقل إلى الأعلى' },
    { value: '-views', label: 'الأكثر مشاهدة' },
    { value: '-ratings.average', label: 'الأعلى تقييماً' },
  ];

  const hasActiveFilters = !!(
    filters.category ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    (filters.sort && filters.sort !== '-createdAt') ||
    filters.search
  );

  // تأثيرات الحركة (Framer Motion)
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* رأس الصفحة وشريط البحث */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-amber-500 bg-clip-text text-transparent">
                منتجاتنا
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">{total} منتج ينتظرك</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {/* حقل البحث (يستخدم updateFilter مع debounce مدمج في الـ Hook) */}
              <div className="relative">
                <input
                  type="text"
                  value={filters.search || ''}
                  onChange={(e) => updateFilter('search', e.target.value || undefined)}
                  placeholder="ابحث عن منتج..."
                  className="pr-10 pl-5 py-2.5 w-64 border border-gray-200 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                />
                <FontAwesomeIcon icon={faSearch} className="absolute right-3 top-3.5 text-gray-400" />
              </div>
              {/* زر الفلاتر للهواتف */}
              <button
                onClick={() => setShowMobileFilters(true)}
                className="md:hidden flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 rounded-full shadow-sm hover:shadow-md transition"
              >
                <FontAwesomeIcon icon={faFilter} className="text-primary-600" />
                <span>فلاتر</span>
              </button>
              {/* قائمة الترتيب */}
              <div className="relative">
                <select
                  value={filters.sort}
                  onChange={(e) => updateFilter('sort', e.target.value)}
                  className="pr-10 pl-5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <FontAwesomeIcon icon={faSlidersH} className="absolute left-3 top-3.5 text-gray-400" />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* شريط الفلاتر الجانبي (سطح المكتب) */}
          <aside className="hidden md:block w-72 flex-shrink-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="sticky top-24 bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <div className="flex justify-between items-center mb-5">
                <h2 className="font-bold text-lg text-gray-800 dark:text-gray-100">الفلاتر</h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-primary-600 hover:text-primary-700 transition flex items-center gap-1"
                  >
                    <FontAwesomeIcon icon={faTimes} size="xs" /> إلغاء الكل
                  </button>
                )}
              </div>

              {/* فلتر القسم */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">القسم</label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => updateFilter('category', e.target.value || undefined)}
                  className="w-full p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* فلتر السعر */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">نطاق السعر (ريال)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="من"
                    value={filters.minPrice ?? ''}
                    onChange={(e) =>
                      updateFilter('minPrice', e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                    className="w-1/2 p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="0"
                  />
                  <input
                    type="number"
                    placeholder="إلى"
                    value={filters.maxPrice ?? ''}
                    onChange={(e) =>
                      updateFilter('maxPrice', e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                    className="w-1/2 p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="0"
                  />
                </div>
              </div>

              {/* ملخص الفلاتر النشطة */}
              {hasActiveFilters && (
                <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">الفلاتر النشطة</h3>
                  <div className="flex flex-wrap gap-2">
                    {filters.category && (
                      <span className="inline-flex items-center gap-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs px-3 py-1.5 rounded-full">
                        {categories.find((c) => c.value === filters.category)?.label}
                        <button onClick={() => updateFilter('category', undefined)} className="hover:text-red-500">
                          <FontAwesomeIcon icon={faTimes} size="xs" />
                        </button>
                      </span>
                    )}
                    {(filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
                      <span className="inline-flex items-center gap-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs px-3 py-1.5 rounded-full">
                        {filters.minPrice ?? '0'} - {filters.maxPrice ?? '∞'} ريال
                        <button onClick={() => updateFilter('minPrice', undefined)}>
                          <FontAwesomeIcon icon={faTimes} size="xs" />
                        </button>
                        <button onClick={() => updateFilter('maxPrice', undefined)}>
                          <FontAwesomeIcon icon={faTimes} size="xs" />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </aside>

          {/* نافذة الفلاتر المنبثقة للهواتف */}
          <AnimatePresence>
            {showMobileFilters && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/50 flex items-start justify-start md:hidden"
                onClick={() => setShowMobileFilters(false)}
              >
                <motion.div
                  initial={{ x: -300 }}
                  animate={{ x: 0 }}
                  exit={{ x: -300 }}
                  className="bg-white dark:bg-gray-800 w-80 h-full overflow-y-auto p-5 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-5">
                    <h2 className="font-bold text-xl">فلاتر</h2>
                    <button onClick={() => setShowMobileFilters(false)} className="p-1 hover:bg-gray-100 rounded-full">
                      <FontAwesomeIcon icon={faTimes} size="lg" />
                    </button>
                  </div>
                  <div className="mb-5">
                    <label className="block text-sm font-medium mb-2">القسم</label>
                    <select
                      value={filters.category || ''}
                      onChange={(e) => updateFilter('category', e.target.value || undefined)}
                      className="w-full p-2.5 border rounded-xl bg-white dark:bg-gray-700"
                    >
                      {categories.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.icon} {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-5">
                    <label className="block text-sm font-medium mb-2">نطاق السعر (ريال)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="من"
                        value={filters.minPrice ?? ''}
                        onChange={(e) =>
                          updateFilter('minPrice', e.target.value ? parseFloat(e.target.value) : undefined)
                        }
                        className="w-1/2 p-2.5 border rounded-xl"
                      />
                      <input
                        type="number"
                        placeholder="إلى"
                        value={filters.maxPrice ?? ''}
                        onChange={(e) =>
                          updateFilter('maxPrice', e.target.value ? parseFloat(e.target.value) : undefined)
                        }
                        className="w-1/2 p-2.5 border rounded-xl"
                      />
                    </div>
                  </div>
                  {hasActiveFilters && (
                    <button
                      onClick={() => {
                        clearFilters();
                        setShowMobileFilters(false);
                      }}
                      className="w-full mb-4 text-primary-600"
                    >
                      إلغاء الكل
                    </button>
                  )}
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="w-full bg-primary-600 text-white py-2.5 rounded-xl font-semibold"
                  >
                    تطبيق
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* شبكة المنتجات */}
          <div className="flex-1">
            {loading ? (
              <ProductsGridSkeleton />
            ) : products.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm"
              >
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  لا توجد منتجات تطابق الفلاتر المحددة.
                </p>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="mt-4 text-primary-600 hover:underline">
                    إلغاء جميع الفلاتر
                  </button>
                )}
              </motion.div>
            ) : (
              <>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {products.map((product) => (
                    <motion.div key={product._id} variants={fadeInUp}>
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </motion.div>

                {/* مؤشر التحميل أثناء تغيير الفلاتر (يظهر فقط إذا كان هناك debounce نشط) */}
                {loading && (
                  <div className="fixed bottom-8 right-8 bg-white dark:bg-gray-800 rounded-full shadow-lg p-3 z-40">
                    <FontAwesomeIcon icon={faSpinner} spin className="text-primary-600 text-xl" />
                  </div>
                )}

                {/* التصفح بين الصفحات (Pagination) */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-3 mt-10">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2.5 rounded-full border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                      <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      صفحة {currentPage} من {totalPages}
                    </span>
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2.5 rounded-full border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                      <FontAwesomeIcon icon={faChevronLeft} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Store;