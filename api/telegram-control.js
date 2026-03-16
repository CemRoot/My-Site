/**
 * Telegram Bot Control API
 * 
 * Vercel serverless function to control Telegram bot
 * Endpoints:
 * - /api/telegram-control?action=setup-menu
 * - /api/telegram-control?action=send-status
 * - /api/telegram-control?action=trigger-scrape
 * - /api/telegram-control?action=health-check
 */

import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';

const CONFIG = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '',
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY || '',
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
  GITHUB_REPO: process.env.GITHUB_REPOSITORY || 'username/My-Site',
  // Security: API key for authentication (REQUIRED)
  API_SECRET: process.env.TELEGRAM_CONTROL_API_SECRET || '',
};

// SECURITY: Enforce API authentication - this endpoint can trigger workflows and send messages
if (!CONFIG.API_SECRET) {
  console.error('❌ CRITICAL: TELEGRAM_CONTROL_API_SECRET is not set! Authentication is required.');
}

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY);

/**
 * Send message to Telegram
 */
async function sendTelegramMessage(text, options = {}) {
  const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CONFIG.TELEGRAM_CHAT_ID,
      text: text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...options
    })
  });

  if (!response.ok) {
    throw new Error(`Telegram API error: ${response.status}`);
  }

  return await response.json();
}

/**
 * Setup bot menu
 */
async function setupBotMenu() {
  // Set bot commands
  const commands = [
    { command: 'start', description: 'Bot\'u başlat' },
    { command: 'menu', description: 'Ana menüyü göster' },
    { command: 'status', description: 'Hızlı durum raporu' },
    { command: 'scrape', description: 'Haberleri çek' },
    { command: 'health', description: 'Sağlık kontrolü' },
    { command: 'help', description: 'Yardım ve komutlar' },
  ];

  await fetch(
    `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/setMyCommands`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands })
    }
  );

  // Send welcome message with menu
  const welcomeText = `
🤖 <b>Tech News Bot - Menü Güncellemesi</b>

Bot menüsü başarıyla güncellendi!

<b>📋 Kullanılabilir Komutlar:</b>
/menu - Ana menüyü göster
/status - Hızlı durum raporu
/scrape - Haberleri çek
/health - Sistem sağlığı kontrolü
/help - Yardım

<i>Komutları kullanmak için / tuşuna basın</i>`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '📰 Haberleri Çek', callback_data: 'action_scrape' },
        { text: '🏥 Sağlık Kontrolü', callback_data: 'action_health' },
      ],
      [
        { text: '📊 Sistem Durumu', callback_data: 'action_status' },
        { text: '📈 İstatistikler', callback_data: 'action_stats' },
      ],
      [
        { text: '🔧 GitHub Actions', callback_data: 'action_github' },
        { text: '💾 Veritabanı', callback_data: 'action_database' },
      ],
      [
        { text: 'ℹ️ Yardım', callback_data: 'action_help' },
      ],
    ],
  };

  await sendTelegramMessage(welcomeText, { reply_markup: keyboard });
  
  return { success: true, message: 'Bot menu setup completed' };
}

/**
 * Send status report
 */
async function sendStatusReport() {
  const { count } = await supabase
    .from('tech_news_articles')
    .select('*', { count: 'exact', head: true });

  const { data: recent } = await supabase
    .from('tech_news_articles')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1);

  const statusText = `
📊 <b>HIZLI DURUM RAPORU</b>
⏰ ${new Date().toLocaleString('tr-TR')}

📰 Toplam haber: ${count || 0}
⏰ Son güncelleme: ${recent?.[0] ? new Date(recent[0].created_at).toLocaleString('tr-TR') : 'Bilinmiyor'}
🔄 Durum: ✅ Aktif

<i>Detaylı kontrol için /health yazın</i>`;

  await sendTelegramMessage(statusText);
  
  return { success: true, message: 'Status report sent' };
}

