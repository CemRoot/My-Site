#!/usr/bin/env node
/**
 * Telegram Webhook Reset & Cleanup Tool
 * Clears pending updates and resets webhook configuration
 * Use this when switching n8n instances or when messages get stuck in queue
 */

import 'dotenv/config';

const CONFIG = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  WEBHOOK_URL: process.env.WEBHOOK_URL || 'https://cemkoyluoglu.codes/api/telegram-webhook',
};

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function getWebhookInfo() {
  const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/getWebhookInfo`;
  const response = await fetch(url);
  const result = await response.json();
  
  if (!result.ok) {
    throw new Error(`Failed to get webhook info: ${result.description}`);
  }
  
  return result.result;
}

async function deleteWebhook(dropPendingUpdates = false) {
  log('\n🗑️  Deleting existing webhook...', 'yellow');
  
  const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/deleteWebhook`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      drop_pending_updates: dropPendingUpdates
    })
  });
  
  const result = await response.json();
  
  if (!result.ok) {
    throw new Error(`Failed to delete webhook: ${result.description}`);
  }
  
  log(`✅ Webhook deleted successfully!`, 'green');
  if (dropPendingUpdates) {
    log(`✅ All pending updates cleared!`, 'green');
  }
  
  return result;
}

async function setWebhook(url, options = {}) {
  log(`\n🔧 Setting up new webhook...`, 'cyan');
  log(`📡 URL: ${url}`, 'blue');
  
  const setWebhookUrl = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/setWebhook`;
  const response = await fetch(setWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: url,
      allowed_updates: options.allowed_updates || ['callback_query', 'message'],
      max_connections: options.max_connections || 40,
      drop_pending_updates: options.drop_pending_updates || false
    })
  });
  
  const result = await response.json();
  
  if (!result.ok) {
    throw new Error(`Failed to set webhook: ${result.description}`);
  }
  
  log(`✅ Webhook set successfully!`, 'green');
  return result;
}

async function getUpdates(offset = 0, limit = 100) {
  log(`\n📥 Checking for pending updates...`, 'cyan');
  
  const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/getUpdates`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      offset: offset,
      limit: limit,
      timeout: 0
    })
  });
  
  const result = await response.json();
  
  if (!result.ok) {
    throw new Error(`Failed to get updates: ${result.description}`);
  }
  
  return result.result;
}

async function clearPendingUpdatesManually() {
  log(`\n🧹 Manually clearing pending updates...`, 'yellow');
  
  // First, delete webhook to switch to long polling mode
  await deleteWebhook(false);
  
  // Wait a bit for Telegram to process
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Get all pending updates
  let updates = await getUpdates();
  let totalCleared = 0;
  
  while (updates.length > 0) {
    log(`   Found ${updates.length} pending updates...`, 'yellow');
    
    // Get the highest update_id
    const highestUpdateId = Math.max(...updates.map(u => u.update_id));
    
    // Acknowledge all by requesting with offset = highestUpdateId + 1
    updates = await getUpdates(highestUpdateId + 1, 100);
    totalCleared += updates.length;
    
    if (updates.length === 0) break;
  }
  
  log(`✅ Cleared ${totalCleared} pending updates!`, 'green');
  
  // Wait a bit before setting webhook again
  await new Promise(resolve => setTimeout(resolve, 1000));
}

