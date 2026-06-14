// backend/src/utils/logger.ts
/**
 * Why this logger?
 * - Centralized logging using Winston
 * - Supports different log levels: error, warn, info, http, debug
 * - Colorized console output for development
 * - File rotation for production (error.log, combined.log)
 * - JSON format for structured logging (compatible with log aggregators)
 * - Captures uncaught exceptions and unhandled promise rejections
 */
import winston from 'winston';
import path from 'path';
const logDir = 'logs';
const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
// Custom format for development (human-readable)
const devFormat = winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length) {
        log += ` ${JSON.stringify(meta)}`;
    }
    if (stack)
        log += `\n${stack}`;
    return log;
});
// Transports array
const transports = [
    // Console transport for all environments
    new winston.transports.Console({
        format: winston.format.combine(winston.format.colorize({ all: true }), winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), devFormat),
    }),
];
// File transport for production (optional)
if (process.env.NODE_ENV === 'production') {
    transports.push(new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }), new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        maxsize: 5242880,
        maxFiles: 5,
    }));
}
// Create logger instance
const logger = winston.createLogger({
    level: logLevel,
    format: winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.json() // Structured JSON for file logs
    ),
    transports,
    exceptionHandlers: [
        new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), devFormat) }),
    ],
    rejectionHandlers: [
        new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), devFormat) }),
    ],
});
export default logger;
//# sourceMappingURL=logger.js.map