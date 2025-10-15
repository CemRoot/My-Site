#!/usr/bin/env node
/**
 * Test Telegram Webhook
 * Simulates a button press to test webhook functionality
 */

import 'dotenv/config';

const CONFIG = {
  WEBHOOK_URL: process.env.WEBHOOK_URL || 'https://cemkoyluoglu.codes/api/telegram-webhook',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '1925139795',
};

async function testWebhook() {
  console.log('🧪 Testing Telegram webhook...');
  console.log(`🌐 Webhook URL: ${CONFIG.WEBHOOK_URL}`);

  // Simulate a callback query (button press)
  const testUpdate = {
    update_id: 123456789,
    callback_query: {
      id: "test_callback_123",
      from: {
        id: parseInt(CONFIG.TELEGRAM_CHAT_ID),
        is_bot: false,
        first_name: "Test",
        username: "testuser"
      },
      message: {
        message_id: 999,
        date: Math.floor(Date.now() / 1000),
        chat: {
          id: parseInt(CONFIG.TELEGRAM_CHAT_ID),
          type: "private"
        },
        text: "Test message for webhook"
      },
      data: "approve_all"
    }
  };

  try {
    console.log('📤 Sending test callback query...');
    
    const response = await fetch(CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TelegramBot (like TwitterBot)'
      },
      body: JSON.stringify(testUpdate)
    });

    const responseText = await response.text();
    
    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📄 Response Headers:`, Object.fromEntries(response.headers.entries()));
    console.log(`📝 Response Body:`, responseText);

    if (response.ok) {
      console.log('✅ Webhook test successful!');
    } else {
      console.log('❌ Webhook test failed!');
      
      if (response.status === 403) {
        console.log('🔑 Likely cause: Missing environment variables in Vercel');
        console.log('   Add these to Vercel Dashboard → Settings → Environment Variables:');
        console.log('   - TELEGRAM_BOT_TOKEN');
        console.log('   - TELEGRAM_CHAT_ID');
        console.log('   - NEXT_PUBLIC_SUPABASE_URL');
        console.log('   - SUPABASE_SERVICE_ROLE_KEY');
      }
    }

  } catch (error) {
    console.error('❌ Webhook test error:', error.message);
  }
}

// Test basic connectivity
async function testConnectivity() {
  console.log('🔌 Testing basic connectivity...');
  
  try {
    const response = await fetch(CONFIG.WEBHOOK_URL, {
      method: 'GET'
    });
    
    const responseText = await response.text();
    console.log(`📊 GET Response: ${response.status} - ${responseText}`);
    
    if (response.status === 405) {
      console.log('✅ Webhook endpoint is reachable (Method Not Allowed is expected for GET)');
    }
    
  } catch (error) {
    console.error('❌ Connectivity test failed:', error.message);
  }
}

// Command line argument handling
const command = process.argv[2];

switch (command) {
  case 'webhook':
  case 'callback':
    testWebhook();
    break;
  case 'connectivity':
  case 'ping':
    testConnectivity();
    break;
  default:
    console.log('Usage: node scripts/test-webhook.js [webhook|connectivity]');
    console.log('');
    console.log('Commands:');
    console.log('  webhook, callback - Test webhook with simulated button press');
    console.log('  connectivity, ping - Test basic endpoint connectivity');
    process.exit(1);
}
