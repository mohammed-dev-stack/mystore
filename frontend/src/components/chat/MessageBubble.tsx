// frontend/src/components/chat/MessageBubble.tsx
/**
 * Why this component?
 * - Reusable chat message bubble for both user and AI messages
 * - Different styles for user vs AI (colors, alignment, avatar)
 * - Displays timestamp and optional product suggestions
 * - Optimized with memo to prevent unnecessary re-renders
 * - Supports RTL layout
 */

import { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faRobot, faSpinner } from '@fortawesome/free-solid-svg-icons';
import ProductCard from '../common/ProductCard';
import type { Product } from '../../services/product.service';

export interface MessageBubbleProps {
  id: string;
  sender: 'user' | 'ai';
  message: string;
  timestamp: Date | string;
  isTyping?: boolean;
  showAvatar?: boolean;
  triggeredSearch?: boolean;
  searchResults?: Product[];
}

const MessageBubbleComponent = ({
  sender,
  message,
  timestamp,
  isTyping = false,
  showAvatar = true,
  triggeredSearch = false,
  searchResults = [],
}: MessageBubbleProps) => {
  const isUser = sender === 'user';
  const formattedTime = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const timeString = formattedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Typing indicator
  if (isTyping) {
    return (
      <div className="flex justify-start">
        <div className="flex items-start gap-2 max-w-[70%]">
          {showAvatar && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
              <FontAwesomeIcon icon={faRobot} className="text-gray-600 dark:text-gray-300 text-sm" />
            </div>
          )}
          <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl rounded-bl-none px-4 py-2">
            <div className="flex items-center gap-1">
              <FontAwesomeIcon icon={faSpinner} spin className="text-gray-500 text-sm" />
              <span className="text-sm text-gray-500">المساعد يكتب...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        {showAvatar && (
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              isUser ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <FontAwesomeIcon
              icon={isUser ? faUser : faRobot}
              className={`text-sm ${isUser ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}
            />
          </div>
        )}
        {/* Message content */}
        <div className="flex-1">
          <div
            className={`rounded-2xl px-4 py-2 ${
              isUser
                ? 'bg-primary-600 text-white rounded-br-none'
                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none shadow-sm border border-gray-100 dark:border-gray-700'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message}</p>
            <div
              className={`text-xs mt-1 text-left ${
                isUser ? 'text-primary-100' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {timeString}
            </div>
          </div>
          {/* Product cards (if AI message and search results exist) */}
          {!isUser && triggeredSearch && searchResults.length > 0 && (
            <div className="mt-3 mr-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {searchResults.slice(0, 4).map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Memoize to prevent unnecessary re-renders when parent updates
export const MessageBubble = memo(MessageBubbleComponent);
export default MessageBubble;