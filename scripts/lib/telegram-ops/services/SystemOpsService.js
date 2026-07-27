/**
 * SystemOpsService — health, webhook, n8n, chat backend, GitHub Actions.
 */

import { getSystemManagementKeyboard } from '../keyboards.js';

const GITHUB_WORKFLOW_DISPLAY_MAP = {
  'scrape-tech-news.yml': '📰 Scrape Tech News',
  'manual-article-scraper.yml': '➕ Manual Article Scraper',
  'system-health-check.yml': '🏥 System Health Check',
  'linkedin-groups.yml': '🔵 LinkedIn Groups',
  'vercel-status-monitor.yml': '🔍 Vercel Status Monitor',
};

const GITHUB_WORKFLOW_SHORT_DISPLAY_MAP = {
  'scrape-tech-news.yml': 'Scrape Tech News',
  'manual-article-scraper.yml': 'Manual Article Scraper',
  'system-health-check.yml': 'System Health Check',
  'linkedin-groups.yml': 'LinkedIn Groups',
  'vercel-status-monitor.yml': 'Vercel Status Monitor',
};

export class SystemOpsService {
  constructor(deps) {
    this.sendTelegramMessage = deps.sendTelegramMessage;
    this.callTelegramApi = deps.callTelegramApi;
    this.supabase = deps.supabase;
    this.env = deps.env;
    this.config = deps.config;
  }

  /**
   * Handle action_system_management - Show System Management submenu
   */
  async handleSystemManagementMenu() {
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

    await this.sendTelegramMessage(systemText, {
      reply_markup: getSystemManagementKeyboard()
    });
  }

