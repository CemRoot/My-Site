import { supabase } from './lib/supabaseAdmin.js';
import { notifyTelegram } from './lib/telegram.js';

/**
 * Main cleanup function
 */
async function cleanupOldArticles() {
  console.log('Starting old articles cleanup...');

  // Calculate the date 30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoffDate = thirtyDaysAgo.toISOString();

  console.log(`Deleting articles older than: ${cutoffDate}`);

  let totalDeletedTechNews = 0;
  let totalDeletedRejected = 0;

  try {
    // 1. Delete from tech_news_articles
    // Note: Supabase free tier might have limits on how many rows can be deleted at once,
    // but typically a simple delete with a filter works well.
    const { data: deletedTechNews, error: techNewsError } = await supabase
      .from('tech_news_articles')
      .delete()
      .lt('created_at', cutoffDate)
      .select('id');

    if (techNewsError) {
      throw new Error(`Failed to delete from tech_news_articles: ${techNewsError.message}`);
    }

    totalDeletedTechNews = deletedTechNews?.length || 0;
    console.log(`Successfully deleted ${totalDeletedTechNews} old articles from tech_news_articles.`);

    // 2. Delete from rejected_articles (column is scraped_at, not created_at)
    const { data: deletedRejected, error: rejectedError } = await supabase
      .from('rejected_articles')
      .delete()
      .lt('scraped_at', cutoffDate)
      .select('id');

    if (rejectedError) {
      throw new Error(`Failed to delete from rejected_articles: ${rejectedError.message}`);
    }

    totalDeletedRejected = deletedRejected?.length || 0;
    console.log(`Successfully deleted ${totalDeletedRejected} old articles from rejected_articles.`);

    // 3. Send Telegram Notification
    const message = `
🧹 <b>Database Cleanup Complete</b>

I have successfully cleaned up old articles from the database.

<b>Stats:</b>
• <b>Tech News Deleted:</b> ${totalDeletedTechNews}
• <b>Rejected Articles Deleted:</b> ${totalDeletedRejected}
• <b>Cutoff Date:</b> ${thirtyDaysAgo.toDateString()}

<i>This runs automatically every Monday to keep the database healthy.</i>
    `.trim();

    await notifyTelegram(message);

    // Also output for GitHub Actions log parsing if needed
    console.log(`::set-output name=tech_news_deleted::${totalDeletedTechNews}`);
    console.log(`::set-output name=rejected_deleted::${totalDeletedRejected}`);

  } catch (error) {
    console.error('Error during cleanup:', error.message);

    const errorMessage = `
❌ <b>Database Cleanup Failed</b>

An error occurred while trying to clean up old articles.
<b>Error:</b> ${error.message}
    `.trim();

    await notifyTelegram(errorMessage);
    process.exit(1);
  }
}

// Run the cleanup
cleanupOldArticles();
