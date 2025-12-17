/**
 * Telegram Bot Menu Handler
 * 
 * Provides interactive menu system for controlling the tech news system
 * Commands: /start, /menu, /status, /scrape, /health, /help
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';

const CONFIG = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  GITHUB_REPO: process.env.GITHUB_REPOSITORY || 'username/My-Site',
};

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY);

/**
 * Send message to Telegram
 */
export async function sendTelegramMessage(text, options = {}) {
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
        ...options
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
 * Main menu keyboard - Reorganized with System Management section
 */
function getMainMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '📰 Haberleri Çek', callback_data: 'action_scrape' },
        { text: '➕ Manuel Ekle', callback_data: 'action_add_article' },
      ],
      [
        { text: '📱 LinkedIn', callback_data: 'action_linkedin' },
        { text: '🔧 Sistem Yönetimi', callback_data: 'action_system_management' },
      ],
      [
        { text: '📊 Durum', callback_data: 'action_status' },
        { text: '📈 İstatistikler', callback_data: 'action_stats' },
      ],
      [
        { text: '💾 Veritabanı', callback_data: 'action_database' },
        { text: 'ℹ️ Yardım', callback_data: 'action_help' },
      ],
    ],
  };
}

/**
 * System Management submenu keyboard
 */
function getSystemManagementKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🤖 n8n Durumu', callback_data: 'action_n8n_status' },
        { text: '🔄 Webhook Reset', callback_data: 'action_webhook_reset' },
      ],
      [
        { text: '🏥 Sağlık Kontrolü', callback_data: 'action_health' },
        { text: '🔧 GitHub Actions', callback_data: 'action_github' },
      ],
      [
        { text: '🔙 Ana Menü', callback_data: 'action_refresh_menu' },
      ],
    ],
  };
}

/**
 * Handle /start command
 */
export async function handleStartCommand() {
  const welcomeText = `
🤖 <b>Tech News Bot'a Hoş Geldiniz!</b>

Bu bot ile tüm sistemlerinizi Telegram'dan yönetin!

<b>📋 Menü Komutları:</b>
/menu - Ana menüyü göster
/status - Hızlı durum raporu
/scrape - Haberleri çek
/health - Sistem sağlığı
/help - Yardım ve komutlar

<b>🎯 Özellikler:</b>
✅ Otomatik haber toplama
✅ LinkedIn digest yönetimi
✅ n8n trial takibi
✅ Webhook yönetimi (reset)
✅ Sistem sağlığı izleme
✅ GitHub Actions kontrolü

<b>🆕 Yeni!</b> Sistem Yönetimi menüsünden:
• n8n deneme süresini takip edin
• Telegram webhook'u resetleyin
• Tüm sistemi tek yerden yönetin

Başlamak için aşağıdaki menüyü kullanın:`;

  await sendTelegramMessage(welcomeText, {
    reply_markup: getMainMenuKeyboard()
  });
}

/**
 * Handle /menu command
 */
export async function handleMenuCommand() {
  const menuText = `
📱 <b>ANA MENÜ</b>

Yapmak istediğiniz işlemi seçin:

<b>📰 İçerik Yönetimi</b>
• Haberleri Çek - Yeni haberler topla
• Manuel Ekle - Tek haber ekle

<b>📱 LinkedIn</b> - Digest yönetimi

<b>🔧 Sistem Yönetimi</b> [Yeni!]
• n8n Durumu - Trial takibi
• Webhook Reset - Kuyruk temizle
• Sağlık Kontrolü - Sistem durumu
• GitHub Actions - Workflow'lar

<b>📊 Raporlar</b>
• Durum, İstatistikler, Veritabanı

<i>Butonlara tıklayarak işlem yapabilirsiniz.</i>`;

  await sendTelegramMessage(menuText, {
    reply_markup: getMainMenuKeyboard()
  });
}

/**
 * Handle action_scrape - Trigger news scraping
 */
export async function handleScrapeAction() {
  try {
    await sendTelegramMessage('🔄 <b>Haber Toplama Başlatılıyor...</b>\n\nLütfen bekleyin, bu işlem birkaç dakika sürebilir.');

    // Trigger GitHub Actions workflow
    if (CONFIG.GITHUB_TOKEN) {
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
          body: JSON.stringify({
            ref: 'main'
          })
        }
      );

      if (response.ok) {
        await sendTelegramMessage(
          '✅ <b>Haber toplama başlatıldı!</b>\n\n' +
          '📊 GitHub Actions workflow tetiklendi\n' +
          '⏳ İşlem tamamlandığında bildirim alacaksınız\n\n' +
          '<i>Durum: Çalışıyor...</i>'
        );
      } else {
        throw new Error(`GitHub API error: ${response.status}`);
      }
    } else {
      // Fallback: Run locally
      await sendTelegramMessage(
        '⚠️ GitHub token bulunamadı, lokal çalıştırılıyor...\n\n' +
        'Bu işlem daha uzun sürebilir.'
      );
      
      // Run scraper locally
      const scraper = spawn('npm', ['run', 'scrape:news'], {
        cwd: process.cwd(),
        stdio: 'pipe'
      });

      scraper.on('close', async (code) => {
        if (code === 0) {
          await sendTelegramMessage('✅ Haber toplama başarıyla tamamlandı!');
        } else {
          await sendTelegramMessage(`❌ Haber toplama başarısız oldu (Exit code: ${code})`);
        }
      });
    }
  } catch (error) {
    await sendTelegramMessage(`❌ <b>Hata!</b>\n\n${error.message}`);
  }
}

/**
 * Handle action_health - Run health check
 */
export async function handleHealthAction() {
  try {
    await sendTelegramMessage('🔍 <b>Sistem sağlığı kontrol ediliyor...</b>');

    // Check Supabase
    const { count: articleCount, error: countError } = await supabase
      .from('tech_news_articles')
      .select('*', { count: 'exact', head: true });
    
    const supabaseStatus = countError ? '❌ Hata' : '✅ Bağlı';

    // Check recent articles
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { data: recentArticles, error: recentError } = await supabase
      .from('tech_news_articles')
      .select('id, title, created_at')
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false });
    
    const recentCount = recentArticles?.length || 0;

    // Check Firecrawl API
    let firecrawlStatus = '❓ Bilinmiyor';
    try {
      const fcResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: 'https://example.com', formats: ['markdown'] })
      });
      firecrawlStatus = (fcResponse.status === 401 || fcResponse.status === 403) ? '❌ API Key Invalid' : '✅ Aktif';
    } catch (e) {
      firecrawlStatus = '❌ Bağlantı Hatası';
    }

    // Check Groq API
    let groqStatus = '❓ Bilinmiyor';
    try {
      const groqResponse = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}` }
      });
      groqStatus = groqResponse.ok ? '✅ Aktif' : '❌ Hata';
    } catch (e) {
      groqStatus = '❌ Bağlantı Hatası';
    }

    const healthReport = `
