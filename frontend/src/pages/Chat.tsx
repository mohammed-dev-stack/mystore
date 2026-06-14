// frontend/src/pages/Chat.tsx
/**
 * صفحة الدردشة الذكية (AI Assistant) – نسخة محسنة الأداء مع فصل مكون الإدخال
 * - عرض بطاقات المنتجات مباشرة ضمن رسالة المساعد
 * - إزالة أي منطق انتظار للتأكيد
 * - دعم RTL كامل
 * - استخدام MessageBubble و ChatInput لتحسين إعادة الرسم
 * - تعتمد على useChat من طبقة hooks/ لتجريد السياق
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus, faRobot, faMessage } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../hooks/useChat'; // ✅ استيراد من hooks بدلاً من contexts
import { MessageBubble } from '../components/chat/MessageBubble';
import { ChatInput } from '../components/chat/ChatInput';
import type { Product } from '../services/product.service';

const Chat = () => {
  const {
    currentSessionId,
    messages,
    sessions,
    isLoading,
    isSending,
    sendMessage,
    loadSession,
    createNewSession,
    deleteSession,
    clearAllHistory,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async (msg: string) => {
    await sendMessage(msg);
  }, [sendMessage]);

  const handleClearHistory = () => {
    if (confirmClear) {
      clearAllHistory();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  const getSearchResultsFromMessage = (msg: any): Product[] => {
    if (msg.triggeredSearch && msg.searchResults && Array.isArray(msg.searchResults)) {
      return msg.searchResults.filter((p: any) => p && p._id && typeof p.price === 'number');
    }
    return [];
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Sidebar - قائمة الجلسات */}
      <div className="w-80 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-l border-gray-200 dark:border-gray-700 flex flex-col shadow-xl z-10">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">المحادثات</h2>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={createNewSession} className="p-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition shadow-md">
            <FontAwesomeIcon icon={faPlus} />
          </motion.button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {isLoading && sessions.length === 0 ? (
            Array(3).fill(0).map((_, i) => <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-16 rounded-xl"></div>)
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FontAwesomeIcon icon={faMessage} size="3x" className="mb-3 opacity-40" />
              <p>لا توجد محادثات بعد</p>
              <p className="text-sm">ابدأ محادثة جديدة</p>
            </div>
          ) : (
            sessions.map((session) => (
              <motion.div key={session.sessionId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} whileHover={{ scale: 1.02 }}
                className={`p-3 rounded-xl cursor-pointer transition-all duration-200 ${currentSessionId === session.sessionId ? 'bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/40 dark:to-primary-800/40 border-r-4 border-r-primary-600 shadow-md' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                onClick={() => loadSession(session.sessionId)}>
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{session.lastMessage || 'محادثة جديدة'}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(session.lastMessageDate).toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteSession(session.sessionId); }} className="text-gray-400 hover:text-red-500 transition p-1">
                    <FontAwesomeIcon icon={faTrash} size="sm" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={handleClearHistory} className={`w-full text-center text-sm py-2 rounded-lg transition ${confirmClear ? 'bg-red-600 text-white' : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'}`}>
            {confirmClear ? 'اضغط مرة أخرى للتأكيد' : 'مسح كل المحادثات'}
          </button>
        </div>
      </div>

      {/* منطقة المحادثة الرئيسية */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md">
              <FontAwesomeIcon icon={faRobot} className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">المساعد الذكي للتسوق</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">اسأل عن المنتجات، التوصيات – النتائج تظهر فوراً</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {!currentSessionId && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
              <FontAwesomeIcon icon={faRobot} size="4x" className="mb-4 opacity-30" />
              <p className="text-lg font-medium">مرحباً بك في المساعد الذكي</p>
              <p className="text-sm">اختر محادثة سابقة أو ابدأ محادثة جديدة</p>
              <button onClick={createNewSession} className="mt-6 px-6 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition shadow-md">محادثة جديدة</button>
            </div>
          )}
          {isLoading && currentSessionId && <div className="flex justify-center py-8"><div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin"></div></div>}
          <AnimatePresence>
            {messages.map((msg) => (
              <MessageBubble key={msg._id} id={msg._id} sender={msg.sender} message={msg.message} timestamp={msg.createdAt} triggeredSearch={msg.triggeredSearch} searchResults={getSearchResultsFromMessage(msg)} showAvatar={true} />
            ))}
          </AnimatePresence>
          {isSending && <MessageBubble id="typing-indicator" sender="ai" message="" timestamp={new Date()} isTyping={true} showAvatar={true} />}
          <div ref={messagesEndRef} />
        </div>

        <ChatInput onSend={handleSendMessage} disabled={isSending} />
      </div>
    </div>
  );
};

export default Chat;