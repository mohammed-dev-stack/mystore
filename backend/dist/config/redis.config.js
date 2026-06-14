// backend/src/config/redis.config.ts
/**
 * Why this configuration?
 * - Centralized Redis connection setup for caching, session storage, rate limiting.
 * - Supports connection pooling, retry strategy, and graceful shutdown.
 * - Used by chat service (caching Ollama responses), product service (caching popular products), and rate limiter.
 *
 * Environment variables:
 *   - REDIS_URL: full Redis connection string (e.g., redis://localhost:6379)
 *   - REDIS_PASSWORD: optional password
 *   - REDIS_DB: optional database index (default 0)
 *
 * Falls back to a mock (in-memory) implementation if REDIS_URL is not provided
 * (useful for development without Redis).
 */
import Redis from 'ioredis';
import logger from '../utils/logger.js';
/**
 * In-memory mock implementation (used when Redis is not configured).
 * Suitable for development or environments where Redis is unavailable.
 */
class InMemoryCache {
    store = new Map();
    async get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return null;
        if (entry.expiresAt && entry.expiresAt < Date.now()) {
            this.store.delete(key);
            return null;
        }
        return entry.value;
    }
    async set(key, value, ttlSeconds) {
        const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
        this.store.set(key, { value, expiresAt });
    }
    async del(key) {
        this.store.delete(key);
    }
    async exists(key) {
        const value = await this.get(key);
        return value !== null;
    }
    async expire(key, seconds) {
        const entry = this.store.get(key);
        if (entry) {
            entry.expiresAt = Date.now() + seconds * 1000;
            this.store.set(key, entry);
        }
    }
    async incr(key) {
        const current = await this.get(key);
        const newValue = current ? parseInt(current, 10) + 1 : 1;
        await this.set(key, newValue.toString());
        return newValue;
    }
    async quit() {
        this.store.clear();
    }
}
// Determine Redis connection details
const REDIS_URL = process.env.REDIS_URL;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_DB = parseInt(process.env.REDIS_DB || '0', 10);
let redisClient = null;
let cacheClient;
if (REDIS_URL) {
    // Connect to Redis using the provided URL
    try {
        redisClient = new Redis(REDIS_URL, {
            password: REDIS_PASSWORD,
            db: REDIS_DB,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                logger.warn(`Redis connection lost. Retrying in ${delay}ms... (attempt ${times})`);
                return delay;
            },
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            lazyConnect: false,
        });
        redisClient.on('connect', () => {
            logger.info('✅ Redis connected successfully');
        });
        redisClient.on('error', (err) => {
            logger.error('❌ Redis error:', err);
        });
        redisClient.on('close', () => {
            logger.warn('⚠️ Redis connection closed');
        });
        cacheClient = {
            async get(key) {
                return redisClient.get(key);
            },
            async set(key, value, ttlSeconds) {
                if (ttlSeconds) {
                    await redisClient.set(key, value, 'EX', ttlSeconds);
                }
                else {
                    await redisClient.set(key, value);
                }
            },
            async del(key) {
                await redisClient.del(key);
            },
            async exists(key) {
                const result = await redisClient.exists(key);
                return result === 1;
            },
            async expire(key, seconds) {
                await redisClient.expire(key, seconds);
            },
            async incr(key) {
                return redisClient.incr(key);
            },
            async quit() {
                if (redisClient) {
                    await redisClient.quit();
                }
            },
        };
    }
    catch (err) {
        logger.error('Failed to initialize Redis client, falling back to in-memory cache:', err);
        cacheClient = new InMemoryCache();
    }
}
else {
    logger.warn('REDIS_URL not provided, using in-memory cache (suitable for development)');
    cacheClient = new InMemoryCache();
}
/**
 * Returns the Redis client instance (or null if using in-memory).
 * Useful for advanced Redis operations (pub/sub, etc.).
 */
export const getRedisClient = () => redisClient;
/**
 * Returns the cache client (either Redis or in-memory mock).
 * This is the recommended interface for most caching needs.
 */
export const getCacheClient = () => cacheClient;
/**
 * Gracefully close the Redis connection.
 * Should be called during application shutdown.
 */
export const closeRedisConnection = async () => {
    if (redisClient) {
        await redisClient.quit();
        logger.info('Redis connection closed gracefully');
    }
    else {
        await cacheClient.quit();
    }
};
// Default export for convenience
export default { getRedisClient, getCacheClient, closeRedisConnection };
//# sourceMappingURL=redis.config.js.map