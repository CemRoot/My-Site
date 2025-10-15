/**
 * Daily LinkedIn Automation
 * Main script that orchestrates the daily news analysis and LinkedIn posting
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { selectTopArticles, generateTelegramSummary } from './ai-content-generator.js';
import { 
  sendApprovalRequest, 
  sendSuccessNotification, 
  sendErrorNotification, 
  sendDebugInfo,
  sendDailySummary 
} from './telegram-bot.js';

// Configuration
const CONFIG = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  LINKEDIN_ACCESS_TOKEN: process.env.LINKEDIN_ACCESS_TOKEN,
  LINKEDIN_PERSON_ID: process.env.LINKEDIN_PERSON_ID,
  MAX_ARTICLES_PER_DAY: 5,
  MIN_AI_SCORE: parseInt(process.env.MIN_AI_SCORE) || 60, // Lowered from 70 to 60 for better content selection
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://yoursite.com'
};

// Initialize Supabase
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY);

/**
 * Get recent articles from Supabase (last 24 hours)
 */
async function getRecentArticles() {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { data: articles, error } = await supabase
      .from('tech_news_articles')
      .select('*')
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }
    
    console.log(`📊 Found ${articles?.length || 0} articles from last 24 hours`);
    return articles || [];
    
  } catch (error) {
    console.error('❌ Error fetching articles:', error);
    throw error;
  }
}

/**
 * Save LinkedIn posts to database
 */
async function saveLinkedInPosts(articles) {
  try {
    const posts = articles.map(article => ({
      article_id: article.id,
      ai_score: article.ai_score,
      suggested_content: article.suggested_content,
      status: 'pending',
      created_at: new Date().toISOString()
    }));
    
    const { data, error } = await supabase
      .from('linkedin_posts')
      .insert(posts)
      .select();
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log(`💾 Saved ${data.length} posts to database`);
    return data;
    
  } catch (error) {
    console.error('❌ Error saving posts:', error);
    throw error;
  }
}

/**
 * Get approved posts ready for LinkedIn
 */
async function getApprovedPosts() {
  try {
    const { data: posts, error } = await supabase
      .from('linkedin_posts')
      .select(`
        *,
        tech_news_articles (
          id, title, description, slug, category, image_url
        )
      `)
      .eq('status', 'approved')
      .is('posted_at', null)
      .order('ai_score', { ascending: false });
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log(`📤 Found ${posts?.length || 0} approved posts ready for LinkedIn`);
    return posts || [];
    
  } catch (error) {
    console.error('❌ Error fetching approved posts:', error);
    throw error;
  }
}

/**
 * Post to LinkedIn using API
 */
async function postToLinkedIn(post) {
  try {
    const article = post.tech_news_articles;
    const articleUrl = `${CONFIG.SITE_URL}/tech-news/${article.slug}`;
    
    // Use approved content or fallback to suggested content
    const content = post.approved_content || post.suggested_content;
    const fullContent = `${content}\n\n${articleUrl}`;
    
    console.log(`📤 Posting to LinkedIn: ${article.title.substring(0, 50)}...`);
    
    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.LINKEDIN_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify({
        author: `urn:li:person:${CONFIG.LINKEDIN_PERSON_ID}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: fullContent
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`LinkedIn API error: ${response.status} - ${errorData}`);
    }
    
    const result = await response.json();
    
    // Update post status in database
    await supabase
      .from('linkedin_posts')
      .update({ 
        status: 'posted', 
        posted_at: new Date().toISOString() 
      })
      .eq('id', post.id);
    
    console.log(`✅ Successfully posted to LinkedIn: ${result.id}`);
    return result;
    
  } catch (error) {
    console.error(`❌ LinkedIn posting error: ${error.message}`);
    
    // Update post status to failed
    await supabase
      .from('linkedin_posts')
      .update({ status: 'failed' })
      .eq('id', post.id);
    
    throw error;
  }
}

/**
 * Main analysis function - runs at 15:00 UTC
 */
export async function runDailyAnalysis() {
  const startTime = Date.now();
  let stats = {
    analyzedCount: 0,
    selectedCount: 0,
    processingTime: 0
  };
  
  try {
    console.log('🚀 Starting Daily LinkedIn Analysis...');
    console.log('='.repeat(60));
    
    // Send start notification
    await sendSuccessNotification('🔄 Günlük analiz başladı...');
    
    // 1. Get recent articles
    const recentArticles = await getRecentArticles();
    stats.analyzedCount = recentArticles.length;
    
    if (recentArticles.length === 0) {
      console.log('⚠️ No recent articles found');
      await sendSuccessNotification('⚠️ Son 24 saatte yeni haber bulunamadı');
      return;
    }
    
    // 2. Filter articles that haven't been processed yet
    const { data: existingPosts } = await supabase
      .from('linkedin_posts')
      .select('article_id')
      .in('article_id', recentArticles.map(a => a.id));
    
    const existingArticleIds = new Set(existingPosts?.map(p => p.article_id) || []);
    const newArticles = recentArticles.filter(article => !existingArticleIds.has(article.id));
    
    console.log(`📊 New articles to analyze: ${newArticles.length}`);
    
    if (newArticles.length === 0) {
      console.log('ℹ️ All recent articles already analyzed');
      await sendSuccessNotification('ℹ️ Tüm haberler daha önce analiz edilmiş');
      return;
    }
    
    // 3. Analyze articles with AI and select top ones
    const topArticles = await selectTopArticles(newArticles, CONFIG.MAX_ARTICLES_PER_DAY);
    stats.selectedCount = topArticles.length;
    
    // Filter by minimum score
    const qualifiedArticles = topArticles.filter(article => article.ai_score >= CONFIG.MIN_AI_SCORE);
    
    if (qualifiedArticles.length === 0) {
      console.log(`⚠️ No articles meet minimum score threshold (${CONFIG.MIN_AI_SCORE})`);
      
      // Show top scores for debugging
      const topScores = topArticles.slice(0, 3).map(a => `${a.title.substring(0, 40)}... (${a.ai_score})`).join('\n');
      
      await sendSuccessNotification(`⚠️ Bugün hiçbir haber minimum skoru (${CONFIG.MIN_AI_SCORE}) geçemedi

📊 En yüksek skorlar:
${topScores}

💡 Yarın daha ilginç haberler olabilir!`);
      return;
    }
    
    console.log(`🎯 ${qualifiedArticles.length} articles qualified for LinkedIn`);
    
    // 4. Save to database
    await saveLinkedInPosts(qualifiedArticles);
    
    // 5. Generate summary and send approval request
    const summary = await generateTelegramSummary(qualifiedArticles);
    await sendApprovalRequest(qualifiedArticles);
    
    // 6. Send debug info
    stats.processingTime = Date.now() - startTime;
    await sendDebugInfo({
      ...stats,
      duration: `${Math.round(stats.processingTime / 1000)}s`,
      memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Daily analysis completed successfully');
    console.log(`⏰ Processing time: ${Math.round(stats.processingTime / 1000)}s`);
    
  } catch (error) {
    console.error('💥 Fatal error in daily analysis:', error);
    
    await sendErrorNotification(error, {
      workflow: 'daily-analysis',
      status: 'Analysis failed',
      logUrl: process.env.GITHUB_SERVER_URL ? 
        `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : 
        'N/A'
    });
    
    throw error;
  }
}

