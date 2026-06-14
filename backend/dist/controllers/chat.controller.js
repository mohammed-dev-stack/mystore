// backend/src/controllers/chat.controller.ts
/**
 * Why this controller?
 * - HTTP request/response handling for AI chat
 * - Extracts message, sessionId, image from request body
 * - Calls chat service for business logic (saving messages, calling Ollama, search)
 * - Returns AI response with optional product search results
 * - Handles session validation and error cases
 * - Uses catchAsync wrapper to reduce boilerplate and centralize error handling
 */
import * as chatService from '../services/chat.service.js';
import { catchAsync } from '../middleware/error.middleware.js';
// Helper to ensure param is string (not array)
const ensureString = (param) => {
    if (Array.isArray(param))
        return param[0] || '';
    return param || '';
};
/**
 * Send a message to the AI assistant
 */
export const sendMessage = catchAsync(async (req, res, next) => {
    if (!req.user || !req.user._id) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
    }
    const { message, sessionId, imageBase64 } = req.body;
    const userId = req.user._id.toString();
    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        res.status(400).json({ success: false, message: 'Message content is required and cannot be empty' });
        return;
    }
    if (message.length > 4000) {
        res.status(400).json({ success: false, message: 'Message too long (max 4000 characters)' });
        return;
    }
    const result = await chatService.sendMessage(userId, message, sessionId, imageBase64);
    res.status(200).json({ success: true, ...result });
});
/**
 * Get conversation history for a specific session
 */
export const getConversationHistory = catchAsync(async (req, res, next) => {
    if (!req.user || !req.user._id) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
    }
    const sessionId = ensureString(req.params.sessionId);
    if (!sessionId) {
        res.status(400).json({ success: false, message: 'Invalid session ID' });
        return;
    }
    const userId = req.user._id.toString();
    const messages = await chatService.getConversationHistory(userId, sessionId);
    res.status(200).json({ success: true, sessionId, count: messages.length, data: messages });
});
/**
 * Get all chat sessions for the current user
 */
export const getUserSessions = catchAsync(async (req, res, next) => {
    if (!req.user || !req.user._id) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
    }
    const userId = req.user._id.toString();
    const sessions = await chatService.getUserSessions(userId);
    res.status(200).json({ success: true, count: sessions.length, data: sessions });
});
/**
 * Delete a specific chat session (GDPR compliance)
 */
export const deleteSession = catchAsync(async (req, res, next) => {
    if (!req.user || !req.user._id) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
    }
    const sessionId = ensureString(req.params.sessionId);
    if (!sessionId) {
        res.status(400).json({ success: false, message: 'Invalid session ID' });
        return;
    }
    const userId = req.user._id.toString();
    const deletedCount = await chatService.deleteSession(userId, sessionId);
    if (deletedCount === 0) {
        res.status(404).json({ success: false, message: 'Session not found or already deleted' });
        return;
    }
    res.status(200).json({
        success: true,
        message: `Deleted ${deletedCount} message(s) from session ${sessionId}`,
    });
});
/**
 * Clear all chat history for the current user (GDPR compliance)
 */
export const clearAllHistory = catchAsync(async (req, res, next) => {
    if (!req.user || !req.user._id) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
    }
    const userId = req.user._id.toString();
    const deletedCount = await chatService.clearAllHistory(userId);
    res.status(200).json({
        success: true,
        message: `Deleted ${deletedCount} message(s) from all sessions`,
    });
});
//# sourceMappingURL=chat.controller.js.map