async function displayWebhookInfo(info) {
  log('\n📊 Current Webhook Status:', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  
  if (!info.url) {
    log('   Status: NO WEBHOOK SET (using polling mode)', 'yellow');
  } else {
    log(`   URL: ${info.url}`, 'blue');
    log(`   Pending Updates: ${info.pending_update_count || 0}`, 
        info.pending_update_count > 0 ? 'red' : 'green');
    
    if (info.last_error_date) {
      const errorDate = new Date(info.last_error_date * 1000);
      log(`   Last Error Date: ${errorDate.toLocaleString('tr-TR')}`, 'red');
      log(`   Last Error Message: ${info.last_error_message}`, 'red');
    } else {
      log(`   Last Error: None ✅`, 'green');
    }
    
    log(`   Max Connections: ${info.max_connections || 'Default (40)'}`, 'blue');
    log(`   Allowed Updates: ${JSON.stringify(info.allowed_updates || 'all')}`, 'blue');
    log(`   Has Custom Certificate: ${info.has_custom_certificate ? 'Yes' : 'No'}`, 'blue');
    
    if (info.ip_address) {
      log(`   IP Address: ${info.ip_address}`, 'blue');
    }
  }
  
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
}

async function fullReset() {
  if (!CONFIG.TELEGRAM_BOT_TOKEN) {
    log('❌ TELEGRAM_BOT_TOKEN is required!', 'red');
    log('   Please set it in your .env file', 'yellow');
    process.exit(1);
  }

  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'magenta');
  log('🚀 TELEGRAM WEBHOOK RESET & CLEANUP', 'magenta');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'magenta');

  try {
    // Step 1: Check current status
    log('\n📋 Step 1: Checking current webhook status...', 'cyan');
    const currentInfo = await getWebhookInfo();
    await displayWebhookInfo(currentInfo);

    // Step 2: Delete webhook with drop_pending_updates
    log('\n📋 Step 2: Deleting webhook and clearing queue...', 'cyan');
    await deleteWebhook(true); // This will drop ALL pending updates
    
    // Wait for Telegram to process
    log('   Waiting for Telegram to process...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Verify queue is clear
    log('\n📋 Step 3: Verifying queue is clear...', 'cyan');
    const afterDeleteInfo = await getWebhookInfo();
    await displayWebhookInfo(afterDeleteInfo);

    // Step 4: Set new webhook
    log('\n📋 Step 4: Setting up new webhook...', 'cyan');
    await setWebhook(CONFIG.WEBHOOK_URL, {
      allowed_updates: ['callback_query', 'message'],
      max_connections: 40,
      drop_pending_updates: true // Extra safety
    });

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 5: Final verification
    log('\n📋 Step 5: Final verification...', 'cyan');
    const finalInfo = await getWebhookInfo();
    await displayWebhookInfo(finalInfo);

    // Success!
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green');
    log('✅ WEBHOOK RESET COMPLETED SUCCESSFULLY!', 'green');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green');
    
    log('\n📝 Next Steps:', 'cyan');
    log('   1. Test your bot by sending a message', 'blue');
    log('   2. Make sure N8N_LINKEDIN_WORKFLOW_WEBHOOK is set in Vercel', 'blue');
    log('   3. Check that your n8n workflow is active', 'blue');
    
    log('\n💡 Tips:', 'cyan');
    log('   • Run this script whenever you switch n8n instances', 'yellow');
    log('   • Run this if messages get stuck in queue', 'yellow');
    log('   • Run this after major n8n workflow changes', 'yellow');

  } catch (error) {
    log(`\n❌ Reset failed: ${error.message}`, 'red');
    log('\n🔍 Troubleshooting:', 'yellow');
    log('   • Check TELEGRAM_BOT_TOKEN is correct', 'yellow');
    log('   • Check bot has admin rights', 'yellow');
    log('   • Check internet connection', 'yellow');
    process.exit(1);
  }
}

async function quickCheck() {
  if (!CONFIG.TELEGRAM_BOT_TOKEN) {
    log('❌ TELEGRAM_BOT_TOKEN is required!', 'red');
    process.exit(1);
  }

  try {
    log('🔍 Checking webhook status...', 'cyan');
    const info = await getWebhookInfo();
    await displayWebhookInfo(info);
    
    if (info.pending_update_count > 0) {
      log(`\n⚠️  WARNING: ${info.pending_update_count} pending updates in queue!`, 'red');
      log('   Run "npm run telegram:reset" to clear them', 'yellow');
    }
  } catch (error) {
    log(`\n❌ Check failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Command handling
const command = process.argv[2] || 'reset';

switch (command) {
  case 'reset':
  case 'full':
    fullReset();
    break;
  case 'check':
  case 'status':
    quickCheck();
    break;
  case 'help':
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
    log('📚 Telegram Webhook Reset Tool', 'cyan');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
    log('\nUsage:', 'yellow');
    log('  node scripts/reset-telegram-webhook.js [command]', 'blue');
    log('\nCommands:', 'yellow');
    log('  reset, full  - Full webhook reset and queue cleanup (default)', 'blue');
    log('  check, status - Check current webhook status only', 'blue');
    log('  help         - Show this help message', 'blue');
    log('\nEnvironment Variables:', 'yellow');
    log('  TELEGRAM_BOT_TOKEN - Your bot token (required)', 'blue');
    log('  WEBHOOK_URL - Your webhook URL (optional)', 'blue');
    log('\nExamples:', 'yellow');
    log('  npm run telegram:reset        # Full reset', 'green');
    log('  npm run telegram:check        # Check status', 'green');
    break;
  default:
    log(`❌ Unknown command: ${command}`, 'red');
    log('   Run with "help" for usage information', 'yellow');
    process.exit(1);
}

