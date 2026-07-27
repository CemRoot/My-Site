/**
 * ConversationFlowService — start / menu / help navigation.
 */

import { getMainMenuKeyboard } from '../keyboards.js';

export class ConversationFlowService {
  constructor(deps) {
    this.sendTelegramMessage = deps.sendTelegramMessage;
    this.callTelegramApi = deps.callTelegramApi;
    this.supabase = deps.supabase;
    this.env = deps.env;
    this.config = deps.config;
  }

  /**
   * Handle /start command
   */
  async handleStartCommand() {
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

    await this.sendTelegramMessage(welcomeText, {
      reply_markup: getMainMenuKeyboard()
    });
  }

  /**
   * Handle /menu command
   */
  async handleMenuCommand() {
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

    await this.sendTelegramMessage(menuText, {
      reply_markup: getMainMenuKeyboard()
    });
  }

  /**
   * Handle action_help - Help and commands
   */
  async handleHelpAction() {
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

    await this.sendTelegramMessage(helpText, {
      reply_markup: getMainMenuKeyboard()
    });
  }
}
