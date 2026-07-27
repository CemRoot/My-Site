/**
 * ScraperOpsService — scrape trigger, manual add/delete article flows.
 */

import {
  getMainMenuKeyboard,
  getScraperMenuKeyboard,
} from '../keyboards.js';

export class ScraperOpsService {
  constructor(deps) {
    this.sendTelegramMessage = deps.sendTelegramMessage;
    this.callTelegramApi = deps.callTelegramApi;
    this.supabase = deps.supabase;
    this.env = deps.env;
    this.config = deps.config;
  }

  /**
   * Handle Scraper & Content Submenu
   */
  async handleScraperMenu() {
    const text = `
📡 <b>SCRAPER & CONTENT</b>

Manage content gathering and articles:
• <b>Run Scraper:</b> Trigger GitHub Action to scrape new tech news
• <b>Manual Add:</b> Provide a URL to add a specific article
• <b>Delete:</b> Remove an existing article`;

    await this.sendTelegramMessage(text, {
      reply_markup: getScraperMenuKeyboard()
    });
  }

  /**
   * Handle action_scrape - Trigger news scraping via GitHub Actions only
   */
  async handleScrapeAction() {
    try {
      if (!this.config.GITHUB_TOKEN) {
        await this.sendTelegramMessage(
          '❌ <b>GITHUB_TOKEN not configured</b>\n\n' +
          'Set the <code>GITHUB_TOKEN</code> environment variable to trigger the scraper via GitHub Actions.\n' +
          'Local spawn fallback is not supported in this environment.'
        );
        return;
      }

      const [owner, repo] = this.config.GITHUB_REPO.split('/');
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/actions/workflows/scrape-tech-news.yml/dispatches`,
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
          '🔄 <b>Tech News Scraper Started</b>\n\n' +
          '📊 GitHub Actions workflow has been triggered.\n' +
          '⏳ You will receive a summary when the process completes.'
        );
      } else {
        throw new Error(`GitHub API error: ${response.status}`);
      }
    } catch (error) {
      await this.sendTelegramMessage(`❌ <b>Error!</b>\n\n${error.message}`);
    }
  }

  /**
   * Handle action_add_article - Start manual article addition flow
   */
  async handleAddArticleAction(userId) {
    try {
      const { setConversationState } = await import('../../../../lib/conversation-state.js');
      await setConversationState(userId, 'awaiting_url');

      await this.sendTelegramMessage(
        '➕ <b>Manuel Haber Ekleme</b>\n\n' +
        '📎 Lütfen eklemek istediğiniz haberin URL\'sini gönderin:\n\n' +
        '<i>Örnek: https://techcrunch.com/article-123</i>\n\n' +
        '⏱️ 10 dakika içinde işlem yapmazsanız süreç iptal olur.'
      );
    } catch (error) {
      console.error('Add article action error:', error);
      await this.sendTelegramMessage(
        `❌ <b>Hata!</b>\n\n${error.message}\n\nLütfen tekrar deneyin veya /help ile destek alın.`
      );
    }
  }

  /**
   * Handle article URL input
   */
  async handleArticleUrlInput(url, userId) {
    try {
      const { getConversationState, setConversationState, deleteConversationState } = await import('../../../../lib/conversation-state.js');

      const state = await getConversationState(userId);
      if (!state || state.step !== 'awaiting_url') {
        return;
      }

      const { isValidUrl } = await import('../../../manual-article-scraper.js');
      if (!isValidUrl(url)) {
        await this.sendTelegramMessage(
          '❌ <b>Geçersiz URL formatı!</b>\n\n' +
          'Lütfen geçerli bir URL gönderin:\n' +
          '<i>Örnek: https://techcrunch.com/article-123</i>'
        );
        return;
      }

      await setConversationState(userId, 'confirm_source', { articleUrl: url });

      await this.sendTelegramMessage(
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
      await this.sendTelegramMessage(
        `❌ <b>Hata!</b>\n\n${error.message}\n\nLütfen tekrar deneyin.`
      );
      const { deleteConversationState } = await import('../../../../lib/conversation-state.js');
      await deleteConversationState(userId);
    }
  }

  /**
   * Handle source confirmation
   */
  async handleSourceConfirmation(useOriginal, userId) {
    try {
      const { getConversationState, setConversationState, deleteConversationState } = await import('../../../../lib/conversation-state.js');

      const state = await getConversationState(userId);
      if (!state || state.step !== 'confirm_source') {
        await this.sendTelegramMessage('❌ Oturum zaman aşımına uğradı. Lütfen /menu ile tekrar başlayın.');
        await deleteConversationState(userId);
        return;
      }

      if (useOriginal) {
        await deleteConversationState(userId);

        try {
          await this.#triggerGitHubActionsWorkflow(state.article_url, state.article_url, userId);

          await this.sendTelegramMessage(
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
          await this.sendTelegramMessage(
            `❌ <b>İşlem Başlatılamadı!</b>\n\n` +
            `<code>${error.message}</code>\n\n` +
            'Lütfen tekrar deneyin veya /help ile destek alın.',
            {
              reply_markup: getMainMenuKeyboard()
            }
          );
        }
      } else {
        await setConversationState(userId, 'awaiting_original_source', { articleUrl: state.article_url });

        await this.sendTelegramMessage(
          '📝 <b>Original Source URL\'ini girin:</b>\n\n' +
          '<i>Örnek: https://originalsource.com/article</i>\n\n' +
          '⏱️ 10 dakika içinde göndermezsaniz işlem iptal olur.'
        );
      }
    } catch (error) {
      console.error('Source confirmation error:', error);
      await this.sendTelegramMessage(
        `❌ <b>Hata Oluştu!</b>\n\n${error.message}\n\n` +
        'Lütfen tekrar deneyin veya /help ile destek alın.',
        {
          reply_markup: getMainMenuKeyboard()
        }
      );
      const { deleteConversationState } = await import('../../../../lib/conversation-state.js');
      await deleteConversationState(userId);
    }
  }

  /**
   * Handle original source URL input
   */
  async handleOriginalSourceInput(originalUrl, userId, articleUrl) {
    try {
      const { getConversationState, deleteConversationState } = await import('../../../../lib/conversation-state.js');

      const state = await getConversationState(userId);
      if (!state || state.step !== 'awaiting_original_source') {
        return;
      }

      const { isValidUrl } = await import('../../../manual-article-scraper.js');
      if (!isValidUrl(originalUrl)) {
        await this.sendTelegramMessage(
          '❌ <b>Geçersiz URL formatı!</b>\n\n' +
          'Lütfen geçerli bir URL gönderin:\n' +
          '<i>Örnek: https://originalsource.com/article</i>'
        );
        return;
      }

      await deleteConversationState(userId);

      try {
        await this.#triggerGitHubActionsWorkflow(state.article_url, originalUrl, userId);

        await this.sendTelegramMessage(
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
        await this.sendTelegramMessage(
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
      await this.sendTelegramMessage(
        `❌ <b>Hata Oluştu!</b>\n\n${error.message}\n\n` +
        'Lütfen tekrar deneyin veya /help ile destek alın.',
        {
          reply_markup: getMainMenuKeyboard()
        }
      );
      const { deleteConversationState } = await import('../../../../lib/conversation-state.js');
      await deleteConversationState(userId);
    }
  }

  /**
   * Handle action_delete_article - Start delete article flow
   */
  async handleDeleteArticleAction(userId) {
    try {
      const { setConversationState } = await import('../../../../lib/conversation-state.js');
      await setConversationState(userId, 'awaiting_delete_url');

      await this.sendTelegramMessage(
        '🗑️ <b>Haber Silme</b>\n\n' +
        '📎 Silmek istediğiniz haberin linkini gönderin:\n\n' +
        '<i>Örnek: https://cemkoyluoglu.codes/tech-news/article-slug</i>\n\n' +
        '💡 Doğrudan link gönderirseniz de otomatik algılanır.\n' +
        '⏱️ 10 dakika içinde göndermezsaniz işlem iptal olur.'
      );
    } catch (error) {
      console.error('Delete article action error:', error);
      await this.sendTelegramMessage(`❌ <b>Hata!</b>\n\n${error.message}`);
    }
  }

  /**
   * Handle delete article URL input — auto-detected or from conversation flow
   */
  async handleDeleteUrlInput(url, userId) {
    try {
      const { deleteConversationState } = await import('../../../../lib/conversation-state.js');

      const siteMatch = url.match(/cemkoyluoglu\.codes\/tech-news\/([a-z0-9][a-z0-9-]*)/i);
      if (!siteMatch) {
        await this.sendTelegramMessage(
          '❌ <b>Geçersiz link!</b>\n\n' +
          'Lütfen geçerli bir haber linki gönderin:\n' +
          '<i>https://cemkoyluoglu.codes/tech-news/article-slug</i>'
        );
        return;
      }

      const slug = siteMatch[1];
      await deleteConversationState(userId);

      const { data: article, error } = await this.supabase
        .from('tech_news_articles')
        .select('id, title, slug, category')
        .eq('slug', slug)
        .single();

      if (error || !article) {
        await this.sendTelegramMessage(
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

      await this.sendTelegramMessage(
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
      await this.sendTelegramMessage(`❌ <b>Hata!</b>\n\n${error.message}`);
      const { deleteConversationState } = await import('../../../../lib/conversation-state.js');
      await deleteConversationState(userId);
    }
  }

  /**
   * Handle delete article confirmation callback
   */
  async handleDeleteArticleConfirm(articleId) {
    try {
      const { data: deleted, error } = await this.supabase
        .from('tech_news_articles')
        .delete()
        .eq('id', articleId)
        .select('title')
        .single();

      if (error) {
        await this.sendTelegramMessage(`❌ <b>Silme hatası!</b>\n\n<code>${error.message}</code>`);
        return;
      }

      if (!deleted) {
        await this.sendTelegramMessage(
          '❌ <b>Haber bulunamadı!</b>\n\nZaten silinmiş olabilir.',
          { reply_markup: getMainMenuKeyboard() }
        );
        return;
      }

      const titlePreview = deleted.title.length > 60
        ? deleted.title.substring(0, 60) + '...'
        : deleted.title;

      await this.sendTelegramMessage(
        `✅ <b>Haber Silindi!</b>\n\n📰 "${titlePreview}"`,
        { reply_markup: getMainMenuKeyboard() }
      );
    } catch (error) {
      console.error('Delete article confirm error:', error);
      await this.sendTelegramMessage(`❌ <b>Silme hatası!</b>\n\n<code>${error.message}</code>`);
    }
  }

  /**
   * Trigger GitHub Actions workflow to process article
   */
  async #triggerGitHubActionsWorkflow(articleUrl, originalSourceUrl, userId) {
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
}
