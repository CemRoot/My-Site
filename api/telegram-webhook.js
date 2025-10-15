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
        let updateData = {};
        let responseText = '';

        // Find the corresponding linkedin_posts entries by telegram_message_id
        const { data: postEntries, error: fetchError } = await supabase
          .from('linkedin_posts')
          .select('*')
          .eq('telegram_message_id', messageId);

        if (fetchError || !postEntries || postEntries.length === 0) {
          console.error('Error fetching post entries or posts not found:', fetchError?.message || 'Not found');
          try {
            await sendTelegramMessage('❌ Bu gönderiler bulunamadı veya bir hata oluştu.');
          } catch (telegramError) {
            console.error('Failed to send Telegram error message:', telegramError.message);
          }
          return res.status(200).json({ success: false, message: 'Posts not found' });
        }

        switch (data) {
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