🏥 <b>SİSTEM SAĞLIK RAPORU</b>
⏰ ${new Date().toLocaleString('tr-TR')}

<b>📊 Veritabanı (Supabase)</b>
${supabaseStatus}
📰 Toplam haber: ${articleCount || 0}
🆕 Son 24 saat: ${recentCount} yeni haber
${recentArticles?.[0] ? `⏰ Son: ${new Date(recentArticles[0].created_at).toLocaleString('tr-TR')}` : ''}

<b>🌐 API Servisleri</b>
Firecrawl API: ${firecrawlStatus}
Groq AI API: ${groqStatus}
Telegram Bot: ✅ Aktif

<b>🔄 Durum</b>
${supabaseStatus === '✅ Bağlı' && firecrawlStatus.includes('✅') && groqStatus.includes('✅') 
  ? '✨ <b>Tüm sistemler çalışıyor</b>' 
  : '⚠️ <b>Bazı sistemlerde sorun var</b>'}`;

    await sendTelegramMessage(healthReport, {
      reply_markup: getMainMenuKeyboard()
    });
  } catch (error) {
    await sendTelegramMessage(`❌ <b>Sağlık kontrolü hatası!</b>\n\n${error.message}`);
  }
}

/**
 * Handle action_status - Quick status
 */
export async function handleStatusAction() {
  try {
    const { count } = await supabase
      .from('tech_news_articles')
      .select('*', { count: 'exact', head: true });

    const { data: recent } = await supabase
      .from('tech_news_articles')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1);

    const statusText = `
📊 <b>HIZLI DURUM</b>
⏰ ${new Date().toLocaleString('tr-TR')}

📰 Toplam haber: ${count || 0}
⏰ Son güncelleme: ${recent?.[0] ? new Date(recent[0].created_at).toLocaleString('tr-TR') : 'Bilinmiyor'}
🔄 Durum: ✅ Aktif

<i>Detaylı kontrol için 🏥 Sağlık Kontrolü'ne tıklayın</i>`;

    await sendTelegramMessage(statusText, {
      reply_markup: getMainMenuKeyboard()
    });
  } catch (error) {
    await sendTelegramMessage(`❌ Durum alınamadı: ${error.message}`);
  }
}

/**
 * Handle action_stats - Statistics
 */
export async function handleStatsAction() {
  try {
    // Get article stats
    const { count: totalCount } = await supabase
      .from('tech_news_articles')
      .select('*', { count: 'exact', head: true });

    // Last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { count: weekCount } = await supabase
      .from('tech_news_articles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    // Last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { count: dayCount } = await supabase
      .from('tech_news_articles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString());

    // Category breakdown
    const { data: categories } = await supabase
      .from('tech_news_articles')
      .select('category')
      .not('category', 'is', null);

    const categoryStats = {};
    categories?.forEach(item => {
      categoryStats[item.category] = (categoryStats[item.category] || 0) + 1;
    });

    const topCategories = Object.entries(categoryStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, count]) => `  ${cat}: ${count}`)
      .join('\n');

    const statsText = `
📈 <b>İSTATİSTİKLER</b>
⏰ ${new Date().toLocaleString('tr-TR')}

<b>📰 Haber Sayıları</b>
Toplam: ${totalCount || 0}
Son 7 gün: ${weekCount || 0}
Son 24 saat: ${dayCount || 0}

<b>🏆 En Popüler Kategoriler</b>
${topCategories || 'Veri yok'}

<b>📊 Ortalamalar</b>
Günlük: ~${Math.round((weekCount || 0) / 7)} haber
Haftalık: ~${weekCount || 0} haber`;

    await sendTelegramMessage(statsText, {
      reply_markup: getMainMenuKeyboard()
    });
  } catch (error) {
    await sendTelegramMessage(`❌ İstatistikler alınamadı: ${error.message}`);
  }
}

/**
 * Handle action_database - Database info
 */
export async function handleDatabaseAction() {
  try {
    const { count: total } = await supabase
      .from('tech_news_articles')
      .select('*', { count: 'exact', head: true });

    const { count: withSource } = await supabase
      .from('tech_news_articles')
      .select('*', { count: 'exact', head: true })
      .not('original_source', 'is', null);

    const { count: nullSource } = await supabase
      .from('tech_news_articles')
      .select('*', { count: 'exact', head: true })
      .is('original_source', null);

    const sourcePercentage = total > 0 ? Math.round((withSource / total) * 100) : 0;

    const dbText = `
💾 <b>VERİTABANI BİLGİLERİ</b>

<b>📊 Genel İstatistikler</b>
Toplam kayıt: ${total}
Original source var: ${withSource} (${sourcePercentage}%)
Original source yok: ${nullSource}

<b>🔧 Bakım</b>
${nullSource > 0 ? `⚠️ ${nullSource} kayıtta source eksik\n\nDüzeltmek için:\nnpm run fix:original-sources` : '✅ Tüm kayıtlar düzgün'}

<b>🔗 Bağlantı</b>
Supabase: ✅ Bağlı
URL: ${CONFIG.SUPABASE_URL.substring(0, 30)}...`;

    await sendTelegramMessage(dbText, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔧 Source\'ları Düzelt', callback_data: 'action_fix_sources' },
          ],
          [
            { text: '🔙 Ana Menü', callback_data: 'action_refresh_menu' },
          ],
        ]
      }
    });
  } catch (error) {
    await sendTelegramMessage(`❌ Veritabanı bilgisi alınamadı: ${error.message}`);
  }
}

/**
 * Handle action_system_management - Show System Management submenu
 */
export async function handleSystemManagementMenu() {
  const systemText = `
🔧 <b>SİSTEM YÖNETİMİ</b>

Sistemlerinizi buradan yönetin:

<b>🤖 n8n Durumu</b>
• Deneme süresi takibi
• Kalan gün kontrolü
• Trial sıfırlama

<b>🔄 Webhook Reset</b>
• Telegram webhook'u sıfırla
• Kuyrukta sıkışan mesajları temizle
• GitHub Actions ile otomatik

<b>🏥 Sağlık Kontrolü</b>
• Tüm sistemleri kontrol et
• API durumları
• Veritabanı bağlantısı

<b>🔧 GitHub Actions</b>
• Workflow durumları
• Manuel tetikleme

<i>Yapmak istediğiniz işlemi seçin:</i>`;

  await sendTelegramMessage(systemText, {
    reply_markup: getSystemManagementKeyboard()
  });
}

/**
 * Handle action_n8n_status - Show n8n trial status
 */
export async function handleN8nStatusAction() {
  try {
    await sendTelegramMessage('🔍 <b>n8n Durumu Kontrol Ediliyor...</b>\n\nLütfen bekleyin...');

    console.log('Importing n8n-trial-status module...');
    
    // Import n8n trial status functions
    const { calculateRemainingDays } = await import('./n8n-trial-status.js');
    
    console.log('Calculating remaining days...');
    const status = await calculateRemainingDays();
    console.log('Status calculated:', status);
    const { startDate, endDate, durationDays, daysPassed, daysRemaining, isExpired } = status;

    // Progress bar (safe for expired trials)
    const progress = Math.min(100, Math.max(0, Math.round((daysPassed / durationDays) * 100)));
    const filledBars = Math.min(10, Math.max(0, Math.floor(progress / 10)));
    const emptyBars = Math.max(0, 10 - filledBars);
    const progressBar = '▓'.repeat(filledBars) + '░'.repeat(emptyBars);

    let statusText = `
🤖 <b>n8n DENEME SÜRESİ DURUMU</b>

<b>📅 Tarih Bilgileri:</b>
Başlangıç: ${startDate}
Bitiş: ${endDate}
Toplam süre: ${durationDays} gün

<b>📊 İlerleme:</b>
${progressBar} ${progress}%
✅ Geçen: ${daysPassed} gün
⏳ Kalan: ${daysRemaining} gün

<b>🔔 Durum:</b>`;

    if (isExpired) {
      statusText += `
❌ Deneme süresi ${Math.abs(daysRemaining)} gün önce sona erdi!

<b>⚠️ Yapılması Gerekenler:</b>
1. Yeni n8n hesabı oluştur
2. Workflow'u yeni hesaba aktar  
3. Vercel webhook URL'ini güncelle
4. "30 Günü Yeniden Başlat" butonuna bas

<i>Not: Yeni hesap kurduktan sonra trial'ı sıfırlayın.</i>`;
      
      // Add reset button
      const keyboard = {
        inline_keyboard: [
          [
            { text: '🔄 30 Günü Yeniden Başlat', callback_data: 'action_n8n_trial_reset' }
          ],
          [
            { text: '🔙 Sistem Yönetimi', callback_data: 'action_system_management' }
          ]
        ]
      };
      
      await sendTelegramMessage(statusText, { reply_markup: keyboard });
    } else if (daysRemaining <= 1) {
      statusText += `
⚠️ <b>KRİTİK!</b> Deneme süreniz yarın bitiyor!

Yeni n8n hesabı için hazırlık yapın:
• Workflow'u export edin
• Yeni hesap oluşturun
• Webhook URL'lerini güncelleyin

<i>Süre bitince trial'ı sıfırlayabilirsiniz.</i>`;
      
      await sendTelegramMessage(statusText, {
        reply_markup: getSystemManagementKeyboard()
      });
    } else if (daysRemaining <= 3) {
      statusText += `
⚠️ <b>UYARI!</b> ${daysRemaining} gün kaldı.

Yeni n8n hesabı için hazırlık yapmayı unutmayın!

<i>Günlük otomatik kontroller devam edecek.</i>`;
      
      await sendTelegramMessage(statusText, {
        reply_markup: getSystemManagementKeyboard()
      });
    } else {
      statusText += `
✅ <b>Her şey yolunda!</b> ${daysRemaining} gün kaldı.

Sistem normal çalışıyor. ${daysRemaining <= 7 ? 'Hazırlık yapmaya başlayabilirsiniz.' : ''}

<i>Günlük otomatik kontroller aktif.</i>`;
      
      await sendTelegramMessage(statusText, {
        reply_markup: getSystemManagementKeyboard()
      });
    }

  } catch (error) {
    console.error('❌ n8n status error:', error);
    console.error('Error stack:', error.stack);
    
    await sendTelegramMessage(
      `❌ <b>n8n Durumu Alınamadı!</b>\n\n` +
      `<b>Hata:</b> <code>${error.message}</code>\n\n` +
      `<b>Detay:</b> ${error.stack ? error.stack.split('\n')[0] : 'Bilinmiyor'}\n\n` +
      `💡 Kontrol edin:\n` +
      `• Supabase system_settings tablosu var mı?\n` +
      `• SUPABASE_SERVICE_ROLE_KEY doğru mu?\n` +
      `• Vercel env variables güncel mi?`,
      { reply_markup: getSystemManagementKeyboard() }
    );
  }
}

/**
 * Handle action_webhook_reset - Trigger GitHub Action to reset webhook
 */