/**
 * Main posting function - runs at 16:30 UTC (15:30 UTC)
 */
export async function runDailyPosting() {
  const startTime = Date.now();
  let stats = {
    approvedCount: 0,
    postedCount: 0,
    failedCount: 0
  };
  
  try {
    console.log('📤 Starting Daily LinkedIn Posting...');
    console.log('='.repeat(60));
    
    // Get approved posts
    const approvedPosts = await getApprovedPosts();
    stats.approvedCount = approvedPosts.length;
    
    if (approvedPosts.length === 0) {
      console.log('ℹ️ No approved posts found for today');
      await sendSuccessNotification(`ℹ️ Bugün onaylanmış haber bulunamadı

📱 Manuel paylaşım sistemi aktif:
1. Günlük analiz sonuçlarını Telegram'dan alın
2. Hazır içerikleri kopyalayın  
3. LinkedIn'e manuel olarak yapıştırın
4. "MANUEL PAYLAŞTIM" butonuna basın

⏰ Bir sonraki analiz: Yarın 16:00`);
      return;
    }
    
    console.log(`📊 Processing ${approvedPosts.length} approved posts...`);
    
    // Post each approved article to LinkedIn
    for (const post of approvedPosts) {
      try {
        await postToLinkedIn(post);
        stats.postedCount++;
        
        // Rate limiting - wait between posts
        await new Promise(resolve => setTimeout(resolve, 5000));
        
      } catch (error) {
        console.error(`❌ Failed to post: ${error.message}`);
        stats.failedCount++;
        
        // Continue with next post
        continue;
      }
    }
    
    // Send completion notification
    const completionMessage = `📊 LinkedIn gönderim tamamlandı!
✅ Başarılı: ${stats.postedCount}
❌ Başarısız: ${stats.failedCount}
⏰ Süre: ${Math.round((Date.now() - startTime) / 1000)}s`;
    
    await sendSuccessNotification(completionMessage);
    
    // Send daily summary
    await sendDailySummary({
      ...stats,
      processingTime: `${Math.round((Date.now() - startTime) / 1000)}s`
    });
    
    console.log('✅ Daily posting completed');
    
  } catch (error) {
    console.error('💥 Fatal error in daily posting:', error);
    
    await sendErrorNotification(error, {
      workflow: 'daily-posting',
      status: 'Posting failed',
      logUrl: process.env.GITHUB_SERVER_URL ? 
        `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : 
        'N/A'
    });
    
    throw error;
  }
}

/**
 * Manual trigger function for testing
 */
export async function runManualTest() {
  console.log('🧪 Running manual test...');
  
  try {
    // Run analysis only (no posting)
    await runDailyAnalysis();
    console.log('✅ Manual test completed successfully');
  } catch (error) {
    console.error('❌ Manual test failed:', error);
    process.exit(1);
  }
}

// CLI handling
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  switch (command) {
    case 'analyze':
      runDailyAnalysis().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
      });
      break;
      
    case 'post':
      runDailyPosting().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
      });
      break;
      
    case 'test':
      runManualTest();
      break;
      
    default:
      console.log('Usage: node daily-linkedin-automation.js [analyze|post|test]');
      process.exit(1);
  }
}
