/**
 * Telegram Bot Menu Handler
 * 
 * Provides interactive menu system for controlling the tech news system
 * Commands: /start, /menu, /status, /scrape, /health, /help
 */

import { spawn } from 'child_process';
import { supabase } from './lib/supabaseAdmin.js';
import { env } from './lib/config.js';
import { sendTelegramMessage, callTelegramApi } from './lib/telegram.js';
import {
  getMainMenuKeyboard,
  getSystemManagementKeyboard,
  getScraperMenuKeyboard,
  getSocialMenuKeyboard,
  getAnalyticsMenuKeyboard
} from './lib/menu/keyboards.js';

const CONFIG = {
  GROQ_API_KEY: env.GROQ_API_KEY,
  FIRECRAWL_API_KEY: env.FIRECRAWL_API_KEY,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  GITHUB_REPO: process.env.GITHUB_REPOSITORY || 'username/My-Site',
};

export { sendTelegramMessage };

/**
 * Handle /start command
 */
export async function handleStartCommand() {
  const welcomeText = `
🤖 <b>Welcome to Tech News Bot!</b>

Manage all your systems directly from Telegram!

<b>📋 Commands:</b>
/menu - Show main menu
/status - Quick status report
/scrape - Run news scraper
/health - System health check
/help - Help and information

<b>🎯 Features:</b>
✅ Automated news scraping
✅ LinkedIn digest management
✅ n8n trial tracking
✅ Webhook management
✅ System health monitoring
✅ GitHub Actions control

Select an option below to get started:`;

  await sendTelegramMessage(welcomeText, {
    reply_markup: getMainMenuKeyboard()
  });
}

/**
 * Handle /menu command
 */
export async function handleMenuCommand() {
  const menuText = `
📱 <b>MAIN MENU</b>

Select an action below:

<b>📡 Scraper & Content</b>
• Run Scraper, Add Article, Delete

<b>📱 Social Media</b>
• LinkedIn Digests & Groups

<b>📊 Analytics & Data</b>
• System Status, Statistics, DB Info

<b>⚙️ System Management</b>
• GitHub Actions, Health Check, n8n Settings

<i>Tap a button to proceed.</i>`;

  await sendTelegramMessage(menuText, {
    reply_markup: getMainMenuKeyboard()
  });
}

/**
 * Handle Scraper & Content Submenu
 */
export async function handleScraperMenu() {
  const text = `
📡 <b>SCRAPER & CONTENT</b>

Manage content gathering and articles:
• <b>Run Scraper:</b> Trigger GitHub Action to scrape new tech news
• <b>Manual Add:</b> Provide a URL to add a specific article
• <b>Delete:</b> Remove an existing article`;

  await sendTelegramMessage(text, {
    reply_markup: getScraperMenuKeyboard()
  });
}

/**
 * Handle Social Media Submenu
 */
export async function handleSocialMenu() {
  const text = `
📱 <b>SOCIAL MEDIA</b>

Manage automated social posts:
• <b>LinkedIn Digests:</b> View, approve, or reject daily digests
• <b>LinkedIn Groups:</b> Trigger group-specific automated digests`;

  await sendTelegramMessage(text, {
    reply_markup: getSocialMenuKeyboard()
  });
}

/**
 * Handle Analytics & Data Submenu
 */
export async function handleAnalyticsMenu() {
  const text = `
📊 <b>ANALYTICS & DATA</b>

View system data and metrics:
• <b>System Status:</b> Quick overview of total articles and recent updates
• <b>Statistics:</b> Article counts over time and top categories
• <b>Database:</b> Source URLs and general DB health`;

  await sendTelegramMessage(text, {
    reply_markup: getAnalyticsMenuKeyboard()
  });
}

/**
 * Handle action_scrape - Trigger news scraping
 */
export async function handleScrapeAction() {
  try {
    // Trigger GitHub Actions workflow
    if (CONFIG.GITHUB_TOKEN) {
      const [owner, repo] = CONFIG.GITHUB_REPO.split('/');
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/actions/workflows/scrape-tech-news.yml/dispatches`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CONFIG.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ref: 'main'
          })
        }
      );

      if (response.ok) {
        await sendTelegramMessage(
          '🔄 <b>Tech News Scraper Started</b>\n\n' +
          '📊 GitHub Actions workflow has been triggered.\n' +
          '⏳ You will receive a summary when the process completes.'
        );
      } else {
        throw new Error(`GitHub API error: ${response.status}`);
      }
    } else {
      // Fallback: Run locally
      await sendTelegramMessage(
        '⚠️ GitHub token not found, running locally...\n\n' +
        'This may take several minutes.'
      );
      
      // Run scraper locally
      const scraper = spawn('npm', ['run', 'scrape:news'], {
        cwd: process.cwd(),
        stdio: 'pipe'
      });

      scraper.on('close', async (code) => {
        if (code === 0) {
          await sendTelegramMessage('✅ Local scraping completed successfully!');
        } else {
          await sendTelegramMessage(`❌ Local scraping failed (Exit code: ${code})`);
        }
      });
    }
  } catch (error) {
    await sendTelegramMessage(`❌ <b>Error!</b>\n\n${error.message}`);
  }
}

/**
 * Handle action_health - Run health check
 */
export async function handleHealthAction() {
  try {
    await sendTelegramMessage('🔍 <b>Checking system health...</b>');

    // Check Supabase
    const { count: articleCount, error: countError } = await supabase
      .from('tech_news_articles')
      .select('*', { count: 'exact', head: true });
    
    const supabaseStatus = countError ? '❌ Error' : '✅ Connected';

    // Check recent articles
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { data: recentArticles, error: recentError } = await supabase
      .from('tech_news_articles')
      .select('id, title, created_at')
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false });
    
    const recentCount = recentArticles?.length || 0;

    // Check Firecrawl API
    let firecrawlStatus = '❓ Unknown';
    try {
      const fcResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: 'https://example.com', formats: ['markdown'] })
      });
      firecrawlStatus = (fcResponse.status === 401 || fcResponse.status === 403) ? '❌ API Key Invalid' : '✅ Active';
    } catch (e) {
      firecrawlStatus = '❌ Connection Error';
    }

    // Check Groq API
    let groqStatus = '❓ Unknown';
    try {
      const groqResponse = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}` }
      });
      groqStatus = groqResponse.ok ? '✅ Active' : '❌ Error';
    } catch (e) {
      groqStatus = '❌ Connection Error';
    }

    const healthReport = `
🏥 <b>SYSTEM HEALTH REPORT</b>
⏰ ${new Date().toLocaleString('en-US', { timeZone: 'UTC' })} UTC

<b>📊 Database (Supabase)</b>
${supabaseStatus}
📰 Total Articles: ${articleCount || 0}
🆕 Last 24h: ${recentCount} new
${recentArticles?.[0] ? `⏰ Latest: ${new Date(recentArticles[0].created_at).toLocaleString('en-US', { timeZone: 'UTC' })}` : ''}

<b>🌐 API Services</b>
Firecrawl API: ${firecrawlStatus}
Groq AI API: ${groqStatus}
Telegram Bot: ✅ Active

<b>🔄 Overall Status</b>
${supabaseStatus === '✅ Connected' && firecrawlStatus.includes('✅') && groqStatus.includes('✅')
  ? '✨ <b>All systems operational</b>'
  : '⚠️ <b>Issues detected</b>'}`;

    await sendTelegramMessage(healthReport, {
      reply_markup: getSystemManagementKeyboard()
    });
  } catch (error) {
    await sendTelegramMessage(`❌ <b>Health check failed!</b>\n\n${error.message}`);
  }
}

/**
 * Handle action_status - Quick status
 */
export async function handleStatusAction() {
  try {
    const { count } = await supabase
      .from('tech_news_articles')
      .select('*', { count: 'exact', head: true });

    const { data: recent } = await supabase
      .from('tech_news_articles')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1);

    const statusText = `
📊 <b>QUICK STATUS</b>
⏰ ${new Date().toLocaleString('en-US', { timeZone: 'UTC' })} UTC

📰 Total Articles: ${count || 0}
⏰ Last Update: ${recent?.[0] ? new Date(recent[0].created_at).toLocaleString('en-US', { timeZone: 'UTC' }) : 'Unknown'}
🔄 Bot Status: ✅ Active

<i>For detailed info, check Health Check in System Management</i>`;

    await sendTelegramMessage(statusText, {
      reply_markup: getAnalyticsMenuKeyboard()
    });
  } catch (error) {
    await sendTelegramMessage(`❌ Failed to retrieve status: ${error.message}`);
  }
}