export async function handleWebhookResetAction() {
  try {
    await sendTelegramMessage(
      '🔄 <b>Telegram Webhook Reset Başlatılıyor...</b>\n\n' +
      'GitHub Actions workflow tetikleniyor...\n' +
      'Bu işlem 1-2 dakika sürebilir.'
    );

    // Trigger GitHub Actions workflow
    if (CONFIG.GITHUB_TOKEN) {
      const [owner, repo] = CONFIG.GITHUB_REPO.split('/');
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/actions/workflows/telegram-webhook-reset.yml/dispatches`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CONFIG.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ref: 'main'
          })
        }
      );

      if (response.ok) {
        await sendTelegramMessage(
          '✅ <b>Webhook Reset Başlatıldı!</b>\n\n' +
          '📊 GitHub Actions workflow tetiklendi\n' +
          '⏳ İşlemler:\n' +
          '  1️⃣ Eski webhook siliniyor...\n' +
          '  2️⃣ Pending updates temizleniyor...\n' +
          '  3️⃣ Yeni webhook kuruluyor...\n' +
          '  4️⃣ Durum doğrulanıyor...\n\n' +
          '🔔 Tamamlandığında bildirim alacaksınız (30-60 saniye)\n\n' +
          '<i>GitHub Actions sekmesinden takip edebilirsiniz.</i>',
          { reply_markup: getSystemManagementKeyboard() }
        );
      } else {
        throw new Error(`GitHub API error: ${response.status}`);
      }
    } else {
      throw new Error('GITHUB_TOKEN not configured');
    }
  } catch (error) {
    await sendTelegramMessage(
      `❌ <b>Webhook Reset Başlatılamadı!</b>\n\n` +
      `<code>${error.message}</code>\n\n` +
      `💡 Alternatif:\n` +
      `Lokal olarak çalıştırın:\n` +
      `<code>npm run telegram:reset</code>`,
      { reply_markup: getSystemManagementKeyboard() }
    );
  }
}

/**
 * Handle action_n8n_trial_reset - Reset n8n trial period (start new 30 days)
 */
export async function handleN8nTrialResetAction() {
  try {
    await sendTelegramMessage(
      '🔄 <b>n8n Trial Sıfırlanıyor...</b>\n\n' +
      'Yeni 30 günlük süre başlatılıyor...'
    );

    // Import reset function
    const { resetTrialPeriod, calculateRemainingDays } = await import('./n8n-trial-status.js');
    
    // Reset trial
    const newStatus = await resetTrialPeriod('telegram-user');
    
    const { startDate, endDate, durationDays } = newStatus;

    await sendTelegramMessage(
      '✅ <b>n8n Trial Sıfırlandı!</b>\n\n' +
      `📅 <b>Yeni Süre:</b>\n` +
      `Başlangıç: ${startDate}\n` +
      `Bitiş: ${endDate}\n` +
      `Toplam: ${durationDays} gün\n\n` +
      `💚 Yeni 30 günlük deneme süresi başladı!\n\n` +
      `⏰ Her gün otomatik kontrol edilecek.\n` +
      `🔔 ${durationDays - 3} gün sonra uyarı mesajları başlayacak.\n\n` +
      `<i>Not: Yeni n8n hesabı oluşturduktan sonra bu işlemi yapın.</i>`,
      { reply_markup: getSystemManagementKeyboard() }
    );

  } catch (error) {
    await sendTelegramMessage(
      `❌ <b>Trial Sıfırlama Başarısız!</b>\n\n` +
      `<code>${error.message}</code>\n\n` +
      `Lütfen Supabase bağlantısını kontrol edin.`,
      { reply_markup: getSystemManagementKeyboard() }
    );
  }
}

/**
 * Get GitHub workflow status
 */
async function getGitHubWorkflowStatus() {
  if (!CONFIG.GITHUB_TOKEN) {
    return null;
  }

  try {
    const [owner, repo] = CONFIG.GITHUB_REPO.split('/');
    
    // Get all workflows
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows`,
      {
        headers: {
          'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Map workflow names to display names
    const displayMap = {
      'scrape-tech-news.yml': '📰 Scrape Tech News',
      'manual-article-scraper.yml': '➕ Manual Article Scraper',
      'system-health-check.yml': '🏥 System Health Check',
      'daily-linkedin.yml': '📱 Daily LinkedIn',
      'vercel-status-monitor.yml': '🔍 Vercel Status Monitor',
    };

    const statuses = [];
    
    for (const workflow of data.workflows || []) {
      const fileName = workflow.path.split('/').pop(); // Get filename from path
      const displayName = displayMap[fileName];
      
      if (displayName) {
        statuses.push({
          name: displayName,
          fileName: fileName,
          workflowId: workflow.id,
          enabled: workflow.state === 'active'
        });
      }
    }

    return statuses;
  } catch (error) {
    console.error('GitHub workflow status error:', error);
    return null;
  }
}

/**
 * Enable/Disable GitHub workflow
 */
async function toggleGitHubWorkflow(workflowFileName, enable) {
  if (!CONFIG.GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN not configured');
  }

  const [owner, repo] = CONFIG.GITHUB_REPO.split('/');
  const action = enable ? 'enable' : 'disable';
  
  // First, get workflow ID by listing all workflows
  const listResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows`,
    {
      headers: {
        'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }
  );

  if (!listResponse.ok) {
    throw new Error(`Failed to list workflows: ${listResponse.status}`);
  }

  const workflowsData = await listResponse.json();
  const workflow = workflowsData.workflows?.find(w => w.path.endsWith(workflowFileName));

  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowFileName}`);
  }

  // Use workflow ID for enable/disable
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow.id}/${action}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${errorText}`);
  }

  return true;
}

/**
 * Handle action_github - GitHub Actions status
 */
export async function handleGitHubAction() {
  try {
    await sendTelegramMessage('🔍 <b>GitHub Actions durumu kontrol ediliyor...</b>');

    const statuses = await getGitHubWorkflowStatus();
    
    let githubText = `🔧 <b>GITHUB ACTIONS YÖNETİMİ</b>\n\n`;

    if (!statuses || statuses.length === 0) {
      githubText += `⚠️ <b>Workflow durumları alınamadı</b>\n\n`;
      githubText += `GITHUB_TOKEN environment variable'ı kontrol edin.`;
    } else {
      githubText += `<b>📋 Workflow Durumları:</b>\n\n`;
      
      statuses.forEach(status => {
        const icon = status.enabled ? '✅' : '❌';
        githubText += `${icon} ${status.name}\n`;
      });

      githubText += `\n<b>ℹ️ Not</b>\n`;
      githubText += `Workflow'ları devre dışı bırakmak için aşağıdaki butonları kullanın.`;
    }

    // Create keyboard with workflow toggle buttons
    const keyboard = [];
    
    if (statuses && statuses.length > 0) {
      // Group workflows in pairs
      for (let i = 0; i < statuses.length; i += 2) {
        const row = [];
        const workflow1 = statuses[i];
        const workflow2 = statuses[i + 1];
        
        if (workflow1) {
          const action = workflow1.enabled ? 'disable' : 'enable';
          const icon = workflow1.enabled ? '⏸️' : '▶️';
          const shortName = workflow1.name.split(' ').slice(1).join(' ');
          row.push({
            text: `${icon} ${shortName}`,
            callback_data: `github_${action}_${workflow1.fileName}`
          });
        }
        
        if (workflow2) {
          const action = workflow2.enabled ? 'disable' : 'enable';
          const icon = workflow2.enabled ? '⏸️' : '▶️';
          const shortName = workflow2.name.split(' ').slice(1).join(' ');
          row.push({
            text: `${icon} ${shortName}`,
            callback_data: `github_${action}_${workflow2.fileName}`
          });
        }
        
        keyboard.push(row);
      }
    }

    keyboard.push([
      { text: '🔄 Durumu Yenile', callback_data: 'action_github' },
    ]);
    
    keyboard.push([
      { text: '🔙 Sistem Yönetimi', callback_data: 'action_system_management' },
    ]);

    await sendTelegramMessage(githubText, {
      reply_markup: { inline_keyboard: keyboard }
    });

  } catch (error) {
    console.error('GitHub action error:', error);
    await sendTelegramMessage(
      `❌ <b>Hata!</b>\n\n${error.message}\n\n` +
      `GITHUB_TOKEN kontrol edin veya /help ile destek alın.`
    );
  }
}

/**
 * Handle GitHub workflow toggle actions
 */