  /**
   * Handle action_health - Run health check
   */
  async handleHealthAction() {
    try {
      await this.sendTelegramMessage('🔍 <b>Checking system health...</b>');

      const { count: articleCount, error: countError } = await this.supabase
        .from('tech_news_articles')
        .select('*', { count: 'exact', head: true });

      const supabaseStatus = countError ? '❌ Error' : '✅ Connected';

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: recentArticles, error: recentError } = await this.supabase
        .from('tech_news_articles')
        .select('id, title, created_at')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false });

      const recentCount = recentArticles?.length || 0;

      let firecrawlStatus = '❓ Unknown';
      try {
        const fcResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ url: 'https://example.com', formats: ['markdown'] })
        });
        firecrawlStatus = (fcResponse.status === 401 || fcResponse.status === 403) ? '❌ API Key Invalid' : '✅ Active';
      } catch (e) {
        firecrawlStatus = '❌ Connection Error';
      }

      let groqStatus = '❓ Unknown';
      try {
        const groqResponse = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { 'Authorization': `Bearer ${this.config.GROQ_API_KEY}` }
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

      await this.sendTelegramMessage(healthReport, {
        reply_markup: getSystemManagementKeyboard()
      });
    } catch (error) {
      await this.sendTelegramMessage(`❌ <b>Health check failed!</b>\n\n${error.message}`);
    }
  }

  /**
   * Handle action_webhook_reset - Trigger GitHub Action to reset webhook
   */
  async handleWebhookResetAction() {
    try {
      await this.sendTelegramMessage(
        '🔄 <b>Initiating Telegram Webhook Reset...</b>\n\n' +
        'Triggering GitHub Actions workflow...\n' +
        'This may take 1-2 minutes.'
      );

      if (this.config.GITHUB_TOKEN) {
        const [owner, repo] = this.config.GITHUB_REPO.split('/');
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/actions/workflows/telegram-webhook-reset.yml/dispatches`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.config.GITHUB_TOKEN}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ref: 'main'
            })
          }
        );

        if (response.ok) {
          await this.sendTelegramMessage(
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
      await this.sendTelegramMessage(
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
   * Handle action_n8n_status - Show n8n trial status
   */
  async handleN8nStatusAction() {
    try {
      await this.sendTelegramMessage('🔍 <b>n8n Durumu Kontrol Ediliyor...</b>\n\nLütfen bekleyin...');

      console.log('Importing n8n-trial-status module...');

      const { calculateRemainingDays } = await import('../../../n8n-trial-status.js');

      console.log('Calculating remaining days...');
      const status = await calculateRemainingDays();
      console.log('Status calculated:', status);
      const { startDate, endDate, durationDays, daysPassed, daysRemaining, isExpired } = status;

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

        await this.sendTelegramMessage(statusText, { reply_markup: keyboard });
      } else if (daysRemaining <= 1) {
        statusText += `
⚠️ <b>CRITICAL!</b> Trial ends tomorrow!

Prepare new n8n account:
• Export workflow
• Create new account
• Update webhook URLs`;

        await this.sendTelegramMessage(statusText, {
          reply_markup: getSystemManagementKeyboard()
        });
      } else if (daysRemaining <= 3) {
        statusText += `
⚠️ <b>WARNING!</b> ${daysRemaining} days left.

Don't forget to prepare a new n8n account!`;

        await this.sendTelegramMessage(statusText, {
          reply_markup: getSystemManagementKeyboard()
        });
      } else {
        statusText += `
✅ <b>All good!</b> ${daysRemaining} days remaining.

System is operating normally.`;

        await this.sendTelegramMessage(statusText, {
          reply_markup: getSystemManagementKeyboard()
        });
      }

    } catch (error) {
      console.error('❌ n8n status error:', error);

      await this.sendTelegramMessage(
        `❌ <b>Failed to get n8n Status!</b>\n\n` +
        `<b>Error:</b> <code>${error.message}</code>\n\n` +
        `💡 Please check Supabase system_settings table.`,
        { reply_markup: getSystemManagementKeyboard() }
      );
    }
  }

  /**
   * Handle action_n8n_trial_reset - Reset n8n trial period (start new 30 days)
   */
  async handleN8nTrialResetAction() {
    try {
      await this.sendTelegramMessage(
        '🔄 <b>Resetting n8n Trial...</b>\n\n' +
        'Starting a new 30-day period...'
      );

      const { resetTrialPeriod } = await import('../../../n8n-trial-status.js');

      const newStatus = await resetTrialPeriod('telegram-user');

      const { startDate, endDate, durationDays } = newStatus;

      await this.sendTelegramMessage(
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
      await this.sendTelegramMessage(
        `❌ <b>Trial Reset Failed!</b>\n\n` +
        `<code>${error.message}</code>\n\n` +
        `Please check Supabase connection.`,
        { reply_markup: getSystemManagementKeyboard() }
      );
    }
  }

  /**
   * Handle action_n8n_notifications - Show n8n notification toggle menu
   */
  async handleN8nNotificationsMenu() {
    try {
      await this.sendTelegramMessage('🔍 <b>Checking n8n Notification Settings...</b>');

      const enabled = await this.#getN8nTrialNotificationsSetting();

      const statusText = `
🔔 <b>n8n NOTIFICATION SETTINGS</b>

<b>📊 Daily Trial Notifications:</b>
${enabled ? '✅ Enabled' : '🔕 Disabled'}

<b>📝 Description:</b>
• Enabled: Daily automated Telegram messages are sent
• Disabled: Daily automated messages are silenced
• Manual "🤖 n8n Status" checks will always work

<i>Select to change status:</i>`;

      await this.sendTelegramMessage(statusText, {
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
      await this.sendTelegramMessage(
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
  async handleN8nNotificationsToggle(enabled) {
    try {
      const currentEnabled = await this.#getN8nTrialNotificationsSetting();

      if (currentEnabled === enabled) {
        await this.sendTelegramMessage(
          `ℹ️ <b>n8n Trial Bildirimleri zaten ${enabled ? 'Açık' : 'Kapalı'} durumda!</b>\n\n` +
          `Değişiklik yapılmadı.`,
          { reply_markup: getSystemManagementKeyboard() }
        );
        return;
      }

      await this.#setN8nTrialNotificationsSetting(enabled, 'telegram-user');

      await this.sendTelegramMessage(
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
      await this.sendTelegramMessage(
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
  async handleChatBackendMenu() {
    try {
      await this.sendTelegramMessage('🔍 <b>Checking Chat Backend Status...</b>');

      const currentBackend = await this.#getChatBackendSetting();
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

      await this.sendTelegramMessage(statusText, { reply_markup: keyboard });

    } catch (error) {
      console.error('Chat backend menu error:', error);
      await this.sendTelegramMessage(
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
  async handleChatBackendToggle(newBackend) {
    try {
      const currentBackend = await this.#getChatBackendSetting();

      if (currentBackend === newBackend) {
        await this.sendTelegramMessage(
          `ℹ️ <b>Chat Backend zaten ${newBackend === 'vercel' ? 'Vercel API' : 'n8n Workflow'} olarak ayarlı!</b>\n\n` +
          `Değişiklik yapılmadı.`,
          { reply_markup: getSystemManagementKeyboard() }
        );
        return;
      }

      await this.#setChatBackendSetting(newBackend, 'telegram-user');

      const backendName = newBackend === 'vercel' ? 'Vercel API (chat.js)' : 'n8n Workflow';
      const backendEmoji = newBackend === 'vercel' ? '🟢' : '🔵';
      const features = newBackend === 'vercel'
        ? '• Groq Llama 3.3 70B\n• Ücretsiz\n• Çok hızlı'
        : '• OpenAI GPT-4o-mini\n• Supabase Memory\n• Conversation history';

      await this.sendTelegramMessage(
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
      await this.sendTelegramMessage(
        `❌ <b>Backend Değiştirilemedi!</b>\n\n` +
        `<code>${error.message}</code>\n\n` +
        `Supabase bağlantısını kontrol edin.`,
        { reply_markup: getSystemManagementKeyboard() }
      );
    }
  }

  /**
   * Handle action_github - GitHub Actions status
   */
  async handleGitHubAction() {
    try {
      await this.sendTelegramMessage('🔍 <b>Checking GitHub Actions status...</b>');

      const statuses = await this.#getGitHubWorkflowStatus();

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

      const keyboard = [];

      if (statuses && statuses.length > 0) {
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

      await this.sendTelegramMessage(githubText, {
        reply_markup: { inline_keyboard: keyboard }
      });

    } catch (error) {
      console.error('GitHub action error:', error);
      await this.sendTelegramMessage(
        `❌ <b>Error!</b>\n\n${error.message}\n\n` +
        `Check GITHUB_TOKEN or use /help for support.`
      );
    }
  }

  /**
   * Handle GitHub workflow toggle actions
   */
  async handleGitHubWorkflowToggle(action, workflowFileName) {
    try {
      const enable = action === 'enable';

      const displayName = GITHUB_WORKFLOW_SHORT_DISPLAY_MAP[workflowFileName] || workflowFileName;
      const actionText = enable ? 'aktifleştiriliyor' : 'devre dışı bırakılıyor';

      await this.sendTelegramMessage(`⏳ <b>${displayName} ${actionText}...</b>`);

      await this.#toggleGitHubWorkflow(workflowFileName, enable);

      const statusIcon = enable ? '✅' : '⏸️';
      const statusText = enable ? 'aktifleştirildi' : 'devre dışı bırakıldı';

      await this.sendTelegramMessage(
        `${statusIcon} <b>${displayName} ${statusText}!</b>\n\n` +
        `Workflow artık ${enable ? 'çalışacak' : 'çalışmayacak'}.\n\n` +
        `Durumu kontrol etmek için "Durumu Yenile" butonuna basın.`
      );

      setTimeout(() => {
        this.handleGitHubAction();
      }, 1000);

    } catch (error) {
      console.error('GitHub workflow toggle error:', error);
      await this.sendTelegramMessage(
        `❌ <b>Hata!</b>\n\n${error.message}\n\n` +
        `GITHUB_TOKEN kontrol edin veya workflow dosya adını doğrulayın.`
      );
    }
  }

  /**
   * Set bot commands (run once during setup)
   */
  async setBotCommands() {
    const commands = [
      { command: 'start', description: 'Start Bot' },
      { command: 'menu', description: 'Show Main Menu' },
      { command: 'status', description: 'Quick Status Report' },
      { command: 'scrape', description: 'Run Scraper' },
      { command: 'health', description: 'Health Check' },
      { command: 'help', description: 'Help and Commands' },
    ];

    try {
      await this.callTelegramApi('setMyCommands', { commands });
      console.log('✅ Bot commands set successfully!');
    } catch (error) {
      console.error('❌ Error setting bot commands:', error);
    }
  }

  async #getChatBackendSetting() {
    try {
      const { data, error } = await this.supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'chat_backend')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data?.setting_value || 'vercel';
    } catch (error) {
      console.error('Error getting chat backend setting:', error);
      return 'vercel';
    }
  }

  async #setChatBackendSetting(backend, updatedBy = 'telegram') {
    try {
      const { data, error } = await this.supabase
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

  async #getN8nTrialNotificationsSetting() {
    try {
      const { data, error } = await this.supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'n8n_trial_notifications_enabled')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data?.setting_value) return true;
      return String(data.setting_value).toLowerCase() !== 'false';
    } catch (error) {
      console.error('Error getting n8n trial notification setting:', error);
      return true;
    }
  }

  async #setN8nTrialNotificationsSetting(enabled, updatedBy = 'telegram') {
    try {
      const { data, error } = await this.supabase
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

  async #getGitHubWorkflowStatus() {
    if (!this.config.GITHUB_TOKEN) {
      return null;
    }

    try {
      const [owner, repo] = this.config.GITHUB_REPO.split('/');

      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/actions/workflows`,
        {
          headers: {
            'Authorization': `token ${this.config.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      const statuses = [];

      for (const workflow of data.workflows || []) {
        const fileName = workflow.path.split('/').pop();
        const displayName = GITHUB_WORKFLOW_DISPLAY_MAP[fileName];

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

  async #toggleGitHubWorkflow(workflowFileName, enable) {
    if (!this.config.GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN not configured');
    }

    const [owner, repo] = this.config.GITHUB_REPO.split('/');
    const action = enable ? 'enable' : 'disable';

    const listResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows`,
      {
        headers: {
          'Authorization': `token ${this.config.GITHUB_TOKEN}`,
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

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow.id}/${action}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.config.GITHUB_TOKEN}`,
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
}
