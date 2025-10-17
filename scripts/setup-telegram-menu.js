/**
 * Setup Telegram Bot Menu
 * 
 * Configures bot commands and sends welcome message
 */

import 'dotenv/config';
import menuHandler from './telegram-menu-handler.js';

async function setupTelegramMenu() {
  console.log('🤖 Setting up Telegram bot menu...\n');

  try {
    // Step 1: Set bot commands
    console.log('1️⃣ Setting bot commands...');
    await menuHandler.setBotCommands();
    console.log('✅ Bot commands configured\n');

    // Step 2: Send welcome message
    console.log('2️⃣ Sending welcome message...');
    await menuHandler.handleStartCommand();
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

// Run setup
setupTelegramMenu();

