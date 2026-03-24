import { supabase } from './lib/supabaseAdmin.js';
import { notifyTelegram } from './lib/telegram.js';
import { writeJsonArtifact } from './lib/config.js';

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
    const { data: oldTechNewsRows, error: oldTechNewsError } = await supabase
      .from('tech_news_articles')
      .select('id, slug, title, source_url, category, created_at')
      .lt('created_at', cutoffDate);

    if (oldTechNewsError) {
      throw new Error(`Failed to load deletable tech_news_articles: ${oldTechNewsError.message}`);
    }

    const { data: oldRejectedRows, error: oldRejectedLoadError } = await supabase
      .from('rejected_articles')
      .select('id, title, source_url, original_source, reason, scraped_at')
      .lt('scraped_at', cutoffDate);

    if (oldRejectedLoadError) {
      throw new Error(`Failed to load deletable rejected_articles: ${oldRejectedLoadError.message}`);
    }

    if ((oldTechNewsRows?.length || 0) + (oldRejectedRows?.length || 0) > 0) {
      const snapshotPath = await writeJsonArtifact('tech-news-retention-cleanup-batch', {
        version: 1,
        type: 'tech-news-cleanup-batch',
        cleanupKind: 'retention',
        startedAt: new Date().toISOString(),
        dryRun: false,
        cutoffDate,
        metrics: {
          techNewsMarkedForDeletion: oldTechNewsRows?.length || 0,
          rejectedMarkedForDeletion: oldRejectedRows?.length || 0,
        },
        batches: {
          deleted: [
            ...(oldTechNewsRows || []).map(row => ({
              table: 'tech_news_articles',
              id: row.id,
              slug: row.slug,
              title: row.title,
              source_url: row.source_url,
              category: row.category,
              created_at: row.created_at,
              reason: `Older than retention cutoff ${cutoffDate}`,
            })),
            ...(oldRejectedRows || []).map(row => ({
              table: 'rejected_articles',
              id: row.id,
              title: row.title,
              source_url: row.source_url,
              original_source: row.original_source,
              scraped_at: row.scraped_at,
              reason: row.reason || `Older than retention cutoff ${cutoffDate}`,
            })),
          ],
        },
      });

      console.log(`🧾 Cleanup snapshot saved: ${snapshotPath}`);
    }

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
