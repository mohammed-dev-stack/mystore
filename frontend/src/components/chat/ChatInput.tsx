// frontend/src/components/chat/ChatInput.tsx
/**
 * Why this component?
 * - Isolated input state to prevent re-rendering of the whole chat list on each keystroke
 * - Handles sending messages with Enter key (Shift+Enter for new line)
 * - RTL support with proper styling
 * - Loading/disabled state
 */


import { useState, useRef, memo } from 'react'
import type { KeyboardEvent } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';

import { motion } from 'framer-motion';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
  placeholder?: string;
}

const ChatInputComponent = ({ onSend, disabled, placeholder = 'اكتب استفسارك عن المنتجات، العروض...' }: ChatInputProps) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
      <div className="flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={disabled}
          className="flex-1 px-5 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white resize-none transition disabled:opacity-50"
          style={{ minHeight: '48px', maxHeight: '150px' }}
        />
        <motion.button
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={!text.trim() || disabled}
          className="p-3 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          aria-label="إرسال"
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </motion.button>
      </div>
      <p className="text-xs text-gray-400 mt-2 text-center">
        اضغط Enter للإرسال، Shift+Enter لسطر جديد
      </p>
    </form>
  );
};

export const ChatInput = memo(ChatInputComponent);
export default ChatInput;