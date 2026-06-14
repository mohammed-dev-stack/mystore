// backend/src/config/redis.ts
/**
 * Why Redis?
 * - In-memory data store for high-performance caching (product lists, API responses)
 * - Session store for authentication (optional, if we move from JWT to sessions)
 * - Rate limiting storage (track request counts per IP)
 * - Queue management for background jobs (email sending, image processing)
 * - Reduces database load and improves response times
 */
import Redis from 'ioredis';
import logger from '../utils/logger.js';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;
const REDIS_DB = parseInt(process.env.REDIS_DB || '0', 10);
let redisClient = null;
/**
 * Initialize Redis connection
 * @returns Redis client instance
 */
export const initRedis = () => {
    if (redisClient)
        return redisClient;
    redisClient = new Redis(REDIS_URL, {
        password: REDIS_PASSWORD,
        db: REDIS_DB,
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            logger.warn(`Redis connection retry ${times}, delay ${delay}ms`);
            return delay;
        },
        maxRetriesPerRequest: 3,
    });
    redisClient.on('connect', () => {
        logger.info('✅ Redis connected');
    });
    redisClient.on('error', (err) => {
        logger.error('Redis connection error:', err);
    });
    return redisClient;
};
/**
 * Get cached data by key
 * @param key - Cache key
 * @returns Parsed JSON data or null
 */
export const getCache = async (key) => {
    if (!redisClient)
        initRedis();
    try {
        const data = await redisClient.get(key);
        if (data)
            return JSON.parse(data);
        return null;
    }
    catch (error) {
        logger.error(`Redis get error for key ${key}:`, error);
        return null;
    }
};
/**
 * Set cached data with expiration
 * @param key - Cache key
 * @param value - Data to cache (will be JSON.stringify)
 * @param ttlSeconds - Time to live in seconds (default 60)
 */
export const setCache = async (key, value, ttlSeconds = 60) => {
    if (!redisClient)
        initRedis();
    try {
        const serialized = JSON.stringify(value);
        await redisClient.setex(key, ttlSeconds, serialized);
    }
    catch (error) {
        logger.error(`Redis set error for key ${key}:`, error);
    }
};
/**
 * Delete cached data by key pattern (supports wildcards)
 * @param pattern - Key pattern (e.g., "products:*")
 */
export const deleteCachePattern = async (pattern) => {
    if (!redisClient)
        initRedis();
    try {
        const keys = await redisClient.keys(pattern);
        if (keys.length) {
            await redisClient.del(...keys);
            logger.debug(`Deleted ${keys.length} cache keys matching ${pattern}`);
        }
    }
    catch (error) {
        logger.error(`Redis delete pattern error for ${pattern}:`, error);
    }
};
/**
 * Clear entire database (use with caution)
 */
export const flushCache = async () => {
    if (!redisClient)
        initRedis();
    try {
        await redisClient.flushdb();
        logger.warn('Redis cache flushed');
    }
    catch (error) {
        logger.error('Redis flush error:', error);
    }
};
/**
 * Close Redis connection (for graceful shutdown)
 */
export const closeRedis = async () => {
    if (redisClient) {
        await redisClient.quit();
        logger.info('Redis connection closed');
        redisClient = null;
    }
};
// Export default client for direct use if needed
export const getRedisClient = () => {
    if (!redisClient)
        return initRedis();
    return redisClient;
};
//# sourceMappingURL=redis.js.map