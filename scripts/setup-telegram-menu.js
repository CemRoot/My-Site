/**
 * Setup Telegram Bot Menu
 *
 * Configures bot commands and sends welcome message via TelegramOpsBot.
 */

import 'dotenv/config';
import {
  setBotCommands,
  handleStartCommand,
} from './lib/telegram-ops/TelegramOpsBot.js';

async function setupTelegramMenu() {
  console.log('🤖 Setting up Telegram bot menu...\n');

  try {
    console.log('1️⃣ Setting bot commands...');
    await setBotCommands();
    console.log('✅ Bot commands configured\n');

    console.log('2️⃣ Sending welcome message...');
    await handleStartCommand();
    console.log('✅ Welcome message sent\n');

    console.log('='.repeat(60));
    console.log('🎉 Telegram bot menu setup complete!');
    console.log('='.repeat(60));
    console.log('\n📱 Available commands in Telegram:');
    console.log('   /start  - Bot\'u başlat ve menüyü göster');
    console.log('   /menu   - Ana menüyü göster');
    console.log('   /status - Hızlı durum raporu');
    console.log('   /scrape - Haberleri çek');
    console.log('   /health - Sistem sağlığı');
    console.log('   /help   - Yardım ve komutlar');
    console.log('\n💡 Telegram\'dan bot\'unuza /start yazarak başlayın!\n');
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupTelegramMenu();