export async function handleGitHubWorkflowToggle(action, workflowFileName) {
  try {
    const enable = action === 'enable';
    
    // Get display name from filename
    const displayMap = {
      'scrape-tech-news.yml': 'Scrape Tech News',
      'manual-article-scraper.yml': 'Manual Article Scraper',
      'system-health-check.yml': 'System Health Check',
      'daily-linkedin.yml': 'Daily LinkedIn',
      'vercel-status-monitor.yml': 'Vercel Status Monitor',
    };
    
    const displayName = displayMap[workflowFileName] || workflowFileName;
    const actionText = enable ? 'aktifleştiriliyor' : 'devre dışı bırakılıyor';
    
    await sendTelegramMessage(`⏳ <b>${displayName} ${actionText}...</b>`);

    await toggleGitHubWorkflow(workflowFileName, enable);

    const statusIcon = enable ? '✅' : '⏸️';
    const statusText = enable ? 'aktifleştirildi' : 'devre dışı bırakıldı';
    
    await sendTelegramMessage(
      `${statusIcon} <b>${displayName} ${statusText}!</b>\n\n` +
      `Workflow artık ${enable ? 'çalışacak' : 'çalışmayacak'}.\n\n` +
      `Durumu kontrol etmek için "Durumu Yenile" butonuna basın.`
    );

    // Refresh GitHub menu after 1 second
    setTimeout(() => {
      handleGitHubAction();
    }, 1000);

  } catch (error) {
    console.error('GitHub workflow toggle error:', error);
    await sendTelegramMessage(
      `❌ <b>Hata!</b>\n\n${error.message}\n\n` +
      `GITHUB_TOKEN kontrol edin veya workflow dosya adını doğrulayın.`
    );
  }
}

/**
 * Handle /linkedin command - Show pending LinkedIn digests
 */
export async function handleLinkedInCommand() {
  try {
    await sendTelegramMessage('📱 <b>LinkedIn Digest\'ler Yükleniyor...</b>');

    // Get pending, posting, and recent digests (including stuck "posting" status)
    const { data: digests, error } = await supabase
      .from('linkedin_digest_posts')
      .select('*')
      .in('status', ['pending', 'posting', 'posted', 'rejected'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!digests || digests.length === 0) {
      await sendTelegramMessage(
        '📱 <b>LinkedIn Digest\'ler</b>\n\n' +
        'ℹ️ Henüz digest bulunamadı.\n\n' +
        'Digest\'ler her gün saat 16:30\'da otomatik olarak oluşturulur.\n\n' +
        '👇 Manuel olarak digest oluşturmak için butona tıklayın:',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🚀 Manuel Digest Oluştur', callback_data: 'action_create_digest' }],
              [{ text: '🔙 Ana Menü', callback_data: 'action_menu' }]
            ]
          }
        }
      );
      return;
    }

    // Group by status
    const pending = digests.filter(d => d.status === 'pending');
    const posting = digests.filter(d => d.status === 'posting'); // Stuck digests
    const posted = digests.filter(d => d.status === 'posted');
    const rejected = digests.filter(d => d.status === 'rejected');

    // Combined stuck digests (pending + posting that got stuck)
    const stuckDigests = [...pending, ...posting];

    let messageText = '📱 <b>LINKEDİN DIGEST YÖNETİMİ</b>\n\n';

    // Stuck "posting" digests (failed during LinkedIn post)
    if (posting.length > 0) {
      messageText += '<b>⚠️ Takılı Kalmış (Posting):</b>\n';
      posting.forEach(d => {
        messageText += `🔴 ${d.digest_date} | 📊 ${d.article_count} haber (LinkedIn hatası)\n`;
      });
      messageText += '\n';
    }

    // Pending digests
    if (pending.length > 0) {
      messageText += '<b>⏳ Onay Bekleyen:</b>\n';
      pending.forEach(d => {
        messageText += `📅 ${d.digest_date} | 📊 ${d.article_count} haber\n`;
      });
      messageText += '\n';
    }

    // Posted digests
    if (posted.length > 0) {
      messageText += '<b>✅ Paylaşılan:</b>\n';
      posted.slice(0, 3).forEach(d => {
        const date = new Date(d.posted_at).toLocaleDateString('tr-TR');
        messageText += `✓ ${d.digest_date} (${date})\n`;
      });
      if (posted.length > 3) {
        messageText += `<i>... ve ${posted.length - 3} daha</i>\n`;
      }
      messageText += '\n';
    }

    // Rejected digests
    if (rejected.length > 0) {
      messageText += '<b>❌ Reddedilen:</b>\n';
      rejected.slice(0, 2).forEach(d => {
        messageText += `✗ ${d.digest_date}\n`;
      });
      messageText += '\n';
    }

    // Create buttons for pending digests
    const buttons = [];
    
    if (pending.length > 0) {
      pending.forEach(digest => {
        buttons.push([
          {
            text: `📅 ${digest.digest_date} - Görüntüle`,
            callback_data: `view_${digest.id}`
          },
          {
            text: '✅ Onayla',
            callback_data: `approve_${digest.id}`
          }
        ]);
      });
    }

    // Add manual create button
    buttons.push([
      { text: '🚀 Manuel Digest Oluştur', callback_data: 'action_create_digest' }
    ]);

    // Add cleanup button if there are stuck digests (pending OR posting)
    if (stuckDigests.length > 0) {
      buttons.push([
        { text: '🗑️ Takılı Digest\'leri Temizle', callback_data: 'action_clean_pending' }
      ]);
    }

    buttons.push([
      { text: '🔙 Ana Menü', callback_data: 'action_refresh_menu' }
    ]);

    await sendTelegramMessage(messageText, {
      reply_markup: { inline_keyboard: buttons }
    });

  } catch (error) {
    console.error('LinkedIn command error:', error);
    await sendTelegramMessage(`❌ <b>Hata!</b>\n\n${error.message}`);
  }
}

/**
 * Handle action_create_digest - Trigger manual digest creation
 */
