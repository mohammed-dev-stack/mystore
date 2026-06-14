// frontend/src/layouts/AuthLayout.tsx
/**
 * Why this layout?
 * - Simple layout for authentication pages (login, register, forgot-password)
 * - No navbar or footer, just centered content with optional background gradient
 * - Outlet renders child routes (Login, Register, etc.)
 * - Includes a back-to-home link for better UX
 */

import { Outlet, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition mb-4"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Back to Home
        </Link>
      </div>
      <Outlet />
    </div>
  );
};

export default AuthLayout;