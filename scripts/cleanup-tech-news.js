import { createClient } from '@supabase/supabase-js';

// Required environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Sends a notification to Telegram
 */
async function sendTelegramNotification(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('Telegram credentials not found, skipping notification.');
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      console.error(`Failed to send Telegram message: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending Telegram message:', error.message);
  }
}

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

    // 2. Delete from rejected_articles
    const { data: deletedRejected, error: rejectedError } = await supabase
      .from('rejected_articles')
      .delete()
      .lt('created_at', cutoffDate)
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

    await sendTelegramNotification(message);

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

    await sendTelegramNotification(errorMessage);
    process.exit(1);
  }
}

// Run the cleanup
cleanupOldArticles();
