// frontend/src/components/common/ProductCard.tsx
/**
 * بطاقة المنتج – تصميم عصري وجذاب يتكامل مع قاعدة البيانات
 * - يعرض اسم المنتج، السعر، التقييم، حالة التوفر، وزر الإضافة إلى السلة
 * - يدعم RTL (من اليمين لليسار)
 * - يستخدم FontAwesome للنجوم والسلة
 * - مؤثرات حركية ناعمة عند التمرير
 * - شارة "خصم" إذا كان السعر المخفض أقل من السعر الأصلي
 * - شارة "نفذت الكمية" عند عدم التوفر
 * - يعمل مع CartContext عبر Hook معزول (useCart) لتحقيق فصل المسؤوليات
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faStar, faStarHalfAlt, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../hooks/useCart'; // ✅ استيراد من طبقة الهوكس بدلاً من السياق مباشرة

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number | null;
    images?: Array<{ thumbnail?: string; isPrimary?: boolean }>;
    inventory?: { quantity: number };
    ratings?: { average: number; count: number };
  };
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart(); // ✅ استخدام الهوكس المعاد تصديره
  const [isAdding, setIsAdding] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const { name,
    slug,
    price,
    compareAtPrice,
    images = [],
    inventory = { quantity: 0 },
    ratings = { average: 0, count: 0 },
  } = product;

  const isOnSale = compareAtPrice && compareAtPrice > price;
  const discountPercent = isOnSale ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;
  const isInStock = (inventory.quantity || 0) > 0;
  const primaryImage = images.find((img) => img.isPrimary)?.thumbnail || images[0]?.thumbnail || '/placeholder.jpg';

  // عرض التقييم بنجوم FontAwesome
  const renderStars = () => {
    const avg = ratings.average || 0;
    const fullStars = Math.floor(avg);
    const hasHalfStar = avg % 1 >= 0.5;
    const stars = [];
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FontAwesomeIcon key={`full-${i}`} icon={faStar} className="text-yellow-400 text-sm" />);
    }
    if (hasHalfStar) {
      stars.push(<FontAwesomeIcon key="half" icon={faStarHalfAlt} className="text-yellow-400 text-sm" />);
    }
    const remaining = 5 - stars.length;
    for (let i = 0; i < remaining; i++) {
      stars.push(<FontAwesomeIcon key={`empty-${i}`} icon={faStar} className="text-gray-300 dark:text-gray-600 text-sm" />);
    }
    return stars;
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isInStock) return;
    setIsAdding(true);
    addToCart(product, 1, {});
    setTimeout(() => setIsAdding(false), 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700"
    >
      {/* شارة الخصم */}
      {isOnSale && (
        <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
          خصم {discountPercent}%
        </div>
      )}

      {/* شارة "نفذت الكمية" */}
      {!isInStock && (
        <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center backdrop-blur-sm">
          <span className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-full text-sm font-bold shadow-lg">
            نفذت الكمية
          </span>
        </div>
      )}

      {/* الصورة مع تأثير تحميل */}
      <Link to={`/product/${slug}`} className="block overflow-hidden bg-gray-100 dark:bg-gray-700 relative">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
            <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <img
          src={primaryImage}
          alt={name}
          loading="lazy"
          className={`w-full h-56 object-cover transition-transform duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
        />
      </Link>

      {/* المحتوى */}
      <div className="p-4">
        <Link to={`/product/${slug}`}>
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg mb-1 line-clamp-1 hover:text-primary-600 transition">
            {name}
          </h3>
        </Link>

        {/* التقييم */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-0.5">{renderStars()}</div>
          <span className="text-xs text-gray-500 dark:text-gray-400">({ratings.count || 0})</span>
        </div>

        {/* السعر */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
            {price.toFixed(2)} ر.س
          </span>
          {isOnSale && (
            <span className="text-sm text-gray-400 line-through">
              {compareAtPrice?.toFixed(2)} ر.س
            </span>
          )}
        </div>

        {/* زر الإضافة إلى السلة */}
        <button
          onClick={handleAddToCart}
          disabled={!isInStock || isAdding}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
            isInStock
              ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-md hover:shadow-lg'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          {isAdding ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              جاري الإضافة...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faShoppingCart} className="text-lg" />
              أضف للسلة
            </>
          )}
        </button>

        {/* تأكيد الثقة */}
        {isInStock && (
          <div className="mt-3 flex items-center justify-center gap-1 text-xs text-green-600 dark:text-green-400">
            <FontAwesomeIcon icon={faCheckCircle} className="text-xs" />
            <span>توصيل سريع</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProductCard;