/**
 * Migration Script: JSON to Supabase
 * 
 * Migrates existing tech news articles from JSON file to Supabase PostgreSQL
 */

import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const JSON_PATH = path.join(__dirname, '../public/data/tech-news.json');
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Initialize Supabase client (using service role for admin access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Parse date from Turkish format to ISO
 */
function parseDateToISO(dateString) {
  try {
    // Handle format: "DD/MM/YYYY"
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    // Already ISO format
    return dateString.split('T')[0];
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Migrate single article
 */
async function migrateArticle(article) {
  try {
    // Check if article already exists
    const { data: existing, error: checkError } = await supabase
      .from('tech_news_articles')
      .select('id')
      .eq('source_url', article.sourceUrl)
      .single();

    if (existing) {
      console.log(`⏭️  Article already exists: ${article.title.substring(0, 50)}...`);
      return { success: true, skipped: true };
    }

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Check error:', checkError);
      return { success: false, error: checkError };
    }

    // Insert article
    const { data, error } = await supabase
      .from('tech_news_articles')
      .insert([
        {
          title: article.title,
          description: article.description,
          content: article.content,
          original_title: article.originalTitle,
          image_url: article.image,
          date: parseDateToISO(article.date),
          category: article.category || 'Tech',
          source_url: article.sourceUrl,
          original_source: article.originalSource,
          slug: article.slug,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error(`❌ Failed to migrate: ${article.title.substring(0, 50)}...`);
      console.error('Error:', error);
      return { success: false, error };
    }

    console.log(`✅ Migrated: ${article.title.substring(0, 50)}...`);
    return { success: true, data };
  } catch (error) {
    console.error('Migration error:', error);
    return { success: false, error };
  }
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('🚀 Starting Migration: JSON → Supabase\n');
  console.log('='.repeat(60));
  
  try {
    // Read JSON file
    console.log(`📂 Reading JSON file: ${JSON_PATH}`);
    const fileContent = await fs.readFile(JSON_PATH, 'utf-8');
    const jsonData = JSON.parse(fileContent);
    
    const articles = jsonData.articles || [];
    console.log(`📊 Found ${articles.length} articles to migrate\n`);
    
    if (articles.length === 0) {
      console.log('⚠️  No articles found in JSON file');
      return;
    }

    // Get current Supabase count
    const { count: currentCount } = await supabase
      .from('tech_news_articles')
      .select('*', { count: 'exact', head: true });
    
    console.log(`💾 Current Supabase database: ${currentCount || 0} articles\n`);
    console.log('='.repeat(60));
    console.log('\n');

    let successCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    // Migrate each article
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      console.log(`[${i + 1}/${articles.length}] Processing...`);
      
      const result = await migrateArticle(article);
      
      if (result.success) {
        if (result.skipped) {
          skippedCount++;
        } else {
          successCount++;
        }
      } else {
        failedCount++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Get final count
    const { count: finalCount } = await supabase
      .from('tech_news_articles')
      .select('*', { count: 'exact', head: true });

    console.log('\n');
    console.log('='.repeat(60));
    console.log('🎉 Migration Completed!\n');
    console.log(`✅ Successfully migrated: ${successCount}`);
    console.log(`⏭️  Skipped (duplicates):  ${skippedCount}`);
    console.log(`❌ Failed:                ${failedCount}`);
    console.log(`📊 Total in database:     ${finalCount || 0}`);
    console.log('='.repeat(60));

    if (successCount > 0) {
      console.log('\n💡 Next Steps:');
      console.log('1. ✅ Run the Supabase schema: docs/tech-news-schema.sql');
      console.log('2. ✅ Update GitHub Secrets with Supabase credentials');
      console.log('3. ✅ Deploy to Vercel');
      console.log('4. ✅ Test the API: /api/tech-news');
    }

  } catch (error) {
    console.error('\n💥 Fatal Migration Error:', error);
    process.exit(1);
  }
}

// Run migration
migrate().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

