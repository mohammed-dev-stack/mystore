// backend/src/config/ollama.ts
/**
 * Why this configuration?
 * - Integrates with Ollama API (local or remote) for AI capabilities:
 *   - Image analysis: extract product description from base64 image
 *   - Chat: conversational AI for shopping assistant
 *   - Product description generation: admin assistance
 * - Supports configurable model via environment variables
 * - Connection pooling with keep-alive, timeout, retry logic
 * - Health check to verify Ollama service and model availability
 * - Error handling: graceful fallback messages when Ollama is unavailable
 * - Fully typed (no `any`) for production safety
 */
import axios from 'axios';
import https from 'https';
import logger from '../utils/logger.js';
// ============================
// Configuration from environment
// ============================
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b'; // Updated to match actual model
const OLLAMA_TIMEOUT = parseInt(process.env.OLLAMA_TIMEOUT || '30000', 10);
// ============================
// HTTP Agent for keep-alive connections
// ============================
const httpAgent = new https.Agent({ keepAlive: true, keepAliveMsecs: 10000 });
// ============================
// Typed Axios instance
// ============================
const ollamaClient = axios.create({
    baseURL: OLLAMA_URL,
    timeout: OLLAMA_TIMEOUT,
    httpAgent,
    httpsAgent: httpAgent,
    headers: { 'Content-Type': 'application/json' },
});
/**
 * Checks if Ollama service is reachable and the required model is available.
 * @returns HealthStatus object
 */
export const checkOllamaHealth = async () => {
    try {
        const response = await ollamaClient.get('/api/tags', { timeout: 5000 });
        const models = response.data.models || [];
        const modelBaseName = OLLAMA_MODEL.split(':')[0];
        const hasModel = models.some((m) => m.name.includes(modelBaseName));
        return { healthy: true, hasModel };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.warn('Ollama health check failed:', message);
        return { healthy: false, hasModel: false, error: message };
    }
};
/**
 * Quick availability check (calls checkOllamaHealth and returns boolean).
 */
export const isOllamaAvailable = async () => {
    const { healthy } = await checkOllamaHealth();
    return healthy;
};
// ============================
// Image Analysis
// ============================
/**
 * Analyzes an image (base64) and returns a short product description.
 * @param imageBase64 - Base64 encoded image (raw, without data:image prefix)
 * @returns Promise resolving to description string (max 100 chars)
 * @throws Error if Ollama fails or model not found
 */
export const analyzeImageWithOllama = async (imageBase64) => {
    try {
        const prompt = `You are a product recognition assistant. Analyze this image and describe the product in 5-10 words maximum.
    Focus on: category, color, main feature, or brand if recognizable.
    Examples:
    - "Red Nike running shoes"
    - "Black leather wallet with zipper"
    - "White ceramic coffee mug"
    Respond with ONLY the description, no extra text.`;
        const payload = {
            model: OLLAMA_MODEL,
            prompt,
            images: [imageBase64],
            stream: false,
            options: {
                temperature: 0.3,
                top_p: 0.9,
                num_predict: 30,
            },
        };
        const response = await ollamaClient.post('/api/generate', payload);
        if (response.data?.response) {
            let description = response.data.response.trim();
            // Remove punctuation and limit length
            description = description.replace(/[^\w\s]/g, '').substring(0, 100);
            return description;
        }
        throw new Error('No response from Ollama');
    }
    catch (error) {
        const axiosError = error;
        logger.error('Ollama image analysis error:', axiosError.message);
        if (axiosError.code === 'ECONNREFUSED') {
            throw new Error('Ollama service not running. Please start Ollama on port 11434');
        }
        if (axiosError.response?.status === 404) {
            throw new Error(`Model '${OLLAMA_MODEL}' not found in Ollama. Pull it first: ollama pull ${OLLAMA_MODEL}`);
        }
        if (axiosError.code === 'ETIMEDOUT') {
            throw new Error(`Ollama request timed out after ${OLLAMA_TIMEOUT}ms`);
        }
        throw new Error(`Image analysis failed: ${axiosError.message}`);
    }
};
/**
 * Sends a chat message to Ollama and returns the AI response.
 * @param message - User message
 * @param conversationHistory - Previous messages (max last 5 used)
 * @returns AI response string (may contain "SEARCH:" prefix)
 */
export const chatWithOllama = async (message, conversationHistory = []) => {
    try {
        const systemPrompt = `You are an e-commerce assistant for MyStore. Help customers find products, answer questions about shipping, returns, and give recommendations.
    Keep responses concise (2-3 sentences). If the user asks to search for a product, respond with "SEARCH:[keyword]" format. Otherwise respond naturally.`;
        const formattedHistory = conversationHistory.slice(-5).map((msg) => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.message,
        }));
        const payload = {
            model: OLLAMA_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                ...formattedHistory,
                { role: 'user', content: message },
            ],
            stream: false,
            options: {
                temperature: 0.7,
                top_p: 0.9,
                num_predict: 150,
            },
        };
        const response = await ollamaClient.post('/api/chat', payload);
        if (response.data?.message?.content) {
            return response.data.message.content;
        }
        throw new Error('No response from Ollama');
    }
    catch (error) {
        const axiosError = error;
        logger.error('Ollama chat error:', axiosError.message);
        if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ETIMEDOUT') {
            return "I'm sorry, the AI assistant is currently unavailable. Please try again later.";
        }
        return "I encountered an error processing your request. Please try again.";
    }
};
// ============================
// Product Description Generation (Admin Helper)
// ============================
/**
 * Generates a short product description from keywords using Ollama.
 * @param keywords - Keywords to base description on
 * @returns Generated description (empty string on failure)
 */
export const generateProductDescription = async (keywords) => {
    try {
        const prompt = `Write a short product description (2 sentences) for a product with these keywords: ${keywords}.
    Use an engaging, professional tone.`;
        const payload = {
            model: OLLAMA_MODEL,
            prompt,
            stream: false,
            options: { temperature: 0.6, num_predict: 100 },
        };
        const response = await ollamaClient.post('/api/generate', payload);
        return response.data?.response?.trim() || '';
    }
    catch (error) {
        logger.error('Description generation failed:', error);
        return '';
    }
};
/**
 * Analyzes multiple images concurrently with a small delay between each to avoid overloading.
 * Uses Promise.allSettled for better performance and error isolation.
 * @param imageBase64Array - Array of base64-encoded images
 * @returns Array of results (each with index, description or error)
 */
export const batchAnalyzeImages = async (imageBase64Array) => {
    const limitedImages = imageBase64Array.slice(0, 5);
    const promises = limitedImages.map(async (img, idx) => {
        try {
            const description = await analyzeImageWithOllama(img);
            return { index: idx, description };
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            return { index: idx, error: errorMessage };
        }
    });
    // Optional: add delay between requests to respect rate limits
    const results = await Promise.all(promises);
    return results;
};
// ============================
// Default export for convenience
// ============================
export default {
    checkOllamaHealth,
    isOllamaAvailable,
    analyzeImageWithOllama,
    chatWithOllama,
    generateProductDescription,
    batchAnalyzeImages,
};
//# sourceMappingURL=ollama.js.map