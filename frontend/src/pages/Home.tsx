/**
 * الصفحة الرئيسية – متكاملة مع قاعدة البيانات، مصممة للجمهور العربي،
 * خالية من أي إشارات لشركات داعمة للصهيونية، ومتوافقة مع RTL.
 * نسخة محسنة الجمال والحركات والتكاملية.
 * تم إصلاح أخطاء TypeScript والفريم موشن.
 */

import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTruck,
  faShieldHalved,
  faHeadset,
  faRotateLeft,
  faLaptop,
  faMobileScreen,
  faBook,
  faHome,
  faSpa,
  faFutbol,
  faStar,
  faStarHalfAlt,
  faChevronLeft,
  faGem,
  faArrowLeft,
  faFire,
  faCheckCircle,
  faQuoteRight,
} from '@fortawesome/free-solid-svg-icons';
import ProductCard from '../components/common/ProductCard';
import { getFeaturedProducts } from '../services/product.service';

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  images?: Array<{ thumbnail?: string; isPrimary?: boolean }>;
  inventory?: { quantity: number };
  ratings?: { average: number; count: number };
}

// بيانات المزايا (ثابتة) مع ألوان أكثر حيوية
const features = [
  { icon: faTruck, title: 'توصيل مجاني', desc: 'للطلبات التي تزيد عن 200 ريال', color: 'from-blue-500 to-cyan-500', bgGlow: 'rgba(59,130,246,0.2)' },
  { icon: faShieldHalved, title: 'دفع آمن', desc: 'معاملات مشفرة وبياناتك محمية', color: 'from-emerald-500 to-teal-500', bgGlow: 'rgba(16,185,129,0.2)' },
  { icon: faHeadset, title: 'دعم فوري', desc: 'فريق خدمة عملاء متواجد 24/7', color: 'from-amber-500 to-orange-500', bgGlow: 'rgba(245,158,11,0.2)' },
  { icon: faRotateLeft, title: 'إرجاع سهل', desc: 'سياسة إرجاع مرنة خلال 30 يوماً', color: 'from-rose-500 to-pink-500', bgGlow: 'rgba(244,63,94,0.2)' },
];

// بيانات الأقسام بتأثيرات أقوى
const categories = [
  { name: 'الإلكترونيات', slug: 'electronics', icon: faLaptop, gradient: 'from-blue-600 to-indigo-600', hoverGradient: 'from-indigo-500 to-blue-500', emoji: '💻' },
  { name: 'الأزياء', slug: 'clothing', icon: faMobileScreen, gradient: 'from-emerald-600 to-teal-600', hoverGradient: 'from-teal-500 to-emerald-500', emoji: '👕' },
  { name: 'الكتب', slug: 'books', icon: faBook, gradient: 'from-amber-600 to-yellow-600', hoverGradient: 'from-yellow-500 to-amber-500', emoji: '📚' },
  { name: 'المنزل', slug: 'home', icon: faHome, gradient: 'from-purple-600 to-pink-600', hoverGradient: 'from-pink-500 to-purple-500', emoji: '🏠' },
  { name: 'الجمال', slug: 'beauty', icon: faSpa, gradient: 'from-rose-600 to-red-600', hoverGradient: 'from-red-500 to-rose-500', emoji: '💄' },
  { name: 'الرياضة', slug: 'sports', icon: faFutbol, gradient: 'from-indigo-600 to-blue-700', hoverGradient: 'from-blue-600 to-indigo-600', emoji: '⚽' },
];

