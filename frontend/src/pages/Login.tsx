// frontend/src/pages/Login.tsx
/**
 * صفحة تسجيل الدخول - نسخة عربية محسّنة.
 * - دعم كامل لـ RTL (من اليمين لليسار) باستخدام Tailwind Utilities.
 * - استخدام أيقونات FontAwesome.
 * - إظهار/إخفاء كلمة المرور.
 * - رابط "نسيت كلمة المرور" تم تعطيله مؤقتاً (لأن الصفحة غير موجودة بعد).
 * - إعادة التوجيه إلى الصفحة السابقة بعد تسجيل الدخول الناجح.
 * - تعتمد على useAuth من طبقة hooks/ لتجريد سياق المصادقة.
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope,
  faLock,
  faSpinner,
  faSignInAlt,
  faEye,
  faEyeSlash,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../hooks/useAuth'; // ✅ استيراد من hooks بدلاً من contexts

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.message || 'فشل تسجيل الدخول، يرجى التحقق من بياناتك');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white text-3xl font-bold">م</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">مرحباً بعودتك</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">سجل الدخول إلى حسابك لمواصلة التسوق</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border-r-4 border-red-500 p-4 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* البريد الإلكتروني */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">البريد الإلكتروني</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faEnvelope} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pr-10 pl-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition text-right"
                  placeholder="example@example.com"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* كلمة المرور */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">كلمة المرور</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faLock} className="text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pr-10 pl-10 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition text-right"
                  placeholder="••••••••"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            {/* ✅ تم إزالة رابط "نسيت كلمة المرور" مؤقتاً (سيتم إضافته بعد إنشاء الصفحة) */}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <><FontAwesomeIcon icon={faSpinner} spin /> جاري تسجيل الدخول...</>
              ) : (
                <><FontAwesomeIcon icon={faSignInAlt} /> تسجيل الدخول</>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300 dark:border-gray-600"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-gray-800 text-gray-500">أو</span></div>
          </div>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            ليس لديك حساب؟{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
              إنشاء حساب مجاني
            </Link>
          </p>
        </div>

        {import.meta.env.DEV && (
          <div className="text-center text-xs text-gray-500 bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
            <p className="font-semibold">بيانات دخول تجريبية:</p>
            <p>مستخدم: user@example.com / password123</p>
            <p>مدير: admin@mystore.com / admin123</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;