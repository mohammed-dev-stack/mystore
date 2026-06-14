// backend/src/routes/search.routes.ts
/**
 * Why these routes?
 * - Text search: GET endpoint for keyword-based search (used by search bar)
 * - Image search: POST endpoint for base64 image → Ollama analysis → product search
 * - Combined search: POST that accepts both text + image for richer queries
 * - Autocomplete: Fast prefix matching for instant suggestions (improves UX)
 * - All routes are public (no authentication required), but can be rate-limited
 */

import express from 'express';
import {
  textSearch,
  imageSearch,
  combinedSearch,
  autocomplete,
} from '../controllers/search.controller.js';

const router = express.Router();

// Search endpoints
router.get('/', textSearch);               // GET /api/search?q=keyword&limit=20
router.post('/image', imageSearch);        // POST /api/search/image (body: { imageBase64, textHint })
router.post('/combined', combinedSearch);  // POST /api/search/combined (body: { textQuery, imageBase64 })
router.get('/suggest', autocomplete);      // GET /api/search/suggest?q=partial&limit=5

export default router;