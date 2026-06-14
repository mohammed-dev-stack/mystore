// backend/src/config/database.ts
/**
 * Why this configuration?
 * - MongoDB connection with Mongoose (TypeScript support)
 * - Connection pooling: optimizes performance for frequent DB calls
 * - Retry logic with max attempts: handles temporary network failures in production
 * - Index creation: ensures performance-critical indexes exist (text search, compound indexes)
 * - Event logging: listens to connection events for monitoring
 * - TTL index for chat sessions (auto-cleanup after 30 days)
 */

import mongoose from 'mongoose';
import logger from '../utils/logger.js';

// Import models to ensure they are registered before index creation
import '../models/user.model.js';
import '../models/product.model.js';
import '../models/chat.model.js';
import '../models/order.model.js';

const MAX_RETRY_ATTEMPTS = 5;
let retryCount = 0;

/**
 * Validates that MONGO_URI environment variable is defined.
 * Throws an error with clear message if missing.
 */
function validateMongoUri(): string {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error(
      '❌ MONGO_URI environment variable is not defined. ' +
      'Please set it in your .env file (e.g., MONGO_URI=mongodb://localhost:27017/mystore)'
    );
  }
  return uri;
}

/**
 * Establishes connection to MongoDB with retry logic for production.
 */
const connectDB = async (): Promise<void> => {
  const mongoUri = validateMongoUri();

  try {
    const conn = await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      retryReads: true,
      compressors: ['snappy'],
      // Add server selection timeout to avoid hanging
      serverSelectionTimeoutMS: 5000,
    });

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);

    // Reset retry counter on successful connection
    retryCount = 0;

    // Create indexes after connection (if not already present)
    await createIndexes();

    // Connection event listeners for monitoring
    mongoose.connection.on('error', (err) => {
      logger.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('✅ MongoDB reconnected');
    });
  } catch (error) {
    logger.error('❌ MongoDB Connection Failed:', error);

    if (process.env.NODE_ENV === 'production') {
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        retryCount++;
        const delayMs = 5000 * retryCount; // Exponential backoff: 5s, 10s, 15s...
        logger.info(`🔄 Retrying connection in ${delayMs / 1000}s (attempt ${retryCount}/${MAX_RETRY_ATTEMPTS})...`);
        setTimeout(() => connectDB(), delayMs);
      } else {
        logger.error(`❌ Failed to connect after ${MAX_RETRY_ATTEMPTS} attempts. Exiting.`);
        process.exit(1);
      }
    } else {
      // In development, exit immediately to avoid silent failures
      logger.error('❌ Database connection failed in development mode. Exiting.');
      process.exit(1);
    }
  }
};

/**
 * Creates necessary indexes for all models.
 * Uses `createIndex` which is idempotent (does nothing if index already exists).
 * Errors are logged but do not stop the application startup.
 */
const createIndexes = async (): Promise<void> => {
  try {
    // Obtain model references (already imported above)
    const User = mongoose.model('User');
    const Product = mongoose.model('Product');
    const Chat = mongoose.model('Chat');
    const Order = mongoose.model('Order');

    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true, background: true });
    await User.collection.createIndex({ role: 1, isActive: 1 });

    // Product indexes (text search + filtering)
    await Product.collection.createIndex(
      { name: 'text', description: 'text', tags: 'text' },
      {
        weights: { name: 10, tags: 8, description: 5 },
        name: 'product_search_index',
        background: true,
      }
    );
    await Product.collection.createIndex({ category: 1, price: 1 });
    await Product.collection.createIndex({ isActive: 1, isFeatured: 1 });
    await Product.collection.createIndex({ createdAt: -1 });
    await Product.collection.createIndex({ slug: 1 }, { unique: true });

    // Chat TTL index (auto-delete after 30 days)
    await Chat.collection.createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 30 * 24 * 60 * 60, background: true }
    );

    // Order indexes
    await Order.collection.createIndex({ user: 1, createdAt: -1 });
    await Order.collection.createIndex({ status: 1, createdAt: -1 });
    await Order.collection.createIndex({ orderNumber: 1 }, { unique: true });

    logger.info('📊 Database indexes verified/created successfully');
  } catch (error) {
    // Index creation failure is not fatal; log warning and continue
    logger.warn('⚠️ Index creation encountered an issue (may already exist):', error);
  }
};

export default connectDB;