/**
 * Trigger GitHub Actions scraping
 */
async function triggerScraping() {
  if (!CONFIG.GITHUB_TOKEN) {
    return { success: false, message: 'GITHUB_TOKEN not configured' };
  }

  await sendTelegramMessage('🔄 <b>Haber Toplama Başlatılıyor...</b>\n\nGitHub Actions workflow tetikleniyor...');

  const [owner, repo] = CONFIG.GITHUB_REPO.split('/');
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/scrape-tech-news.yml/dispatches`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: 'main' })
    }
  );

  if (response.ok) {
    await sendTelegramMessage('✅ <b>GitHub Actions tetiklendi!</b>\n\nİşlem tamamlandığında bildirim alacaksınız.');
    return { success: true, message: 'Scraping workflow triggered' };
  } else {
    const error = await response.json();
    return { success: false, message: `GitHub API error: ${error.message}` };
  }
}

/**
 * Run health check
 */
async function runHealthCheck() {
  await sendTelegramMessage('🔍 <b>Sistem sağlığı kontrol ediliyor...</b>');

  // Check Supabase
  const { count: articleCount, error: countError } = await supabase
    .from('tech_news_articles')
    .select('*', { count: 'exact', head: true });
  
  const supabaseStatus = countError ? '❌ Hata' : '✅ Bağlı';

  // Check recent articles
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const { data: recentArticles } = await supabase
    .from('tech_news_articles')
    .select('id, created_at')
    .gte('created_at', yesterday.toISOString())
    .order('created_at', { ascending: false });
  
  const recentCount = recentArticles?.length || 0;

  const healthReport = `
🏥 <b>SİSTEM SAĞLIK RAPORU</b>
⏰ ${new Date().toLocaleString('tr-TR')}

<b>📊 Veritabanı</b>
${supabaseStatus}
📰 Toplam: ${articleCount || 0}
🆕 Son 24 saat: ${recentCount}

<b>🔄 Durum</b>
${supabaseStatus === '✅ Bağlı' ? '✨ Sistemler çalışıyor' : '⚠️ Sorun tespit edildi'}`;

  await sendTelegramMessage(healthReport);
  
  return { success: true, message: 'Health check completed' };
}

/**
 * Main handler
 */
export default async function handler(req, res) {
  // CORS headers - Security: Only allow requests from trusted origins
  const ALLOWED_ORIGINS = [
    'https://cemkoyluoglu.codes',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ].filter(Boolean);
  
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Security: Check API secret (REQUIRED)
    if (!CONFIG.API_SECRET) {
      console.error('Security violation: TELEGRAM_CONTROL_API_SECRET not set');
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'API security configuration is missing. Set TELEGRAM_CONTROL_API_SECRET.'
      });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('Unauthorized access attempt to telegram-control API');
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Bearer token required in Authorization header'
      });
    }

    const providedSecret = authHeader.replace('Bearer ', '');
    if (providedSecret !== CONFIG.API_SECRET) {
      console.warn('Invalid API secret provided to telegram-control API');
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Invalid API secret'
      });
    }

    // Get action from query or body
    const action = req.query.action || req.body?.action;

    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Missing action parameter',
        available_actions: [
          'setup-menu',
          'send-status',
          'trigger-scrape',
          'health-check'
        ]
      });
    }

    console.log(`🤖 Telegram Control API: ${action}`);

    let result;

    switch (action) {
      case 'setup-menu':
        result = await setupBotMenu();
        break;

      case 'send-status':
        result = await sendStatusReport();
        break;

      case 'trigger-scrape':
        result = await triggerScraping();
        break;

      case 'health-check':
        result = await runHealthCheck();
        break;

      default:
        return res.status(400).json({
          success: false,
          message: `Unknown action: ${action}`,
          available_actions: [
            'setup-menu',
            'send-status',
            'trigger-scrape',
            'health-check'
          ]
        });
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Telegram Control API error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