/**
 * Handle action_stats - Statistics
 */
export async function handleStatsAction() {
  try {
    // Get article stats
    const { count: totalCount } = await supabase
      .from('tech_news_articles')
      .select('*', { count: 'exact', head: true });

    // Last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { count: weekCount } = await supabase
      .from('tech_news_articles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    // Last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { count: dayCount } = await supabase
      .from('tech_news_articles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString());

    // Category breakdown
    const { data: categories } = await supabase
      .from('tech_news_articles')
      .select('category')
      .not('category', 'is', null);

    const categoryStats = {};
    categories?.forEach(item => {
      categoryStats[item.category] = (categoryStats[item.category] || 0) + 1;
    });

    const topCategories = Object.entries(categoryStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, count]) => `  ${cat}: ${count}`)
      .join('\n');

    const statsText = `
📈 <b>STATISTICS</b>
⏰ ${new Date().toLocaleString('en-US', { timeZone: 'UTC' })} UTC

<b>📰 Article Counts</b>
Total: ${totalCount || 0}
Last 7 Days: ${weekCount || 0}
Last 24 Hours: ${dayCount || 0}

<b>🏆 Top Categories</b>
${topCategories || 'No data'}

<b>📊 Averages</b>
Daily: ~${Math.round((weekCount || 0) / 7)} articles
Weekly: ~${weekCount || 0} articles`;

    await sendTelegramMessage(statsText, {
      reply_markup: getAnalyticsMenuKeyboard()
    });
  } catch (error) {
    await sendTelegramMessage(`❌ Failed to retrieve stats: ${error.message}`);
  }
}

/**
 * Handle action_database - Database info
 */
export async function handleDatabaseAction() {
  try {
    const { count: total } = await supabase
      .from('tech_news_articles')
      .select('*', { count: 'exact', head: true });

    const { count: withSource } = await supabase
      .from('tech_news_articles')
      .select('*', { count: 'exact', head: true })
      .not('original_source', 'is', null);

    const { count: nullSource } = await supabase
      .from('tech_news_articles')
      .select('*', { count: 'exact', head: true })
      .is('original_source', null);

    const sourcePercentage = total > 0 ? Math.round((withSource / total) * 100) : 0;

    const dbText = `
💾 <b>DATABASE INFO</b>

<b>📊 Overview</b>
Total Records: ${total}
Has Original Source: ${withSource} (${sourcePercentage}%)
Missing Source: ${nullSource}

<b>🔧 Maintenance</b>
${nullSource > 0 ? `⚠️ ${nullSource} records missing source.\n\nRun locally:\nnpm run fix:original-sources` : '✅ All records healthy'}

<b>🔗 Connection</b>
Supabase: ✅ Connected
URL: ${env.SUPABASE_URL.substring(0, 30)}...`;

    await sendTelegramMessage(dbText, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔧 Fix Sources', callback_data: 'action_fix_sources' },
          ],
          [
            { text: '🔙 Analytics Menu', callback_data: 'action_analytics_menu' },
          ],
        ]
      }
    });
  } catch (error) {
    await sendTelegramMessage(`❌ Failed to retrieve DB info: ${error.message}`);
  }
}

/**
 * Handle action_system_management - Show System Management submenu
 */
export async function handleSystemManagementMenu() {
  const systemText = `
⚙️ <b>SYSTEM MANAGEMENT</b>

Manage and monitor internal systems:

<b>🤖 n8n Status</b>
• Track trial period and reset limits

<b>🔄 Webhook Reset</b>
• Clear stuck messages and reset Telegram hook

<b>🏥 Health Check</b>
• Full diagnostic of APIs and Database

<b>🔧 GitHub Actions</b>
• Enable/disable workflows and check status

<i>Select an option below:</i>`;

  await sendTelegramMessage(systemText, {
    reply_markup: getSystemManagementKeyboard()
  });
}

/**
 * Handle action_n8n_status - Show n8n trial status
 */
export async function handleN8nStatusAction() {
  try {
    await sendTelegramMessage('🔍 <b>n8n Durumu Kontrol Ediliyor...</b>\n\nLütfen bekleyin...');

    console.log('Importing n8n-trial-status module...');
    
    // Import n8n trial status functions
    const { calculateRemainingDays } = await import('./n8n-trial-status.js');
    
    console.log('Calculating remaining days...');
    const status = await calculateRemainingDays();
    console.log('Status calculated:', status);
    const { startDate, endDate, durationDays, daysPassed, daysRemaining, isExpired } = status;

    // Progress bar (safe for expired trials)
    const progress = Math.min(100, Math.max(0, Math.round((daysPassed / durationDays) * 100)));
    const filledBars = Math.min(10, Math.max(0, Math.floor(progress / 10)));
    const emptyBars = Math.max(0, 10 - filledBars);
    const progressBar = '▓'.repeat(filledBars) + '░'.repeat(emptyBars);

    let statusText = `
🤖 <b>n8n TRIAL STATUS</b>

<b>📅 Dates:</b>
Start: ${startDate}
End: ${endDate}
Total: ${durationDays} days

<b>📊 Progress:</b>
${progressBar} ${progress}%
✅ Elapsed: ${daysPassed} days
⏳ Remaining: ${daysRemaining} days

<b>🔔 Status:</b>`;

    if (isExpired) {
      statusText += `
❌ Trial expired ${Math.abs(daysRemaining)} days ago!

<b>⚠️ Required Actions:</b>
1. Create a new n8n account
2. Export/Import workflow to new account
3. Update Vercel webhook URL
4. Click "Reset 30 Days" button

<i>Note: Reset trial only after setting up the new account.</i>`;
      
      // Add reset button
      const keyboard = {
        inline_keyboard: [
          [
            { text: '🔄 Reset 30 Days', callback_data: 'action_n8n_trial_reset' }
          ],
          [
            { text: '🔙 System Management', callback_data: 'action_system_management' }
          ]
        ]
      };
      
      await sendTelegramMessage(statusText, { reply_markup: keyboard });
    } else if (daysRemaining <= 1) {
      statusText += `
⚠️ <b>CRITICAL!</b> Trial ends tomorrow!

Prepare new n8n account:
• Export workflow
• Create new account
• Update webhook URLs`;
      
      await sendTelegramMessage(statusText, {
        reply_markup: getSystemManagementKeyboard()
      });
    } else if (daysRemaining <= 3) {
      statusText += `
⚠️ <b>WARNING!</b> ${daysRemaining} days left.

Don't forget to prepare a new n8n account!`;
      
      await sendTelegramMessage(statusText, {
        reply_markup: getSystemManagementKeyboard()
      });
    } else {
      statusText += `
✅ <b>All good!</b> ${daysRemaining} days remaining.

System is operating normally.`;
      
      await sendTelegramMessage(statusText, {
        reply_markup: getSystemManagementKeyboard()
      });
    }

  } catch (error) {
    console.error('❌ n8n status error:', error);
    
    await sendTelegramMessage(
      `❌ <b>Failed to get n8n Status!</b>\n\n` +
      `<b>Error:</b> <code>${error.message}</code>\n\n` +
      `💡 Please check Supabase system_settings table.`,
      { reply_markup: getSystemManagementKeyboard() }
    );
  }
}

/**
 * Handle action_webhook_reset - Trigger GitHub Action to reset webhook
 */
