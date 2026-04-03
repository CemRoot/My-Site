/**
 * Frontend Health Monitor API
 * 
 * Monitors frontend errors and sends Telegram notifications
 * Called by frontend when critical errors occur
 * 
 * Usage: POST /api/frontend-health-monitor
 * Body: { type: 'error' | 'crash' | 'performance', data: {...} }
 */

import { supabase } from '../lib/supabaseAdmin.js';
import { notifyTelegram } from '../lib/telegram.js';

const CONFIG = {
  SENTRY_DSN: process.env.VITE_SENTRY_DSN || '',
};

// Rate limiting cache (in-memory)
const rateLimitCache = new Map();

/**
 * Check rate limit for notifications
 */
function checkRateLimit(key, maxRequests = 5, windowMs = 300000) { // 5 requests per 5 minutes
  const now = Date.now();
  
  if (!rateLimitCache.has(key)) {
    rateLimitCache.set(key, []);
  }
  
  const requests = rateLimitCache.get(key).filter(time => now - time < windowMs);
  
  if (requests.length >= maxRequests) {
    return false;
  }
  
  requests.push(now);
  rateLimitCache.set(key, requests);
  return true;
}

async function sendTelegramMessage(text) {
  try {
    await notifyTelegram(text);
  } catch (error) {
    console.error('Failed to send Telegram message:', error.message);
    return null;
  }
}

/**
 * Log error to Supabase
 */
async function logError(errorData) {
  try {
    const { error } = await supabase
      .from('frontend_error_logs')
      .insert({
        error_type: errorData.type,
        error_message: errorData.message,
        error_stack: errorData.stack,
        user_agent: errorData.userAgent,
        page_url: errorData.pageUrl,
        timestamp: new Date().toISOString(),
        additional_data: errorData.additionalData || {}
      });

    if (error) {
      console.error('Failed to log error to Supabase:', error);
    }
  } catch (error) {
    console.error('Error logging to database:', error);
  }
}

/**
 * Format error message for Telegram
 */
function formatErrorMessage(errorData) {
  const { type, message, stack, userAgent, pageUrl, componentStack, sentryUrl } = errorData;
  
  const emoji = type === 'crash' ? '💥' : type === 'performance' ? '🐌' : '🚨';
  const severity = type === 'crash' ? 'CRITICAL' : type === 'performance' ? 'WARNING' : 'ERROR';
  
  let text = `${emoji} <b>FRONTEND ${severity}</b>\n\n`;
  text += `🌐 <b>Site:</b> cemkoyluoglu.codes\n`;
  text += `📍 <b>Sayfa:</b> ${pageUrl || 'Bilinmiyor'}\n`;
  text += `⏰ <b>Zaman:</b> ${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}\n\n`;
  
  text += `❌ <b>Hata:</b>\n<code>${message || 'Bilinmeyen hata'}</code>\n\n`;
  
  if (stack) {
    const stackLines = stack.split('\n').slice(0, 3).join('\n');
    text += `📚 <b>Stack Trace:</b>\n<code>${stackLines}</code>\n\n`;
  }
  
  if (componentStack) {
    text += `⚛️ <b>Component:</b>\n<code>${componentStack.split('\n')[0]}</code>\n\n`;
  }
  
  if (userAgent) {
    const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/[\d.]+/);
    const browser = browserMatch ? browserMatch[0] : 'Bilinmiyor';
    text += `🌍 <b>Tarayıcı:</b> ${browser}\n`;
  }
  
  if (sentryUrl) {
    text += `\n🔗 <a href="${sentryUrl}">Sentry'de Görüntüle</a>\n`;
  }
  
  text += `\n<i>🔧 Hata otomatik olarak loglandı ve takip ediliyor.</i>`;
  
  return text;
}

/**
 * Main handler
 */
export default async function handler(req, res) {
  // CORS – restrict to the production domain and known Vercel preview URLs only.
  // Wildcard *.vercel.app is intentionally NOT used: any developer can claim a
  // free *.vercel.app subdomain, making it an effectively open CORS policy.
  const origin = req.headers.origin || '';
  const ALLOWED_ORIGINS = [
    'https://cemkoyluoglu.codes',
    'https://www.cemkoyluoglu.codes',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ].filter(Boolean);

  // Also allow localhost in development
  const isLocal = process.env.NODE_ENV !== 'production' && origin === 'http://localhost:5173';
  const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin) || isLocal;

  if (isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    const errorData = req.body;
    
    if (!errorData || !errorData.type) {
      return res.status(400).json({
        success: false,
        message: 'Invalid error data'
      });
    }

    // Rate limit check
    const rateLimitKey = `${errorData.type}_${errorData.message}`;
    if (!checkRateLimit(rateLimitKey)) {
      console.log('Rate limit exceeded for:', rateLimitKey);
      return res.status(200).json({
        success: true,
        message: 'Rate limited but acknowledged'
      });
    }

    // Log to Supabase (non-blocking)
    logError(errorData).catch(err => {
      console.error('Failed to log error:', err);
    });

    // Send Telegram notification for critical errors
    const isCritical = errorData.type === 'crash' || 
                       errorData.type === 'error' ||
                       errorData.severity === 'critical';
    
    if (isCritical) {
      const message = formatErrorMessage(errorData);
      await sendTelegramMessage(message);
    }

    return res.status(200).json({
      success: true,
      message: 'Error reported successfully'
    });

  } catch (error) {
    console.error('Frontend health monitor error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

