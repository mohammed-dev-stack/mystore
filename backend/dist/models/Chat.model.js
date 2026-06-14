// backend/src/models/chat.model.ts
/**
 * Chat message model for storing conversation history with AI assistant.
 * Supports TTL index for auto‑cleanup (30 days) and full‑text search on messages.
 */
import mongoose, { Schema } from 'mongoose';
const chatMessageSchema = new Schema({
    sessionId: { type: String, required: true, index: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sender: { type: String, enum: ['user', 'ai'], required: true },
    message: { type: String, required: true, maxlength: [4000, 'Message cannot exceed 4000 characters'] },
    aiModel: {
        type: String,
        default: 'llama3.2:3b',
    },
    tokensUsed: { type: Number, default: 0, min: 0 },
    imageDescription: { type: String, default: null },
    responseTimeMs: { type: Number, default: null },
    triggeredSearch: { type: Boolean, default: false },
    searchResults: [{
            productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
            score: { type: Number, default: 0 },
        }],
}, { timestamps: true });
// Performance indexes
chatMessageSchema.index({ sessionId: 1, createdAt: 1 });
chatMessageSchema.index({ userId: 1, createdAt: -1 });
chatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60, background: true });
// Instance method: mark message as search trigger and attach results
chatMessageSchema.methods.markAsSearchTrigger = async function (results) {
    this.triggeredSearch = true;
    this.searchResults = results;
    return this.save();
};
// Static methods
chatMessageSchema.statics.getConversationHistory = async function (sessionId, limit = 20) {
    return this.find({ sessionId }).sort({ createdAt: 1 }).limit(limit).lean();
};
chatMessageSchema.statics.deleteUserSessions = async function (userId) {
    return this.deleteMany({ userId });
};
chatMessageSchema.statics.startNewSession = function (userId) {
    return `${userId}_${Date.now()}`;
};
const Chat = mongoose.model('Chat', chatMessageSchema);
export default Chat;
//# sourceMappingURL=chat.model.js.map