export async function handleWebhookResetAction() {
  try {
    await sendTelegramMessage(
      '🔄 <b>Initiating Telegram Webhook Reset...</b>\n\n' +
      'Triggering GitHub Actions workflow...\n' +
      'This may take 1-2 minutes.'
    );

    // Trigger GitHub Actions workflow
    if (CONFIG.GITHUB_TOKEN) {
      const [owner, repo] = CONFIG.GITHUB_REPO.split('/');
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/actions/workflows/telegram-webhook-reset.yml/dispatches`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CONFIG.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ref: 'main'
          })
        }
      );

      if (response.ok) {
        await sendTelegramMessage(
          '✅ <b>Webhook Reset Started!</b>\n\n' +
          '📊 GitHub Actions workflow triggered\n' +
          '⏳ Steps:\n' +
          '  1️⃣ Removing old webhook...\n' +
          '  2️⃣ Clearing pending updates...\n' +
          '  3️⃣ Setting new webhook...\n' +
          '  4️⃣ Verifying status...\n\n' +
          '🔔 You will be notified upon completion.',
          { reply_markup: getSystemManagementKeyboard() }
        );
      } else {
        throw new Error(`GitHub API error: ${response.status}`);
      }
    } else {
      throw new Error('GITHUB_TOKEN not configured');
    }
  } catch (error) {
    await sendTelegramMessage(
      `❌ <b>Failed to Start Webhook Reset!</b>\n\n` +
      `<code>${error.message}</code>\n\n` +
      `💡 Alternative:\n` +
      `Run locally:\n` +
      `<code>npm run telegram:reset</code>`,
      { reply_markup: getSystemManagementKeyboard() }
    );
  }
}

/**
 * Handle action_n8n_trial_reset - Reset n8n trial period (start new 30 days)
 */
export async function handleN8nTrialResetAction() {
  try {
    await sendTelegramMessage(
      '🔄 <b>Resetting n8n Trial...</b>\n\n' +
      'Starting a new 30-day period...'
    );

    // Import reset function
    const { resetTrialPeriod, calculateRemainingDays } = await import('./n8n-trial-status.js');
    
    // Reset trial
    const newStatus = await resetTrialPeriod('telegram-user');
    
    const { startDate, endDate, durationDays } = newStatus;

    await sendTelegramMessage(
      '✅ <b>n8n Trial Reset Successful!</b>\n\n' +
      `📅 <b>New Period:</b>\n` +
      `Start: ${startDate}\n` +
      `End: ${endDate}\n` +
      `Total: ${durationDays} days\n\n` +
      `💚 New 30-day trial tracking has begun.\n\n` +
      `<i>Note: Only do this after setting up a new n8n account.</i>`,
      { reply_markup: getSystemManagementKeyboard() }
    );

  } catch (error) {
    await sendTelegramMessage(
      `❌ <b>Trial Reset Failed!</b>\n\n` +
      `<code>${error.message}</code>\n\n` +
      `Please check Supabase connection.`,
      { reply_markup: getSystemManagementKeyboard() }
    );
  }
}

/**
 * Get current chat backend setting from Supabase
 */
async function getChatBackendSetting() {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'chat_backend')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data?.setting_value || 'vercel'; // Default to vercel
  } catch (error) {
    console.error('Error getting chat backend setting:', error);
    return 'vercel'; // Default fallback
  }
}

/**
 * Set chat backend setting in Supabase
 */
async function setChatBackendSetting(backend, updatedBy = 'telegram') {
  try {
    // Try upsert (insert or update)
    const { data, error } = await supabase
      .from('system_settings')
      .upsert({
        setting_key: 'chat_backend',
        setting_value: backend,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy
      }, {
        onConflict: 'setting_key'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error setting chat backend:', error);
    throw error;
  }
}

/**
 * Get n8n trial notification setting from Supabase
 */
async function getN8nTrialNotificationsSetting() {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'n8n_trial_notifications_enabled')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data?.setting_value) return true; // Default: enabled
    return String(data.setting_value).toLowerCase() !== 'false';
  } catch (error) {
    console.error('Error getting n8n trial notification setting:', error);
    return true; // Default fallback
  }
}

/**
 * Set n8n trial notification setting in Supabase
 */
async function setN8nTrialNotificationsSetting(enabled, updatedBy = 'telegram') {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .upsert({
        setting_key: 'n8n_trial_notifications_enabled',
        setting_value: enabled ? 'true' : 'false',
        updated_at: new Date().toISOString(),
        updated_by: updatedBy
      }, {
        onConflict: 'setting_key'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error setting n8n trial notification setting:', error);
    throw error;
  }
}

/**
 * Handle action_n8n_notifications - Show n8n notification toggle menu
 */
export async function handleN8nNotificationsMenu() {
  try {
    await sendTelegramMessage('🔍 <b>Checking n8n Notification Settings...</b>');

    const enabled = await getN8nTrialNotificationsSetting();

    const statusText = `
🔔 <b>n8n NOTIFICATION SETTINGS</b>

<b>📊 Daily Trial Notifications:</b>
${enabled ? '✅ Enabled' : '🔕 Disabled'}

<b>📝 Description:</b>
• Enabled: Daily automated Telegram messages are sent
• Disabled: Daily automated messages are silenced
• Manual "🤖 n8n Status" checks will always work

<i>Select to change status:</i>`;

    await sendTelegramMessage(statusText, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: enabled ? '🟢 Enabled (Active)' : '⚪ Enable',
              callback_data: 'n8n_notifications_on'
            },
            {
              text: enabled ? '⚪ Disable' : '🔕 Disabled (Active)',
              callback_data: 'n8n_notifications_off'
            }
          ],
          [
            { text: '🔄 Refresh', callback_data: 'action_n8n_notifications' }
          ],
          [
            { text: '🔙 System Management', callback_data: 'action_system_management' }
          ]
        ]
      }
    });

  } catch (error) {
    console.error('n8n notifications menu error:', error);
    await sendTelegramMessage(
      `❌ <b>Failed to load notification menu!</b>\n\n` +
      `<code>${error.message}</code>\n\n` +
      `Check Supabase system_settings table.`,
      { reply_markup: getSystemManagementKeyboard() }
    );
  }
}

/**
 * Handle n8n notification toggle
 */
export async function handleN8nNotificationsToggle(enabled) {
  try {
    const currentEnabled = await getN8nTrialNotificationsSetting();

    if (currentEnabled === enabled) {
      await sendTelegramMessage(
        `ℹ️ <b>n8n Trial Bildirimleri zaten ${enabled ? 'Açık' : 'Kapalı'} durumda!</b>\n\n` +
        `Değişiklik yapılmadı.`,
        { reply_markup: getSystemManagementKeyboard() }
      );
      return;
    }

    await setN8nTrialNotificationsSetting(enabled, 'telegram-user');

    await sendTelegramMessage(
      `${enabled ? '✅' : '🔕'} <b>n8n Trial Bildirimleri ${enabled ? 'Açıldı' : 'Kapatıldı'}!</b>\n\n` +
      `Yeni durum: <b>${enabled ? 'Açık' : 'Kapalı'}</b>\n\n` +
      `${enabled
        ? '⏰ Günlük n8n trial kontrol bildirimleri tekrar gönderilecek.'
        : '🔇 Günlük n8n trial kontrol bildirimleri artık gönderilmeyecek.'}\n` +
      `📊 Manuel kontrol için "🤖 n8n Durumu" menüsü kullanılabilir.`,
      { reply_markup: getSystemManagementKeyboard() }
    );
  } catch (error) {
    console.error('n8n notifications toggle error:', error);
    await sendTelegramMessage(
      `❌ <b>n8n Bildirim Ayarı Değiştirilemedi!</b>\n\n` +
      `<code>${error.message}</code>\n\n` +
      `Supabase bağlantısını kontrol edin.`,
      { reply_markup: getSystemManagementKeyboard() }
    );
  }
}

/**
 * Handle action_chat_backend - Show Chat Backend menu
 */
export async function handleChatBackendMenu() {
  try {
    await sendTelegramMessage('🔍 <b>Checking Chat Backend Status...</b>');

    const currentBackend = await getChatBackendSetting();
    const isVercel = currentBackend === 'vercel';
    const isN8n = currentBackend === 'n8n';

    const statusText = `
🔀 <b>CHAT BACKEND SETTINGS</b>

<b>📊 Current Backend:</b>
${isVercel ? '✅' : '⚪'} Vercel API (chat.js)
${isN8n ? '✅' : '⚪'} n8n Workflow

<b>📝 Backend Features:</b>

<b>🟢 Vercel API (chat.js)</b>
• Model: Groq Llama 3.3 70B
• Speed: ⚡ Very Fast
• Cost: 💚 Free
• Memory: ❌ None
• Status: Production-ready

<b>🔵 n8n Workflow</b>
• Model: OpenAI GPT-4o-mini
• Speed: 🔄 Normal
• Cost: 💛 Paid (OpenAI)
• Memory: ✅ Supabase DB
• Status: Testing/Backup

<i>Select to change:</i>`;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: isVercel ? '🟢 Vercel API (Active)' : '⚪ Vercel API',
            callback_data: 'chat_backend_vercel'
          },
          {
            text: isN8n ? '🟢 n8n Workflow (Active)' : '⚪ n8n Workflow',
            callback_data: 'chat_backend_n8n'
          }
        ],
        [
          { text: '🔄 Refresh', callback_data: 'action_chat_backend' }
        ],
        [
          { text: '🔙 System Management', callback_data: 'action_system_management' }
        ]
      ]
    };

    await sendTelegramMessage(statusText, { reply_markup: keyboard });

  } catch (error) {
    console.error('Chat backend menu error:', error);
    await sendTelegramMessage(
      `❌ <b>Failed to load Chat Backend Menu!</b>\n\n` +
      `<code>${error.message}</code>\n\n` +
      `Check Supabase system_settings table.`,
      { reply_markup: getSystemManagementKeyboard() }
    );
  }
}

/**
 * Handle chat backend toggle - Switch between Vercel and n8n
 */
export async function handleChatBackendToggle(newBackend) {
  try {
    const currentBackend = await getChatBackendSetting();

    // If already on this backend, just show message
    if (currentBackend === newBackend) {
      await sendTelegramMessage(
        `ℹ️ <b>Chat Backend zaten ${newBackend === 'vercel' ? 'Vercel API' : 'n8n Workflow'} olarak ayarlı!</b>\n\n` +
        `Değişiklik yapılmadı.`,
        { reply_markup: getSystemManagementKeyboard() }
      );
      return;
    }

    // Update setting
    await setChatBackendSetting(newBackend, 'telegram-user');

    const backendName = newBackend === 'vercel' ? 'Vercel API (chat.js)' : 'n8n Workflow';
    const backendEmoji = newBackend === 'vercel' ? '🟢' : '🔵';
    const features = newBackend === 'vercel' 
      ? '• Groq Llama 3.3 70B\n• Ücretsiz\n• Çok hızlı'
      : '• OpenAI GPT-4o-mini\n• Supabase Memory\n• Conversation history';

    await sendTelegramMessage(
      `${backendEmoji} <b>Chat Backend Değiştirildi!</b>\n\n` +
      `<b>Yeni Backend:</b> ${backendName}\n\n` +
      `<b>Özellikler:</b>\n${features}\n\n` +
      `✅ Değişiklik hemen aktif oldu!\n\n` +
      `<i>Test etmek için siteye gidin ve chatbot'u kullanın.</i>`,
      { reply_markup: getSystemManagementKeyboard() }
    );

    console.log(`✅ Chat backend changed from ${currentBackend} to ${newBackend}`);

  } catch (error) {
    console.error('Chat backend toggle error:', error);
    await sendTelegramMessage(
      `❌ <b>Backend Değiştirilemedi!</b>\n\n` +
      `<code>${error.message}</code>\n\n` +
      `Supabase bağlantısını kontrol edin.`,
      { reply_markup: getSystemManagementKeyboard() }
    );
  }
}