export async function handleCreateDigestAction() {
  try {
    await sendTelegramMessage('🔍 <b>Digest kontrolü yapılıyor...</b>');

    const today = new Date().toISOString().split('T')[0];

    // Check if digest already exists for today
    const { data: existingDigest, error: checkError } = await supabase
      .from('linkedin_digest_posts')
      .select('*')
      .eq('digest_date', today)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows found (which is OK)
      throw checkError;
    }

    // If digest exists
    if (existingDigest) {
      if (existingDigest.status === 'pending') {
        // Already pending - just resend it
        await sendTelegramMessage(
          '⚠️ <b>Bugün için digest zaten mevcut!</b>\n\n' +
          `📅 Tarih: ${existingDigest.digest_date}\n` +
          `📊 Durum: ${existingDigest.status}\n` +
          `📝 Haber sayısı: ${existingDigest.article_count}\n\n` +
          'Digest zaten oluşturulmuş ve onay bekliyor.\n' +
          'LinkedIn Posts menüsünden görüntüleyebilirsiniz.'
        );
        return;
      } else if (existingDigest.status === 'posted') {
        // Already posted
        await sendTelegramMessage(
          '✅ <b>Bugün için digest zaten paylaşılmış!</b>\n\n' +
          `📅 Tarih: ${existingDigest.digest_date}\n` +
          `📊 Paylaşım: ${new Date(existingDigest.posted_at).toLocaleString('tr-TR')}\n\n` +
          'Yeni bir digest oluşturmak için yarın tekrar deneyin.'
        );
        return;
      } else if (existingDigest.status === 'rejected') {
        // Rejected - delete it and create new one
        await sendTelegramMessage('🔄 <b>Reddedilen digest siliniyor, yenisi oluşturuluyor...</b>');
        
        const { error: deleteError } = await supabase
          .from('linkedin_digest_posts')
          .delete()
          .eq('id', existingDigest.id);

        if (deleteError) {
          throw new Error(`Silme hatası: ${deleteError.message}`);
        }
      }
    }

    // Proceed with creation
    await sendTelegramMessage('🚀 <b>Manuel Digest Oluşturuluyor...</b>\n\nLütfen bekleyin, bu işlem 30-60 saniye sürebilir.');

    // Use unified workflow webhook
    const N8N_WEBHOOK_URL = process.env.N8N_LINKEDIN_WORKFLOW_WEBHOOK;
    
    if (!N8N_WEBHOOK_URL) {
      throw new Error('N8N_LINKEDIN_WORKFLOW_WEBHOOK environment variable not configured. Please add it to Vercel.');
    }

    // Trigger n8n unified workflow (manual trigger)
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trigger: 'manual',
        chat_id: CONFIG.TELEGRAM_CHAT_ID,
        timestamp: new Date().toISOString(),
        force_recreate: existingDigest?.status === 'rejected' // Flag for n8n
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`n8n webhook error (${response.status}): ${errorText}`);
    }

    // Simple feedback - detailed message will come from n8n
    await sendTelegramMessage('⏳ <b>Digest oluşturuluyor...</b>');

  } catch (error) {
    console.error('Create digest error:', error);
    await sendTelegramMessage(
      `❌ <b>Digest oluşturma hatası!</b>\n\n<code>${error.message}</code>\n\n` +
      'Lütfen tekrar deneyin veya /help ile destek alın.'
    );
  }
}

/**
 * Handle action_help - Help and commands
 */
export async function handleHelpAction() {
  const helpText = `
ℹ️ <b>YARDIM VE KOMUTLAR</b>

<b>📱 Bot Komutları</b>
/start - Bot'u başlat
/menu - Ana menüyü göster
/linkedin - LinkedIn digest'leri yönet
/status - Hızlı durum raporu
/scrape - Haberleri çek
/health - Sağlık kontrolü
/help - Bu yardım mesajı

<b>🎯 Menü Özellikleri</b>
• 📰 Haberleri Çek - Yeni haberler topla
• 🏥 Sağlık Kontrolü - Sistemleri kontrol et
• 📊 Sistem Durumu - Hızlı özet
• 📈 İstatistikler - Detaylı veriler
• 🔧 GitHub Actions - Workflow durumu
• 💾 Veritabanı - DB yönetimi

<b>🔔 Otomatik Bildirimler</b>
• ✅ Başarılı işlemler
• ❌ Hatalar ve sorunlar
• 📊 Günlük sağlık raporu

<b>💡 İpuçları</b>
• Butonlara tıklayarak işlem yapın
• Komutları direkt yazabilirsiniz
• Bildirimler otomatik gelir

<i>Sorun olursa /menu ile yenileyin</i>`;

  await sendTelegramMessage(helpText, {
    reply_markup: getMainMenuKeyboard()
  });
}

/**
 * Trigger GitHub Actions workflow to process article
 */
async function triggerGitHubActionsWorkflow(articleUrl, originalSourceUrl, userId) {
  const githubToken = process.env.GITHUB_TOKEN;
  const githubRepo = process.env.GITHUB_REPOSITORY || 'CemRoot/My-Site';
  
  if (!githubToken) {
    throw new Error('GITHUB_TOKEN environment variable not configured');
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${githubRepo}/actions/workflows/manual-article-scraper.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${githubToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            article_url: articleUrl,
            original_source: originalSourceUrl,
            telegram_user_id: userId.toString(),
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
    }

    console.log('✅ GitHub Actions workflow triggered successfully');
    return true;
  } catch (error) {
    console.error('❌ GitHub Actions trigger error:', error);
    throw error;
  }
}

/**
 * Handle action_add_article - Start manual article addition flow
 */
export async function handleAddArticleAction(userId) {
  try {
    // Initialize conversation state in Supabase
    const { setConversationState } = await import('../lib/conversation-state.js');
    await setConversationState(userId, 'awaiting_url');

    await sendTelegramMessage(
      '➕ <b>Manuel Haber Ekleme</b>\n\n' +
      '📎 Lütfen eklemek istediğiniz haberin URL\'sini gönderin:\n\n' +
      '<i>Örnek: https://techcrunch.com/article-123</i>\n\n' +
      '⏱️ 10 dakika içinde işlem yapmazsanız süreç iptal olur.'
    );
  } catch (error) {
    console.error('Add article action error:', error);
    await sendTelegramMessage(
      `❌ <b>Hata!</b>\n\n${error.message}\n\nLütfen tekrar deneyin veya /help ile destek alın.`
    );
  }
}

/**
 * Handle article URL input
 */
export async function handleArticleUrlInput(url, userId) {
  try {
    const { getConversationState, setConversationState, deleteConversationState } = await import('../lib/conversation-state.js');
    
    const state = await getConversationState(userId);
    if (!state || state.step !== 'awaiting_url') {
      return; // Invalid state
    }

    // Validate URL
    const { isValidUrl } = await import('./manual-article-scraper.js');
    if (!isValidUrl(url)) {
      await sendTelegramMessage(
        '❌ <b>Geçersiz URL formatı!</b>\n\n' +
        'Lütfen geçerli bir URL gönderin:\n' +
        '<i>Örnek: https://techcrunch.com/article-123</i>'
      );
      return;
    }

    // Update state and ask for confirmation
    await setConversationState(userId, 'confirm_source', { articleUrl: url });

    await sendTelegramMessage(
      '🔗 <b>URL Alındı!</b>\n\n' +
      `📎 ${url}\n\n` +
      '📰 Bu URL\'i "Original Article Source" olarak kullanabilir miyim?\n\n' +
      '<i>• <b>Evet:</b> Paylaştığınız link kaynak olarak kullanılacak</i>\n' +
      '<i>• <b>Hayır:</b> Farklı bir kaynak URL\'i girebilirsiniz</i>',
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Evet', callback_data: 'source_yes' },
              { text: '❌ Hayır', callback_data: 'source_no' }
            ]
          ]
        }
      }
    );
  } catch (error) {
    console.error('URL input error:', error);
    await sendTelegramMessage(
      `❌ <b>Hata!</b>\n\n${error.message}\n\nLütfen tekrar deneyin.`
    );
    const { deleteConversationState } = await import('../lib/conversation-state.js');
    await deleteConversationState(userId);
  }
}

