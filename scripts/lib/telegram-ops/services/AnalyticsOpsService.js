/**
 * AnalyticsOpsService — status, stats, database info.
 */

import { getAnalyticsMenuKeyboard } from '../keyboards.js';

export class AnalyticsOpsService {
  constructor(deps) {
    this.sendTelegramMessage = deps.sendTelegramMessage;
    this.callTelegramApi = deps.callTelegramApi;
    this.supabase = deps.supabase;
    this.env = deps.env;
    this.config = deps.config;
  }

  /**
   * Handle Analytics & Data Submenu
   */
  async handleAnalyticsMenu() {
    const text = `
📊 <b>ANALYTICS & DATA</b>

View system data and metrics:
• <b>System Status:</b> Quick overview of total articles and recent updates
• <b>Statistics:</b> Article counts over time and top categories
• <b>Database:</b> Source URLs and general DB health`;

    await this.sendTelegramMessage(text, {
      reply_markup: getAnalyticsMenuKeyboard()
    });
  }

  /**
   * Handle action_status - Quick status
   */
  async handleStatusAction() {
    try {
      const { count } = await this.supabase
        .from('tech_news_articles')
        .select('*', { count: 'exact', head: true });

      const { data: recent } = await this.supabase
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

      await this.sendTelegramMessage(statusText, {
        reply_markup: getAnalyticsMenuKeyboard()
      });
    } catch (error) {
      await this.sendTelegramMessage(`❌ Failed to retrieve status: ${error.message}`);
    }
  }

  /**
   * Handle action_stats - Statistics
   */
  async handleStatsAction() {
    try {
      const { count: totalCount } = await this.supabase
        .from('tech_news_articles')
        .select('*', { count: 'exact', head: true });

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: weekCount } = await this.supabase
        .from('tech_news_articles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { count: dayCount } = await this.supabase
        .from('tech_news_articles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString());

      const { data: categories } = await this.supabase
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

      await this.sendTelegramMessage(statsText, {
        reply_markup: getAnalyticsMenuKeyboard()
      });
    } catch (error) {
      await this.sendTelegramMessage(`❌ Failed to retrieve stats: ${error.message}`);
    }
  }

  /**
   * Handle action_database - Database info
   * Source fix is not available remotely — no Fix Sources button.
   */
  async handleDatabaseAction() {
    try {
      const { count: total } = await this.supabase
        .from('tech_news_articles')
        .select('*', { count: 'exact', head: true });

      const { count: withSource } = await this.supabase
        .from('tech_news_articles')
        .select('*', { count: 'exact', head: true })
        .not('original_source', 'is', null);

      const { count: nullSource } = await this.supabase
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
${nullSource > 0
  ? `⚠️ ${nullSource} records missing source.\n\nSource fix is not available remotely. Contact maintainers.\n\nLocal: npm run fix:original-sources`
  : '✅ All records healthy'}

<b>🔗 Connection</b>
Supabase: ✅ Connected
URL: ${this.env.SUPABASE_URL.substring(0, 30)}...`;

      await this.sendTelegramMessage(dbText, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔙 Analytics Menu', callback_data: 'action_analytics_menu' },
            ],
          ]
        }
      });
    } catch (error) {
      await this.sendTelegramMessage(`❌ Failed to retrieve DB info: ${error.message}`);
    }
  }
}
