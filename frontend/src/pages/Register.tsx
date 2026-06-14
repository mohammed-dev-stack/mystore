// frontend/src/pages/Register.tsx
/**
 * صفحة إنشاء حساب جديد - نسخة عربية محسّنة.
 * - دعم كامل لـ RTL.
 * - التحقق من قوة كلمة المرور وتطابقها.
 * - بعد التسجيل الناجح: يتم التوجيه إلى صفحة تسجيل الدخول (وليس الصفحة الرئيسية).
 * - إظهار رسائل خطأ واضحة.
 * - تعتمد على useAuth من طبقة hooks/ لتجريد سياق المصادقة.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  faSpinner,
  faUserPlus,
  faCheckCircle,
  faTimesCircle,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../hooks/useAuth'; // ✅ استيراد من hooks بدلاً من contexts

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // قوة كلمة المرور
  const passwordChecks = {
    length: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
  };
  const passwordStrength = Object.values(passwordChecks).filter(Boolean).length;
  const isPasswordStrong = passwordStrength >= 3;

  const validateForm = (): boolean => {
    if (!fullName.trim() || !email.trim() || !password) {
      setError('جميع الحقول مطلوبة');
      return false;
    }
    if (password.length < 8) {
      setError('يجب أن تتكون كلمة المرور من 8 أحرف على الأقل');
      return false;
    }
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return false;
    }
    const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
    if (!emailRegex.test(email)) {
      setError('يرجى إدخال بريد إلكتروني صالح');
      return false;
    }
    if (!isPasswordStrong) {
      setError('كلمة المرور ضعيفة. استخدم 8 أحرف على الأقل تحتوي على أرقام وأحرف كبيرة وصغيرة');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;

    setIsLoading(true);
    const result = await register({ fullName, email, password });
    setIsLoading(false);

    if (result.success) {
      // ✅ بعد نجاح التسجيل، يتم التوجيه إلى صفحة تسجيل الدخول
      navigate('/login');
    } else {
      setError(result.message || 'فشل إنشاء الحساب، يرجى المحاولة مرة أخرى');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white text-3xl font-bold">م</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">إنشاء حساب</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">انضم إلى MyStore وابدأ التسوق</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border-r-4 border-red-500 p-4 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* الاسم الكامل */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم الكامل</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full pr-10 pl-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition text-right"
                  placeholder="أحمد محمد"
                  disabled={isLoading}
                  autoComplete="name"
                />
              </div>
            </div>

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
                  placeholder="أنشئ كلمة مرور قوية"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>

              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1 h-1">
                    <div className={`flex-1 rounded-full ${passwordStrength >= 1 ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                    <div className={`flex-1 rounded-full ${passwordStrength >= 2 ? 'bg-yellow-500' : 'bg-gray-200'}`}></div>
                    <div className={`flex-1 rounded-full ${passwordStrength >= 3 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                    <div className={`flex-1 rounded-full ${passwordStrength >= 4 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div className={`flex items-center gap-1 ${passwordChecks.length ? 'text-green-600' : 'text-gray-400'}`}>
                      {passwordChecks.length ? <FontAwesomeIcon icon={faCheckCircle} /> : <FontAwesomeIcon icon={faTimesCircle} />} <span>8 أحرف على الأقل</span>
                    </div>
                    <div className={`flex items-center gap-1 ${passwordChecks.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                      {passwordChecks.hasNumber ? <FontAwesomeIcon icon={faCheckCircle} /> : <FontAwesomeIcon icon={faTimesCircle} />} <span>يحتوي على رقم</span>
                    </div>
                    <div className={`flex items-center gap-1 ${passwordChecks.hasUpper ? 'text-green-600' : 'text-gray-400'}`}>
                      {passwordChecks.hasUpper ? <FontAwesomeIcon icon={faCheckCircle} /> : <FontAwesomeIcon icon={faTimesCircle} />} <span>حرف كبير</span>
                    </div>
                    <div className={`flex items-center gap-1 ${passwordChecks.hasLower ? 'text-green-600' : 'text-gray-400'}`}>
                      {passwordChecks.hasLower ? <FontAwesomeIcon icon={faCheckCircle} /> : <FontAwesomeIcon icon={faTimesCircle} />} <span>حرف صغير</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* تأكيد كلمة المرور */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تأكيد كلمة المرور</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faLock} className="text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pr-10 pl-10 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition text-right"
                  placeholder="أعد كتابة كلمة المرور"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">كلمتا المرور غير متطابقتين</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <><FontAwesomeIcon icon={faSpinner} spin /> جاري إنشاء الحساب...</>
              ) : (
                <><FontAwesomeIcon icon={faUserPlus} /> إنشاء حساب</>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300 dark:border-gray-600"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-gray-800 text-gray-500">لديك حساب بالفعل؟</span></div>
          </div>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">سجل الدخول بدلاً من ذلك</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;