/**
 * Handle source confirmation
 */
export async function handleSourceConfirmation(useOriginal, userId) {
  try {
    const { getConversationState, setConversationState, deleteConversationState } = await import('../lib/conversation-state.js');
    
    const state = await getConversationState(userId);
    if (!state || state.step !== 'confirm_source') {
      await sendTelegramMessage('❌ Oturum zaman aşımına uğradı. Lütfen /menu ile tekrar başlayın.');
      await deleteConversationState(userId);
      return;
    }

    if (useOriginal) {
      // Clear state immediately to prevent duplicates
      await deleteConversationState(userId);
      
      try {
        // Trigger GitHub Actions workflow
        await triggerGitHubActionsWorkflow(state.article_url, state.article_url, userId);
        
        // Send confirmation message
        await sendTelegramMessage(
          '🚀 <b>İşlem Başlatıldı!</b>\n\n' +
          '📊 GitHub Actions workflow tetiklendi\n' +
          '⏳ Makale işleniyor...\n\n' +
          '<i>İşlem tamamlandığında bildirim alacaksınız (30-60 saniye)</i>',
          {
            reply_markup: getMainMenuKeyboard()
          }
        );
      } catch (error) {
        console.error('GitHub Actions trigger error:', error);
        await sendTelegramMessage(
          `❌ <b>İşlem Başlatılamadı!</b>\n\n` +
          `<code>${error.message}</code>\n\n` +
          'Lütfen tekrar deneyin veya /help ile destek alın.',
          {
            reply_markup: getMainMenuKeyboard()
          }
        );
      }
    } else {
      // Ask for different original source
      await setConversationState(userId, 'awaiting_original_source', { articleUrl: state.article_url });

      await sendTelegramMessage(
        '📝 <b>Original Source URL\'ini girin:</b>\n\n' +
        '<i>Örnek: https://originalsource.com/article</i>\n\n' +
        '⏱️ 10 dakika içinde göndermezsaniz işlem iptal olur.'
      );
    }
  } catch (error) {
    console.error('Source confirmation error:', error);
    await sendTelegramMessage(
      `❌ <b>Hata Oluştu!</b>\n\n${error.message}\n\n` +
      'Lütfen tekrar deneyin veya /help ile destek alın.',
      {
        reply_markup: getMainMenuKeyboard()
      }
    );
    const { deleteConversationState } = await import('../lib/conversation-state.js');
    await deleteConversationState(userId);
  }
}

/**
 * Handle original source URL input
 */
export async function handleOriginalSourceInput(originalUrl, userId, articleUrl) {
  try {
    const { getConversationState, deleteConversationState } = await import('../lib/conversation-state.js');
    
    const state = await getConversationState(userId);
    if (!state || state.step !== 'awaiting_original_source') {
      return; // Invalid state
    }

    // Validate URL
    const { isValidUrl } = await import('./manual-article-scraper.js');
    if (!isValidUrl(originalUrl)) {
      await sendTelegramMessage(
        '❌ <b>Geçersiz URL formatı!</b>\n\n' +
        'Lütfen geçerli bir URL gönderin:\n' +
        '<i>Örnek: https://originalsource.com/article</i>'
      );
      return;
    }

    // Clear state immediately to prevent duplicates
    await deleteConversationState(userId);
    
    try {
      // Trigger GitHub Actions workflow
      await triggerGitHubActionsWorkflow(state.article_url, originalUrl, userId);
      
      // Send confirmation message
      await sendTelegramMessage(
        '🚀 <b>İşlem Başlatıldı!</b>\n\n' +
        '📊 GitHub Actions workflow tetiklendi\n' +
        '⏳ Makale işleniyor...\n\n' +
        '<i>İşlem tamamlandığında bildirim alacaksınız (30-60 saniye)</i>',
        {
          reply_markup: getMainMenuKeyboard()
        }
      );
    } catch (error) {
      console.error('GitHub Actions trigger error:', error);
      await sendTelegramMessage(
        `❌ <b>İşlem Başlatılamadı!</b>\n\n` +
        `<code>${error.message}</code>\n\n` +
        'Lütfen tekrar deneyin veya /help ile destek alın.',
        {
          reply_markup: getMainMenuKeyboard()
        }
      );
    }
  } catch (error) {
    console.error('Original source input error:', error);
    await sendTelegramMessage(
      `❌ <b>Hata Oluştu!</b>\n\n${error.message}\n\n` +
      'Lütfen tekrar deneyin veya /help ile destek alın.',
      {
        reply_markup: getMainMenuKeyboard()
      }
    );
    const { deleteConversationState } = await import('../lib/conversation-state.js');
    await deleteConversationState(userId);
  }
}

/**
 * Handle digest edit input (LinkedIn digest editing)
 */
export async function handleDigestEditInput(editedContent, userId, digestId) {
  try {
    const { deleteConversationState } = await import('../lib/conversation-state.js');
    
    // Validate content length (LinkedIn limit: 3000 characters)
    if (editedContent.length > 3000) {
      await sendTelegramMessage(
        `❌ <b>İçerik çok uzun!</b>\n\n` +
        `📏 Mevcut: ${editedContent.length} karakter\n` +
        `📏 Maksimum: 3000 karakter\n\n` +
        `Lütfen içeriği kısaltın ve tekrar gönderin.`
      );
      return;
    }

    // Clear conversation state immediately
    await deleteConversationState(userId);

    // Update digest with edited content
    const { data: digest, error: updateError } = await supabase
      .from('linkedin_digest_posts')
      .update({
        edited_content: editedContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', digestId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Digest güncelleme hatası: ${updateError.message}`);
    }

    // Send confirmation with approve/reject buttons
    await sendTelegramMessage(
      `✅ <b>İçerik Güncellendi!</b>\n\n` +
      `📝 Düzenlenmiş içerik kaydedildi.\n` +
      `📊 Karakter sayısı: ${editedContent.length}/3000\n\n` +
      `<b>📋 Önizleme:</b>\n` +
      `${editedContent.substring(0, 500)}${editedContent.length > 500 ? '...' : ''}\n\n` +
      `👇 Şimdi ne yapmak istersiniz?`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '✅ Approve & Post to LinkedIn',
                callback_data: `approve_${digestId}`
              }
            ],
            [
              {
                text: '❌ Reject',
                callback_data: `reject_${digestId}`
              }
            ],
            [
              {
                text: '👁️ View Full Content',
                callback_data: `view_${digestId}`
              }
            ],
            [
              {
                text: '🔙 Back to Menu',
                callback_data: 'action_refresh_menu'
              }
            ]
          ]
        }
      }
    );

    console.log(`✅ Digest ${digestId} updated with edited content by user ${userId}`);

  } catch (error) {
    console.error('Digest edit input error:', error);
    await sendTelegramMessage(
      `❌ <b>Hata Oluştu!</b>\n\n${error.message}\n\n` +
      'Lütfen tekrar deneyin veya /help ile destek alın.',
      {
        reply_markup: getMainMenuKeyboard()
      }
    );
    const { deleteConversationState } = await import('../lib/conversation-state.js');
    await deleteConversationState(userId);
  }
}