/**
 * Get GitHub workflow status
 */
async function getGitHubWorkflowStatus() {
  if (!CONFIG.GITHUB_TOKEN) {
    return null;
  }

  try {
    const [owner, repo] = CONFIG.GITHUB_REPO.split('/');
    
    // Get all workflows
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows`,
      {
        headers: {
          'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Map workflow names to display names
    const displayMap = {
      'scrape-tech-news.yml': '📰 Scrape Tech News',
      'manual-article-scraper.yml': '➕ Manual Article Scraper',
      'system-health-check.yml': '🏥 System Health Check',
      'daily-linkedin.yml': '📱 Daily LinkedIn',
      'linkedin-groups.yml': '🔵 LinkedIn Groups',
      'vercel-status-monitor.yml': '🔍 Vercel Status Monitor',
    };

    const statuses = [];
    
    for (const workflow of data.workflows || []) {
      const fileName = workflow.path.split('/').pop(); // Get filename from path
      const displayName = displayMap[fileName];
      
      if (displayName) {
        statuses.push({
          name: displayName,
          fileName: fileName,
          workflowId: workflow.id,
          enabled: workflow.state === 'active'
        });
      }
    }

    return statuses;
  } catch (error) {
    console.error('GitHub workflow status error:', error);
    return null;
  }
}

/**
 * Enable/Disable GitHub workflow
 */
async function toggleGitHubWorkflow(workflowFileName, enable) {
  if (!CONFIG.GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN not configured');
  }

  const [owner, repo] = CONFIG.GITHUB_REPO.split('/');
  const action = enable ? 'enable' : 'disable';
  
  // First, get workflow ID by listing all workflows
  const listResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows`,
    {
      headers: {
        'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }
  );

  if (!listResponse.ok) {
    throw new Error(`Failed to list workflows: ${listResponse.status}`);
  }

  const workflowsData = await listResponse.json();
  const workflow = workflowsData.workflows?.find(w => w.path.endsWith(workflowFileName));

  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowFileName}`);
  }

  // Use workflow ID for enable/disable
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow.id}/${action}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${errorText}`);
  }

  return true;
}

/**
 * Handle action_github - GitHub Actions status
 */
export async function handleGitHubAction() {
  try {
    await sendTelegramMessage('🔍 <b>Checking GitHub Actions status...</b>');

    const statuses = await getGitHubWorkflowStatus();
    
    let githubText = `🔧 <b>GITHUB ACTIONS MANAGEMENT</b>\n\n`;

    if (!statuses || statuses.length === 0) {
      githubText += `⚠️ <b>Could not retrieve workflow statuses</b>\n\n`;
      githubText += `Check your GITHUB_TOKEN environment variable.`;
    } else {
      githubText += `<b>📋 Workflow Statuses:</b>\n\n`;
      
      statuses.forEach(status => {
        const icon = status.enabled ? '✅' : '❌';
        githubText += `${icon} ${status.name}\n`;
      });

      githubText += `\n<b>ℹ️ Note</b>\n`;
      githubText += `Use the buttons below to toggle workflows.`;
    }

    // Create keyboard with workflow toggle buttons
    const keyboard = [];
    
    if (statuses && statuses.length > 0) {
      // Group workflows in pairs
      for (let i = 0; i < statuses.length; i += 2) {
        const row = [];
        const workflow1 = statuses[i];
        const workflow2 = statuses[i + 1];
        
        if (workflow1) {
          const action = workflow1.enabled ? 'disable' : 'enable';
          const icon = workflow1.enabled ? '⏸️' : '▶️';
          const shortName = workflow1.name.split(' ').slice(1).join(' ');
          row.push({
            text: `${icon} ${shortName}`,
            callback_data: `github_${action}_${workflow1.fileName}`
          });
        }
        
        if (workflow2) {
          const action = workflow2.enabled ? 'disable' : 'enable';
          const icon = workflow2.enabled ? '⏸️' : '▶️';
          const shortName = workflow2.name.split(' ').slice(1).join(' ');
          row.push({
            text: `${icon} ${shortName}`,
            callback_data: `github_${action}_${workflow2.fileName}`
          });
        }
        
        keyboard.push(row);
      }
    }

    keyboard.push([
      { text: '🔄 Refresh Status', callback_data: 'action_github' },
    ]);
    
    keyboard.push([
      { text: '🔙 System Management', callback_data: 'action_system_management' },
    ]);

  await sendTelegramMessage(githubText, {
      reply_markup: { inline_keyboard: keyboard }
    });

  } catch (error) {
    console.error('GitHub action error:', error);
    await sendTelegramMessage(
      `❌ <b>Error!</b>\n\n${error.message}\n\n` +
      `Check GITHUB_TOKEN or use /help for support.`
    );
  }
}

/**
 * Handle GitHub workflow toggle actions
 */
