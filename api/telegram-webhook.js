/**
 * Telegram Webhook Handler
 * Handles Telegram bot callbacks for LinkedIn automation approval workflow
 */

import { handleTelegramWebhook } from '../scripts/telegram-bot.js';

export default async function handler(req, res) {
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
    // Verify the request is from Telegram (optional but recommended)
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const secretPath = `/webhook/${telegramToken}`;
    
    if (req.url !== secretPath) {
      console.log('❌ Invalid webhook path');
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden' 
      });
    }

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

    // Handle the webhook
    await handleTelegramWebhook(update);

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
//         -d '{"url": "https://yoursite.com/api/telegram-webhook/webhook/<YOUR_BOT_TOKEN>"}'
//
// 2. Verify webhook is set:
//    curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
//
// 3. To remove webhook (for testing):
//    curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook"