/**
 * Handle clean pending digests action
 */
export async function handleCleanPendingAction() {
  try {
    await sendTelegramMessage('🔍 <b>Takılı Digest\'ler Kontrol Ediliyor...</b>');

    // Get stuck digests (both pending AND posting status)
    const { data: stuckDigests, error } = await supabase
      .from('linkedin_digest_posts')
      .select('*')
      .in('status', ['pending', 'posting'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!stuckDigests || stuckDigests.length === 0) {
      await sendTelegramMessage(
        '✅ <b>Temizlenecek Takılı Digest Yok!</b>\n\n' +
        'Sistem şu anda temiz durumda.'
      );
      return;
    }

    // Format digests for display
    const digestsFormatted = stuckDigests.map(d => ({
      id: d.id,
      date: d.digest_date,
      status: d.status,
      articles: d.article_count,
      created: new Date(d.created_at).toLocaleString('tr-TR'),
      age: Math.floor((Date.now() - new Date(d.created_at)) / (1000 * 60)) + ' minutes'
    }));

    // Show confirmation dialog
    let confirmText = '🗑️ <b>Takılı Digest Temizleme</b>\n\n';
    confirmText += `<b>Silinecek digest sayısı:</b> ${stuckDigests.length}\n\n`;
    confirmText += '<b>Digest Listesi:</b>\n';

    digestsFormatted.forEach(d => {
      const statusEmoji = d.status === 'posting' ? '🔴' : '⏳';
      confirmText += `${statusEmoji} ${d.date} - ${d.articles} haber (${d.status}) - ${d.age}\n`;
    });

    confirmText += '\n⚠️ <b>DİKKAT:</b> Bu işlem geri alınamaz!\n';
    confirmText += 'Tüm pending digest\'ler silinecek.\n\n';
    confirmText += 'Onaylıyor musunuz?';

    await sendTelegramMessage(confirmText, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Evet, Sil', callback_data: 'action_confirm_clean' },
            { text: '❌ İptal', callback_data: 'action_linkedin' }
          ]
        ]
      }
    });

  } catch (error) {
    console.error('Clean pending action error:', error);
    await sendTelegramMessage(`❌ <b>Hata!</b>\n\n${error.message}`);
  }
}

/**
 * Handle confirm clean action - actually delete pending digests
 */
export async function handleConfirmCleanAction() {
  try {
    await sendTelegramMessage('🗑️ <b>Takılı Digest\'ler Siliniyor...</b>');

    // Get all stuck digests first (both pending AND posting)
    const { data: stuckDigests, error: fetchError } = await supabase
      .from('linkedin_digest_posts')
      .select('*')
      .in('status', ['pending', 'posting']);

    if (fetchError) throw fetchError;

    let successText = '✅ <b>Temizleme Tamamlandı!</b>\n\n';

    if (stuckDigests && stuckDigests.length > 0) {
      // Delete all stuck digests (pending + posting)
      const { error: deleteError } = await supabase
        .from('linkedin_digest_posts')
        .delete()
        .in('status', ['pending', 'posting']);

      if (deleteError) throw deleteError;

      successText += `<b>Silinen digest sayısı:</b> ${stuckDigests.length}\n\n`;
      successText += '<b>Silinen Digest\'ler:</b>\n';
      stuckDigests.forEach(d => {
        const statusEmoji = d.status === 'posting' ? '🔴' : '⏳';
        successText += `${statusEmoji} ${d.digest_date} - ${d.article_count} haber (${d.status})\n`;
      });
    } else {
      successText += 'Silinecek digest bulunamadı.';
    }

    successText += '\n\nArtık yeni digest oluşturabilirsiniz.';

    await sendTelegramMessage(successText, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🚀 Yeni Digest Oluştur', callback_data: 'action_create_digest' }
          ],
          [
            { text: '🔙 LinkedIn Menü', callback_data: 'action_linkedin' }
          ]
        ]
      }
    });

  } catch (error) {
    console.error('Confirm clean action error:', error);
    await sendTelegramMessage(`❌ <b>Silme Hatası!</b>\n\n${error.message}`);
  }
}

/**
 * Set bot commands (run once during setup)
 */
export async function setBotCommands() {
  const commands = [
    { command: 'start', description: 'Bot\'u başlat' },
    { command: 'menu', description: 'Ana menüyü göster' },
    { command: 'status', description: 'Hızlı durum raporu' },
    { command: 'scrape', description: 'Haberleri çek' },
    { command: 'health', description: 'Sağlık kontrolü' },
    { command: 'help', description: 'Yardım ve komutlar' },
  ];

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/setMyCommands`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands })
      }
    );

    if (response.ok) {
      console.log('✅ Bot commands set successfully!');
    } else {
      const error = await response.json();
      console.error('❌ Failed to set bot commands:', error);
    }
  } catch (error) {
    console.error('❌ Error setting bot commands:', error);
  }
}

export default {
  sendTelegramMessage,
  handleStartCommand,
  handleMenuCommand,
  handleLinkedInCommand,
  handleCreateDigestAction,
  handleCleanPendingAction,
  handleConfirmCleanAction,
  handleAddArticleAction,
  handleArticleUrlInput,
  handleSourceConfirmation,
  handleOriginalSourceInput,
  handleDigestEditInput,
  handleScrapeAction,
  handleHealthAction,
  handleStatusAction,
  handleStatsAction,
  handleDatabaseAction,
  handleGitHubAction,
  handleGitHubWorkflowToggle,
  handleHelpAction,
  setBotCommands,
};