export async function handleGitHubWorkflowToggle(action, workflowFileName) {
  try {
    const enable = action === 'enable';
    
    // Get display name from filename
    const displayMap = {
      'scrape-tech-news.yml': 'Scrape Tech News',
      'manual-article-scraper.yml': 'Manual Article Scraper',
      'system-health-check.yml': 'System Health Check',
      'daily-linkedin.yml': 'Daily LinkedIn',
      'linkedin-groups.yml': 'LinkedIn Groups',
      'vercel-status-monitor.yml': 'Vercel Status Monitor',
    };
    
    const displayName = displayMap[workflowFileName] || workflowFileName;
    const actionText = enable ? 'aktifleştiriliyor' : 'devre dışı bırakılıyor';
    
    await sendTelegramMessage(`⏳ <b>${displayName} ${actionText}...</b>`);

    await toggleGitHubWorkflow(workflowFileName, enable);

    const statusIcon = enable ? '✅' : '⏸️';
    const statusText = enable ? 'aktifleştirildi' : 'devre dışı bırakıldı';
    
    await sendTelegramMessage(
      `${statusIcon} <b>${displayName} ${statusText}!</b>\n\n` +
      `Workflow artık ${enable ? 'çalışacak' : 'çalışmayacak'}.\n\n` +
      `Durumu kontrol etmek için "Durumu Yenile" butonuna basın.`
    );

    // Refresh GitHub menu after 1 second
    setTimeout(() => {
      handleGitHubAction();
    }, 1000);

  } catch (error) {
    console.error('GitHub workflow toggle error:', error);
    await sendTelegramMessage(
      `❌ <b>Hata!</b>\n\n${error.message}\n\n` +
      `GITHUB_TOKEN kontrol edin veya workflow dosya adını doğrulayın.`
    );
  }
}

/**
 * Handle LinkedIn Groups Daily Digest - Trigger GitHub Action
 */
