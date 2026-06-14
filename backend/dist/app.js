// backend/src/app.ts
/**
 * Why this file?
 * - Central Express app configuration (separates app logic from server startup)
 * - Registers all global middleware: Helmet (security), CORS, Compression, Rate Limit, JSON parser
 * - Mounts all route modules (auth, products, search, chat, orders)
 * - Global error handler (must be last)
 * - Exports the configured app instance for testing and server.ts
 */
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';
// Import route modules (with explicit .js extension for ES modules)
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import searchRoutes from './routes/search.routes.js';
import chatRoutes from './routes/chat.routes.js';
import orderRoutes from './routes/order.routes.js';
// Import custom middleware
import { errorHandler } from './middleware/error.middleware.js';
import { securityMiddleware } from './middleware/security.middleware.js';
const app = express();
// ------------------------------
// 1. Global Security Middleware
// ------------------------------
app.use(helmet({
    crossOriginResourcePolicy: { policy: "same-site" },
    hsts: { maxAge: 31536000, includeSubDomains: true }
}));
// CORS configuration (allow frontend origin)
const allowedOrigins = process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL]
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'];
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin) || origin.includes('localhost') || origin.includes('127.0.0.1')) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
}));
// Additional security headers (XSS, SQL injection protection)
app.use(securityMiddleware);
// ------------------------------
// 2. Performance Middleware
// ------------------------------
app.use(compression({ level: 6, threshold: '1kb' }));
// ------------------------------
// 3. Request Parsing
// ------------------------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// ------------------------------
// 4. Rate Limiting (prevent brute force / DDoS)
// ------------------------------
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', globalLimiter);
// ✅ تم تعديل هذا الجزء لحل مشكلة 429 Too Many Requests
// - في بيئة التطوير (development): نسمح بـ 100 محاولة فاشلة
// - في بيئة الإنتاج (production): نسمح بـ 5 محاولات فقط للأمان
const AUTH_MAX_ATTEMPTS = process.env.NODE_ENV === 'production' ? 5 : 100;
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: AUTH_MAX_ATTEMPTS, // ✅ الحد حسب البيئة
    skipSuccessfulRequests: true, // المحاولات الناجحة لا تحتسب
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many login/register attempts, please try again after 15 minutes.'
});
app.use('/api/auth/', authLimiter);
// ------------------------------
// 5. Routes
// ------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/orders', orderRoutes);
// Health check endpoint (for load balancers / docker)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
// 404 handler for unmatched routes
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});
// ------------------------------
// 6. Global Error Handler (must be last)
// ------------------------------
app.use(errorHandler);
export default app;
//# sourceMappingURL=app.js.map