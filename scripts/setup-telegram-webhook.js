#!/usr/bin/env node
/**
 * Setup Telegram Webhook for LinkedIn Automation
 * This script registers the webhook URL with Telegram Bot API
 */

import 'dotenv/config';

const CONFIG = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  WEBHOOK_URL: process.env.WEBHOOK_URL || 'https://cemkoyluoglu.codes/api/telegram-webhook',
};

async function setupWebhook() {
  if (!CONFIG.TELEGRAM_BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN is required');
    process.exit(1);
  }

  console.log('🔧 Setting up Telegram webhook...');
  console.log(`📡 Bot Token: ${CONFIG.TELEGRAM_BOT_TOKEN.substring(0, 10)}...`);
  console.log(`🌐 Webhook URL: ${CONFIG.WEBHOOK_URL}`);

  try {
    // Set webhook
    const setWebhookUrl = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/setWebhook`;
    const setResponse = await fetch(setWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: CONFIG.WEBHOOK_URL,
        allowed_updates: ['callback_query', 'message']
      }),
    });

    const setResult = await setResponse.json();
    
    if (!setResult.ok) {
      throw new Error(`Failed to set webhook: ${setResult.description}`);
    }

    console.log('✅ Webhook set successfully!');

    // Verify webhook
    const getWebhookUrl = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/getWebhookInfo`;
    const getResponse = await fetch(getWebhookUrl);
    const getResult = await getResponse.json();

    if (getResult.ok) {
      console.log('\n📊 Webhook Info:');
      console.log(`   URL: ${getResult.result.url}`);
      console.log(`   Has Custom Certificate: ${getResult.result.has_custom_certificate}`);
      console.log(`   Pending Update Count: ${getResult.result.pending_update_count}`);
      console.log(`   Last Error Date: ${getResult.result.last_error_date || 'None'}`);
      console.log(`   Last Error Message: ${getResult.result.last_error_message || 'None'}`);
      console.log(`   Max Connections: ${getResult.result.max_connections || 'Default'}`);
      console.log(`   Allowed Updates: ${JSON.stringify(getResult.result.allowed_updates)}`);
    }

    console.log('\n🎉 Telegram webhook setup completed successfully!');
    console.log('🔔 Your bot will now receive button press notifications.');

  } catch (error) {
    console.error('❌ Failed to setup webhook:', error.message);
    process.exit(1);
  }
}

async function removeWebhook() {
  if (!CONFIG.TELEGRAM_BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN is required');
    process.exit(1);
  }

  console.log('🗑️  Removing Telegram webhook...');

  try {
    const deleteWebhookUrl = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/deleteWebhook`;
    const response = await fetch(deleteWebhookUrl, { method: 'POST' });
    const result = await response.json();

    if (!result.ok) {
      throw new Error(`Failed to delete webhook: ${result.description}`);
    }

    console.log('✅ Webhook removed successfully!');
    console.log('🔔 Bot will now use polling mode (if applicable).');

  } catch (error) {
    console.error('❌ Failed to remove webhook:', error.message);
    process.exit(1);
  }
}

// Command line argument handling
const command = process.argv[2];

switch (command) {
  case 'set':
  case 'setup':
    setupWebhook();
    break;
  case 'remove':
  case 'delete':
    removeWebhook();
    break;
  default:
    console.log('Usage: node scripts/setup-telegram-webhook.js [set|remove]');
    console.log('');
    console.log('Commands:');
    console.log('  set, setup  - Set up the webhook URL');
    console.log('  remove, delete - Remove the webhook URL');
    console.log('');
    console.log('Environment variables:');
    console.log('  TELEGRAM_BOT_TOKEN - Your Telegram bot token (required)');
    console.log('  WEBHOOK_URL - Your webhook URL (default: https://cemkoyluoglu.codes/api/telegram-webhook)');
    process.exit(1);
}