export async function handleLinkedInGroupsDigest(groupId = null) {
  try {
    await sendTelegramMessage(
      '🔵 <b>LinkedIn Groups Digest Oluşturuluyor...</b>\n\n' +
      '🤖 AI Model: Groq (Llama 3.3 70B)\n' +
      '📊 Mod: Daily Digest\n\n' +
      '⏳ GitHub Actions workflow tetikleniyor...'
    );

    // Trigger GitHub Actions workflow
    if (CONFIG.GITHUB_TOKEN) {
      const [owner, repo] = CONFIG.GITHUB_REPO.split('/');
      
      const inputs = {
        mode: 'daily'
      };
      
      if (groupId) {
        inputs.group_id = groupId;
      }
      
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/actions/workflows/linkedin-groups.yml/dispatches`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CONFIG.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ref: 'main',
            inputs
          })
        }
      );

      if (response.ok) {
        await sendTelegramMessage(
          '✅ <b>LinkedIn Groups Digest Başlatıldı!</b>\n\n' +
          '📊 GitHub Actions workflow tetiklendi\n' +
          '⏳ İşlem adımları:\n' +
          '  1️⃣ Son 48 saatin haberleri çekiliyor\n' +
          '  2️⃣ Grup için relevance skoru hesaplanıyor\n' +
          '  3️⃣ En iyi 3 haber seçiliyor\n' +
          '  4️⃣ AI ile içerik oluşturuluyor\n' +
          '  5️⃣ Telegram\'a gönderiliyor\n\n' +
          '🔔 İçerik hazır olduğunda bildirim alacaksınız!\n\n' +
          '<i>Tahmini süre: 30-60 saniye</i>'
        );
      } else {
        const errorText = await response.text();
        throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
      }
    } else {
      throw new Error('GITHUB_TOKEN not configured');
    }
  } catch (error) {
    console.error('LinkedIn Groups Digest error:', error);
    await sendTelegramMessage(
      `❌ <b>LinkedIn Groups Digest Başlatılamadı!</b>\n\n` +
      `<code>${error.message}</code>\n\n` +
      `💡 Alternatif:\n` +
      `Lokal olarak çalıştırın:\n` +
      `<code>node scripts/linkedin-groups-digest.js daily</code>`
    );
  }
}

/**
 * Handle /linkedin command - Show pending LinkedIn digests
 */
export async function handleLinkedInCommand() {
  try {
    await sendTelegramMessage('📱 <b>LinkedIn Digest\'ler Yükleniyor...</b>');

    // Get pending, posting, and recent digests (including stuck "posting" status)
    const { data: digests, error } = await supabase
      .from('linkedin_digest_posts')
      .select('*')
      .in('status', ['pending', 'posting', 'posted', 'rejected'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!digests || digests.length === 0) {
      await sendTelegramMessage(
        '📱 <b>LinkedIn Digest\'ler</b>\n\n' +
        'ℹ️ Henüz digest bulunamadı.\n\n' +
        'Digest\'ler her gün saat 16:30\'da otomatik olarak oluşturulur.\n\n' +
        '👇 Manuel olarak digest oluşturmak için butona tıklayın:',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🚀 Manuel Digest Oluştur', callback_data: 'action_create_digest' }],
              [{ text: '🔙 Ana Menü', callback_data: 'action_menu' }]
            ]
          }
        }
      );
      return;
    }

    // Group by status
    const pending = digests.filter(d => d.status === 'pending');
    const posting = digests.filter(d => d.status === 'posting'); // Stuck digests
    const posted = digests.filter(d => d.status === 'posted');
    const rejected = digests.filter(d => d.status === 'rejected');

    // Combined stuck digests (pending + posting that got stuck)
    const stuckDigests = [...pending, ...posting];

    let messageText = '📱 <b>LINKEDİN DIGEST YÖNETİMİ</b>\n\n';

    // Stuck "posting" digests (failed during LinkedIn post)
    if (posting.length > 0) {
      messageText += '<b>⚠️ Takılı Kalmış (Posting):</b>\n';
      posting.forEach(d => {
        messageText += `🔴 ${d.digest_date} | 📊 ${d.article_count} haber (LinkedIn hatası)\n`;
      });
      messageText += '\n';
    }

    // Pending digests
    if (pending.length > 0) {
      messageText += '<b>⏳ Onay Bekleyen:</b>\n';
      pending.forEach(d => {
        messageText += `📅 ${d.digest_date} | 📊 ${d.article_count} haber\n`;
      });
      messageText += '\n';
    }

    // Posted digests
    if (posted.length > 0) {
      messageText += '<b>✅ Paylaşılan:</b>\n';
      posted.slice(0, 3).forEach(d => {
        const date = new Date(d.posted_at).toLocaleDateString('tr-TR');
        messageText += `✓ ${d.digest_date} (${date})\n`;
      });
      if (posted.length > 3) {
        messageText += `<i>... ve ${posted.length - 3} daha</i>\n`;
      }
      messageText += '\n';
    }

    // Rejected digests
    if (rejected.length > 0) {
      messageText += '<b>❌ Reddedilen:</b>\n';
      rejected.slice(0, 2).forEach(d => {
        messageText += `✗ ${d.digest_date}\n`;
      });
      messageText += '\n';
    }

    // Create buttons for pending digests
    const buttons = [];
    
    if (pending.length > 0) {
      pending.forEach(digest => {
        buttons.push([
          {
            text: `📅 ${digest.digest_date} - Görüntüle`,
            callback_data: `view_${digest.id}`
          },
          {
            text: '✅ Onayla',
            callback_data: `approve_${digest.id}`
          }
        ]);
      });
    }

    // Add manual create button
    buttons.push([
      { text: '🚀 Manuel Digest Oluştur', callback_data: 'action_create_digest' }
    ]);

    // Add cleanup button if there are stuck digests (pending OR posting)
    if (stuckDigests.length > 0) {
      buttons.push([
        { text: '🗑️ Takılı Digest\'leri Temizle', callback_data: 'action_clean_pending' }
      ]);
    }

    buttons.push([
      { text: '🔙 Ana Menü', callback_data: 'action_refresh_menu' }
    ]);

    await sendTelegramMessage(messageText, {
      reply_markup: { inline_keyboard: buttons }
    });

  } catch (error) {
    console.error('LinkedIn command error:', error);
    await sendTelegramMessage(`❌ <b>Hata!</b>\n\n${error.message}`);
  }
}

/**
 * Handle action_create_digest - Trigger manual digest creation
 */
export async function handleCreateDigestAction() {
  try {
    await sendTelegramMessage('🔍 <b>Digest kontrolü yapılıyor...</b>');

    const today = new Date().toISOString().split('T')[0];

    // Check if digest already exists for today
    const { data: existingDigest, error: checkError } = await supabase
      .from('linkedin_digest_posts')
      .select('*')
      .eq('digest_date', today)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows found (which is OK)
      throw checkError;
    }

    // If digest exists
    if (existingDigest) {
      if (existingDigest.status === 'pending') {
        // Already pending - just resend it
        await sendTelegramMessage(
          '⚠️ <b>Bugün için digest zaten mevcut!</b>\n\n' +
          `📅 Tarih: ${existingDigest.digest_date}\n` +
          `📊 Durum: ${existingDigest.status}\n` +
          `📝 Haber sayısı: ${existingDigest.article_count}\n\n` +
          'Digest zaten oluşturulmuş ve onay bekliyor.\n' +
          'LinkedIn Posts menüsünden görüntüleyebilirsiniz.'
        );
        return;
      } else if (existingDigest.status === 'posted') {
        // Already posted
        await sendTelegramMessage(
          '✅ <b>Bugün için digest zaten paylaşılmış!</b>\n\n' +
          `📅 Tarih: ${existingDigest.digest_date}\n` +
          `📊 Paylaşım: ${new Date(existingDigest.posted_at).toLocaleString('tr-TR')}\n\n` +
          'Yeni bir digest oluşturmak için yarın tekrar deneyin.'
        );
        return;
      } else if (existingDigest.status === 'rejected') {
        // Rejected - delete it and create new one
        await sendTelegramMessage('🔄 <b>Reddedilen digest siliniyor, yenisi oluşturuluyor...</b>');
        
        const { error: deleteError } = await supabase
          .from('linkedin_digest_posts')
          .delete()
          .eq('id', existingDigest.id);

        if (deleteError) {
          throw new Error(`Silme hatası: ${deleteError.message}`);
        }
      }
    }

    // Proceed with creation
    await sendTelegramMessage('🚀 <b>Manuel Digest Oluşturuluyor...</b>\n\nLütfen bekleyin, bu işlem 30-60 saniye sürebilir.');

    // Use unified workflow webhook
    const N8N_WEBHOOK_URL = process.env.N8N_LINKEDIN_WORKFLOW_WEBHOOK;
    
    if (!N8N_WEBHOOK_URL) {
      throw new Error('N8N_LINKEDIN_WORKFLOW_WEBHOOK environment variable not configured. Please add it to Vercel.');
    }

    // Trigger n8n unified workflow (manual trigger)
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trigger: 'manual',
        chat_id: env.TELEGRAM_CHAT_ID,
        timestamp: new Date().toISOString(),
        force_recreate: existingDigest?.status === 'rejected' // Flag for n8n
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`n8n webhook error (${response.status}): ${errorText}`);
    }

    // Simple feedback - detailed message will come from n8n
    await sendTelegramMessage('⏳ <b>Digest oluşturuluyor...</b>');

  } catch (error) {
    console.error('Create digest error:', error);
    await sendTelegramMessage(
      `❌ <b>Digest oluşturma hatası!</b>\n\n<code>${error.message}</code>\n\n` +
      'Lütfen tekrar deneyin veya /help ile destek alın.'
    );
  }
}

/**
 * Handle action_delete_article - Start delete article flow
 */
export async function handleDeleteArticleAction(userId) {
  try {
    const { setConversationState } = await import('../lib/conversation-state.js');
    await setConversationState(userId, 'awaiting_delete_url');

    await sendTelegramMessage(
      '🗑️ <b>Haber Silme</b>\n\n' +
      '📎 Silmek istediğiniz haberin linkini gönderin:\n\n' +
      '<i>Örnek: https://cemkoyluoglu.codes/tech-news/article-slug</i>\n\n' +
      '💡 Doğrudan link gönderirseniz de otomatik algılanır.\n' +
      '⏱️ 10 dakika içinde göndermezsaniz işlem iptal olur.'
    );
  } catch (error) {
    console.error('Delete article action error:', error);
    await sendTelegramMessage(`❌ <b>Hata!</b>\n\n${error.message}`);
  }
}

/**
 * Handle delete article URL input — auto-detected or from conversation flow
 */
export async function handleDeleteUrlInput(url, userId) {
  try {
    const { deleteConversationState } = await import('../lib/conversation-state.js');

    const siteMatch = url.match(/cemkoyluoglu\.codes\/tech-news\/([a-z0-9][a-z0-9-]*)/i);
    if (!siteMatch) {
      await sendTelegramMessage(
        '❌ <b>Geçersiz link!</b>\n\n' +
        'Lütfen geçerli bir haber linki gönderin:\n' +
        '<i>https://cemkoyluoglu.codes/tech-news/article-slug</i>'
      );
      return;
    }

    const slug = siteMatch[1];
    await deleteConversationState(userId);

    const { data: article, error } = await supabase
      .from('tech_news_articles')
      .select('id, title, slug, category')
      .eq('slug', slug)
      .single();

    if (error || !article) {
      await sendTelegramMessage(
        `❌ <b>Haber bulunamadı!</b>\n\n` +
        `Slug: <code>${slug}</code>\n\n` +
        `Zaten silinmiş olabilir.`,
        { reply_markup: getMainMenuKeyboard() }
      );
      return;
    }

    const titlePreview = article.title.length > 80
      ? article.title.substring(0, 80) + '...'
      : article.title;

    await sendTelegramMessage(
      '🗑️ <b>Bu Haberi Silmek İstiyor Musunuz?</b>\n\n' +
      `📰 <b>${titlePreview}</b>\n` +
      `🏷️ Kategori: ${article.category || 'N/A'}\n\n` +
      '⚠️ Bu işlem geri alınamaz!',
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Evet, Sil', callback_data: `delete_confirm_${article.id}` },
              { text: '❌ İptal', callback_data: 'action_refresh_menu' },
            ]
          ]
        }
      }
    );
  } catch (error) {
    console.error('Delete URL input error:', error);
    await sendTelegramMessage(`❌ <b>Hata!</b>\n\n${error.message}`);
    const { deleteConversationState } = await import('../lib/conversation-state.js');
    await deleteConversationState(userId);
  }
}

/**
 * Handle delete article confirmation callback
 */
export async function handleDeleteArticleConfirm(articleId) {
  try {
    const { data: deleted, error } = await supabase
      .from('tech_news_articles')
      .delete()
      .eq('id', articleId)
      .select('title')
      .single();

    if (error) {
      await sendTelegramMessage(`❌ <b>Silme hatası!</b>\n\n<code>${error.message}</code>`);
      return;
    }

    if (!deleted) {
      await sendTelegramMessage(
        '❌ <b>Haber bulunamadı!</b>\n\nZaten silinmiş olabilir.',
        { reply_markup: getMainMenuKeyboard() }
      );
      return;
    }

    const titlePreview = deleted.title.length > 60
      ? deleted.title.substring(0, 60) + '...'
      : deleted.title;

    await sendTelegramMessage(
      `✅ <b>Haber Silindi!</b>\n\n📰 "${titlePreview}"`,
      { reply_markup: getMainMenuKeyboard() }
    );
  } catch (error) {
    console.error('Delete article confirm error:', error);
    await sendTelegramMessage(`❌ <b>Silme hatası!</b>\n\n<code>${error.message}</code>`);
  }
}

/**
 * Handle action_help - Help and commands
 */
export async function handleHelpAction() {
  const helpText = `
ℹ️ <b>HELP & COMMANDS</b>

<b>📱 Bot Commands</b>
/start - Start Bot
/menu - Show main menu
/status - Quick status report
/scrape - Run news scraper
/health - System health check
/help - This help message

<b>🎯 Menu Features</b>
• 📡 Scraper & Content: Run scraper, add/delete articles
• 📱 Social Media: Manage LinkedIn Digests & Groups
• 📊 Analytics & Data: DB metrics, status, statistics
• ⚙️ System Management: Webhook, n8n, Actions, Health

<b>🔔 Automated Notifications</b>
• ✅ Success operations
• ❌ Errors & Failures
• 📊 Daily health reports

<b>💡 Tips</b>
• Tap buttons to perform actions
• You can write commands directly
• If stuck, type /menu to reset state

<i>Need more help? Check the README or /menu to refresh</i>`;

  await sendTelegramMessage(helpText, {
    reply_markup: getMainMenuKeyboard()
  });
}

/**
 * Trigger GitHub Actions workflow to process article
 */
async function triggerGitHubActionsWorkflow(articleUrl, originalSourceUrl, userId) {
  const githubToken = process.env.GITHUB_TOKEN;
  const githubRepo = process.env.GITHUB_REPOSITORY || 'CemRoot/My-Site';
  
  if (!githubToken) {
    throw new Error('GITHUB_TOKEN environment variable not configured');
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${githubRepo}/actions/workflows/manual-article-scraper.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${githubToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            article_url: articleUrl,
            original_source: originalSourceUrl,
            telegram_user_id: userId.toString(),
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
    }

    console.log('✅ GitHub Actions workflow triggered successfully');
    return true;
  } catch (error) {
    console.error('❌ GitHub Actions trigger error:', error);
    throw error;
  }
}

/**
 * Handle action_add_article - Start manual article addition flow
 */
export async function handleAddArticleAction(userId) {
  try {
    // Initialize conversation state in Supabase
    const { setConversationState } = await import('../lib/conversation-state.js');
    await setConversationState(userId, 'awaiting_url');

    await sendTelegramMessage(
      '➕ <b>Manuel Haber Ekleme</b>\n\n' +
      '📎 Lütfen eklemek istediğiniz haberin URL\'sini gönderin:\n\n' +
      '<i>Örnek: https://techcrunch.com/article-123</i>\n\n' +
      '⏱️ 10 dakika içinde işlem yapmazsanız süreç iptal olur.'
    );
  } catch (error) {
    console.error('Add article action error:', error);
    await sendTelegramMessage(
      `❌ <b>Hata!</b>\n\n${error.message}\n\nLütfen tekrar deneyin veya /help ile destek alın.`
    );
  }
}

/**
 * Handle article URL input
 */
export async function handleArticleUrlInput(url, userId) {
  try {
    const { getConversationState, setConversationState, deleteConversationState } = await import('../lib/conversation-state.js');
    
    const state = await getConversationState(userId);
    if (!state || state.step !== 'awaiting_url') {
      return; // Invalid state
    }

    // Validate URL
    const { isValidUrl } = await import('./manual-article-scraper.js');
    if (!isValidUrl(url)) {
      await sendTelegramMessage(
        '❌ <b>Geçersiz URL formatı!</b>\n\n' +
        'Lütfen geçerli bir URL gönderin:\n' +
        '<i>Örnek: https://techcrunch.com/article-123</i>'
      );
      return;
    }

    // Update state and ask for confirmation
    await setConversationState(userId, 'confirm_source', { articleUrl: url });

    await sendTelegramMessage(
      '🔗 <b>URL Alındı!</b>\n\n' +
      `📎 ${url}\n\n` +
      '📰 Bu URL\'i "Original Article Source" olarak kullanabilir miyim?\n\n' +
      '<i>• <b>Evet:</b> Paylaştığınız link kaynak olarak kullanılacak</i>\n' +
      '<i>• <b>Hayır:</b> Farklı bir kaynak URL\'i girebilirsiniz</i>',
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Evet', callback_data: 'source_yes' },
              { text: '❌ Hayır', callback_data: 'source_no' }
            ]
          ]
        }
      }
    );
  } catch (error) {
    console.error('URL input error:', error);
    await sendTelegramMessage(
      `❌ <b>Hata!</b>\n\n${error.message}\n\nLütfen tekrar deneyin.`
    );
    const { deleteConversationState } = await import('../lib/conversation-state.js');
    await deleteConversationState(userId);
  }
}

/**
 * Handle source confirmation
 */
export async function handleSourceConfirmation(useOriginal, userId) {
  try {
    const { getConversationState, setConversationState, deleteConversationState } = await import('../lib/conversation-state.js');
    
    const state = await getConversationState(userId);
    if (!state || state.step !== 'confirm_source') {
      await sendTelegramMessage('❌ Oturum zaman aşımına uğradı. Lütfen /menu ile tekrar başlayın.');
      await deleteConversationState(userId);
      return;
    }

    if (useOriginal) {
      // Clear state immediately to prevent duplicates
      await deleteConversationState(userId);
      
      try {
        // Trigger GitHub Actions workflow
        await triggerGitHubActionsWorkflow(state.article_url, state.article_url, userId);
        
        // Send confirmation message
        await sendTelegramMessage(
          '🚀 <b>İşlem Başlatıldı!</b>\n\n' +
          '📊 GitHub Actions workflow tetiklendi\n' +
          '⏳ Makale işleniyor...\n\n' +
          '<i>İşlem tamamlandığında bildirim alacaksınız (30-60 saniye)</i>',
          {
            reply_markup: getMainMenuKeyboard()
          }
        );
      } catch (error) {
        console.error('GitHub Actions trigger error:', error);
        await sendTelegramMessage(
          `❌ <b>İşlem Başlatılamadı!</b>\n\n` +
          `<code>${error.message}</code>\n\n` +
          'Lütfen tekrar deneyin veya /help ile destek alın.',
          {
            reply_markup: getMainMenuKeyboard()
          }
        );
      }
    } else {
      // Ask for different original source
      await setConversationState(userId, 'awaiting_original_source', { articleUrl: state.article_url });

      await sendTelegramMessage(
        '📝 <b>Original Source URL\'ini girin:</b>\n\n' +
        '<i>Örnek: https://originalsource.com/article</i>\n\n' +
        '⏱️ 10 dakika içinde göndermezsaniz işlem iptal olur.'
      );
    }
  } catch (error) {
    console.error('Source confirmation error:', error);
    await sendTelegramMessage(
      `❌ <b>Hata Oluştu!</b>\n\n${error.message}\n\n` +
      'Lütfen tekrar deneyin veya /help ile destek alın.',
      {
        reply_markup: getMainMenuKeyboard()
      }
    );
    const { deleteConversationState } = await import('../lib/conversation-state.js');
    await deleteConversationState(userId);
  }
}

/**
 * Handle original source URL input
 */
export async function handleOriginalSourceInput(originalUrl, userId, articleUrl) {
  try {
    const { getConversationState, deleteConversationState } = await import('../lib/conversation-state.js');
    
    const state = await getConversationState(userId);
    if (!state || state.step !== 'awaiting_original_source') {
      return; // Invalid state
    }

    // Validate URL
    const { isValidUrl } = await import('./manual-article-scraper.js');
    if (!isValidUrl(originalUrl)) {
      await sendTelegramMessage(
        '❌ <b>Geçersiz URL formatı!</b>\n\n' +
        'Lütfen geçerli bir URL gönderin:\n' +
        '<i>Örnek: https://originalsource.com/article</i>'
      );
      return;
    }

    // Clear state immediately to prevent duplicates
    await deleteConversationState(userId);
    
    try {
      // Trigger GitHub Actions workflow
      await triggerGitHubActionsWorkflow(state.article_url, originalUrl, userId);
      
      // Send confirmation message
      await sendTelegramMessage(
        '🚀 <b>İşlem Başlatıldı!</b>\n\n' +
        '📊 GitHub Actions workflow tetiklendi\n' +
        '⏳ Makale işleniyor...\n\n' +
        '<i>İşlem tamamlandığında bildirim alacaksınız (30-60 saniye)</i>',
        {
          reply_markup: getMainMenuKeyboard()
        }
      );
    } catch (error) {
      console.error('GitHub Actions trigger error:', error);
      await sendTelegramMessage(
        `❌ <b>İşlem Başlatılamadı!</b>\n\n` +
        `<code>${error.message}</code>\n\n` +
        'Lütfen tekrar deneyin veya /help ile destek alın.',
        {
          reply_markup: getMainMenuKeyboard()
        }
      );
    }
  } catch (error) {
    console.error('Original source input error:', error);
    await sendTelegramMessage(
      `❌ <b>Hata Oluştu!</b>\n\n${error.message}\n\n` +
      'Lütfen tekrar deneyin veya /help ile destek alın.',
      {
        reply_markup: getMainMenuKeyboard()
      }
    );
    const { deleteConversationState } = await import('../lib/conversation-state.js');
    await deleteConversationState(userId);
  }
}

/**
 * Handle digest edit input (LinkedIn digest editing)
 */
export async function handleDigestEditInput(editedContent, userId, digestId) {
  try {
    const { deleteConversationState } = await import('../lib/conversation-state.js');
    
    // Validate content length (LinkedIn limit: 3000 characters)
    if (editedContent.length > 3000) {
      await sendTelegramMessage(
        `❌ <b>İçerik çok uzun!</b>\n\n` +
        `📏 Mevcut: ${editedContent.length} karakter\n` +
        `📏 Maksimum: 3000 karakter\n\n` +
        `Lütfen içeriği kısaltın ve tekrar gönderin.`
      );
      return;
    }

    // Clear conversation state immediately
    await deleteConversationState(userId);

    // Update digest with edited content
    const { data: digest, error: updateError } = await supabase
      .from('linkedin_digest_posts')
      .update({
        edited_content: editedContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', digestId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Digest güncelleme hatası: ${updateError.message}`);
    }

    // Send confirmation with approve/reject buttons
    await sendTelegramMessage(
      `✅ <b>İçerik Güncellendi!</b>\n\n` +
      `📝 Düzenlenmiş içerik kaydedildi.\n` +
      `📊 Karakter sayısı: ${editedContent.length}/3000\n\n` +
      `<b>📋 Önizleme:</b>\n` +
      `${editedContent.substring(0, 500)}${editedContent.length > 500 ? '...' : ''}\n\n` +
      `👇 Şimdi ne yapmak istersiniz?`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '✅ Approve & Post to LinkedIn',
                callback_data: `approve_${digestId}`
              }
            ],
            [
              {
                text: '❌ Reject',
                callback_data: `reject_${digestId}`
              }
            ],
            [
              {
                text: '👁️ View Full Content',
                callback_data: `view_${digestId}`
              }
            ],
            [
              {
                text: '🔙 Back to Menu',
                callback_data: 'action_refresh_menu'
              }
            ]
          ]
        }
      }
    );

    console.log(`✅ Digest ${digestId} updated with edited content by user ${userId}`);

  } catch (error) {
    console.error('Digest edit input error:', error);
    await sendTelegramMessage(
      `❌ <b>Hata Oluştu!</b>\n\n${error.message}\n\n` +
      'Lütfen tekrar deneyin veya /help ile destek alın.',
      {
        reply_markup: getMainMenuKeyboard()
      }
    );
    const { deleteConversationState } = await import('../lib/conversation-state.js');
    await deleteConversationState(userId);
  }
}

