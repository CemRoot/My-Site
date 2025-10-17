/**
 * Fix Missing Original Sources (Improved Version)
 * 
 * Re-scrapes Nuvemmag articles to extract original source URLs
 * Uses the improved extraction logic with 3-strategy approach
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const CONFIG = {
  FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY || '',
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  RATE_LIMIT_DELAY: 8000, // 8 seconds between requests (Firecrawl free tier)
};

// Initialize Supabase
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY);

/**
 * Extract original source from Nuvemmag article using improved 3-strategy approach
 */
async function extractOriginalSource(nuvemmagUrl) {
  console.log(`\n🔍 Re-scraping: ${nuvemmagUrl}`);
  
  try {
    // Scrape with Firecrawl
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        url: nuvemmagUrl,
        formats: ['markdown'],
        onlyMainContent: true
      })
    });

    if (!response.ok) {
      throw new Error(`Firecrawl API error: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success || !result.data || !result.data.markdown) {
      throw new Error('No markdown returned');
    }

    const markdown = result.data.markdown;
    let extractedSource = null;
    
    // ============================================
    // THREE-STRATEGY EXTRACTION
    // ============================================
    
    // Strategy 1: Look for "Kaynak:" followed by URL
    const kaynakMatch = markdown.match(/Kaynak:\s*(?:\[([^\]]+)\]\()?([^\s\)<>\]]+)(?:\))?/i);
    if (kaynakMatch) {
      extractedSource = kaynakMatch[2];
      console.log(`  ✅ Strategy 1 (Kaynak): ${extractedSource}`);
      return extractedSource;
    }
    
    // Strategy 2: Search for markdown links (excluding social media)
    const allLinks = markdown.match(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g) || [];
    for (const linkMatch of allLinks) {
      const urlMatch = linkMatch.match(/\((https?:\/\/[^\)]+)\)/);
      if (urlMatch) {
        const linkUrl = urlMatch[1];
        if (!linkUrl.includes('nuvemmag.com') && 
            !linkUrl.includes('twitter.com') && 
            !linkUrl.includes('x.com') &&
            !linkUrl.includes('youtube.com') && 
            !linkUrl.includes('youtu.be') &&
            !linkUrl.includes('tiktok.com') &&
            !linkUrl.includes('instagram.com') &&
            !linkUrl.includes('facebook.com') &&
            !linkUrl.includes('linkedin.com')) {
          extractedSource = linkUrl;
          console.log(`  ✅ Strategy 2 (Markdown Link): ${extractedSource}`);
          return extractedSource;
        }
      }
    }
    
    // Strategy 3: Scan all URLs in markdown
    const allUrls = markdown.match(/https?:\/\/[^\s<>()\[\]]+/gi) || [];
    for (const foundUrl of allUrls) {
      if (!foundUrl.includes('nuvemmag.com') && 
          !foundUrl.includes('twitter.com') && 
          !foundUrl.includes('x.com') &&
          !foundUrl.includes('youtube.com') && 
          !foundUrl.includes('youtu.be') &&
          !foundUrl.includes('tiktok.com') &&
          !foundUrl.includes('instagram.com') &&
          !foundUrl.includes('facebook.com') &&
          !foundUrl.includes('linkedin.com') &&
          !foundUrl.includes('cdn.prod.website-files.com') &&
          !foundUrl.includes('.png') &&
          !foundUrl.includes('.jpg') &&
          !foundUrl.includes('.jpeg') &&
          !foundUrl.includes('.gif') &&
          !foundUrl.includes('.webp')) {
        extractedSource = foundUrl.trim();
        console.log(`  ✅ Strategy 3 (URL Scan): ${extractedSource}`);
        return extractedSource;
      }
    }
    
    console.log(`  ⚠️  No source found with any strategy`);
    return null;
    
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return null;
  }
}

/**
 * Main function
 */
async function fixOriginalSources() {
  console.log('🔧 FIX MISSING ORIGINAL SOURCES (IMPROVED)\n');
  console.log('='.repeat(80));
  
  // Get articles with NULL original_source
  console.log('📊 Querying database for articles with missing original_source...');
  const { data: articles, error } = await supabase
    .from('tech_news_articles')
    .select('id, title, slug, source_url, original_source, created_at')
    .is('original_source', null)
    .order('created_at', { ascending: false })
    .limit(100); // Process 100 at a time

  if (error) {
    console.error('❌ Database error:', error);
    return;
  }

  if (!articles || articles.length === 0) {
    console.log('\n✅ All articles already have original_source!');
    console.log('No action needed.\n');
    return;
  }

  console.log(`\n📰 Found ${articles.length} articles missing original_source`);
  console.log('='.repeat(80));

  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    console.log(`\n[${i + 1}/${articles.length}] ${article.title.substring(0, 70)}...`);
    console.log(`   Created: ${new Date(article.created_at).toLocaleString('tr-TR')}`);
    console.log(`   Source URL: ${article.source_url}`);

    if (!article.source_url) {
      console.log('   ⚠️  No source_url available, skipping');
      skippedCount++;
      continue;
    }

    // Extract original source
    const originalSource = await extractOriginalSource(article.source_url);

    if (originalSource) {
      // Update database
      const { error: updateError } = await supabase
        .from('tech_news_articles')
        .update({ original_source: originalSource })
        .eq('id', article.id);

      if (updateError) {
        console.log(`   ❌ Database update failed: ${updateError.message}`);
        failCount++;
      } else {
        console.log(`   ✅ Updated successfully!`);
        console.log(`   📰 Original: ${originalSource}`);
        successCount++;
      }
    } else {
      console.log(`   ❌ Could not extract source`);
      failCount++;
    }

    // Rate limiting
    if (i < articles.length - 1) {
      console.log(`   ⏳ Waiting ${CONFIG.RATE_LIMIT_DELAY / 1000}s (rate limit)...`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.RATE_LIMIT_DELAY));
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Successfully updated: ${successCount}`);
  console.log(`❌ Failed to extract: ${failCount}`);
  console.log(`⏭️  Skipped (no source_url): ${skippedCount}`);
  console.log(`📊 Total processed: ${articles.length}`);
  console.log('='.repeat(80));

  if (successCount > 0) {
    console.log('\n🎉 Original sources have been updated!');
    console.log('💡 Tip: Re-run this script to process more articles if needed.');
  }

  if (failCount > 0) {
    console.log('\n⚠️  Some articles could not be updated.');
    console.log('This is normal - not all Nuvemmag articles have external sources.');
  }
}

// Run the fixer
fixOriginalSources().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

