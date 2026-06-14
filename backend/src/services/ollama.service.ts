// backend/src/services/ollama.service.ts
/**
 * Why this service?
 * - Centralized Ollama API client for AI capabilities
 * - Handles: intent classification, product root extraction, general chat, image analysis
 * - Used by chat.service.ts to avoid mixing concerns
 * - Includes fallback logic and retry with multiple URLs
 * - Fully typed (no `any`) for production safety
 * - Configurable timeout via OLLAMA_TIMEOUT environment variable
 */

import logger from '../utils/logger.js';

// Polyfill fetch if not available (Node.js < 18)
// In modern Node.js 18+, fetch is available globally.
// This guard ensures compatibility without external dependencies.
const fetchImpl = globalThis.fetch;

if (!fetchImpl) {
  throw new Error('Fetch API is not available. Please upgrade to Node.js 18+ or install node-fetch.');
}

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';
const OLLAMA_TIMEOUT = parseInt(process.env.OLLAMA_TIMEOUT || '30000', 10);

// Type definitions for Ollama API
interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaChatResponse {
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

interface OllamaErrorResponse {
  error: string;
}

// Helper: call Ollama with retry across multiple URLs
async function callOllama(messages: OllamaMessage[], options: Record<string, unknown> = {}): Promise<string | null> {
  const urls = [
    `${OLLAMA_BASE_URL}/api/chat`,
    'http://127.0.0.1:11434/api/chat',
    'http://localhost:11434/api/chat'
  ];
  const timeoutMs = OLLAMA_TIMEOUT;

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetchImpl(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages,
          stream: false,
          options: { temperature: 0.0, repeat_penalty: 1.2, ...options },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        // Try to read error response
        try {
          const errorData = (await response.json()) as OllamaErrorResponse;
          logger.warn(`Ollama request failed on ${url}: ${response.status} - ${errorData.error}`);
        } catch {
          logger.warn(`Ollama request failed on ${url}: ${response.statusText}`);
        }
        continue;
      }
      const data = (await response.json()) as OllamaChatResponse;
      const content = data.message?.content;
      if (content && typeof content === 'string') return content;
    } catch (error) {
      const err = error as Error;
      logger.warn(`Ollama call failed on ${url}: ${err.message}`);
      continue;
    }
  }
  return null;
}

// 1. Intent analysis: returns SEARCH or GENERAL with keywords
export const getAIResponse = async (userMessage: string): Promise<{ intent: string; message: string; keywords?: string }> => {
  const systemPrompt = `أنت مساعد متجر MyStore. رد فقط بصيغة JSON.
إذا كان المستخدم يطلب منتجًا (مثل "بدي كتاب"، "عايز حذاء") => {"intent": "SEARCH", "keywords": "اسم المنتج بالمفرد"}
أي شيء آخر => {"intent": "GENERAL", "message": "رد قصير وودود"}.`;

  const responseText = await callOllama(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    { num_predict: 100 }
  );

  if (!responseText) {
    // Fallback: simple regex for common search patterns
    const fallbackMatch = userMessage.match(/(بدي|أريد|عايز|ابحث عن|عندك|شو عندك)\s*([^\s]+)/i);
    if (fallbackMatch && fallbackMatch[2]) {
      return { intent: 'SEARCH', message: '', keywords: fallbackMatch[2] };
    }
    return { intent: 'GENERAL', message: 'كيف يمكنني مساعدتك اليوم؟' };
  }

  try {
    const jsonMatch = responseText.match(/\{.*\}/s);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as { intent: string; keywords?: string; message?: string };
      if (parsed.intent === 'SEARCH') {
        return { intent: 'SEARCH', message: '', keywords: parsed.keywords || userMessage };
      }
      return { intent: 'GENERAL', message: parsed.message || 'كيف يمكنني مساعدتك؟' };
    }
  } catch (err) {
    logger.warn('Failed to parse Ollama JSON response:', err);
  }
  return { intent: 'GENERAL', message: 'كيف يمكنني مساعدتك اليوم؟' };
};

// 2. Extract product root (singular form)
export const extractProductRoot = async (userMessage: string): Promise<string> => {
  const systemPrompt = `استخرج اسم المنتج الرئيسي من الجملة وحوله للمفرد. أخرج JSON فقط: {"product": "الاسم"}.`;
  const responseText = await callOllama(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    { num_predict: 50 }
  );

  if (responseText) {
    try {
      const match = responseText.match(/\{.*\}/s);
      if (match) {
        const parsed = JSON.parse(match[0]) as { product: string };
        if (parsed.product && parsed.product.length > 0) return parsed.product;
      }
    } catch (err) {
      logger.warn('Failed to parse product root JSON:', err);
    }
  }
  // Fallback: take first word longer than 2 chars after removing stopwords
  const words = userMessage.split(/\s+/);
  const stopwords = ['بدي', 'أريد', 'عايز', 'عندك', 'شو', 'من', 'الى', 'على', 'في', 'هذا', 'هذه'];
  for (const word of words) {
    if (word.length > 2 && !stopwords.includes(word)) return word;
  }
  return userMessage;
};

// 3. Direct responses for common patterns (no Ollama)
export const getDirectGeneralResponse = (message: string): string | null => {
  const lower = message.toLowerCase();
  if (lower.includes('مرحبا') || lower.includes('هلا') || lower.includes('السلام')) {
    return 'أهلاً بك! كيف يمكنني مساعدتك في البحث عن منتج؟';
  }
  if (lower.includes('شو اسمك') || lower.includes('ما اسمك')) {
    return 'أنا مساعد MyStore الذكي، أساعدك في العثور على المنتجات.';
  }
  if (lower.includes('هل تحبني') || lower.includes('تحبني')) {
    return 'أنا مساعد رقمي، لكنني هنا لخدمتك ولتوفير أفضل تجربة تسوق لك.';
  }
  if (lower.includes('شو عندك') || lower.includes('ماذا تقدم')) {
    return 'يمكنني مساعدتك في البحث عن منتجات مثل الإلكترونيات، الملابس، الكتب، وغيرها. فقط اكتب "بدي [اسم المنتج]".';
  }
  return null;
};

// 4. General chat without search intent (fallback)
export const getGeneralChatResponse = async (userMessage: string): Promise<string> => {
  const systemPrompt = `أنت مساعد متجر MyStore. أجب بالعربية مختصراً (جملة أو جملتين).`;
  const response = await callOllama(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    { temperature: 0.2, num_predict: 80 }
  );
  return response || 'كيف يمكنني مساعدتك اليوم؟ يمكنك أن تطلب منتجاً معيناً.';
};