/**
 * Handle clean pending digests action
 */
export async function handleCleanPendingAction() {
  try {
    await sendTelegramMessage('🔍 <b>Takılı Digest\'ler Kontrol Ediliyor...</b>');

    // Get stuck digests (both pending AND posting status)
    const { data: stuckDigests, error } = await supabase
      .from('linkedin_digest_posts')
      .select('*')
      .in('status', ['pending', 'posting'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!stuckDigests || stuckDigests.length === 0) {
      await sendTelegramMessage(
        '✅ <b>Temizlenecek Takılı Digest Yok!</b>\n\n' +
        'Sistem şu anda temiz durumda.'
      );
      return;
    }

    // Format digests for display
    const digestsFormatted = stuckDigests.map(d => ({
      id: d.id,
      date: d.digest_date,
      status: d.status,
      articles: d.article_count,
      created: new Date(d.created_at).toLocaleString('tr-TR'),
      age: Math.floor((Date.now() - new Date(d.created_at)) / (1000 * 60)) + ' minutes'
    }));

    // Show confirmation dialog
    let confirmText = '🗑️ <b>Takılı Digest Temizleme</b>\n\n';
    confirmText += `<b>Silinecek digest sayısı:</b> ${stuckDigests.length}\n\n`;
    confirmText += '<b>Digest Listesi:</b>\n';

    digestsFormatted.forEach(d => {
      const statusEmoji = d.status === 'posting' ? '🔴' : '⏳';
      confirmText += `${statusEmoji} ${d.date} - ${d.articles} haber (${d.status}) - ${d.age}\n`;
    });

    confirmText += '\n⚠️ <b>DİKKAT:</b> Bu işlem geri alınamaz!\n';
    confirmText += 'Tüm pending digest\'ler silinecek.\n\n';
    confirmText += 'Onaylıyor musunuz?';

    await sendTelegramMessage(confirmText, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Evet, Sil', callback_data: 'action_confirm_clean' },
            { text: '❌ İptal', callback_data: 'action_linkedin' }
          ]
        ]
      }
    });

  } catch (error) {
    console.error('Clean pending action error:', error);
    await sendTelegramMessage(`❌ <b>Hata!</b>\n\n${error.message}`);
  }
}

