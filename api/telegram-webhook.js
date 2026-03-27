/**
 * Telegram Webhook Handler
 * Handles Telegram bot callbacks for LinkedIn automation approval workflow
 */

import { supabase } from '../lib/supabaseAdmin.js';
import { sendTelegramMessage, callTelegramApi } from '../lib/telegram.js';

const TELEGRAM_CHAT_ID = () => process.env.TELEGRAM_CHAT_ID || '';

const rateLimitCache = new Map();
const processedCallbacks = new Map();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(uuid) {
  return UUID_REGEX.test(uuid);
}

function checkRateLimit(userId, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const userKey = `user_${userId}`;

  if (!rateLimitCache.has(userKey)) {
    rateLimitCache.set(userKey, []);
  }

  const requests = rateLimitCache.get(userKey).filter(time => now - time < windowMs);

  if (requests.length >= maxRequests) {
    return false;
  }

  requests.push(now);
  rateLimitCache.set(userKey, requests);
  return true;
}

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
      if (chatId.toString() !== TELEGRAM_CHAT_ID()) {
        console.warn(`Unauthorized Telegram message from chat ID: ${chatId}`);
        return res.status(200).json({ success: false, message: 'Unauthorized chat ID' });
      }

      try {
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
            case 'linkedin':
              await menuHandler.handleLinkedInCommand();
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
        } else {
          const userId = message.from.id;

          // Auto-detect site article URLs for quick deletion
          if (/cemkoyluoglu\.codes\/tech-news\/[a-z0-9-]+/i.test(text)) {
            await menuHandler.handleDeleteUrlInput(text, userId);
            return res.status(200).json({ success: true, message: 'Delete article flow initiated' });
          }

          // Handle text messages for conversation flow (non-command messages)
          const { getConversationState } = await import('../lib/conversation-state.js');
          const state = await getConversationState(userId);
          
          if (state) {
            if (state.step === 'awaiting_url') {
              await menuHandler.handleArticleUrlInput(text, userId);
            } else if (state.step === 'awaiting_original_source') {
              await menuHandler.handleOriginalSourceInput(text, userId, state.article_url);
            } else if (state.step === 'awaiting_digest_edit') {
              await menuHandler.handleDigestEditInput(text, userId, state.digest_id);
            } else if (state.step === 'awaiting_delete_url') {
              await menuHandler.handleDeleteUrlInput(text, userId);
            }
            
            return res.status(200).json({ success: true, message: 'Conversation message processed' });
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
      if (chatId.toString() !== TELEGRAM_CHAT_ID()) {
        console.warn(`Unauthorized Telegram callback from chat ID: ${chatId}`);
        return res.status(200).json({ success: false, message: 'Unauthorized chat ID' });
      }

      try {
        // Import menu handler functions
        const menuHandler = await import('../scripts/telegram-menu-handler.js');

        // Handle menu actions
        if (data.startsWith('action_')) {
          const action = data.replace('action_', '');
          
          await callTelegramApi('answerCallbackQuery', {
            callback_query_id: callback_query.id,
            text: 'İşlem yapılıyor...',
          });

          switch (action) {
            case 'scrape':
              await menuHandler.handleScrapeAction();
              break;
            case 'linkedin':
              await menuHandler.handleLinkedInCommand();
              break;
            case 'create_digest':
              await menuHandler.handleCreateDigestAction();
              break;
            case 'clean_pending':
              await menuHandler.handleCleanPendingAction();
              break;
            case 'confirm_clean':
              await menuHandler.handleConfirmCleanAction();
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
            case 'add_article':
              await menuHandler.handleAddArticleAction(fromId);
              break;
            case 'system_management':
              await menuHandler.handleSystemManagementMenu();
              break;
            case 'n8n_status':
              await menuHandler.handleN8nStatusAction();
              break;
            case 'webhook_reset':
              await menuHandler.handleWebhookResetAction();
              break;
            case 'n8n_trial_reset':
              await menuHandler.handleN8nTrialResetAction();
              break;
            case 'chat_backend':
              await menuHandler.handleChatBackendMenu();
              break;
            case 'n8n_notifications':
              await menuHandler.handleN8nNotificationsMenu();
              break;
            case 'delete_article':
              await menuHandler.handleDeleteArticleAction(fromId);
              break;
            case 'fix_sources':
              await menuHandler.sendTelegramMessage(
                '🔧 <b>Source Düzeltme</b>\n\n' +
                'Lokal ortamda çalıştırmak için:\n' +
                '<code>npm run fix:original-sources</code>\n\n' +
                'GitHub Actions ile çalıştırma yakında eklenecek.'
              );
              break;
            case 'linkedin_groups':
              await menuHandler.handleLinkedInGroupsDigest();
              break;
            default:
              await menuHandler.sendTelegramMessage('❓ Bilinmeyen aksiyon');
          }

          return res.status(200).json({ success: true, message: 'Menu action processed' });
        }

        // Handle chat backend toggle callbacks
        if (data.startsWith('chat_backend_')) {
          const backend = data.replace('chat_backend_', '');
          
          await callTelegramApi('answerCallbackQuery', {
            callback_query_id: callback_query.id,
            text: 'Backend değiştiriliyor...',
          });

          const menuHandler = await import('../scripts/telegram-menu-handler.js');
          await menuHandler.handleChatBackendToggle(backend);
          
          return res.status(200).json({ success: true, message: 'Chat backend toggle processed' });
        }

        // Handle n8n trial notifications toggle callbacks
        if (data.startsWith('n8n_notifications_')) {
          const mode = data.replace('n8n_notifications_', '');
          if (mode !== 'on' && mode !== 'off') {
            await callTelegramApi('answerCallbackQuery', {
              callback_query_id: callback_query.id,
              text: 'Geçersiz bildirim ayarı',
              show_alert: false,
            });
            return res.status(200).json({ success: false, message: 'Invalid n8n notifications mode' });
          }

          const enabled = mode === 'on';
          
          await callTelegramApi('answerCallbackQuery', {
            callback_query_id: callback_query.id,
            text: 'Bildirim ayarı güncelleniyor...',
          });

          const menuHandler = await import('../scripts/telegram-menu-handler.js');
          await menuHandler.handleN8nNotificationsToggle(enabled);
          
          return res.status(200).json({ success: true, message: 'n8n notifications toggle processed' });
        }

        // Handle GitHub workflow toggle callbacks (github_enable_workflowname or github_disable_workflowname)
        if (data.startsWith('github_')) {
          const parts = data.split('_');
          if (parts.length === 3) {
            const [_, action, workflowName] = parts;
            
            await callTelegramApi('answerCallbackQuery', {
              callback_query_id: callback_query.id,
              text: 'İşlem yapılıyor...',
            });

            const menuHandler = await import('../scripts/telegram-menu-handler.js');
            await menuHandler.handleGitHubWorkflowToggle(action, workflowName);
            
            return res.status(200).json({ success: true, message: 'GitHub workflow toggle processed' });
          }
        }

        // Handle article deletion confirmation
        if (data.startsWith('delete_confirm_')) {
          const articleId = data.replace('delete_confirm_', '');

          await callTelegramApi('answerCallbackQuery', {
            callback_query_id: callback_query.id,
            text: 'Siliniyor...',
          });

          await menuHandler.handleDeleteArticleConfirm(articleId);
          return res.status(200).json({ success: true, message: 'Article deleted' });
        }

        // Handle source confirmation callbacks
        if (data.startsWith('source_')) {
          const [_, confirmation] = data.split('_');
          
          await callTelegramApi('answerCallbackQuery', {
            callback_query_id: callback_query.id,
            text: 'İşleniyor...',
          });
          
          if (confirmation === 'yes' || confirmation === 'no') {
            await menuHandler.handleSourceConfirmation(confirmation === 'yes', fromId);
          }
          
          return res.status(200).json({ success: true, message: 'Source confirmation processed' });
        }

        // Handle LinkedIn Digest actions - Forward to n8n workflow
        if (data.match(/^(approve|reject|edit|view)_[0-9a-f-]+$/i)) {
          const [action, digestId] = data.split('_');
          
          // Security: Validate UUID format
          if (!isValidUUID(digestId)) {
            console.warn(`Invalid UUID format in callback: ${digestId}`);
            await sendTelegramMessage('❌ Geçersiz istek formatı.');
            return res.status(400).json({ success: false, message: 'Invalid UUID format' });
          }
          
          // CRITICAL: Answer callback query IMMEDIATELY to prevent Telegram retries
          const callbackQueryId = callback_query.id;
          
          // Check if this callback was already processed (deduplication)
          if (processedCallbacks.has(callbackQueryId)) {
            console.log(`⚠️ Callback already processed: ${callbackQueryId}`);
            return res.status(200).json({ 
              success: true, 
              message: 'Already processed (deduplicated)' 
            });
          }
          
          // Mark as processed (expires in 5 minutes)
          processedCallbacks.set(callbackQueryId, Date.now());
          setTimeout(() => processedCallbacks.delete(callbackQueryId), 300000);
          
          // Answer callback query IMMEDIATELY (before any DB checks)
          try {
            await callTelegramApi('answerCallbackQuery', {
              callback_query_id: callbackQueryId,
              text: '⏳ İşleniyor...',
              show_alert: false,
            });
            console.log(`✅ Callback acknowledged: ${callbackQueryId}`);
          } catch (ackError) {
            console.error('⚠️ Failed to acknowledge callback:', ackError.message);
          }
          
          // Security: Rate limiting check
          if (!checkRateLimit(fromId, 10, 60000)) {
            console.warn(`Rate limit exceeded for user: ${fromId}`);
            await sendTelegramMessage('⏱️ Çok fazla istek gönderdiniz. Lütfen 1 dakika bekleyin.');
            return res.status(200).json({ success: true, message: 'Rate limited but callback acknowledged' });
          }

          try {

            // Check digest status BEFORE forwarding to n8n
            const { data: digest, error: digestError } = await supabase
              .from('linkedin_digest_posts')
              .select('*')
              .eq('id', digestId)
              .single();

            if (digestError) {
              throw new Error(`Digest bulunamadı: ${digestError.message}`);
            }

            if (!digest) {
              throw new Error('Digest bulunamadı');
            }

            // STATUS VALIDATION: Only allow approve/reject on pending digests
            if (action === 'approve' || action === 'reject') {
              if (digest.status !== 'pending') {
                let errorMsg = '';
                if (digest.status === 'posted') {
                  errorMsg = `❌ Bu digest zaten paylaşılmış!\n\n📅 Tarih: ${digest.digest_date}\n📊 Paylaşım: ${new Date(digest.posted_at).toLocaleString('tr-TR')}\n\n⚠️ Zaten paylaşılan bir digest üzerinde işlem yapamazsınız.`;
                } else if (digest.status === 'rejected') {
                  errorMsg = `❌ Bu digest zaten reddedilmiş!\n\n📅 Tarih: ${digest.digest_date}\n\n⚠️ Reddedilen bir digest'i onaylayamazsınız.\n\n💡 Yeni bir digest oluşturmak için /linkedin komutunu kullanın.`;
                } else {
                  errorMsg = `❌ Bu digest üzerinde işlem yapılamıyor!\n\n📊 Mevcut durum: ${digest.status}\n\n⚠️ Sadece "pending" durumundaki digest'ler onaylanabilir veya reddedilebilir.`;
                }

                await sendTelegramMessage(errorMsg);
                console.warn(`⚠️ Status validation failed: ${action} on ${digest.status} digest`);
                
                // CRITICAL: Return 200 OK to prevent Telegram retry loop!
                return res.status(200).json({ 
                  success: false, 
                  message: `Cannot ${action} a ${digest.status} digest (validation failed but callback acknowledged)` 
                });
              }
            }

            // Forward to n8n callback workflow
            // Use unified workflow webhook (handles all callback actions)
            const N8N_WEBHOOK_URL = process.env.N8N_LINKEDIN_WORKFLOW_WEBHOOK;
            
            if (!N8N_WEBHOOK_URL) {
              throw new Error('N8N_LINKEDIN_WORKFLOW_WEBHOOK environment variable not configured. Please add it to Vercel.');
            }

            console.log(`📤 Forwarding LinkedIn digest callback to n8n: ${action}_${digestId} (status: ${digest.status})`);
            
            const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                callback_query: callback_query,
                action: action,
                digest_id: digestId,
                chat_id: chatId,
                message_id: messageId,
                from_id: fromId,
                digest_status: digest.status // Pass status to n8n for double-check
              })
            });

            if (!n8nResponse.ok) {
              const errorText = await n8nResponse.text();
              throw new Error(`n8n webhook error (${n8nResponse.status}): ${errorText}`);
            }

            console.log('✅ Successfully forwarded to n8n workflow');
            
            return res.status(200).json({ 
              success: true, 
              message: 'Request forwarded to n8n workflow for processing' 
            });

          } catch (error) {
            console.error('❌ Error forwarding to n8n:', error);
            await sendTelegramMessage(
              `❌ İşlem sırasında hata oluştu:\n\n<code>${error.message}</code>\n\nLütfen tekrar deneyin veya /help ile destek alın.`
            );
            // CRITICAL: Return 200 OK even on error to prevent Telegram retry loop!
            return res.status(200).json({ 
              success: false, 
              message: `Error: ${error.message} (callback acknowledged)` 
            });
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
            
            // Trigger N8N workflow for each approved post in parallel
            await Promise.all(postEntries.map(async (post) => {
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
            }));
            
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

        await callTelegramApi('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text: `${callback_query.message.text}\n\n--- \n<i>${responseText}</i>`,
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [] },
        });

        await callTelegramApi('answerCallbackQuery', {
          callback_query_id: callback_query.id,
          text: responseText,
          show_alert: false,
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
