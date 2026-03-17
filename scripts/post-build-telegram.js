/**
 * Post-Build Telegram Setup
 * 
 * Runs after Vercel build to setup Telegram bot
 * Only runs in production environment
 */

import { env } from './lib/config.js';
import { notifyTelegram, callTelegramApi } from './lib/telegram.js';

const CONFIG = {
  VERCEL_ENV: env.VERCEL_ENV,
  VERCEL_URL: env.VERCEL_URL,
  VERCEL_GIT_COMMIT_MESSAGE: process.env.VERCEL_GIT_COMMIT_MESSAGE || 'Manual deployment',
};

async function setupBotCommands() {
  if (!env.TELEGRAM_BOT_TOKEN) {
    console.log('⚠️  Telegram bot token not found, skipping setup');
    return;
  }

  try {
    const commands = [
      { command: 'start', description: 'Bot\'u başlat' },
      { command: 'menu', description: 'Ana menüyü göster' },
      { command: 'status', description: 'Hızlı durum raporu' },
      { command: 'scrape', description: 'Haberleri çek' },
      { command: 'health', description: 'Sağlık kontrolü' },
      { command: 'help', description: 'Yardım ve komutlar' },
    ];

    await callTelegramApi('setMyCommands', { commands });
    console.log('✅ Bot commands configured');
  } catch (error) {
    console.log('⚠️  Bot setup error:', error.message);
  }
}

async function postBuildSetup() {
  console.log('\n🤖 Post-Build Telegram Setup');
  console.log('='.repeat(60));
  console.log(`Environment: ${CONFIG.VERCEL_ENV}`);
  console.log(`URL: ${CONFIG.VERCEL_URL || 'localhost'}`);
  console.log('='.repeat(60));

  // Only run in production
  if (CONFIG.VERCEL_ENV !== 'production') {
    console.log('ℹ️  Skipping Telegram setup (not production environment)');
    console.log('='.repeat(60));
    return;
  }

  try {
    // Setup bot commands
    console.log('\n1️⃣ Setting up bot commands...');
    await setupBotCommands();

    // Send build notification (not deployment - that's handled by webhook)
    console.log('\n2️⃣ Sending build notification...');
    const buildMessage = `
⚙️ <b>BUILD TAMAMLANDI</b>

✅ Build süreci başarıyla tamamlandı
⏰ ${new Date().toLocaleString('tr-TR')}
🔗 ${CONFIG.VERCEL_URL ? `https://${CONFIG.VERCEL_URL}` : 'URL bilgisi yok'}
📦 ${CONFIG.VERCEL_GIT_COMMIT_MESSAGE}

<i>Bot menüsü güncellendi - /menu</i>
<i>⏳ Deployment durumu ayrıca bildirilecek...</i>`;

    await notifyTelegram(buildMessage);

    console.log('\n✅ Post-build setup completed successfully!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ Post-build setup error:', error.message);
    console.log('='.repeat(60));
    // Don't fail the build, just log the error
  }
}

// Run setup
postBuildSetup().catch(error => {
  console.error('Fatal error:', error);
  // Exit successfully even if setup fails (don't break build)
  process.exit(0);
});