// بيانات آراء العملاء (بدون صور بشرية – استخدام أيقونات وأحرف)
const testimonials = [
  { id: 1, name: 'أحمد المنصوري', initial: 'أ', role: 'مدير تقنية معلومات', text: 'أفضل متجر إلكتروني تعاملت معه. المنتجات أصلية، التوصيل سريع جداً، والدعم الفني متعاون. تجربة لا تُنسى!', rating: 5 },
  { id: 2, name: 'فاطمة الزهراء', initial: 'ف', role: 'ربة منزل', text: 'تشكيلة رائعة من الأجهزة المنزلية بأسعار مميزة. شكراً MyStore على الخدمة الممتازة والجودة العالية.', rating: 5 },
  { id: 3, name: 'يوسف الحسيني', initial: 'ي', role: 'مهندس معماري', text: 'أول مرة أطلب إلكترونيات عبر الإنترنت وكانت تجربة سلسة. الشحن ضمن الوقت المحدد والمنتجات كما هي في الصور.', rating: 4 },
  { id: 4, name: 'نور الهدى', initial: 'ن', role: 'طالبة جامعية', text: 'عطور رائعة وأسعار منافسة. أوصي الجميع بالتسوق من MyStore. خدمة العملاء ممتازة وسريعة.', rating: 5 },
  { id: 5, name: 'عمر الخطيب', initial: 'ع', role: 'صاحب متجر', text: 'تعاملت معهم بالجملة وكانت أفضل تجربة. أسعار تنافسية وجودة لا تضاهى. سأستمر بالتعامل معهم.', rating: 5 },
  { id: 6, name: 'ليلى عبدالله', initial: 'ل', role: 'مصممة جرافيك', text: 'تصاميم الموقع جذابة والمنتجات متنوعة. استمتعت بالتجربة وأنصح بها الأصدقاء.', rating: 4 },
];

// شركاء معروفون
const partners = [
  { id: 1, name: 'مجموعة الاتصالات', logo: 'https://placehold.co/120x60?text=Etisalat' },
  { id: 2, name: 'مكتبة جرير', logo: 'https://placehold.co/120x60?text=Jarir' },
  { id: 3, name: 'الراجحي', logo: 'https://placehold.co/120x60?text=Alrajhi' },
  { id: 4, name: 'سوق دوت كوم', logo: 'https://placehold.co/120x60?text=Souq' },
  { id: 5, name: 'زين', logo: 'https://placehold.co/120x60?text=Zain' },
  { id: 6, name: 'عطور العربية', logo: 'https://placehold.co/120x60?text=Attar' },
];