/**
 * Handle confirm clean action - actually delete pending digests
 */
export async function handleConfirmCleanAction() {
  try {
    await sendTelegramMessage('🗑️ <b>Takılı Digest\'ler Siliniyor...</b>');

    // Get all stuck digests first (both pending AND posting)
    const { data: stuckDigests, error: fetchError } = await supabase
      .from('linkedin_digest_posts')
      .select('*')
      .in('status', ['pending', 'posting']);

    if (fetchError) throw fetchError;

    let successText = '✅ <b>Temizleme Tamamlandı!</b>\n\n';

    if (stuckDigests && stuckDigests.length > 0) {
      // Delete all stuck digests (pending + posting)
      const { error: deleteError } = await supabase
        .from('linkedin_digest_posts')
        .delete()
        .in('status', ['pending', 'posting']);

      if (deleteError) throw deleteError;

      successText += `<b>Silinen digest sayısı:</b> ${stuckDigests.length}\n\n`;
      successText += '<b>Silinen Digest\'ler:</b>\n';
      stuckDigests.forEach(d => {
        const statusEmoji = d.status === 'posting' ? '🔴' : '⏳';
        successText += `${statusEmoji} ${d.digest_date} - ${d.article_count} haber (${d.status})\n`;
      });
    } else {
      successText += 'Silinecek digest bulunamadı.';
    }

    successText += '\n\nArtık yeni digest oluşturabilirsiniz.';

    await sendTelegramMessage(successText, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🚀 Yeni Digest Oluştur', callback_data: 'action_create_digest' }
          ],
          [
            { text: '🔙 LinkedIn Menü', callback_data: 'action_linkedin' }
          ]
        ]
      }
    });

  } catch (error) {
    console.error('Confirm clean action error:', error);
    await sendTelegramMessage(`❌ <b>Silme Hatası!</b>\n\n${error.message}`);
  }
}

/**
 * Set bot commands (run once during setup)
 */
export async function setBotCommands() {
  const commands = [
    { command: 'start', description: 'Start Bot' },
    { command: 'menu', description: 'Show Main Menu' },
    { command: 'status', description: 'Quick Status Report' },
    { command: 'scrape', description: 'Run Scraper' },
    { command: 'health', description: 'Health Check' },
    { command: 'help', description: 'Help and Commands' },
  ];

  try {
    await callTelegramApi('setMyCommands', { commands });
    console.log('✅ Bot commands set successfully!');
  } catch (error) {
    console.error('❌ Error setting bot commands:', error);
  }
}

export default {
  sendTelegramMessage,
  handleStartCommand,
  handleMenuCommand,
  handleScraperMenu,
  handleSocialMenu,
  handleAnalyticsMenu,
  handleLinkedInCommand,
  handleLinkedInGroupsDigest,
  handleCreateDigestAction,
  handleCleanPendingAction,
  handleConfirmCleanAction,
  handleAddArticleAction,
  handleArticleUrlInput,
  handleSourceConfirmation,
  handleOriginalSourceInput,
  handleDigestEditInput,
  handleDeleteArticleAction,
  handleDeleteUrlInput,
  handleDeleteArticleConfirm,
  handleScrapeAction,
  handleHealthAction,
  handleStatusAction,
  handleStatsAction,
  handleDatabaseAction,
  handleSystemManagementMenu,
  handleGitHubAction,
  handleGitHubWorkflowToggle,
  handleHelpAction,
  handleN8nNotificationsMenu,
  handleN8nNotificationsToggle,
  handleChatBackendMenu,
  handleChatBackendToggle,
  setBotCommands,
};
