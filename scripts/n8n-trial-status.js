#!/usr/bin/env node
/**
 * n8n Trial Status Checker
 * 
 * Checks n8n trial period status from Supabase and sends notifications to Telegram
 * - Calculates remaining days
 * - Sends warnings when trial is ending
 * - Provides "Reset Trial" button when expired
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const CONFIG = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '',
};

// ANSI colors
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

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY);

/**
 * Get setting from Supabase
 */
async function getSetting(key) {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', key)
      .single();

    if (error) throw error;
    return data?.setting_value;
  } catch (error) {
    log(`❌ Error getting setting '${key}': ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Update setting in Supabase
 */
async function updateSetting(key, value, updatedBy = 'system') {
  try {
    const { error } = await supabase
      .from('system_settings')
      .update({ 
        setting_value: value,
        updated_by: updatedBy,
        updated_at: new Date().toISOString()
      })
      .eq('setting_key', key);

    if (error) throw error;
    log(`✅ Setting '${key}' updated to: ${value}`, 'green');
  } catch (error) {
    log(`❌ Error updating setting '${key}': ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Calculate remaining trial days
 */
async function calculateRemainingDays() {
  try {
    const startDate = await getSetting('n8n_trial_start_date');
    const durationDays = parseInt(await getSetting('n8n_trial_duration_days') || '14');

    if (!startDate) {
      throw new Error('n8n_trial_start_date not found in database');
    }

    const start = new Date(startDate);
    const today = new Date();
    const endDate = new Date(start);
    endDate.setDate(start.getDate() + durationDays);

    // Calculate days passed and remaining
    const timeDiff = endDate - today;
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    const daysPassed = Math.ceil((today - start) / (1000 * 60 * 60 * 24));

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      durationDays,
      daysPassed,
      daysRemaining,
      isExpired: daysRemaining <= 0,
      today: today.toISOString().split('T')[0]
    };
  } catch (error) {
    log(`❌ Error calculating remaining days: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Send Telegram message
 */
async function sendTelegramMessage(text, options = {}) {
  try {
    const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CONFIG.TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...options
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Telegram API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    log(`❌ Failed to send Telegram message: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Send trial status notification
 */
async function sendTrialNotification(status) {
  const { startDate, endDate, durationDays, daysPassed, daysRemaining, isExpired } = status;

  let message = '';
  let keyboard = null;

  if (isExpired) {
    // Trial expired - show reset button
    message = `
🚨 <b>n8n DENEME SÜRESİ BİTTİ!</b>

⏰ <b>Süre Bilgileri:</b>
Başlangıç: ${startDate}
Bitiş: ${endDate}
Süre: ${durationDays} gün

📊 <b>Durum:</b>
❌ Deneme süresi ${Math.abs(daysRemaining)} gün önce sona erdi

⚠️ <b>Yapılması Gerekenler:</b>
1. Yeni n8n hesabı oluştur
2. Workflow'u yeni hesaba aktar
3. Vercel'de webhook URL'ini güncelle
4. Aşağıdaki butona basarak deneme süresini sıfırla

<i>Not: Yeni hesap oluşturup sistemi güncelledikten sonra "14 Günü Yeniden Başlat" butonuna basın.</i>`;

    keyboard = {
      inline_keyboard: [
        [
          { text: '🔄 14 Günü Yeniden Başlat', callback_data: 'action_n8n_trial_reset' }
        ],
        [
          { text: '📊 Detaylı Durum', callback_data: 'action_n8n_status' }
        ]
      ]
    };
  } else if (daysRemaining <= 1) {
    // Critical: 1 day or less remaining
    message = `
⚠️ <b>n8n DENEME SÜRESİ YARIN BİTİYOR!</b>

⏰ <b>Süre Bilgileri:</b>
Başlangıç: ${startDate}
Bitiş: ${endDate}
Toplam süre: ${durationDays} gün

📊 <b>Durum:</b>
⏳ Kalan: <b>${daysRemaining} gün</b>
✅ Geçen: ${daysPassed} gün

🚨 <b>ACİL!</b> Yeni n8n hesabı için hazırlık yapın:
1. Yeni n8n hesabı oluşturun
2. Workflow'u export edin
3. Yeni hesaba import edin
4. Webhook URL'lerini güncelleyin

<i>Süre bitince bu mesajda "Yeniden Başlat" butonu görünecek.</i>`;
  } else if (daysRemaining <= 3) {
    // Warning: 3 days or less remaining
    message = `
⚠️ <b>n8n Deneme Süresi Uyarısı</b>

⏰ <b>Süre Bilgileri:</b>
Başlangıç: ${startDate}
Bitiş: ${endDate}
Toplam süre: ${durationDays} gün

📊 <b>Durum:</b>
⏳ Kalan: <b>${daysRemaining} gün</b>
✅ Geçen: ${daysPassed} gün

💡 <b>Hatırlatma:</b>
Deneme süreniz ${daysRemaining} gün içinde sona erecek. Yeni n8n hesabı için hazırlık yapmayı unutmayın.

<i>Günlük kontrol devam edecek.</i>`;
  } else {
    // Normal status: More than 3 days remaining
    message = `
✅ <b>n8n Deneme Süresi Durumu</b>

⏰ <b>Süre Bilgileri:</b>
Başlangıç: ${startDate}
Bitiş: ${endDate}
Toplam süre: ${durationDays} gün

📊 <b>Durum:</b>
⏳ Kalan: <b>${daysRemaining} gün</b>
✅ Geçen: ${daysPassed} gün
📈 İlerleme: ${Math.round((daysPassed / durationDays) * 100)}%

💚 <b>Her şey yolunda!</b> Sisteminiz normal çalışıyor.

<i>Günlük kontroller devam edecek.</i>`;
  }

  // Send message
  await sendTelegramMessage(message, keyboard ? { reply_markup: keyboard } : {});

  // Log to console
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('📊 n8n TRIAL STATUS', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log(`Start Date: ${startDate}`, 'blue');
  log(`End Date: ${endDate}`, 'blue');
  log(`Duration: ${durationDays} days`, 'blue');
  log(`Passed: ${daysPassed} days`, 'green');
  log(`Remaining: ${daysRemaining} days`, daysRemaining <= 0 ? 'red' : daysRemaining <= 3 ? 'yellow' : 'green');
  log(`Status: ${isExpired ? 'EXPIRED' : 'ACTIVE'}`, isExpired ? 'red' : 'green');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('✅ Telegram notification sent', 'green');
}

/**
 * Reset trial period (start new 14-day period from today)
 */
async function resetTrialPeriod(updatedBy = 'telegram-bot') {
  try {
    const today = new Date().toISOString().split('T')[0];
    await updateSetting('n8n_trial_start_date', today, updatedBy);
    
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green');
    log('🔄 TRIAL PERIOD RESET', 'green');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green');
    log(`New start date: ${today}`, 'cyan');
    log('Duration: 14 days', 'cyan');
    
    // Calculate new end date
    const newStatus = await calculateRemainingDays();
    log(`New end date: ${newStatus.endDate}`, 'cyan');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green');
    
    return newStatus;
  } catch (error) {
    log(`❌ Failed to reset trial period: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  // Check for required environment variables
  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_SERVICE_KEY) {
    log('❌ Supabase credentials not configured', 'red');
    process.exit(1);
  }

  if (!CONFIG.TELEGRAM_BOT_TOKEN || !CONFIG.TELEGRAM_CHAT_ID) {
    log('❌ Telegram credentials not configured', 'red');
    process.exit(1);
  }

  try {
    log('🔍 Checking n8n trial status...', 'cyan');
    
    // Get command line argument
    const command = process.argv[2];

    if (command === 'reset') {
      // Reset trial period
      log('🔄 Resetting trial period...', 'yellow');
      const newStatus = await resetTrialPeriod('manual');
      await sendTelegramMessage(
        `✅ <b>n8n Deneme Süresi Sıfırlandı!</b>\n\n` +
        `📅 Yeni başlangıç: ${newStatus.startDate}\n` +
        `📅 Bitiş tarihi: ${newStatus.endDate}\n` +
        `⏳ Toplam süre: ${newStatus.durationDays} gün\n\n` +
        `💚 Yeni 14 günlük deneme süresi başladı!`
      );
      log('✅ Trial period reset successfully!', 'green');
    } else if (command === 'status') {
      // Just show status, don't send notification
      const status = await calculateRemainingDays();
      log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
      log('📊 n8n TRIAL STATUS', 'cyan');
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
      log(`Start Date: ${status.startDate}`, 'blue');
      log(`End Date: ${status.endDate}`, 'blue');
      log(`Duration: ${status.durationDays} days`, 'blue');
      log(`Passed: ${status.daysPassed} days`, 'green');
      log(`Remaining: ${status.daysRemaining} days`, status.daysRemaining <= 0 ? 'red' : status.daysRemaining <= 3 ? 'yellow' : 'green');
      log(`Status: ${status.isExpired ? 'EXPIRED' : 'ACTIVE'}`, status.isExpired ? 'red' : 'green');
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
    } else {
      // Default: Check and send notification
      const status = await calculateRemainingDays();
      await sendTrialNotification(status);
    }

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    
    // Send error notification to Telegram
    try {
      await sendTelegramMessage(
        `🚨 <b>n8n Trial Status Error</b>\n\n` +
        `❌ Kontrol sırasında hata oluştu:\n` +
        `<code>${error.message}</code>\n\n` +
        `Lütfen logları kontrol edin.`
      );
    } catch (telegramError) {
      log(`❌ Failed to send error notification: ${telegramError.message}`, 'red');
    }
    
    process.exit(1);
  }
}

// Only run main when executed directly (not when imported)
if (process.argv[1]?.includes('n8n-trial-status.js')) {
  main();
}

// Export functions for use in other modules
export {
  calculateRemainingDays,
  sendTrialNotification,
  resetTrialPeriod,
  getSetting,
  updateSetting
};