// عداد تنازلي متحرك
const useCountdown = (targetDate: Date) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;
      if (distance < 0) { clearInterval(interval); return; }
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);
  return timeLeft;
};

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [15, -15]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-15, 15]), { stiffness: 300, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (rect) {
      mouseX.set(e.clientX - rect.left - rect.width / 2);
      mouseY.set(e.clientY - rect.top - rect.height / 2);
    }
  };

  const specialOfferDeadline = new Date();
  specialOfferDeadline.setDate(specialOfferDeadline.getDate() + 7);
  const countdown = useCountdown(specialOfferDeadline);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await getFeaturedProducts(8);
        setFeaturedProducts(response.data || []);
      } catch (error) { console.error('فشل تحميل المنتجات المميزة:', error); }
      finally { setLoading(false); }
    };
    fetchFeatured();
  }, []);

  // تعريفات الحركة بصيغة متوافقة مع framer-motion
  const fadeInUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6,  } } };
  const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };

  return (
    <>
      <Helmet>
        <html dir="rtl" />
        <title>متجر MyStore – وجهتك الأولى للتسوق في العالم العربي</title>
        <meta name="description" content="أكبر متجر إلكتروني عربي يقدم تشكيلة واسعة من الإلكترونيات، الأزياء، الكتب، وأكثر. توصيل مجاني وآمن." />
        <meta name="keywords" content="تسوق, متجر, عروض, منتجات, إلكترونيات, أزياء, كتب, منزل, جمال, رياضة" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Helmet>

      {/* Hero Section */}
      <div ref={heroRef} onMouseMove={handleMouseMove} className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
        <motion.div className="absolute inset-0 z-0" style={{ y, scale }}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/90 via-primary-800/70 to-amber-700/80 z-10" />
          <img src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070" alt="تسوق" className="w-full h-full object-cover" />
        </motion.div>

        {/* جزيئات متحركة */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full"
              initial={{ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight }}
              animate={{ y: [0, -50, 0], opacity: [0, 1, 0] }}
              transition={{ duration: Math.random() * 5 + 3, repeat: Infinity, delay: Math.random() * 5 }}
              style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            />
          ))}
        </div>

        <motion.div
          style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
          className="relative z-20 max-w-5xl mx-auto text-center text-white px-4"
        >
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="inline-flex items-center gap-2 px-5 py-2 bg-white/20 backdrop-blur-md rounded-full text-sm font-semibold mb-5 border border-white/30">
              <FontAwesomeIcon icon={faFire} className="text-amber-400" /> عروض حصرية تصل إلى 70% خصم
            </span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-6xl md:text-8xl font-extrabold mb-5 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-white to-amber-200">
            تسوق بثقة،<br />تمتع بالجودة
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }} className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto text-gray-100">
            اكتشف تشكيلة لا مثيل لها من المنتجات الأصلية بأفضل الأسعار.
          </motion.p>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, duration: 0.5 }} className="flex flex-col sm:flex-row gap-5 justify-center">
            <Link to="/store" className="group relative overflow-hidden bg-gradient-to-r from-amber-500 to-amber-600 text-white px-9 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300">
              <span className="relative z-10 flex items-center gap-2">تسوق الآن <FontAwesomeIcon icon={faArrowLeft} className="transition-transform group-hover:translate-x-1" /></span>
              <span className="absolute inset-0 bg-gradient-to-r from-amber-600 to-amber-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </Link>
            <Link to="/store?offer=true" className="border-2 border-white/70 hover:bg-white/20 backdrop-blur-sm px-9 py-4 rounded-full font-semibold text-lg transition duration-300">عروض اليوم</Link>
          </motion.div>
        </motion.div>

        {/* سهم التمرير */}
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <div className="w-8 h-12 border-2 border-white/50 rounded-full flex justify-center"><div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-bounce"></div></div>
        </motion.div>
      </div>

      {/* المزايا */}
      <section className="py-20 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -8 }}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500" style={{ background: `linear-gradient(135deg, ${feat.bgGlow}, transparent)` }} />
                <div className={`w-20 h-20 mx-auto bg-gradient-to-br ${feat.color} rounded-full flex items-center justify-center text-white text-3xl mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <FontAwesomeIcon icon={feat.icon} />
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100">{feat.title}</h3>
                <p className="text-gray-500 dark:text-gray-400">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* الأقسام */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <span className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-sm font-semibold mb-3">أقسامنا</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100 mb-3">تسوق حسب القسم</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-amber-500 to-amber-600 mx-auto rounded-full"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-4 max-w-2xl mx-auto">تشكيلة واسعة تناسب جميع الأذواق والاحتياجات</p>
          </motion.div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((cat) => (
              <motion.div key={cat.slug} variants={fadeInUp} whileHover={{ y: -8, scale: 1.02 }} transition={{ type: 'spring', stiffness: 400 }}>
                <Link to={`/store?category=${cat.slug}`} className={`block p-6 rounded-2xl text-center transition-all duration-300 shadow-md hover:shadow-xl bg-gradient-to-br ${cat.gradient} hover:${cat.hoverGradient} text-white group`}>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">{cat.emoji}</div>
                  <FontAwesomeIcon icon={cat.icon} className="text-3xl mb-2 block mx-auto" />
                  <span className="block font-semibold text-base">{cat.name}</span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* عرض خاص */}
      <section className="py-20 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="flex-1 text-center lg:text-right">
              <div className="inline-flex items-center gap-2 bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-100 px-4 py-1.5 rounded-full text-sm font-semibold mb-5">
                <FontAwesomeIcon icon={faGem} className="text-amber-600" /> عرض حصري
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100 mb-4">خصم يصل إلى 40% على التشكيلة الجديدة</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">لا تفوت الفرصة – العدد محدود</p>
              <div className="flex justify-center lg:justify-start gap-4">
                {Object.entries(countdown).map(([unit, val]) => (
                  <div key={unit} className="bg-white dark:bg-gray-800 rounded-xl px-5 py-3 shadow-lg text-center min-w-[80px]">
                    <span className="block text-3xl font-extrabold text-amber-600">{val}</span>
                    <span className="text-xs text-gray-500">{unit === 'days' ? 'يوم' : unit === 'hours' ? 'ساعة' : unit === 'minutes' ? 'دقيقة' : 'ثانية'}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8"><Link to="/store?offer=true" className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-7 py-3 rounded-full font-semibold transition shadow-lg">تسوق العرض الآن <FontAwesomeIcon icon={faArrowLeft} /></Link></div>
            </div>
            <div className="flex-1">
              <motion.img initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} src="https://images.unsplash.com/photo-1607083206968-13611e3d76db?q=80&w=2070" alt="عرض خاص" className="rounded-2xl shadow-2xl object-cover w-full h-72 object-center" />
            </div>
          </div>
        </div>
      </section>

      {/* منتجات مميزة */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">منتجات مميزة</h2>
              <div className="w-20 h-1 bg-amber-500 rounded-full mt-2"></div>
            </div>
            <Link to="/store" className="text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium">عرض الكل <FontAwesomeIcon icon={faChevronLeft} size="xs" /></Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl h-[380px] animate-pulse"></div>)}
            </div>
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <motion.div key={product._id} variants={fadeInUp}><ProductCard product={product} /></motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* آراء العملاء */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 relative">
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-4 py-1 rounded-full text-sm font-semibold mb-3"><FontAwesomeIcon icon={faCheckCircle} /> ثقة العملاء</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100 mb-3">آراء عملائنا الكرام</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-amber-400 to-amber-600 mx-auto rounded-full"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-4">قصص نجاح وتجارب حقيقية من مجتمع MyStore</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -10 }}
                className="group relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6 overflow-hidden border border-gray-100 dark:border-gray-700"
              >
                <div className="absolute top-4 right-4 text-amber-200 dark:text-amber-800/30 text-5xl opacity-50 group-hover:opacity-100 transition"><FontAwesomeIcon icon={faQuoteRight} /></div>
                <div className="flex text-amber-500 mb-4 gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <FontAwesomeIcon key={i} icon={i < Math.floor(testimonial.rating) ? faStar : (i === Math.floor(testimonial.rating) && testimonial.rating % 1 !== 0 ? faStarHalfAlt : faStar)} className={`w-5 h-5 ${i < Math.ceil(testimonial.rating) ? 'text-amber-400' : 'text-gray-300'}`} />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6 text-base">"{testimonial.text}"</p>
                <div className="flex items-center gap-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xl font-bold shadow-md">{testimonial.initial}</div>
                  <div>
                    <h4 className="font-bold text-gray-800 dark:text-gray-100">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-3 bg-white dark:bg-gray-800 shadow-md rounded-full px-6 py-2 text-sm text-gray-600">
              <span className="flex items-center gap-1"><span className="text-amber-500">★</span> 4.9 / 5</span>
              <span className="w-px h-4 bg-gray-300"></span>
              <span>بناءً على أكثر من 2,500 تقييم حقيقي</span>
            </div>
          </div>
        </div>
      </section>

      {/* شركاء النجاح */}
      <section className="py-16 bg-white dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-center text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider mb-8">شركاء النجاح</h3>
          <motion.div animate={{ x: [0, -50, 0, 50, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="flex flex-wrap justify-center items-center gap-10 md:gap-16">
            {partners.map((partner) => (
              <div key={partner.id} className="grayscale hover:grayscale-0 transition duration-300 opacity-70 hover:opacity-100"><img src={partner.logo} alt={partner.name} className="h-12 w-auto object-contain" /></div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* النشرة البريدية */}
      <section className="py-20 bg-gradient-to-r from-primary-800 to-primary-900 text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} className="space-y-4">
            <h2 className="text-4xl font-bold">اشترك في النشرة البريدية</h2>
            <p className="text-gray-200 text-lg">احصل على أحدث العروض والمنتجات الحصرية أولاً بأول</p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mt-6">
              <input type="email" placeholder="بريدك الإلكتروني" className="flex-1 px-6 py-3 rounded-full text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 text-right" required />
              <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-full font-semibold transition shadow-lg flex items-center justify-center gap-2"><FontAwesomeIcon icon={faArrowLeft} /> اشتراك</button>
            </form>
            <p className="text-xs text-gray-300 mt-4">لن نرسل لك رسائل مزعجة. يمكنك إلغاء الاشتراك في أي وقت.</p>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Home;