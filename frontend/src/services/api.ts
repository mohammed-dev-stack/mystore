// frontend/src/services/api.ts
/**
 * Why this file?
 * - Centralized API client using Axios
 * - Base URL from environment variable (VITE_API_URL)
 * - Automatically attaches JWT token to all requests (if available in localStorage)
 * - Handles 401 responses globally: removes token and redirects to login
 * - Provides typed methods for common HTTP operations (GET, POST, PUT, DELETE)
 * - Includes response interceptor for error handling and logging
 */

import axios, { 
  type AxiosInstance, 
  type AxiosRequestConfig, 
  type AxiosResponse, 
  type InternalAxiosRequestConfig 
} from 'axios';
// Get API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor: attach token to headers
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Response interceptor: handle 401, errors, and logging
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful requests in development
    if (import.meta.env.DEV) {
      console.log(`✅ API ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  async (error: any) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Handle 401 Unauthorized (token expired or invalid)
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // Clear invalid token
      localStorage.removeItem('token');
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Log errors in development
    if (import.meta.env.DEV) {
      console.error(`❌ API Error ${error.config?.url}:`, error.response?.data || error.message);
    }

    return Promise.reject(error);
  }
);

// Generic request wrapper with types
export const request = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    api.get(url, config).then((res: AxiosResponse<T>) => res.data),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    api.post(url, data, config).then((res: AxiosResponse<T>) => res.data),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    api.put(url, data, config).then((res: AxiosResponse<T>) => res.data),

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    api.patch(url, data, config).then((res: AxiosResponse<T>) => res.data),

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    api.delete(url, config).then((res: AxiosResponse<T>) => res.data),
};

export default api;