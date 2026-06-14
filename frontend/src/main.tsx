// frontend/src/main.tsx
/**
 * Why this file?
 * - Entry point for React application (React 18+)
 * - Sets up StrictMode for development warnings
 * - Initializes global Axios configuration (baseURL, interceptors for auth token)
 * - Imports Tailwind CSS and global styles
 * - Renders App component inside root element
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Axios configuration (global)
import axios from 'axios';

// Set base URL from environment variable
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Add token to all requests if present in localStorage
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally (redirect to login)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);