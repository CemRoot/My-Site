/**
 * Telegram Bot Handler for LinkedIn Automation
 * Handles approval workflow and notifications
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Send message to Telegram
 */
async function sendTelegramMessage(text, options = {}) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const payload = {
      chat_id: TELEGRAM_CHAT_ID,
      text: text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...options
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status}`);
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('❌ Telegram send error:', error.message);
    throw error;
  }
}

/**
 * Send articles for manual sharing with ready-to-copy LinkedIn content
 */
export async function sendApprovalRequest(articles) {
  try {
    console.log('📤 Sending manual sharing request to Telegram...');
    
    // Create detailed message for manual sharing
    const summary = `📊 <b>GÜNLÜK HABER ANALİZİ TAMAMLANDI</b>
📅 ${new Date().toLocaleDateString('tr-TR')} - ${articles.length} haber hazır

${articles.map((article, index) => {
  // Clean the content from "POST_CONTENT" and format properly
  let cleanContent = article.suggested_content || '';
  cleanContent = cleanContent.replace(/POST_CONTENT\s*/g, '').trim();
  
  // Add hashtags to content
  const hashtagsText = (Array.isArray(article.hashtags) && article.hashtags.length > 0) 
    ? article.hashtags.join(' ') 
    : '#TechNews #AI';
  const fullContent = `${cleanContent}\n\n🔗 ${CONFIG.SITE_URL}/tech-news/${article.slug}\n\n${hashtagsText}`;
  
  return `${getScoreEmoji(article.ai_score)} <b>[${article.ai_score} puan]</b> ${article.title}

📋 <b>LİNKEDİN İÇERİĞİ:</b>
<code>${fullContent}</code>

`;
}).join('─────────────────────\n')}

📱 <b>MANUEL PAYLAŞIM TALİMATI:</b>
1. Yukarıdaki içerikleri kopyalayın
2. LinkedIn'e gidin ve "Gönderi Oluştur"a tıklayın  
3. İçeriği yapıştırın ve paylaşın
4. Aşağıdaki butonla tamamlandığını bildirin`;

    // Create inline keyboard for manual sharing
    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ MANUEL PAYLAŞTIM', callback_data: 'manual_shared' },
        ],
        [
          { text: '📋 İÇERİKLERİ KOPYALA', callback_data: 'copy_content' },
          { text: '❌ İPTAL ET', callback_data: 'reject_all' },
        ],
      ],
    };

    const message = await sendTelegramMessage(summary, { reply_markup: keyboard });

    // Save message ID for later reference
    for (const article of articles) {
      await supabase
        .from('linkedin_posts')
        .update({ telegram_message_id: message.message_id })
        .eq('article_id', article.id);
    }

    console.log('✅ Manual sharing request sent successfully');
    return message;
    
  } catch (error) {
    console.error('❌ Error sending manual sharing request:', error);
    throw error;
  }
}

/**
 * Send success notification
 */
export async function sendSuccessNotification(message) {
  const text = `✅ <b>BAŞARILI</b>\n${message}`;
  return await sendTelegramMessage(text);
}

/**
 * Send error notification with debug info
 */
export async function sendErrorNotification(error, context = {}) {
  const text = `🚨 <b>HATA RAPORU</b>
⏰ ${new Date().toLocaleString('tr-TR')}
🔧 Workflow: ${context.workflow || 'daily-linkedin'}
❌ Hata: ${error.message}
📊 Durum: ${context.status || 'Bilinmiyor'}
🔗 Log: ${context.logUrl || 'N/A'}

<i>Sistem otomatik olarak tekrar deneyecek...</i>`;
  
  return await sendTelegramMessage(text);
}

/**
 * Send debug information
 */
export async function sendDebugInfo(debugData) {
  const text = `🔧 <b>DEBUG BİLGİSİ</b>
⏰ ${new Date().toLocaleString('tr-TR')}
📊 İşlenen makale: ${debugData.processedCount || 0}
✅ Başarılı: ${debugData.successCount || 0}
❌ Başarısız: ${debugData.failedCount || 0}
⏳ Süre: ${debugData.duration || 'N/A'}
💾 Bellek: ${debugData.memory || 'N/A'}

<pre>${JSON.stringify(debugData, null, 2)}</pre>`;
  
  return await sendTelegramMessage(text);
}

/**
 * Send system status
 */
export async function sendSystemStatus() {
  try {
    // Check Supabase connection
    const { data: articles, error } = await supabase
      .from('tech_news_articles')
      .select('count')
      .limit(1);
    
    const supabaseStatus = error ? '❌ Hata' : '✅ Bağlı';
    
    // Check recent posts
    const { data: recentPosts } = await supabase
      .from('linkedin_posts')
      .select('*')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });
    
    const successfulPosts = recentPosts?.filter(p => p.status === 'posted').length || 0;
    const totalPosts = recentPosts?.length || 0;
    
    const text = `📊 <b>SİSTEM SAĞLIK RAPORU</b>
