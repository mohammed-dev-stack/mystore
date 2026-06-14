// backend/src/routes/chat.routes.ts
/**
 * Why these routes?
 * - Send message: POST for user message, returns AI response with optional product search
 * - History: GET for retrieving conversation history of a session
 * - Sessions: GET for listing all user sessions (for sidebar in chat UI)
 * - Delete session: DELETE for GDPR compliance / user control
 * - Clear all: DELETE for wiping all user chat data
 * - All routes require authentication (protect middleware)
 */
import express from 'express';
import { sendMessage, getConversationHistory, getUserSessions, deleteSession, clearAllHistory, } from '../controllers/chat.controller.js';
import { protect } from '../middleware/auth.middleware.js';
const router = express.Router();
// All chat routes require authentication (personalized history)
router.use(protect);
// Main chat endpoints
router.post('/send', sendMessage);
router.get('/history/:sessionId', getConversationHistory);
router.get('/sessions', getUserSessions);
router.delete('/session/:sessionId', deleteSession);
router.delete('/history', clearAllHistory);
export default router;
//# sourceMappingURL=chat.routes.js.map