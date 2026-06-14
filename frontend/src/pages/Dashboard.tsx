// frontend/src/pages/Dashboard.tsx
/**
 * لوحة تحكم الأدمن - نسخة عربية محسّنة.
 * - دعم كامل لـ RTL (من اليمين لليسار) باستخدام Tailwind Utilities (me, ms, border-l, border-r).
 * - ترجمة جميع النصوص الثابتة إلى العربية.
 * - استخدام أيقونات FontAwesome مع ألوان متناسقة.
 * - إضافة Skeleton Loader أثناء تحميل البيانات (شبكة من البطاقات الوهمية).
 * - عرض إحصائيات رئيسية (المبيعات، الطلبات، المنتجات، المستخدمين).
 * - جدول بأحدث الطلبات مع حالة كل طلب (شريط ألوان حسب الحالة).
 * - أزرار إجراءات (عرض، حذف) مع أيقونات واضحة.
 * - توجيه إلى صفحات إدارة المنتجات والطلبات والمستخدمين.
 */


import { useEffect, useState } from 'react'
;

import { Link } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {  } from '@fortawesome/free-solid-svg-icons';
import { faDollarSign, faShoppingCart, faBox, faUsers, faEye, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';

import { getProducts } from '../services/product.service';

import { getAllUsers } from '../services/auth.service';

import { getAllOrders } from '../services/order.service';

interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  recentOrders: Array<{
    _id: string;
    orderNumber: string;
    total: number;
    status: string;
    createdAt: string;
    user: { fullName: string; email: string };
  }>;
}

// مكون Skeleton للإحصائيات (4 بطاقات)
const StatsSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array(4)
      .fill(0)
      .map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 animate-pulse">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
        </div>
      ))}
  </div>
);

// مكون Skeleton لجدول الطلبات (5 صفوف)
const OrdersTableSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm animate-pulse">
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <th key={i} className="px-4 py-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <tr key={i}>
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-5 bg-gray-100 dark:bg-gray-700 rounded w-20"></div>
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 ms-auto"></div>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const productsRes = await getProducts({ page: 1, limit: 1 });
        const usersRes = await getAllUsers(1, 1);
        const ordersRes = await getAllOrders(1, 5, '', 'createdAt');

        // في الإنتاج، يجب جلب إجمالي المبيعات من API (مثلاً /orders/admin/stats)
        const totalSales = 12500; // قيمة تجريبية

        setStats({
          totalSales,
          totalOrders: ordersRes.total,
          totalProducts: productsRes.total,
          totalUsers: usersRes.total,
          recentOrders: ordersRes.orders || [],
        });
      } catch (error) {
        console.error('فشل تحميل بيانات لوحة التحكم:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // دالة مساعدة لتحديد لون شارة الحالة
  const getStatusBadgeClass = (status: string) => {
    const classes: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      paid: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      processing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      shipped: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  };

  // ترجمة حالة الطلب إلى العربية
  const translateStatus = (status: string): string => {
    const map: Record<string, string> = {
      pending: 'قيد الانتظار',
      paid: 'مدفوع',
      processing: 'قيد التجهيز',
      shipped: 'تم الشحن',
      delivered: 'تم التوصيل',
      cancelled: 'ملغي',
      refunded: 'مسترجع',
    };
    return map[status] || status;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-32 animate-pulse"></div>
        </div>
        <StatsSkeleton />
        <OrdersTableSkeleton />
      </div>
    );
  }

  const statCards = [
    { title: 'إجمالي المبيعات', value: stats ? `$${stats.totalSales.toLocaleString()}` : '-', icon: faDollarSign, color: 'bg-green-500' },
    { title: 'إجمالي الطلبات', value: stats?.totalOrders.toLocaleString() || '-', icon: faShoppingCart, color: 'bg-blue-500' },
    { title: 'إجمالي المنتجات', value: stats?.totalProducts.toLocaleString() || '-', icon: faBox, color: 'bg-purple-500' },
    { title: 'إجمالي المستخدمين', value: stats?.totalUsers.toLocaleString() || '-', icon: faUsers, color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">لوحة التحكم</h1>
        <Link
          to="/dashboard/products/new"
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
        >
          <FontAwesomeIcon icon={faPlus} />
          إضافة منتج
        </Link>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between"
          >
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{card.title}</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{card.value}</p>
            </div>
            <div className={`${card.color} w-12 h-12 rounded-full flex items-center justify-center`}>
              <FontAwesomeIcon icon={card.icon} className="text-white text-xl" />
            </div>
          </div>
        ))}
      </div>

      {/* جدول أحدث الطلبات */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">أحدث الطلبات</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">رقم الطلب</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">العميل</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">التاريخ</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">الإجمالي</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">الحالة</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {stats?.recentOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 font-mono">{order.orderNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{order.user?.fullName || 'غير معروف'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString('ar-EG')}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">${order.total.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(order.status)}`}>
                      {translateStatus(order.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        to={`/dashboard/orders/${order._id}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        title="عرض"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </Link>
                      <button className="text-red-600 hover:text-red-800 dark:text-red-400" title="حذف">
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    لا توجد طلبات لعرضها
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-left">
          <Link
            to="/dashboard/orders"
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            عرض جميع الطلبات ←
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;