// backend/src/controllers/search.controller.ts
/**
 * Why this controller?
 * - HTTP request/response handling for search (text, image, combined)
 * - Extracts search parameters from query or body
 * - Calls product service for text search and autocomplete
 * - Calls Ollama service for image analysis and then product search
 * - Returns products with relevance scoring
 * - Handles errors gracefully (e.g., Ollama unavailable, invalid image)
 * - Uses catchAsync to centralize error handling
 */
import * as productService from '../services/product.service.js';
import { analyzeImageWithOllama } from '../config/ollama.js';
import { catchAsync } from '../middleware/error.middleware.js';
import logger from '../utils/logger.js';
/**
 * Text-based product search (GET /api/search?q=keyword)
 */
export const textSearch = catchAsync(async (req, res, next) => {
    const { q, limit = 20 } = req.query;
    if (!q || q.trim().length === 0) {
        res.status(400).json({ success: false, message: 'Search query is required' });
        return;
    }
    const results = await productService.searchProducts(q, parseInt(limit));
    res.status(200).json({
        success: true,
        count: results.length,
        query: q,
        data: results,
    });
});
/**
 * Image-based product search (POST /api/search/image)
 */
export const imageSearch = catchAsync(async (req, res, next) => {
    const { imageBase64, textHint } = req.body;
    if (!imageBase64) {
        res.status(400).json({ success: false, message: 'Image data (base64) is required' });
        return;
    }
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    if (imageBuffer.length > 5 * 1024 * 1024) {
        res.status(400).json({ success: false, message: 'Image too large (max 5MB)' });
        return;
    }
    let extractedDescription = null;
    let ollamaError = null;
    try {
        extractedDescription = await analyzeImageWithOllama(imageBase64);
    }
    catch (error) {
        const err = error;
        ollamaError = err.message;
        logger.error('Ollama image analysis failed:', err);
        if (!textHint) {
            res.status(503).json({
                success: false,
                message: 'Image analysis service unavailable. Please provide a text search query.',
                details: ollamaError,
            });
            return;
        }
    }
    let searchQuery = textHint || '';
    if (extractedDescription) {
        searchQuery = searchQuery ? `${extractedDescription} ${searchQuery}` : extractedDescription;
    }
    if (!searchQuery || searchQuery.trim().length === 0) {
        res.status(400).json({
            success: false,
            message: 'Could not extract any search terms from image. Please provide a text query.',
        });
        return;
    }
    const results = await productService.searchProducts(searchQuery, 20);
    res.status(200).json({
        success: true,
        count: results.length,
        extractedDescription: extractedDescription || null,
        usedQuery: searchQuery,
        data: results,
    });
});
/**
 * Combined text + image search (POST /api/search/combined)
 */
export const combinedSearch = catchAsync(async (req, res, next) => {
    const { textQuery, imageBase64 } = req.body;
    let extractedDescription = null;
    if (imageBase64) {
        try {
            extractedDescription = await analyzeImageWithOllama(imageBase64);
        }
        catch (err) {
            logger.warn('Ollama image analysis failed, using text only:', err);
        }
    }
    let finalQuery = textQuery || '';
    if (extractedDescription) {
        finalQuery = finalQuery ? `${extractedDescription} ${finalQuery}` : extractedDescription;
    }
    if (!finalQuery.trim()) {
        res.status(400).json({
            success: false,
            message: 'No searchable text provided (neither image nor text query)',
        });
        return;
    }
    const results = await productService.searchProducts(finalQuery, 20);
    res.status(200).json({
        success: true,
        count: results.length,
        extractedDescription: extractedDescription || null,
        usedQuery: finalQuery,
        data: results,
    });
});
/**
 * Autocomplete product names (GET /api/search/suggest?q=partial&limit=5)
 */
export const autocomplete = catchAsync(async (req, res, next) => {
    const { q, limit = 5 } = req.query;
    if (!q || q.length < 2) {
        res.status(400).json({ success: false, message: 'Query must be at least 2 characters' });
        return;
    }
    const suggestions = await productService.autocompleteProducts(q, parseInt(limit));
    res.status(200).json({ success: true, data: suggestions });
});
//# sourceMappingURL=search.controller.js.map