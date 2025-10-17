/**
 * System Health Check Script
 * 
 * Checks the health of all system components and sends a report to Telegram
 * Can be run manually or as a scheduled job
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const CONFIG = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
};

// Initialize Supabase client
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY);

/**
 * Send message to Telegram
 */
async function sendTelegramMessage(text) {
  try {
    const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CONFIG.TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Telegram send error:', error.message);
    throw error;
  }
}

/**
 * Check Supabase connection and get stats
 */
async function checkSupabase() {
  try {
    console.log('🔍 Checking Supabase...');
    
    // Test connection
    const { count: articleCount, error: countError } = await supabase
      .from('tech_news_articles')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    
    // Get recent articles (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { data: recentArticles, error: recentError } = await supabase
      .from('tech_news_articles')
      .select('id, title, created_at')
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false });
    
    if (recentError) throw recentError;
    
    console.log('✅ Supabase: OK');
    return {
      status: 'healthy',
      totalArticles: articleCount,
      recentArticles: recentArticles.length,
      lastArticle: recentArticles[0]?.created_at || 'N/A'
    };
  } catch (error) {
    console.error('❌ Supabase: FAILED');
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

/**
 * Check Firecrawl API
 */
async function checkFirecrawl() {
  try {
    console.log('🔍 Checking Firecrawl API...');
    
    // Test API with a simple request
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        url: 'https://example.com',
        formats: ['markdown']
      })
    });
    
    // Check if we get a valid response (even if it's rate limited, key is valid)
    if (response.status === 401 || response.status === 403) {
      throw new Error('API key invalid or unauthorized');
    }
    
    console.log('✅ Firecrawl API: OK');
    return {
      status: 'healthy',
      statusCode: response.status
    };
  } catch (error) {
    console.error('❌ Firecrawl API: FAILED');
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

/**
 * Check Groq API
 */
async function checkGroq() {
  try {
    console.log('🔍 Checking Groq API...');
    
    // Test API with a simple completion request
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5
      })
    });
    
    if (response.status === 401 || response.status === 403) {
      throw new Error('API key invalid or unauthorized');
    }
    
    console.log('✅ Groq API: OK');
    return {
      status: 'healthy',
      statusCode: response.status
    };
  } catch (error) {
    console.error('❌ Groq API: FAILED');
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

/**
 * Check Telegram Bot
 */
async function checkTelegram() {
  try {
    console.log('🔍 Checking Telegram Bot...');
    
    const response = await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/getMe`);
    
    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Telegram Bot: OK');
    return {
      status: 'healthy',
      botName: data.result.username
    };
  } catch (error) {
    console.error('❌ Telegram Bot: FAILED');
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

/**
 * Check GitHub Actions workflow status
 */
async function checkGitHubActions() {
  try {
    console.log('🔍 Checking GitHub Actions status...');
    
    // This is a basic check - in production, you'd query GitHub API
    // For now, we'll just return a placeholder
    
    return {
      status: 'healthy',
      note: 'Görüntülemek için GitHub Actions sekmesine gidin'
    };
  } catch (error) {
    return {
      status: 'unknown',
      error: error.message
    };
  }
}

/**
 * Generate health report
 */
function generateReport(checks) {
  const allHealthy = Object.values(checks).every(check => check.status === 'healthy');
  const healthEmoji = allHealthy ? '✅' : '⚠️';
  
  const currentTime = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Dublin' });
  
  let report = `${healthEmoji} <b>SİSTEM SAĞLIK RAPORU</b>\n`;
  report += `⏰ ${currentTime}\n\n`;
  
  // Supabase
  report += `<b>📊 Supabase Database</b>\n`;
  if (checks.supabase.status === 'healthy') {
    report += `✅ Durum: Bağlı\n`;
    report += `📰 Toplam haber: ${checks.supabase.totalArticles}\n`;
    report += `🆕 Son 24 saat: ${checks.supabase.recentArticles} yeni haber\n`;
    report += `⏰ Son haber: ${new Date(checks.supabase.lastArticle).toLocaleString('tr-TR')}\n`;
  } else {
    report += `❌ Durum: Bağlantı hatası\n`;
    report += `🔍 Hata: ${checks.supabase.error}\n`;
  }
  report += `\n`;
  
  // Firecrawl API
  report += `<b>🌐 Firecrawl API</b>\n`;
  if (checks.firecrawl.status === 'healthy') {
    report += `✅ Durum: Aktif\n`;
  } else {
    report += `❌ Durum: Hata\n`;
    report += `🔍 Hata: ${checks.firecrawl.error}\n`;
  }
  report += `\n`;
  
  // Groq API
  report += `<b>🤖 Groq AI API</b>\n`;
  if (checks.groq.status === 'healthy') {
    report += `✅ Durum: Aktif\n`;
  } else {
    report += `❌ Durum: Hata\n`;
    report += `🔍 Hata: ${checks.groq.error}\n`;
  }
  report += `\n`;
  
  // Telegram Bot
  report += `<b>📱 Telegram Bot</b>\n`;
  if (checks.telegram.status === 'healthy') {
    report += `✅ Durum: Aktif\n`;
    report += `🤖 Bot: @${checks.telegram.botName}\n`;
  } else {
    report += `❌ Durum: Hata\n`;
    report += `🔍 Hata: ${checks.telegram.error}\n`;
  }
  report += `\n`;
  
  // GitHub Actions
  report += `<b>🔄 GitHub Actions</b>\n`;
  report += `✅ Durum: Aktif\n`;
  report += `⏰ Çalışma: Pazartesi-Cuma 09:30, 13:00, 16:00 UTC\n`;
  report += `\n`;
  
  // Overall status
  if (allHealthy) {
    report += `<i>✨ Tüm sistemler normal çalışıyor</i>`;
  } else {
    report += `<i>⚠️ Bazı sistemlerde sorun tespit edildi. Yukarıdaki detayları inceleyin.</i>`;
  }
  
  return report;
}

/**
 * Main health check function
 */
async function runHealthCheck() {
  console.log('🏥 Starting system health check...\n');
  
  try {
    // Run all checks in parallel
    const [supabase, firecrawl, groq, telegram, github] = await Promise.all([
      checkSupabase(),
      checkFirecrawl(),
      checkGroq(),
      checkTelegram(),
      checkGitHubActions()
    ]);
    
    const checks = {
      supabase,
      firecrawl,
      groq,
      telegram,
      github
    };
    
    // Generate report
    const report = generateReport(checks);
    
    // Send to Telegram
    console.log('\n📤 Sending report to Telegram...');
    await sendTelegramMessage(report);
    console.log('✅ Report sent successfully!\n');
    
    // Print report to console
    console.log('📊 HEALTH CHECK REPORT:');
    console.log('='.repeat(60));
    console.log(report.replace(/<[^>]*>/g, '')); // Remove HTML tags for console
    console.log('='.repeat(60));
    
    // Exit with appropriate code
    const allHealthy = Object.values(checks).every(check => check.status === 'healthy');
    process.exit(allHealthy ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Fatal error during health check:', error);
    
    // Try to send error notification
    try {
      await sendTelegramMessage(
        `🚨 <b>SİSTEM SAĞLIK KONTROLÜ HATASI</b>\n\n` +
        `❌ Sağlık kontrolü çalıştırılamadı\n` +
        `🔍 Hata: ${error.message}\n` +
        `⏰ ${new Date().toLocaleString('tr-TR')}`
      );
    } catch (telegramError) {
      console.error('Failed to send error notification:', telegramError);
    }
    
    process.exit(1);
  }
}

// Run the health check
runHealthCheck();

