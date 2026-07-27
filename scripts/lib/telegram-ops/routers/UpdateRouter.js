/**
 * UpdateRouter — Telegram webhook update dispatcher.
 * Auth helpers + message/callback routing for TelegramOpsBot.
 */

import crypto from 'crypto';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class UpdateRouter {
  constructor(bot) {
    this.bot = bot;
    this.processedCallbacks = new Map();
    this.rateLimitCache = new Map();
  }

  webhookSecretOk(req) {
    const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (!expected || !String(expected).trim()) {
      console.error('TELEGRAM_WEBHOOK_SECRET is not configured — rejecting webhook request');
      return false;
    }
    const provided = req.headers['x-telegram-bot-api-secret-token'];
    if (!provided || typeof provided !== 'string') {
      return false;
    }
    const a = Buffer.from(provided, 'utf8');
    const b = Buffer.from(String(expected).trim(), 'utf8');
    if (a.length !== b.length) {
      return false;
    }
    try {
      return crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  checkRateLimit(userId, maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
    const userKey = `user_${userId}`;

    if (!this.rateLimitCache.has(userKey)) {
      this.rateLimitCache.set(userKey, []);
    }

    const requests = this.rateLimitCache.get(userKey).filter(time => now - time < windowMs);

    if (requests.length >= maxRequests) {
      return false;
    }

    requests.push(now);
    this.rateLimitCache.set(userKey, requests);
    return true;
  }

  isValidUUID(uuid) {
    return UUID_REGEX.test(uuid);
  }

  /**
   * Process a Telegram update.
   * @param {object} update
   * @param {{ chatIdAllowed?: (chatId: string|number) => boolean }} options
   * @returns {Promise<{ success: boolean, message: string, httpStatus?: number }>}
   */
  async handle(update, { chatIdAllowed } = {}) {
    if (!update) {
      return { success: false, message: 'No update data received', httpStatus: 400 };
    }

    const allowed =
      chatIdAllowed ||
      ((chatId) => chatId.toString() === (process.env.TELEGRAM_CHAT_ID || '').trim());

    if (update.message && update.message.text) {
      return this.#handleMessage(update.message, allowed);
    }

    if (update.callback_query) {
      return this.#handleCallback(update.callback_query, allowed);
    }

    return { success: true, message: 'Webhook processed successfully' };
  }

  async #handleMessage(message, allowed) {
    const chatId = message.chat.id;
    const text = message.text;
    const bot = this.bot;

    if (!allowed(chatId)) {
      console.warn(
        `Unauthorized Telegram message from chat ID: ${chatId} (env TELEGRAM_CHAT_ID must match this chat; private: user id, group: often -100…).`,
      );
      return { success: false, message: 'Unauthorized chat ID' };
    }

    try {
      if (text.startsWith('/')) {
        const command = text.split(' ')[0].substring(1).toLowerCase();

        switch (command) {
          case 'start':
            await bot.handleStartCommand();
            break;
          case 'menu':
            await bot.handleMenuCommand();
            break;
          case 'linkedin':
            await bot.handleLinkedInCommand();
            break;
          case 'status':
            await bot.handleStatusAction();
            break;
          case 'scrape':
            await bot.handleScrapeAction();
            break;
          case 'health':
            await bot.handleHealthAction();
            break;
          case 'help':
            await bot.handleHelpAction();
            break;
          default:
            await bot.sendTelegramMessage(
              `❓ Unknown command: ${command}\n\nType /help for available commands`
            );
        }

        return { success: true, message: 'Command processed' };
      }

      const userId = message.from.id;

      if (/cemkoyluoglu\.codes\/tech-news\/[a-z0-9-]+/i.test(text)) {
        await bot.handleDeleteUrlInput(text, userId);
        return { success: true, message: 'Delete article flow initiated' };
      }

      const { getConversationState } = await import('../../../../lib/conversation-state.js');
      const state = await getConversationState(userId);

      if (state) {
        if (state.step === 'awaiting_url') {
          await bot.handleArticleUrlInput(text, userId);
        } else if (state.step === 'awaiting_original_source') {
          await bot.handleOriginalSourceInput(text, userId, state.article_url);
        } else if (state.step === 'awaiting_digest_edit') {
          await bot.handleDigestEditInput(text, userId, state.digest_id);
        } else if (state.step === 'awaiting_delete_url') {
          await bot.handleDeleteUrlInput(text, userId);
        }

        return { success: true, message: 'Conversation message processed' };
      }

      return { success: true, message: 'Command processed' };
    } catch (error) {
      console.error('❌ Command handler error:', error);
      return { success: false, message: 'Internal server error', httpStatus: 500 };
    }
  }

  async #handleCallback(callback_query, allowed) {
    const chatId = callback_query.message.chat.id;
    const data = callback_query.data;
    const fromId = callback_query.from.id;
    const bot = this.bot;
    const callTelegramApi = bot.callTelegramApi;

    if (!allowed(chatId)) {
      console.warn(
        `Unauthorized Telegram callback from chat ID: ${chatId} (env TELEGRAM_CHAT_ID must match this chat).`,
      );
      return { success: false, message: 'Unauthorized chat ID' };
    }

    try {
      if (data.startsWith('action_')) {
        const action = data.replace('action_', '');

        await callTelegramApi('answerCallbackQuery', {
          callback_query_id: callback_query.id,
          text: 'İşlem yapılıyor...',
        });

        const actionMap = {
          scraper_menu: () => bot.handleScraperMenu(),
          social_menu: () => bot.handleSocialMenu(),
          analytics_menu: () => bot.handleAnalyticsMenu(),
          scrape: () => bot.handleScrapeAction(),
          linkedin: () => bot.handleLinkedInCommand(),
          create_digest: () => bot.handleCreateDigestAction(),
          clean_pending: () => bot.handleCleanPendingAction(),
          confirm_clean: () => bot.handleConfirmCleanAction(),
          health: () => bot.handleHealthAction(),
          status: () => bot.handleStatusAction(),
          stats: () => bot.handleStatsAction(),
          database: () => bot.handleDatabaseAction(),
          github: () => bot.handleGitHubAction(),
          help: () => bot.handleHelpAction(),
          refresh_menu: () => bot.handleMenuCommand(),
          menu: () => bot.handleMenuCommand(),
          add_article: () => bot.handleAddArticleAction(fromId),
          system_management: () => bot.handleSystemManagementMenu(),
          n8n_status: () => bot.handleN8nStatusAction(),
          webhook_reset: () => bot.handleWebhookResetAction(),
          n8n_trial_reset: () => bot.handleN8nTrialResetAction(),
          chat_backend: () => bot.handleChatBackendMenu(),
          n8n_notifications: () => bot.handleN8nNotificationsMenu(),
          delete_article: () => bot.handleDeleteArticleAction(fromId),
          linkedin_groups: () => bot.handleLinkedInGroupsDigest(),
        };

        const handler = actionMap[action];
        if (handler) {
          await handler();
        } else {
          await bot.sendTelegramMessage('❓ Bilinmeyen aksiyon');
        }

        return { success: true, message: 'Menu action processed' };
      }

      if (data.startsWith('chat_backend_')) {
        const backend = data.replace('chat_backend_', '');

        await callTelegramApi('answerCallbackQuery', {
          callback_query_id: callback_query.id,
          text: 'Backend değiştiriliyor...',
        });

        await bot.handleChatBackendToggle(backend);
        return { success: true, message: 'Chat backend toggle processed' };
      }

      if (data.startsWith('n8n_notifications_')) {
        const mode = data.replace('n8n_notifications_', '');
        if (mode !== 'on' && mode !== 'off') {
          await callTelegramApi('answerCallbackQuery', {
            callback_query_id: callback_query.id,
            text: 'Geçersiz bildirim ayarı',
            show_alert: false,
          });
          return { success: false, message: 'Invalid n8n notifications mode' };
        }

        const enabled = mode === 'on';

        await callTelegramApi('answerCallbackQuery', {
          callback_query_id: callback_query.id,
          text: 'Bildirim ayarı güncelleniyor...',
        });

        await bot.handleN8nNotificationsToggle(enabled);
        return { success: true, message: 'n8n notifications toggle processed' };
      }

      if (data.startsWith('github_')) {
        const parts = data.split('_');
        if (parts.length === 3) {
          const [, action, workflowName] = parts;

          await callTelegramApi('answerCallbackQuery', {
            callback_query_id: callback_query.id,
            text: 'İşlem yapılıyor...',
          });

          await bot.handleGitHubWorkflowToggle(action, workflowName);
          return { success: true, message: 'GitHub workflow toggle processed' };
        }
      }

      if (data.startsWith('delete_confirm_')) {
        const articleId = data.replace('delete_confirm_', '');

        await callTelegramApi('answerCallbackQuery', {
          callback_query_id: callback_query.id,
          text: 'Siliniyor...',
        });

        await bot.handleDeleteArticleConfirm(articleId);
        return { success: true, message: 'Article deleted' };
      }

      if (data.startsWith('source_')) {
        const [, confirmation] = data.split('_');

        await callTelegramApi('answerCallbackQuery', {
          callback_query_id: callback_query.id,
          text: 'İşleniyor...',
        });

        if (confirmation === 'yes' || confirmation === 'no') {
          await bot.handleSourceConfirmation(confirmation === 'yes', fromId);
        }

        return { success: true, message: 'Source confirmation processed' };
      }

      if (data.match(/^(approve|reject|edit|view)_[0-9a-f-]+$/i)) {
        return bot.handleDigestCallback(callback_query, {
          checkRateLimit: (userId, max, window) => this.checkRateLimit(userId, max, window),
          isValidUUID: (uuid) => this.isValidUUID(uuid),
          processedCallbacks: this.processedCallbacks,
        });
      }

      await callTelegramApi('answerCallbackQuery', {
        callback_query_id: callback_query.id,
        text: 'Geçersiz işlem',
        show_alert: false,
      });
      return { success: false, message: 'Unknown callback' };
    } catch (error) {
      console.error('❌ Telegram webhook handler error:', error.message);
      try {
        await bot.sendTelegramMessage(`🚨 Webhook hatası: ${error.message}`);
      } catch (telegramError) {
        console.error('Failed to send Telegram error message:', telegramError.message);
      }
      return { success: false, message: 'Internal server error', httpStatus: 500 };
    }
  }
}
