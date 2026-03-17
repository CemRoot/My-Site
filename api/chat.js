import Groq from 'groq-sdk';
import { checkRateLimit, getClientIdentifier, sendRateLimitResponse } from '../lib/rate-limit.js';
import { withSentry } from '../lib/sentry-server.js';
import { notifyTelegram } from './lib/telegram.js';
import {
  generateSessionId,
  saveChatHistory,
  updateChatBackendSetting,
  getChatBackend,
  forwardToN8n,
  sanitizeResponse,
  hasSuspiciousCharacters,
  formatPageContext,
} from './lib/chatHelpers.js';
import { CHAT_SYSTEM_PROMPT } from './lib/chatSystemPrompt.js';

const FALLBACK_REASON_EMOJI = {
  'token_exhausted': '💰',
  'ai_error': '🤖',
  'connection_error': '🔌',
  'timeout': '⏱️',
  'rate_limit': '🚫',
  'unknown': '❓',
};

async function sendFallbackNotification(reason, errorDetails = '', userMessage = '') {
  const truncatedMessage = userMessage.length > 50
    ? userMessage.substring(0, 50) + '...'
    : userMessage;

  const emoji = FALLBACK_REASON_EMOJI[reason] || FALLBACK_REASON_EMOJI['unknown'];

  const message = `⚠️ <b>N8N CHAT FALLBACK UYARISI</b>

${emoji} <b>Sebep:</b> ${reason}
⏰ <b>Zaman:</b> ${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}
💬 <b>Kullanıcı Mesajı:</b> <code>${truncatedMessage}</code>

${errorDetails ? `📋 <b>Hata Detayı:</b>\n<code>${errorDetails.substring(0, 200)}</code>\n` : ''}
✅ <b>Durum:</b> Vercel/Groq API'ye otomatik geçildi
💾 <b>DB Güncellendi:</b> chat_backend → vercel

🔄 <b>Aksiyon Gerekli:</b>
1. n8n token/quota durumunu kontrol et
2. Düzeltildikten sonra Telegram'dan /menu → Chat Backend → n8n seç`;

  await notifyTelegram(message);
}

export default withSentry(async function handler(req, res) {
  const ALLOWED_ORIGINS = [
    'https://cemkoyluoglu.codes',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ].filter(Boolean);

  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientId = getClientIdentifier(req);
  const rateLimit = checkRateLimit(clientId, 10, 60000);

  if (!rateLimit.success) {
    console.warn(`Rate limit exceeded for ${clientId}`);
    return sendRateLimitResponse(res, rateLimit);
  }

  try {
    const { message, pageContext } = req.body || {};
    const userMessage = typeof message === 'string' ? message.trim() : '';

    if (!userMessage) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const chatBackend = await getChatBackend();
    const sessionId = generateSessionId();

    if (chatBackend === 'n8n') {
      console.log('🔀 Routing chat request to n8n workflow');
      try {
        const n8nResponse = await forwardToN8n(userMessage, pageContext);

        if (n8nResponse.fallback === true || n8nResponse.useFallback === true) {
          console.log('⚠️ n8n requested fallback to Vercel API (token exhausted or error)');

          const fallbackReason = n8nResponse.reason || 'unknown';

          updateChatBackendSetting('vercel', fallbackReason)
            .catch(err => console.error('DB update error:', err));

          sendFallbackNotification(
            fallbackReason,
            n8nResponse.errorDetails || '',
            userMessage
          ).catch(err => console.error('Telegram notification error:', err));
        } else {
          return res.status(200).json({
            ...n8nResponse,
            sessionId: n8nResponse.sessionId || sessionId,
            source: 'n8n',
          });
        }
      } catch (n8nError) {
        console.error('n8n forward error:', n8nError);

        let errorReason = 'connection_error';
        if (n8nError.message?.includes('timeout')) {
          errorReason = 'timeout';
        } else if (n8nError.message?.includes('rate limit')) {
          errorReason = 'rate_limit';
        }

        updateChatBackendSetting('vercel', errorReason)
          .catch(err => console.error('DB update error:', err));

        sendFallbackNotification(
          errorReason,
          n8nError.message || 'n8n connection failed',
          userMessage
        ).catch(err => console.error('Telegram notification error:', err));

        console.log('⚠️ n8n failed, falling back to Vercel API');
      }
    }

    console.log('🟢 Using Vercel API (chat.js) backend');

    const pageContextSummary = pageContext ? formatPageContext(pageContext) : null;

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const messages = [
      { role: 'system', content: CHAT_SYSTEM_PROMPT },
      ...(pageContextSummary
        ? [{ role: 'system', content: `Current page context for reference:\n${pageContextSummary}` }]
        : []),
      { role: 'user', content: userMessage },
    ];

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.4,
      max_tokens: 700,
      top_p: 0.85,
      frequency_penalty: 0.5,
      presence_penalty: 0.2,
    });

    let reply = completion.choices[0]?.message?.content ||
      '[TOPIC:CEM] I apologize, but I encountered an issue generating a response. Please try asking your question again!';

    if (hasSuspiciousCharacters(reply)) {
      console.warn('Suspicious characters detected in AI response, sanitizing...');
      console.warn('Original response preview:', reply.substring(0, 200));
    }

    reply = sanitizeResponse(reply);

    const source = chatBackend === 'n8n' ? 'n8n_fallback' : 'vercel';
    saveChatHistory(sessionId, userMessage, reply, source).catch(err => {
      console.error('Failed to save chat history:', err);
    });

    return res.status(200).json({ reply, sessionId, source });
  } catch (error) {
    console.error('Groq API Error:', error);

    const errorMessage = error.message?.toLowerCase().includes('rate limit')
      ? '[TOPIC:CEM] I\'m experiencing high traffic right now. Please try again in a moment!'
      : '[TOPIC:CEM] I apologize, but I encountered a temporary issue. Please try asking your question again!';

    return res.status(500).json({
      error: 'Failed to get AI response',
      reply: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});
