// frontend/src/layouts/AdminLayout.tsx
/**
 * Why this layout?
 * - Admin dashboard layout with sidebar navigation and top header
 * - Protects route: redirects non-admin users to home or login (handled in App.tsx)
 * - Collapsible sidebar for mobile responsiveness with RTL support
 * - Modern design with micro-interactions, smooth transitions, and accessibility
 * - Fully typed with no `any`, using framer-motion Variants (type-only import)
 * - Fixed NavLink children to never return `false` (use ternary operator)
 * - Uses useAuth from hooks layer for authentication state and actions
 */

import { useState, useCallback, memo } from 'react';
import { Outlet, NavLink, Link, Navigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTachometerAlt,
  faBox,
  faShoppingCart,
  faUsers,
  faCog,
  faSignOutAlt,
  faBars,
  faTimes,
  faStore,
} from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useAuth } from '../hooks/useAuth'; // ✅ استيراد من hooks بدلاً من contexts

// ------------------------------
// Animation variants (properly typed)
// ------------------------------
const sidebarVariants: Variants = {
  open: {
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
  closed: {
    x: '100%',
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
};

const overlayVariants: Variants = {
  visible: { opacity: 1 },
  hidden: { opacity: 0 },
};

const contentVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const AdminLayoutComponent = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  // Redirect if not admin
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const navItems = [
    { path: '/dashboard', label: 'لوحة التحكم', icon: faTachometerAlt },
    { path: '/dashboard/products', label: 'المنتجات', icon: faBox },
    { path: '/dashboard/orders', label: 'الطلبات', icon: faShoppingCart },
    { path: '/dashboard/users', label: 'المستخدمون', icon: faUsers },
    { path: '/dashboard/settings', label: 'الإعدادات', icon: faCog },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar (RTL: positioned on the right) */}
      <motion.aside
        variants={sidebarVariants}
        initial="closed"
        animate={sidebarOpen ? 'open' : 'closed'}
        className="fixed top-0 right-0 z-40 h-full w-72 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-2xl border-l border-gray-200/50 dark:border-gray-800/50 lg:translate-x-0 lg:relative lg:right-0 lg:shadow-none flex flex-col"
      >
        <div className="flex flex-col h-full">
          {/* Logo area */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200/80 dark:border-gray-800">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 group"
              onClick={() => setSidebarOpen(false)}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-lg">م</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent">
                MyStore Admin
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg transition"
              aria-label="إغلاق القائمة"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 px-3 overflow-y-auto">
            <ul className="space-y-1.5">
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200 group ${
                        isActive
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shadow-sm'
                          : ''
                      }`
                    }
                    onClick={() => setSidebarOpen(false)}
                  >
                    {({ isActive }) => (
                      <>
                        <FontAwesomeIcon
                          icon={item.icon}
                          className="w-5 transition-transform group-hover:scale-110"
                        />
                        <span className="text-sm font-medium">{item.label}</span>
                        {isActive ? (
                          <motion.div
                            layoutId="activeIndicator"
                            className="mr-auto w-1.5 h-1.5 rounded-full bg-primary-500"
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          />
                        ) : null}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200/80 dark:border-gray-800 space-y-2">
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition group"
              onClick={() => setSidebarOpen(false)}
            >
              <FontAwesomeIcon icon={faStore} className="w-5 text-gray-500 group-hover:text-primary-500 transition" />
              <span className="text-sm font-medium">زيارة المتجر</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition group"
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="w-5 group-hover:scale-105 transition" />
              <span className="text-sm font-medium">تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="lg:mr-72">
        {/* Top header */}
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm">
          <div className="flex items-center justify-between px-6 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="فتح القائمة"
            >
              <FontAwesomeIcon icon={faBars} size="lg" />
            </button>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                مرحباً، {user?.fullName || 'مدير'}
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold shadow-md">
                {user?.fullName?.charAt(0).toUpperCase() || 'م'}
              </div>
            </div>
          </div>
        </header>

        {/* Page content with smooth transitions */}
        <main className="p-6">
          <motion.div
            variants={contentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

// Memoize to prevent unnecessary re-renders from parent
export const AdminLayout = memo(AdminLayoutComponent);
export default AdminLayout;