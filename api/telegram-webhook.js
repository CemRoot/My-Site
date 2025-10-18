/**
 * Telegram Webhook Handler
 * Handles Telegram bot callbacks for LinkedIn automation approval workflow
 */

// Import statements for Vercel serverless function
const { createClient } = require('@supabase/supabase-js');

const CONFIG = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '',
};

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY);

// Rate limiting cache (in-memory, resets on function restart)
const rateLimitCache = new Map();

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Helper function: Validate UUID
function isValidUUID(uuid) {
  return UUID_REGEX.test(uuid);
}

// Helper function: Rate limiting check
function checkRateLimit(userId, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const userKey = `user_${userId}`;
  
  if (!rateLimitCache.has(userKey)) {
    rateLimitCache.set(userKey, []);
  }
  
  const requests = rateLimitCache.get(userKey).filter(time => now - time < windowMs);
  
  if (requests.length >= maxRequests) {
    return false; // Rate limit exceeded
  }
  
  requests.push(now);
  rateLimitCache.set(userKey, requests);
  return true;
}

// Helper function: Post to LinkedIn
async function postToLinkedIn(content) {
  const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
  const LINKEDIN_PERSON_URN = process.env.LINKEDIN_PERSON_URN;
  
  if (!LINKEDIN_ACCESS_TOKEN || !LINKEDIN_PERSON_URN) {
    throw new Error('LinkedIn credentials not configured. Set LINKEDIN_ACCESS_TOKEN and LINKEDIN_PERSON_URN in environment variables.');
  }
  
  // LinkedIn Share API v2
  const url = 'https://api.linkedin.com/v2/ugcPosts';
  
  const postData = {
    author: LINKEDIN_PERSON_URN,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: content
        },
        shareMediaCategory: 'NONE'
      }
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
    }
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0'
    },
    body: JSON.stringify(postData)
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LinkedIn API error (${response.status}): ${error}`);
  }
  
  const result = await response.json();
  return result.id; // Returns the post ID
}

// Helper function to send Telegram messages
async function sendTelegramMessage(text, options = {}) {
  const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CONFIG.TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'HTML',
        ...options,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Telegram API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }
    return await response.json();
  } catch (error) {
    console.error('❌ Failed to send Telegram message:', error.message);
    throw error;
  }
}

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed. Use POST.' 
    });
  }

  try {
    // Get the update from Telegram
    const update = req.body;
    
    if (!update) {
      return res.status(400).json({ 
        success: false, 
        message: 'No update data received' 
      });
    }

    console.log('📱 Telegram webhook received:', {
      updateId: update.update_id,
      type: update.callback_query ? 'callback_query' : 
            update.message ? 'message' : 'unknown'
    });

    // Handle text commands
    if (update.message && update.message.text) {
      const { message } = update;
      const chatId = message.chat.id;
      const text = message.text;

      // Ensure the message is from the authorized chat ID
      if (chatId.toString() !== CONFIG.TELEGRAM_CHAT_ID) {
        console.warn(`Unauthorized Telegram message from chat ID: ${chatId}`);
        return res.status(200).json({ success: false, message: 'Unauthorized chat ID' });
      }

      try {
        // Import menu handler functions
        const menuHandler = await import('../scripts/telegram-menu-handler.js');

        // Handle commands
        if (text.startsWith('/')) {
          const command = text.split(' ')[0].substring(1).toLowerCase();
          
          switch (command) {
            case 'start':
              await menuHandler.handleStartCommand();
              break;
            case 'menu':
              await menuHandler.handleMenuCommand();
              break;
            case 'status':
              await menuHandler.handleStatusAction();
              break;
            case 'scrape':
              await menuHandler.handleScrapeAction();
              break;
            case 'health':
              await menuHandler.handleHealthAction();
              break;
            case 'help':
              await menuHandler.handleHelpAction();
              break;
            default:
              await menuHandler.sendTelegramMessage(
                `❓ Bilinmeyen komut: ${command}\n\nKullanılabilir komutlar için /help yazın`
              );
          }
        }

        return res.status(200).json({ success: true, message: 'Command processed' });
      } catch (error) {
        console.error('❌ Command handler error:', error);
        return res.status(500).json({ success: false, message: error.message });
      }
    }

    // Handle callback queries (button presses)
    if (update.callback_query) {
      const { callback_query } = update;
      const chatId = callback_query.message.chat.id;
      const messageId = callback_query.message.message_id;
      const data = callback_query.data;
      const fromId = callback_query.from.id;

      // Ensure the callback is from the authorized chat ID
      if (chatId.toString() !== CONFIG.TELEGRAM_CHAT_ID) {
        console.warn(`Unauthorized Telegram callback from chat ID: ${chatId}`);
        return res.status(200).json({ success: false, message: 'Unauthorized chat ID' });
      }

      try {
        // Import menu handler functions
        const menuHandler = await import('../scripts/telegram-menu-handler.js');

        // Handle menu actions
        if (data.startsWith('action_')) {
          const action = data.replace('action_', '');
          
          // Answer callback query first
          await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callback_query_id: callback_query.id,
              text: 'İşlem yapılıyor...'
            })
          });

          switch (action) {
            case 'scrape':
              await menuHandler.handleScrapeAction();
              break;
            case 'health':
              await menuHandler.handleHealthAction();
              break;
            case 'status':
              await menuHandler.handleStatusAction();
              break;
            case 'stats':
              await menuHandler.handleStatsAction();
              break;
            case 'database':
              await menuHandler.handleDatabaseAction();
              break;
            case 'github':
              await menuHandler.handleGitHubAction();
              break;
            case 'help':
              await menuHandler.handleHelpAction();
              break;
            case 'refresh_menu':
              await menuHandler.handleMenuCommand();
              break;
            case 'fix_sources':
              await menuHandler.sendTelegramMessage(
                '🔧 <b>Source Düzeltme</b>\n\n' +
                'Lokal ortamda çalıştırmak için:\n' +
                '<code>npm run fix:original-sources</code>\n\n' +
                'GitHub Actions ile çalıştırma yakında eklenecek.'
              );
              break;
            default:
              await menuHandler.sendTelegramMessage('❓ Bilinmeyen aksiyon');
          }

          return res.status(200).json({ success: true, message: 'Menu action processed' });
        }

        // Handle LinkedIn Digest actions (new system)
        if (data.match(/^(approve|reject|edit|view)_[0-9a-f-]+$/i)) {
          const [action, digestId] = data.split('_');
          
          // Security: Validate UUID format
          if (!isValidUUID(digestId)) {
            console.warn(`Invalid UUID format in callback: ${digestId}`);
            await sendTelegramMessage('❌ Geçersiz istek formatı.');
            return res.status(400).json({ success: false, message: 'Invalid UUID format' });
          }
          
          // Security: Rate limiting check
          if (!checkRateLimit(fromId, 10, 60000)) {
            console.warn(`Rate limit exceeded for user: ${fromId}`);
            await sendTelegramMessage('⏱️ Çok fazla istek gönderdiniz. Lütfen 1 dakika bekleyin.');
            return res.status(429).json({ success: false, message: 'Rate limit exceeded' });
          }

          try {
            // Answer callback query immediately
            await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                callback_query_id: callback_query.id,
                text: 'İşleniyor...'
              })
            });

            // Fetch digest from database
            const { data: digest, error: fetchError } = await supabase
              .from('linkedin_digest_posts')
              .select('*')
              .eq('id', digestId)
              .single();

            if (fetchError || !digest) {
              console.error('Digest not found:', fetchError?.message || 'Not found');
              await sendTelegramMessage(`❌ Digest bulunamadı. ID: ${digestId}`);
              return res.status(404).json({ success: false, message: 'Digest not found' });
            }

            // Check if already processed
            if (digest.status === 'posted' && action === 'approve') {
              await sendTelegramMessage('⚠️ Bu digest zaten paylaşılmış!');
              return res.status(200).json({ success: false, message: 'Already posted' });
            }

            let responseText = '';
            let updateData = {};

            switch (action) {
              case 'approve':
                // Post to LinkedIn
                try {
                  await sendTelegramMessage('🚀 LinkedIn\'e gönderiliyor...');
                  
                  const linkedInPostId = await postToLinkedIn(digest.suggested_content);
                  
                  // Update database
                  updateData = {
                    status: 'posted',
                    linkedin_post_id: linkedInPostId,
                    posted_at: new Date().toISOString()
                  };
                  
                  const { error: updateError } = await supabase
                    .from('linkedin_digest_posts')
                    .update(updateData)
                    .eq('id', digestId);
                  
                  if (updateError) {
                    throw new Error(`Database update error: ${updateError.message}`);
                  }
                  
                  responseText = `✅ Başarıyla LinkedIn'de paylaşıldı!\n\n📊 Digest ID: ${digestId}\n🔗 Post ID: ${linkedInPostId}\n⏰ ${new Date().toLocaleString('tr-TR')}`;
                  
                } catch (linkedInError) {
                  console.error('LinkedIn posting error:', linkedInError);
                  
                  // Update status to failed
                  await supabase
                    .from('linkedin_digest_posts')
                    .update({ status: 'failed' })
                    .eq('id', digestId);
                  
                  responseText = `❌ LinkedIn paylaşım hatası:\n${linkedInError.message}`;
                }
                break;

              case 'reject':
                // Update status to rejected
                updateData = { status: 'rejected' };
                
                const { error: rejectError } = await supabase
                  .from('linkedin_digest_posts')
                  .update(updateData)
                  .eq('id', digestId);
                
                if (rejectError) {
                  throw new Error(`Database update error: ${rejectError.message}`);
                }
                
                responseText = `❌ Digest reddedildi.\n\n📊 Digest ID: ${digestId}\n⏰ ${new Date().toLocaleString('tr-TR')}`;
                break;

              case 'edit':
                // Provide content for manual editing
                responseText = `✏️ İçeriği düzenlemek için:\n\n1. Aşağıdaki içeriği kopyalayın\n2. Düzenleyin\n3. LinkedIn'e manuel olarak yapıştırın\n\n---\n\n${digest.suggested_content}\n\n---\n\nDüzenledikten sonra "View" butonuna basarak orijinal halini görebilirsiniz.`;
                break;

              case 'view':
                // Show full content
                const contentPreview = digest.suggested_content.length > 1000 
                  ? digest.suggested_content.substring(0, 1000) + '...\n\n(Tam içerik için veritabanını kontrol edin)'
                  : digest.suggested_content;
                
                responseText = `👁️ Tam İçerik:\n\n${contentPreview}\n\n---\n\n📊 Digest ID: ${digestId}\n📅 Tarih: ${digest.digest_date}\n📰 Haber sayısı: ${digest.article_count}\n📌 Durum: ${digest.status}`;
                break;

              default:
                responseText = 'Bilinmeyen işlem.';
            }

            // Send response to Telegram
            await sendTelegramMessage(responseText);

            // Edit original message to remove buttons (except for view)
            if (action !== 'view' && action !== 'edit') {
              await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/editMessageReplyMarkup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  message_id: messageId,
                  reply_markup: { inline_keyboard: [] }
                })
              });
            }

            return res.status(200).json({ success: true, message: responseText });

          } catch (error) {
            console.error('❌ Digest handler error:', error);
            await sendTelegramMessage(`🚨 Hata: ${error.message}`);
            return res.status(500).json({ success: false, message: error.message });
          }
        }

        // Handle LinkedIn post actions (legacy)
        let updateData = {};
        let responseText = '';

        // Find the corresponding linkedin_posts entries by telegram_message_id
        const { data: postEntries, error: fetchError } = await supabase
          .from('linkedin_posts')
          .select('*')
          .eq('telegram_message_id', messageId);

        if (fetchError || !postEntries || postEntries.length === 0) {
          console.error('Error fetching post entries or posts not found:', fetchError?.message || 'Not found');
          
          // Check if this is an old message (more than 24 hours old)
          const messageDate = new Date(callback_query.message.date * 1000);
          const hoursOld = (Date.now() - messageDate.getTime()) / (1000 * 60 * 60);
          
          let errorMessage;
          if (hoursOld > 24) {
            errorMessage = '⏰ Bu mesaj çok eski. Yeni analizler için bekleyin veya manuel test çalıştırın.';
          } else if (fetchError) {
            errorMessage = `❌ Veritabanı hatası: ${fetchError.message}`;
          } else {
            errorMessage = '❌ Bu mesajla ilişkili gönderi bulunamadı. Muhtemelen zaten işlenmiş.';
          }
          
          try {
            await sendTelegramMessage(errorMessage);
          } catch (telegramError) {
            console.error('Failed to send Telegram error message:', telegramError.message);
          }
          return res.status(200).json({ success: false, message: 'Posts not found' });
        }

        switch (data) {
          case 'approve_auto_post':
            // Approve and trigger N8N workflow for automatic posting
            updateData = { status: 'approved' };
            
            // Trigger N8N workflow for each approved post
            for (const post of postEntries) {
              try {
                const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/linkedin-post-webhook';
                await fetch(n8nWebhookUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    post_id: post.id,
                    action: 'approve'
                  })
                });
              } catch (n8nError) {
                console.error('N8N webhook error:', n8nError.message);
              }
            }
            
            responseText = `🚀 ${postEntries.length} gönderi onaylandı ve otomatik paylaşım başlatıldı!`;
            break;
          case 'manual_shared':
            updateData = { status: 'posted', posted_at: new Date().toISOString() };
            responseText = `✅ ${postEntries.length} gönderi manuel olarak paylaşıldı olarak işaretlendi!`;
            break;
          case 'copy_content':
            responseText = '📋 İçerikler yukarıda hazır. Kopyalayıp LinkedIn\'e yapıştırabilirsiniz.';
            // No status change, just acknowledgment
            break;
          case 'reject_all':
            updateData = { status: 'rejected' };
            responseText = `❌ ${postEntries.length} gönderi reddedildi.`;
            break;
          // Legacy support for old buttons
          case 'approve_all':
            updateData = { status: 'approved' };
            responseText = `✅ ${postEntries.length} gönderi onaylandı (manuel paylaşım için hazır)!`;
            break;
          case 'edit_posts':
            responseText = '✏️ İçerikleri yukarıdan kopyalayıp düzenleyebilirsiniz.';
            break;
          default:
            responseText = 'Geçersiz işlem.';
            break;
        }

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('linkedin_posts')
            .update(updateData)
            .eq('telegram_message_id', messageId);

          if (updateError) {
            throw new Error(`Supabase update error: ${updateError.message}`);
          }
        }

        // Edit the original message to show it's been handled
        await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/editMessageText`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            text: `${callback_query.message.text}\n\n--- \n<i>${responseText}</i>`,
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: [] } // Remove keyboard
          }),
        });

        // Answer the callback query to remove loading state
        await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: callback_query.id,
            text: responseText,
            show_alert: false
          }),
        });

        return res.status(200).json({ success: true, message: responseText });
      } catch (error) {
        console.error('❌ Telegram webhook handler error:', error.message);
        try {
          await sendTelegramMessage(`🚨 Webhook hatası: ${error.message}`);
        } catch (telegramError) {
          console.error('Failed to send Telegram error message:', telegramError.message);
        }
        return res.status(500).json({ success: false, message: 'Internal server error' });
      }
    }

    // Respond to Telegram
    return res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    });

  } catch (error) {
    console.error('❌ Telegram webhook error:', error);
    
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Webhook setup instructions:
// 
// 1. Set your webhook URL in Telegram:
//    curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
//         -H "Content-Type: application/json" \
//         -d '{"url": "https://cemkoyluoglu.codes/api/telegram-webhook"}'
//
// 2. Verify webhook is set:
//    curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
//
// 3. To remove webhook (for testing):
//    curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook"
