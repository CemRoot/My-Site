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

const BOT_UA_RE =
  /bot|crawl|spider|slurp|headless|wget|curl|python-requests|scrapy|bytespider|gptbot|claude|perplexity|semrush|ahrefs|bingpreview|facebookexternalhit|twitterbot|linkedinbot|slackbot|discordbot|preview|lighthouse|pagespeed|pingdom|uptimerobot|vercel-screenshot|google-inspection|storebot|chrome-lighthouse/i;

/** Simplified Chrome UAs like Chrome/150.0.0.0 are almost always crawlers/previews, not real users. */
function isSimplifiedChromeUa(userAgent) {
  return /Chrome\/\d+\.0\.0\.0\b/i.test(String(userAgent || ''))
    && !/Edg\/|OPR\/|Brave/i.test(String(userAgent || ''));
}

function isBotOrNoiseReport(errorData) {
  const ua = String(errorData?.userAgent || '');
  const message = String(errorData?.message || '');

  if (BOT_UA_RE.test(ua) || isSimplifiedChromeUa(ua)) {
    return true;
  }

  // Empty-root false positives from partial JS execution / link unfurlers
  if (/Black screen detected/i.test(message) && (!ua || isSimplifiedChromeUa(ua))) {
    return true;
  }

  return false;
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

const ALLOWED_ERROR_TYPES = new Set(['error', 'crash', 'performance']);
const MAX_MESSAGE_LEN = 2000;
const MAX_STACK_LEN = 8000;
const MAX_URL_LEN = 2048;
const MAX_USER_AGENT_LEN = 512;
const MAX_ADDITIONAL_JSON_LEN = 4096;

function truncate(value, maxLen) {
  if (value == null) return null;
  const str = String(value);
  return str.length > maxLen ? str.slice(0, maxLen) : str;
}

function sanitizeAdditionalData(data) {
  if (data == null || typeof data !== 'object' || Array.isArray(data)) {
    return {};
  }
  try {
    const json = JSON.stringify(data);
    if (json.length > MAX_ADDITIONAL_JSON_LEN) {
      return { _truncated: true, preview: json.slice(0, MAX_ADDITIONAL_JSON_LEN) };
    }
    return data;
  } catch {
    return {};
  }
}

function sanitizeErrorPayload(raw) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const type = raw.type;
  if (typeof type !== 'string' || !ALLOWED_ERROR_TYPES.has(type)) {
    return null;
  }
  return {
    type,
    message: truncate(raw.message, MAX_MESSAGE_LEN),
    stack: truncate(raw.stack, MAX_STACK_LEN),
    userAgent: truncate(raw.userAgent, MAX_USER_AGENT_LEN),
    pageUrl: truncate(raw.pageUrl, MAX_URL_LEN),
    componentStack: truncate(raw.componentStack, MAX_STACK_LEN),
    sentryUrl: truncate(raw.sentryUrl, MAX_URL_LEN),
    severity: typeof raw.severity === 'string' ? truncate(raw.severity, 32) : undefined,
    additionalData: sanitizeAdditionalData(raw.additionalData),
  };
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
        additional_data: errorData.additionalData || {},
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
    const errorData = sanitizeErrorPayload(req.body);

    if (!errorData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid error data',
      });
    }

    // Rate limit check (IP + error type/message) — prevents Telegram spam from crawlers
    const clientIp = getClientIp(req);
    const rateLimitKey = `${clientIp}_${errorData.type}_${errorData.message}`;
    if (!checkRateLimit(rateLimitKey)) {
      console.log('Rate limit exceeded for:', rateLimitKey);
      return res.status(200).json({
        success: true,
        message: 'Rate limited but acknowledged'
      });
    }

    // Log to Supabase (non-blocking) — keep logs even for bots for diagnostics
    logError(errorData).catch(err => {
      console.error('Failed to log error:', err);
    });

    const isBotNoise = isBotOrNoiseReport(errorData);
    if (isBotNoise) {
      console.log('Suppressed Telegram notify for bot/noise report:', {
        message: errorData.message,
        userAgent: errorData.userAgent,
        pageUrl: errorData.pageUrl,
      });
      return res.status(200).json({
        success: true,
        message: 'Logged without Telegram notification (bot/noise filtered)',
        filtered: true,
      });
    }

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

