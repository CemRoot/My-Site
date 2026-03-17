#!/usr/bin/env node
/**
 * Setup Telegram Webhook for LinkedIn Automation
 * This script registers the webhook URL with Telegram Bot API
 */

import { env } from './lib/config.js';
import { callTelegramApi } from './lib/telegram.js';

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://cemkoyluoglu.codes/api/telegram-webhook';

async function setupWebhook() {
  if (!env.TELEGRAM_BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN is required');
    process.exit(1);
  }

  console.log('🔧 Setting up Telegram webhook...');
  console.log(`📡 Bot Token: ${env.TELEGRAM_BOT_TOKEN.substring(0, 10)}...`);
  console.log(`🌐 Webhook URL: ${WEBHOOK_URL}`);

  try {
    await callTelegramApi('setWebhook', {
      url: WEBHOOK_URL,
      allowed_updates: ['callback_query', 'message'],
    });
    console.log('✅ Webhook set successfully!');

    const getResult = await callTelegramApi('getWebhookInfo');
    if (getResult.ok) {
      const info = getResult.result;
      console.log('\n📊 Webhook Info:');
      console.log(`   URL: ${info.url}`);
      console.log(`   Has Custom Certificate: ${info.has_custom_certificate}`);
      console.log(`   Pending Update Count: ${info.pending_update_count}`);
      console.log(`   Last Error Date: ${info.last_error_date || 'None'}`);
      console.log(`   Last Error Message: ${info.last_error_message || 'None'}`);
      console.log(`   Max Connections: ${info.max_connections || 'Default'}`);
      console.log(`   Allowed Updates: ${JSON.stringify(info.allowed_updates)}`);
    }

    console.log('\n🎉 Telegram webhook setup completed successfully!');
    console.log('🔔 Your bot will now receive button press notifications.');

  } catch (error) {
    console.error('❌ Failed to setup webhook:', error.message);
    process.exit(1);
  }
}

async function removeWebhook() {
  if (!env.TELEGRAM_BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN is required');
    process.exit(1);
  }

  console.log('🗑️  Removing Telegram webhook...');

  try {
    await callTelegramApi('deleteWebhook');
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
