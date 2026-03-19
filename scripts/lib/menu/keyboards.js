/**
 * Telegram bot menu keyboard layouts.
 * Shared across all menu handler modules.
 */

export function getMainMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '📰 Haberleri Çek', callback_data: 'action_scrape' },
        { text: '➕ Manuel Ekle', callback_data: 'action_add_article' },
      ],
      [
        { text: '🗑️ Haber Sil', callback_data: 'action_delete_article' },
      ],
      [
        { text: '📱 LinkedIn', callback_data: 'action_linkedin' },
        { text: '🔵 LinkedIn Groups', callback_data: 'action_linkedin_groups' },
      ],
      [
        { text: '🔧 Sistem Yönetimi', callback_data: 'action_system_management' },
        { text: '📊 Durum', callback_data: 'action_status' },
      ],
      [
        { text: '📈 İstatistikler', callback_data: 'action_stats' },
        { text: '💾 Veritabanı', callback_data: 'action_database' },
      ],
      [
        { text: 'ℹ️ Yardım', callback_data: 'action_help' },
      ],
    ],
  };
}

export function getSystemManagementKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🤖 n8n Durumu', callback_data: 'action_n8n_status' },
        { text: '🔄 Webhook Reset', callback_data: 'action_webhook_reset' },
      ],
      [
        { text: '🔁 n8n Trial Sıfırla', callback_data: 'action_n8n_trial_reset' },
        { text: '🔀 Chat Backend', callback_data: 'action_chat_backend' },
      ],
      [
        { text: '🏥 Sağlık Kontrolü', callback_data: 'action_health' },
        { text: '🔧 GitHub Actions', callback_data: 'action_github' },
      ],
      [
        { text: '🔙 Ana Menü', callback_data: 'action_refresh_menu' },
      ],
    ],
  };
}
