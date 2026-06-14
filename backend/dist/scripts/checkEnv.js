// backend/src/scripts/checkEnv.ts
/**
 * Why this script?
 * - Validates that all required environment variables are set before starting the server.
 * - Prevents runtime crashes due to missing configuration.
 * - Provides clear error messages for each missing variable.
 * - Can be run programmatically or via CLI.
 *
 * Required variables:
 *   - MONGO_URI, JWT_SECRET, PORT, FRONTEND_URL
 *   - OLLAMA_URL, OLLAMA_MODEL, OLLAMA_TIMEOUT
 *   - NODE_ENV (optional, defaults to 'development')
 *
 * Optional but recommended for production:
 *   - STRIPE_SECRET_KEY, PAYPAL_CLIENT_ID, PAYPAL_SECRET
 *   - REDIS_URL, EMAIL_HOST, EMAIL_USER, EMAIL_PASS
 *
 * Usage:
 *   import { checkEnv } from './scripts/checkEnv.js';
 *   const isOk = checkEnv();
 *   if (!isOk) process.exit(1);
 */
import dotenv from 'dotenv';
// Load environment variables from .env file
dotenv.config();
/**
 * List of required environment variables.
 * These must be present for the application to function.
 */
const REQUIRED_VARS = [
    'MONGO_URI',
    'JWT_SECRET',
    'PORT',
    'FRONTEND_URL',
    'OLLAMA_URL',
    'OLLAMA_MODEL',
    'OLLAMA_TIMEOUT',
];
/**
 * Optional environment variables (not required but warned if missing in production).
 */
const OPTIONAL_VARS_PROD = [
    'STRIPE_SECRET_KEY',
    'PAYPAL_CLIENT_ID',
    'PAYPAL_SECRET',
    'REDIS_URL',
    'EMAIL_HOST',
    'EMAIL_USER',
    'EMAIL_PASS',
];
/**
 * Validates that a JWT secret is strong enough (minimum length 32 chars).
 * @param secret - The JWT secret string.
 * @returns True if strong, false otherwise.
 */
function isStrongJwtSecret(secret) {
    return secret.length >= 32;
}
/**
 * Checks that a URL string is valid and uses http/https.
 * @param url - The URL to validate.
 * @returns True if valid, false otherwise.
 */
function isValidUrl(url) {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    }
    catch {
        return false;
    }
}
/**
 * Validates a port number (1-65535).
 * @param port - The port as string or number.
 * @returns True if valid.
 */
function isValidPort(port) {
    const num = parseInt(port, 10);
    return !isNaN(num) && num >= 1 && num <= 65535;
}
/**
 * Main validation function.
 * Checks all required and optional environment variables.
 * Logs errors and returns false if any required variable is missing or invalid.
 * @returns True if all required variables are present and valid, false otherwise.
 */
export function checkEnv() {
    let allGood = true;
    // Check required variables
    for (const varName of REQUIRED_VARS) {
        const value = process.env[varName];
        if (!value || value.trim() === '') {
            console.error(`❌ Missing required environment variable: ${varName}`);
            allGood = false;
        }
    }
    // Additional validations for specific variables (only if they exist)
    if (process.env.JWT_SECRET) {
        if (!isStrongJwtSecret(process.env.JWT_SECRET)) {
            console.error('❌ JWT_SECRET is too weak (must be at least 32 characters long)');
            allGood = false;
        }
    }
    if (process.env.FRONTEND_URL && !isValidUrl(process.env.FRONTEND_URL)) {
        console.error('❌ FRONTEND_URL must be a valid HTTP/HTTPS URL');
        allGood = false;
    }
    if (process.env.PORT && !isValidPort(process.env.PORT)) {
        console.error('❌ PORT must be a number between 1 and 65535');
        allGood = false;
    }
    if (process.env.OLLAMA_TIMEOUT) {
        const timeout = parseInt(process.env.OLLAMA_TIMEOUT, 10);
        if (isNaN(timeout) || timeout < 1000) {
            console.error('❌ OLLAMA_TIMEOUT must be a number >= 1000 (milliseconds)');
            allGood = false;
        }
    }
    // Warn about optional variables if NODE_ENV === 'production'
    if (process.env.NODE_ENV === 'production') {
        for (const varName of OPTIONAL_VARS_PROD) {
            if (!process.env[varName]) {
                console.warn(`⚠️ Optional environment variable ${varName} is not set. Some features may not work.`);
            }
        }
    }
    if (allGood) {
        console.log('✅ Environment variables validated successfully.');
    }
    else {
        console.error('❌ Environment validation failed. Please fix the errors above and restart.');
    }
    return allGood;
}
/**
 * If this script is run directly via `tsx src/scripts/checkEnv.ts`, execute validation and exit.
 */
if (import.meta.url === `file://${process.argv[1]}`) {
    const ok = checkEnv();
    process.exit(ok ? 0 : 1);
}
//# sourceMappingURL=checkEnv.js.map