⏰ ${new Date().toLocaleString('tr-TR')}

<b>API Durumları:</b>
${supabaseStatus} Supabase
✅ Google Gemini API
✅ LinkedIn API
✅ Telegram Bot

<b>Son 7 Gün İstatistikleri:</b>
📊 Toplam analiz: ${totalPosts}
✅ Başarılı gönderim: ${successfulPosts}
📈 Başarı oranı: ${totalPosts > 0 ? Math.round((successfulPosts / totalPosts) * 100) : 0}%

<b>Sistem Bilgileri:</b>
🔄 Son çalışma: ${recentPosts?.[0]?.created_at ? new Date(recentPosts[0].created_at).toLocaleString('tr-TR') : 'Bilinmiyor'}
⏰ Sonraki çalışma: Yarın 15:00 UTC
🎯 Mod: Otomatik`;
    
    return await sendTelegramMessage(text);
    
  } catch (error) {
    console.error('Error getting system status:', error);
    return await sendTelegramMessage('❌ Sistem durumu alınamadı');
  }
}

/**
 * Send daily summary report
 */
export async function sendDailySummary(stats) {
  const text = `📊 <b>GÜNLÜK ÖZET RAPORU</b>
📅 ${new Date().toLocaleDateString('tr-TR')}

<b>Bugünkü Aktivite:</b>
📰 Analiz edilen haber: ${stats.analyzedCount || 0}
🎯 Seçilen haber: ${stats.selectedCount || 0}
✅ Onaylanan: ${stats.approvedCount || 0}
📤 Gönderilen: ${stats.postedCount || 0}
❌ Red edilen: ${stats.rejectedCount || 0}

<b>Performans:</b>
📈 En yüksek skor: ${stats.highestScore || 0}/100
🏆 En popüler kategori: ${stats.topCategory || 'N/A'}
⏱️ İşlem süresi: ${stats.processingTime || 'N/A'}

<b>LinkedIn Engagement:</b>
👀 Toplam görüntülenme: ${stats.totalViews || 0}
❤️ Toplam beğeni: ${stats.totalLikes || 0}
💬 Toplam yorum: ${stats.totalComments || 0}

Yarın aynı saatte görüşürüz! 🚀`;
  
  return await sendTelegramMessage(text);
}

/**
 * Handle webhook from Telegram (for button responses)
 */
export async function handleTelegramWebhook(update) {
  try {
    if (update.callback_query) {
      const callbackData = update.callback_query.data;
      const messageId = update.callback_query.message.message_id;
      
      console.log(`📱 Telegram callback: ${callbackData}`);
      
      if (callbackData === 'approve_all') {
        await handleApproveAll(messageId);
      } else if (callbackData === 'reject_all') {
        await handleRejectAll(messageId);
      } else if (callbackData.startsWith('approve_')) {
        const articleId = callbackData.replace('approve_', '');
        await handleApproveArticle(articleId, messageId);
      } else if (callbackData.startsWith('reject_')) {
        const articleId = callbackData.replace('reject_', '');
        await handleRejectArticle(articleId, messageId);
      } else if (callbackData === 'stats') {
        await sendSystemStatus();
      }
      
      // Acknowledge the callback
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: update.callback_query.id,
          text: 'İşlem tamamlandı ✅'
        })
      });
    }
    
  } catch (error) {
    console.error('❌ Webhook handling error:', error);
  }
}

/**
 * Helper functions
 */
function getScoreEmoji(score) {
  if (score >= 90) return '🔥';
  if (score >= 80) return '🚀';
  if (score >= 70) return '⭐';
  if (score >= 60) return '📈';
  return '📊';
}

async function handleApproveAll(messageId) {
  const { data: posts } = await supabase
    .from('linkedin_posts')
    .update({ status: 'approved' })
    .eq('telegram_message_id', messageId)
    .eq('status', 'pending');
    
  await sendTelegramMessage('✅ Tüm haberler onaylandı! LinkedIn\'e gönderilecek.');
}

async function handleRejectAll(messageId) {
  const { data: posts } = await supabase
    .from('linkedin_posts')
    .update({ status: 'rejected' })
    .eq('telegram_message_id', messageId)
    .eq('status', 'pending');
    
  await sendTelegramMessage('❌ Tüm haberler red edildi.');
}

async function handleApproveArticle(articleId, messageId) {
  await supabase
    .from('linkedin_posts')
    .update({ status: 'approved' })
    .eq('article_id', articleId);
    
  await sendTelegramMessage(`✅ Haber onaylandı: ${articleId}`);
}

async function handleRejectArticle(articleId, messageId) {
  await supabase
    .from('linkedin_posts')
    .update({ status: 'rejected' })
    .eq('article_id', articleId);
    
  await sendTelegramMessage(`❌ Haber red edildi: ${articleId}`);
}

export default {
  sendApprovalRequest,
  sendSuccessNotification,
  sendErrorNotification,
  sendDebugInfo,
  sendSystemStatus,
  sendDailySummary,
  handleTelegramWebhook
};
