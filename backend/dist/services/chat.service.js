// backend/src/services/chat.service.ts
/**
 * chat.service.ts - نسخة منقحة مع فصل مسؤوليات Ollama
 * - يعتمد على ollama.service.ts لتحليل النية والردود العامة
 * - مسؤول فقط عن حفظ الرسائل، إدارة الجلسات، والبحث في المنتجات
 * - جميع الأنواع محددة (لا `any`)
 */
import mongoose from 'mongoose';
import Chat from '../models/chat.model.js';
import * as productService from './product.service.js';
import * as ollamaService from './ollama.service.js';
import { AppError } from '../middleware/error.middleware.js';
// ============================
// الدوال المساعدة الداخلية
// ============================
export const generateSessionId = (userId) => `${userId}_${Date.now()}`;
// ============================
// الدالة الرئيسية: إرسال رسالة
// ============================
export const sendMessage = async (userId, message, existingSessionId, imageBase64) => {
    const sessionId = existingSessionId || generateSessionId(userId);
    if (!mongoose.Types.ObjectId.isValid(userId))
        throw new AppError('Invalid user ID', 400);
    const trimmedMessage = message?.trim();
    if (!trimmedMessage && !imageBase64)
        throw new AppError('Message or image required', 400);
    // حفظ رسالة المستخدم
    const userMessageDoc = await new Chat({
        sessionId,
        userId: new mongoose.Types.ObjectId(userId),
        sender: 'user',
        message: trimmedMessage || (imageBase64 ? '[صورة]' : ''),
        imageDescription: imageBase64 ? 'Image provided' : null,
    }).save();
    let triggeredSearch = false;
    let searchResults = [];
    let finalMessage = '';
    // 1. محاولة الرد المباشر للحالات البسيطة (بدون Ollama)
    const directReply = ollamaService.getDirectGeneralResponse(trimmedMessage);
    if (directReply) {
        finalMessage = directReply;
    }
    else {
        // 2. تحليل النية باستخدام خدمة Ollama
        const aiResult = await ollamaService.getAIResponse(trimmedMessage);
        if (aiResult.intent === 'SEARCH' && aiResult.keywords) {
            const rootProduct = await ollamaService.extractProductRoot(trimmedMessage);
            const searchKeyword = (rootProduct && rootProduct.length > 1) ? rootProduct : aiResult.keywords;
            if (searchKeyword && searchKeyword.length > 1) {
                searchResults = await productService.smartSearchProducts(searchKeyword, 6);
                if (searchResults.length > 0) {
                    triggeredSearch = true;
                    finalMessage = `🔍 إليك النتائج التي وجدتها لـ "${searchKeyword}":`;
                }
                else {
                    // getFallbackProducts تقبل معامل واحد فقط (الحد الأقصى)
                    const fallback = await productService.getFallbackProducts(3);
                    if (fallback.length > 0) {
                        searchResults = fallback;
                        triggeredSearch = true;
                        finalMessage = `😅 لم أجد "${searchKeyword}" بالضبط، لكن قد تعجبك هذه المنتجات:`;
                    }
                    else {
                        finalMessage = `❌ لا توجد منتجات تطابق "${searchKeyword}". حاول بكلمات أخرى.`;
                    }
                }
            }
            else {
                finalMessage = 'ما المنتج الذي تبحث عنه؟ اذكر اسمه بوضوح.';
            }
        }
        else if (aiResult.message) {
            finalMessage = aiResult.message;
        }
        else {
            finalMessage = await ollamaService.getGeneralChatResponse(trimmedMessage);
        }
    }
    // تأكد من وجود رسالة نهائية
    if (!finalMessage || finalMessage.trim() === '') {
        finalMessage = 'أنا هنا لمساعدتك، اكتب "بدي [اسم المنتج]" للبحث.';
    }
    // حفظ رد المساعد
    const aiMessageDoc = await new Chat({
        sessionId,
        userId: new mongoose.Types.ObjectId(userId),
        sender: 'ai',
        message: finalMessage,
        aiModel: process.env.OLLAMA_MODEL || 'llama3.2:3b',
        triggeredSearch,
        searchResults: searchResults.map(p => ({ productId: p._id, score: 0 })),
    }).save();
    return {
        sessionId,
        userMessage: userMessageDoc,
        aiMessage: {
            _id: aiMessageDoc._id,
            message: finalMessage,
            createdAt: aiMessageDoc.createdAt,
            triggeredSearch,
            searchResults,
        },
    };
};
export const getConversationHistory = async (userId, sessionId) => {
    if (!mongoose.Types.ObjectId.isValid(userId))
        throw new AppError('Invalid user ID', 400);
    return Chat.find({ sessionId, userId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: 1 }).lean();
};
export const getUserSessions = async (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId))
        throw new AppError('Invalid user ID', 400);
    const objectId = new mongoose.Types.ObjectId(userId);
    const sessions = await Chat.aggregate([
        { $match: { userId: objectId } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: '$sessionId', lastMessage: { $first: '$message' }, lastMessageDate: { $first: '$createdAt' }, messageCount: { $sum: 1 } } },
        { $sort: { lastMessageDate: -1 } },
    ]);
    return sessions.map(s => ({
        sessionId: s._id,
        lastMessage: s.lastMessage.substring(0, 100),
        lastMessageDate: s.lastMessageDate,
        messageCount: s.messageCount,
    }));
};
export const deleteSession = async (userId, sessionId) => {
    if (!mongoose.Types.ObjectId.isValid(userId))
        throw new AppError('Invalid user ID', 400);
    const result = await Chat.deleteMany({ sessionId, userId: new mongoose.Types.ObjectId(userId) });
    return result.deletedCount;
};
export const clearAllHistory = async (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId))
        throw new AppError('Invalid user ID', 400);
    const result = await Chat.deleteMany({ userId: new mongoose.Types.ObjectId(userId) });
    return result.deletedCount;
};
//# sourceMappingURL=chat.service.js.map