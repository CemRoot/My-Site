/**
 * Frontend Health Monitor API
 * 
 * Monitors frontend errors and sends Telegram notifications
 * Called by frontend when critical errors occur
 * 
 * Usage: POST /api/frontend-health-monitor
 * Body: { type: 'error' | 'crash' | 'performance', data: {...} }
 */

const { createClient } = require('@supabase/supabase-js');

const CONFIG = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '',
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  SENTRY_DSN: process.env.VITE_SENTRY_DSN || '',
};

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY);

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

/**
 * Send Telegram message
 */
async function sendTelegramMessage(text, options = {}) {
  if (!CONFIG.TELEGRAM_BOT_TOKEN || !CONFIG.TELEGRAM_CHAT_ID) {
    console.warn('Telegram credentials not configured');
    return null;
  }

  try {
    const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CONFIG.TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...options,
      }),
    });

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status}`);
    }

    return await response.json();
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
module.exports = async function handler(req, res) {
  // CORS headers
  const ALLOWED_ORIGINS = [
    'https://cemkoyluoglu.codes',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    'http://localhost:5173',
  ].filter(Boolean);
  
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
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

