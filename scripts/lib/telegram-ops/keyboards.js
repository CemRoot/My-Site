/**
 * Telegram bot menu keyboard layouts.
 * Shared across all menu handler modules.
 */

export function getMainMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '📡 Scraper & Content', callback_data: 'action_scraper_menu' },
      ],
      [
        { text: '📱 Social Media', callback_data: 'action_social_menu' },
      ],
      [
        { text: '📊 Analytics & Data', callback_data: 'action_analytics_menu' },
      ],
      [
        { text: '⚙️ System Management', callback_data: 'action_system_management' },
      ],
      [
        { text: 'ℹ️ Help & Info', callback_data: 'action_help' },
      ],
    ],
  };
}

export function getScraperMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🚀 Run Scraper', callback_data: 'action_scrape' },
      ],
      [
        { text: '➕ Manual Add Article', callback_data: 'action_add_article' },
        { text: '🗑️ Delete Article', callback_data: 'action_delete_article' },
      ],
      [
        { text: '🔙 Main Menu', callback_data: 'action_refresh_menu' },
      ],
    ],
  };
}

export function getSocialMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '📱 LinkedIn Digests', callback_data: 'action_linkedin' },
      ],
      [
        { text: '🔵 LinkedIn Groups', callback_data: 'action_linkedin_groups' },
      ],
      [
        { text: '🔙 Main Menu', callback_data: 'action_refresh_menu' },
      ],
    ],
  };
}

export function getAnalyticsMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '📊 System Status', callback_data: 'action_status' },
      ],
      [
        { text: '📈 Statistics', callback_data: 'action_stats' },
        { text: '💾 Database', callback_data: 'action_database' },
      ],
      [
        { text: '🔙 Main Menu', callback_data: 'action_refresh_menu' },
      ],
    ],
  };
}

export function getSystemManagementKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🏥 Health Check', callback_data: 'action_health' },
        { text: '🔧 GitHub Actions', callback_data: 'action_github' },
      ],
      [
        { text: '🤖 n8n Status', callback_data: 'action_n8n_status' },
        { text: '🔁 n8n Trial Reset', callback_data: 'action_n8n_trial_reset' },
      ],
      [
        { text: '🔔 n8n Notifications', callback_data: 'action_n8n_notifications' },
        { text: '🔄 Webhook Reset', callback_data: 'action_webhook_reset' },
      ],
      [
        { text: '🔀 Chat Backend', callback_data: 'action_chat_backend' },
      ],
      [
        { text: '🔙 Main Menu', callback_data: 'action_refresh_menu' },
      ],
    ],
  };
}
