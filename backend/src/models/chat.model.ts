// backend/src/models/chat.model.ts
/**
 * Chat message model for storing conversation history with AI assistant.
 * Supports TTL index for auto‑cleanup (30 days) and full‑text search on messages.
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IChatMessage extends Document {
  sessionId: string;
  userId: Types.ObjectId;
  sender: 'user' | 'ai';
  message: string;
  aiModel: string; // e.g., 'llama3.2:3b'
  tokensUsed: number;
  imageDescription: string | null;
  responseTimeMs: number | null;
  triggeredSearch: boolean;
  searchResults: Array<{
    productId: Types.ObjectId;
    score: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatMessageModel extends Model<IChatMessage> {
  getConversationHistory(sessionId: string, limit?: number): Promise<IChatMessage[]>;
  deleteUserSessions(userId: string): Promise<mongoose.mongo.DeleteResult>;
  startNewSession(userId: string): string;
}

// Define interface for search result item (used in method)
interface SearchResultItem {
  productId: Types.ObjectId;
  score: number;
}

const chatMessageSchema = new Schema<IChatMessage, ChatMessageModel>(
  {
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
  },
  { timestamps: true }
);

// Performance indexes
chatMessageSchema.index({ sessionId: 1, createdAt: 1 });
chatMessageSchema.index({ userId: 1, createdAt: -1 });
chatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60, background: true });

// Instance method: mark message as search trigger and attach results
chatMessageSchema.methods.markAsSearchTrigger = async function (results: SearchResultItem[]): Promise<IChatMessage> {
  this.triggeredSearch = true;
  this.searchResults = results;
  return this.save();
};

// Static methods
chatMessageSchema.statics.getConversationHistory = async function (sessionId: string, limit = 20): Promise<IChatMessage[]> {
  return this.find({ sessionId }).sort({ createdAt: 1 }).limit(limit).lean();
};

chatMessageSchema.statics.deleteUserSessions = async function (userId: string): Promise<mongoose.mongo.DeleteResult> {
  return this.deleteMany({ userId });
};

chatMessageSchema.statics.startNewSession = function (userId: string): string {
  return `${userId}_${Date.now()}`;
};

const Chat = mongoose.model<IChatMessage, ChatMessageModel>('Chat', chatMessageSchema);
export default Chat;