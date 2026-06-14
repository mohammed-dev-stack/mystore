// frontend/src/layouts/MainLayout.tsx
/**
 * Why this layout?
 * - Shared layout for most pages (home, store, search, chat)
 * - Includes Navbar and Footer components
 * - Outlet from react-router-dom renders child routes
 */

import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;