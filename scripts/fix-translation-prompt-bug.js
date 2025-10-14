/**
 * Fix Translation Prompt Bug
 * Removes articles that have the translation prompt in their title/content
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixBuggedArticles() {
  console.log('🔍 Finding articles with translation prompt bug...\n');
  
  try {
    // Find articles that have the prompt in title or content
    const { data: buggedArticles, error: fetchError } = await supabase
      .from('tech_news_articles')
      .select('id, slug, title')
      .or('title.ilike.%REMINDER:%,title.ilike.%Translate the following%,content.ilike.%REMINDER:%,content.ilike.%Text to translate:%');
    
    if (fetchError) {
      console.error('❌ Error fetching articles:', fetchError);
      return;
    }
    
    if (!buggedArticles || buggedArticles.length === 0) {
      console.log('✅ No bugged articles found!');
      return;
    }
    
    console.log(`Found ${buggedArticles.length} bugged article(s):\n`);
    
    buggedArticles.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title}`);
      console.log(`   Slug: ${article.slug}`);
      console.log(`   ID: ${article.id}\n`);
    });
    
    console.log('🗑️  Deleting bugged articles...\n');
    
    const { error: deleteError } = await supabase
      .from('tech_news_articles')
      .delete()
      .in('id', buggedArticles.map(a => a.id));
    
    if (deleteError) {
      console.error('❌ Error deleting articles:', deleteError);
      return;
    }
    
    console.log(`✅ Successfully deleted ${buggedArticles.length} bugged article(s)`);
    console.log('\n📋 Next steps:');
    console.log('1. Run the scraper again: node scripts/news-scraper.js');
    console.log('2. New articles will use the fixed translation prompt');
    console.log('3. Verify that titles and content are clean\n');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixBuggedArticles();

