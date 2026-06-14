// frontend/src/pages/Checkout.tsx
/**
 * Why this page?
 * - Checkout flow: review cart items, enter shipping/billing address, select payment method
 * - Displays order summary with subtotal, shipping, tax, total
 * - Form validation for required fields
 * - Integrates with CartContext and AuthContext via custom hooks (useCart, useAuth) for clean architecture
 * - Calls API to create order and process payment (Stripe/PayPal)
 * - Handles loading states and error messages
 * - Redirects to order confirmation on success
 * - RTL support for Arabic language
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCreditCard,
  faTruck,
  faMoneyBillWave,
  faSpinner,
  faCheckCircle,
  faLocationDot,
  faBuilding,
  faMapPin,
  faGlobe,
  faPhone,
} from '@fortawesome/free-solid-svg-icons';
import { faPaypal } from '@fortawesome/free-brands-svg-icons';
import { useCart } from '../hooks/useCart';   // ✅ استيراد من hooks بدلاً من contexts
import { useAuth } from '../hooks/useAuth';   // ✅ استيراد من hooks بدلاً من contexts
import { createOrder } from '../services/order.service';

interface AddressForm {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
}

interface FormErrors {
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
}

const Checkout = () => {
  const { cartItems, subtotal, shippingCost, tax, total, clearCart, isEmpty } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal' | 'cash_on_delivery'>('stripe');
  const [shippingAddress, setShippingAddress] = useState<AddressForm>({
    street: '',
    city: '',
    postalCode: '',
    country: '',
    phone: '',
  });
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingAddress, setBillingAddress] = useState<AddressForm>({
    street: '',
    city: '',
    postalCode: '',
    country: '',
    phone: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
    }
    if (isEmpty && !loading) {
      navigate('/store');
    }
  }, [isAuthenticated, isEmpty, navigate, loading]);

  const validateAddress = (address: AddressForm): FormErrors => {
    const newErrors: FormErrors = {};
    if (!address.street.trim()) newErrors.street = 'Street address is required';
    if (!address.city.trim()) newErrors.city = 'City is required';
    if (!address.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
    if (!address.country.trim()) newErrors.country = 'Country is required';
    if (!address.phone.trim()) newErrors.phone = 'Phone number is required';
    return newErrors;
  };

  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBillingAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const shippingErrors = validateAddress(shippingAddress);
    if (Object.keys(shippingErrors).length > 0) {
      setErrors(shippingErrors);
      return;
    }
    let finalBillingAddress = billingAddress;
    if (billingSameAsShipping) {
      finalBillingAddress = shippingAddress;
    } else {
      const billingErrors = validateAddress(billingAddress);
      if (Object.keys(billingErrors).length > 0) {
        setErrors(billingErrors);
        return;
      }
    }

    setLoading(true);
    try {
      const orderData = {
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          selectedAttributes: item.selectedAttributes,
        })),
        shippingAddress,
        billingAddress: finalBillingAddress,
        paymentMethod,
        customerNotes: '',
      };
      const response = await createOrder(orderData);
      if (response.success) {
        clearCart();
        navigate(`/order-confirmation/${response.order._id}`);
      } else {
        setError((response as any).message || "Order creation failed" || 'Order creation failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || isEmpty) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">إتمام الشراء</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left side - Forms */}
        <div className="flex-1 space-y-6">
          {/* Shipping Address */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <FontAwesomeIcon icon={faTruck} className="text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">عنوان الشحن</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العنوان بالتفصيل</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faLocationDot} className="absolute right-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="street"
                    value={shippingAddress.street}
                    onChange={handleShippingChange}
                    className="w-full pr-10 pl-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                    placeholder="الشارع ورقم المبنى"
                  />
                </div>
                {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المدينة</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faBuilding} className="absolute right-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="city"
                    value={shippingAddress.city}
                    onChange={handleShippingChange}
                    className="w-full pr-10 pl-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  />
                </div>
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الرمز البريدي</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faMapPin} className="absolute right-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="postalCode"
                    value={shippingAddress.postalCode}
                    onChange={handleShippingChange}
                    className="w-full pr-10 pl-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  />
                </div>
                {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الدولة</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faGlobe} className="absolute right-3 top-3 text-gray-400" />
                  <select
                    name="country"
                    value={shippingAddress.country}
                    onChange={handleShippingChange}
                    className="w-full pr-10 pl-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 appearance-none"
                  >
                    <option value="">اختر الدولة</option>
                    <option value="SA">السعودية</option>
                    <option value="AE">الإمارات</option>
                    <option value="EG">مصر</option>
                    <option value="KW">الكويت</option>
                    <option value="QA">قطر</option>
                    <option value="OM">عمان</option>
                    <option value="BH">البحرين</option>
                    <option value="US">الولايات المتحدة</option>
                    <option value="UK">المملكة المتحدة</option>
                    <option value="CA">كندا</option>
                  </select>
                </div>
                {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رقم الهاتف</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faPhone} className="absolute right-3 top-3 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={shippingAddress.phone}
                    onChange={handleShippingChange}
                    className="w-full pr-10 pl-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Billing Address */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCreditCard} className="text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">عنوان الفوترة</h2>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={billingSameAsShipping}
                  onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                  className="rounded"
                />
                نفس عنوان الشحن
              </label>
            </div>
            {!billingSameAsShipping && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العنوان بالتفصيل</label>
                  <input
                    type="text"
                    name="street"
                    value={billingAddress.street}
                    onChange={handleBillingChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المدينة</label>
                  <input
                    type="text"
                    name="city"
                    value={billingAddress.city}
                    onChange={handleBillingChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الرمز البريدي</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={billingAddress.postalCode}
                    onChange={handleBillingChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الدولة</label>
                  <select
                    name="country"
                    value={billingAddress.country}
                    onChange={handleBillingChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                  >
                    <option value="">اختر الدولة</option>
                    <option value="SA">السعودية</option>
                    <option value="AE">الإمارات</option>
                    <option value="EG">مصر</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رقم الهاتف</label>
                  <input
                    type="tel"
                    name="phone"
                    value={billingAddress.phone}
                    onChange={handleBillingChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">طريقة الدفع</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="stripe"
                  checked={paymentMethod === 'stripe'}
                  onChange={() => setPaymentMethod('stripe')}
                  className="w-4 h-4"
                />
                <FontAwesomeIcon icon={faCreditCard} className="text-blue-600" />
                <span>بطاقة ائتمان (Stripe)</span>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="paypal"
                  checked={paymentMethod === 'paypal'}
                  onChange={() => setPaymentMethod('paypal')}
                  className="w-4 h-4"
                />
                <FontAwesomeIcon icon={faPaypal} className="text-blue-600" />
                <span>باي بال (PayPal)</span>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash_on_delivery"
                  checked={paymentMethod === 'cash_on_delivery'}
                  onChange={() => setPaymentMethod('cash_on_delivery')}
                  className="w-4 h-4"
                />
                <FontAwesomeIcon icon={faMoneyBillWave} className="text-green-600" />
                <span>الدفع عند الاستلام</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border-r-4 border-red-500 p-4 rounded-lg">
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Right side - Order Summary */}
        <div className="lg:w-96">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sticky top-24">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">ملخص الطلب</h2>
            <div className="space-y-2">
              {cartItems.map((item) => (
                <div key={`${item.productId}-${JSON.stringify(item.selectedAttributes)}`} className="flex justify-between text-sm">
                  <span>
                    {item.name} x {item.quantity}
                  </span>
                  <span>${item.total.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>المجموع الفرعي</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>الشحن</span>
                  <span>${shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>الضريبة (10%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>الإجمالي</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full mt-6 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  جاري المعالجة...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faCheckCircle} />
                  تأكيد الطلب
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;