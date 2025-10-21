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
 * Main menu keyboard
 */
function getMainMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '📰 Haberleri Çek', callback_data: 'action_scrape' },
        { text: '➕ Manuel Haber Ekle', callback_data: 'action_add_article' },
      ],
      [
        { text: '📱 LinkedIn Posts', callback_data: 'action_linkedin' },
        { text: '🏥 Sağlık Kontrolü', callback_data: 'action_health' },
      ],
      [
        { text: '📊 Sistem Durumu', callback_data: 'action_status' },
        { text: '📈 İstatistikler', callback_data: 'action_stats' },
      ],
      [
        { text: '💾 Veritabanı', callback_data: 'action_database' },
        { text: '🔧 GitHub Actions', callback_data: 'action_github' },
      ],
      [
        { text: 'ℹ️ Yardım', callback_data: 'action_help' },
        { text: '🔄 Menüyü Yenile', callback_data: 'action_refresh_menu' },
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

Bu bot ile tech news sistemini tamamen kontrol edebilirsiniz.

<b>📋 Menü Komutları:</b>
/menu - Ana menüyü göster
/status - Hızlı durum raporu
/scrape - Haberleri çek
/health - Sistem sağlığı
/help - Yardım ve komutlar

<b>🎯 Özellikler:</b>
✅ Otomatik haber toplama
✅ Sistem sağlığı izleme
✅ GitHub Actions kontrolü
✅ Veritabanı yönetimi
✅ LinkedIn entegrasyonu

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

<b>📰 Haberleri Çek</b> - Yeni haberler topla
<b>🏥 Sağlık Kontrolü</b> - Tüm sistemleri kontrol et
<b>📊 Sistem Durumu</b> - Hızlı durum özeti
<b>📈 İstatistikler</b> - Detaylı istatistikler
<b>🔧 GitHub Actions</b> - Workflow durumu
<b>💾 Veritabanı</b> - DB bilgileri

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
 * Handle action_github - GitHub Actions status
 */
export async function handleGitHubAction() {
  const githubText = `
🔧 <b>GITHUB ACTIONS</b>

<b>📋 Aktif Workflow'lar</b>
• Scrape Tech News (3x gün, hafta içi)
  ⏰ 09:30, 13:00, 16:00 UTC

• Daily LinkedIn (günlük)
  ⏰ 16:30 UTC

• System Health Check (günlük)
  ⏰ 08:00 UTC

<b>📊 Durum</b>
✅ Tüm workflow'lar aktif

<b>🔗 Linkler</b>
GitHub Actions sekmesinden takip edebilirsiniz.`;

  await sendTelegramMessage(githubText, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🚀 Scraping Başlat', callback_data: 'action_scrape' },
        ],
        [
          { text: '🔙 Ana Menü', callback_data: 'action_refresh_menu' },
        ],
      ]
    }
  });
}

/**
 * Handle /linkedin command - Show pending LinkedIn digests
 */
export async function handleLinkedInCommand() {
  try {
    await sendTelegramMessage('📱 <b>LinkedIn Digest\'ler Yükleniyor...</b>');

    // Get pending and recent digests
    const { data: digests, error } = await supabase
      .from('linkedin_digest_posts')
      .select('*')
      .in('status', ['pending', 'posted', 'rejected'])
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
    const posted = digests.filter(d => d.status === 'posted');
    const rejected = digests.filter(d => d.status === 'rejected');

    let messageText = '📱 <b>LINKEDİN DIGEST YÖNETİMİ</b>\n\n';

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

    await sendTelegramMessage(
      '✅ <b>Digest oluşturma başlatıldı!</b>\n\n' +
      '📊 n8n workflow tetiklendi\n' +
      '⏳ İşlem tamamlandığında digest ile birlikte bildirim alacaksınız\n\n' +
      '<i>Digest oluşturulduğunda onay butonları ile mesaj gelecek.</i>'
    );

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
  handleAddArticleAction,
  handleArticleUrlInput,
  handleSourceConfirmation,
  handleOriginalSourceInput,
  handleScrapeAction,
  handleHealthAction,
  handleStatusAction,
  handleStatsAction,
  handleDatabaseAction,
  handleGitHubAction,
  handleHelpAction,
  setBotCommands,
};

