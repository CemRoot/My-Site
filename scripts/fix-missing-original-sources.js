/**
 * Fix Missing Original Sources Script
 * Scrapes nuvemmag articles to extract original source URLs
 * and updates Supabase database
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

if (!FIRECRAWL_API_KEY) {
  console.error('❌ Missing FIRECRAWL_API_KEY. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function scrapeOriginalSource(nuvemmagUrl) {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: nuvemmagUrl,
        formats: ['markdown'],
        onlyMainContent: true,
        maxAge: 0 // Force fresh scrape, no cache
      })
    });

    if (!response.ok) {
      console.log(`   ❌ Failed to scrape (${response.status})`);
      return null;
    }

    const data = await response.json();
    const markdown = data.data?.markdown || '';

    // Extract original source from markdown
    // Patterns to try: "Kaynak: https://..." or "Kaynak: [https://...](https://...)"
    const patterns = [
      /Kaynak:\s*\[?(https?:\/\/[^\s\]\)]+)/i,
      /Source:\s*\[?(https?:\/\/[^\s\]\)]+)/i,
      /\[Read on\]\((https?:\/\/[^\)]+)\)/i
    ];
    
    for (const pattern of patterns) {
      const sourceMatch = markdown.match(pattern);
      if (sourceMatch && sourceMatch[1]) {
        const url = sourceMatch[1].trim();
        // Skip if it's nuvemmag itself
        if (!url.includes('nuvemmag.com')) {
          return url;
        }
      }
    }

    console.log(`   ⚠️  No source found`);
    return null;

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function fixMissingOriginalSources() {
  console.log('🔍 Finding articles with missing original_source...\n');

  // Get articles with NULL original_source
  const { data: articles, error } = await supabase
    .from('tech_news_articles')
    .select('id, title, slug, source_url, original_source')
    .is('original_source', null)
    .order('created_at', { ascending: false })
    .limit(50); // Process 50 at a time

  if (error) {
    console.error('❌ Database error:', error);
    return;
  }

  if (!articles || articles.length === 0) {
    console.log('✅ All articles already have original_source!');
    return;
  }

  console.log(`📊 Found ${articles.length} articles missing original_source\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    console.log(`\n[${i + 1}/${articles.length}] Processing: ${article.title.substring(0, 60)}...`);
    console.log(`   Source URL: ${article.source_url}`);

    if (!article.source_url) {
      console.log('   ⚠️  No source_url, skipping');
      failCount++;
      continue;
    }

    // Scrape original source
    const originalSource = await scrapeOriginalSource(article.source_url);

    if (originalSource) {
      // Update database
      const { error: updateError } = await supabase
        .from('tech_news_articles')
        .update({ original_source: originalSource })
        .eq('id', article.id);

      if (updateError) {
        console.log(`   ❌ Failed to update: ${updateError.message}`);
        failCount++;
      } else {
        console.log(`   ✅ Updated! Original source: ${originalSource}`);
        successCount++;
      }
    } else {
      failCount++;
    }

    // Rate limiting - wait 1 second between requests
    if (i < articles.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Successfully updated: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📝 Total processed: ${articles.length}`);
  console.log('='.repeat(80));
}

// Run the script
fixMissingOriginalSources()
  .then(() => {
    console.log('\n✅ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

