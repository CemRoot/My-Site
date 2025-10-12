/**
 * Tech News Scraper
 * 
 * Scrapes tech news from Nuvemmag, translates to English, and stores in JSON
 * Features:
 * - Firecrawl integration for web scraping
 * - Groq AI for unlimited, high-quality Turkish to English translation
 * - Duplicate detection using URL hashing
 * - Smart rate limiting
 */

import 'dotenv/config';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  // All categories to scrape (excluding "Çiçek ile Teknoloji")
  CATEGORIES: [
    { name: 'Latest News', url: 'https://www.nuvemmag.com/post-category/en-son-haberler', tag: 'Latest News' },
    { name: 'AI Applications', url: 'https://www.nuvemmag.com/post-category/yapay-zeka-uygulamalari', tag: 'AI Applications' },
    { name: 'Artificial Intelligence', url: 'https://www.nuvemmag.com/post-category/yapay-zeka', tag: 'AI' },
    { name: 'Technology', url: 'https://www.nuvemmag.com/post-category/teknoloji', tag: 'Tech' },
    { name: 'Sustainability', url: 'https://www.nuvemmag.com/post-category/surdurulebilirlik', tag: 'Sustainability' },
    { name: 'Science & World', url: 'https://www.nuvemmag.com/post-category/bilim-dunya', tag: 'Science' },
    { name: 'Agenda', url: 'https://www.nuvemmag.com/post-category/gundem', tag: 'News' },
  ],
  FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  DATA_PATH: path.join(__dirname, '../public/data/tech-news.json'),
  MAX_ARTICLES_PER_CATEGORY: 15, // Increased to get all daily news (was 2)
  TRANSLATION_DELAY: 300, // ms between translation requests
  RATE_LIMIT_DELAY: 7000, // 7 seconds between requests (Firecrawl free: 10 req/min)
  MAX_ARTICLES_PER_RUN: 50, // Safety limit per scraping run
};

// Initialize Groq client
const groq = new Groq({
  apiKey: CONFIG.GROQ_API_KEY,
});

/**
 * Generate unique ID from URL
 */
function generateArticleId(url) {
  return crypto.createHash('md5').update(url).digest('hex');
}

/**
 * Generate URL-friendly slug from English title
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Replace multiple hyphens with single
    .replace(/^-|-$/g, '')         // Remove leading/trailing hyphens
    .substring(0, 100);            // Limit length
}

/**
 * Check if article is from today (for filtering old articles)
 */
function isFromToday(dateString) {
  try {
    // Parse Turkish date format: "10/10/2025" or "9/10/2025"
    const [day, month, year] = dateString.split('/').map(n => parseInt(n, 10));
    const articleDate = new Date(year, month - 1, day);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    articleDate.setHours(0, 0, 0, 0);
    
    // Allow articles from today and yesterday (in case of timezone differences)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    return articleDate >= yesterday && articleDate <= today;
  } catch (error) {
    console.error('Date parsing error:', error);
    return true; // If error, include the article
  }
}

/**
 * Check if article is from last 7 days (more lenient for initial scraping)
 */
function isRecent(dateString) {
  try {
    const [day, month, year] = dateString.split('/').map(n => parseInt(n, 10));
    const articleDate = new Date(year, month - 1, day);
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    
    return articleDate >= weekAgo;
  } catch (error) {
    return true;
  }
}

/**
 * Load existing articles from JSON database
 */
async function loadDatabase() {
  try {
    const data = await fs.readFile(CONFIG.DATA_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.log('📝 Creating new database...');
    return {
      version: '1.0.0',
      lastUpdated: null,
      totalArticles: 0,
      articles: []
    };
  }
}

/**
 * Save articles to JSON database
 */
async function saveDatabase(database) {
  const dir = path.dirname(CONFIG.DATA_PATH);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    CONFIG.DATA_PATH,
    JSON.stringify(database, null, 2),
    'utf-8'
  );
}

/**
 * Check if article already exists in database
 */
function articleExists(database, articleId) {
  return database.articles.some(article => article.id === articleId);
}

/**
 * Scrape article list from a category using Firecrawl REST API
 */
async function scrapeArticleListFromCategory(categoryUrl, categoryTag) {
  console.log(`🔍 Scraping ${categoryTag} from: ${categoryUrl}`);
  
  try {
    // Use Firecrawl REST API
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        url: categoryUrl,
        formats: ['markdown'],
        onlyMainContent: true
      })
    });

    if (!response.ok) {
      throw new Error(`Firecrawl API error: ${response.status} ${response.statusText}`);
    }

    const scrapeResult = await response.json();

    if (!scrapeResult.success || !scrapeResult.data || !scrapeResult.data.markdown) {
      throw new Error('Firecrawl scraping failed - no markdown returned');
    }

    // Parse markdown to extract article URLs and dates
    const markdown = scrapeResult.data.markdown;
    const articles = [];
    
    // Extract category lines with date and URL
    // Format: "Category Name10/10/2025**Article Title**](url)"
    const lineRegex = new RegExp(`${categoryTag}[\\s\\S]*?(\\d{1,2}\\/\\d{1,2}\\/\\d{4})[\\s\\S]*?\\]\\((https:\\/\\/www\\.nuvemmag\\.com\\/post\\/[^)]+)\\)`, 'g');
    let match;
    
    while ((match = lineRegex.exec(markdown)) !== null) {
      const date = match[1];
      const url = match[2];
      
      if (!articles.some(a => a.url === url)) {
        // Filter by date (last 7 days for initial scraping)
        if (isRecent(date)) {
          articles.push({ url, category: categoryTag, scrapedDate: date });
          console.log(`  📅 ${date}: ${url.split('/').pop()}`);
        }
      }
    }

    console.log(`✅ Found ${articles.length} recent articles in ${categoryTag}`);
    return articles;
  } catch (error) {
    console.error(`❌ Failed to scrape ${categoryTag}: ${error.message}`);
    return [];
  }
}

/**
 * Scrape all categories
 */
async function scrapeAllCategories() {
  console.log('🔍 Scraping all categories...\n');
  const allArticles = [];
  
  for (const category of CONFIG.CATEGORIES) {
    const articles = await scrapeArticleListFromCategory(category.url, category.tag);
    
    // Limit articles per category
    const limitedArticles = articles.slice(0, CONFIG.MAX_ARTICLES_PER_CATEGORY);
    allArticles.push(...limitedArticles);
    
    // Rate limiting between categories (Firecrawl free: 10 req/min)
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds
  }
  
  console.log(`\n✅ Total articles found across all categories: ${allArticles.length}\n`);
  return allArticles;
}

/**
 * Scrape single article details using Firecrawl REST API
 */
async function scrapeArticleDetails(url) {
  console.log(`📰 Scraping article: ${url}`);
  
  try {
    // Use Firecrawl REST API
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown'],
        onlyMainContent: true
      })
    });

    if (!response.ok) {
      throw new Error(`Firecrawl API error: ${response.status} ${response.statusText}`);
    }

    const scrapeResult = await response.json();
    
    if (!scrapeResult.success || !scrapeResult.data || !scrapeResult.data.markdown) {
      throw new Error('Failed to scrape article - no markdown returned');
    }

    const { markdown, metadata } = scrapeResult.data;
    
    // Extract title from metadata or markdown
    const title = metadata.title || metadata.ogTitle || '';
    const description = metadata.description || metadata.ogDescription || '';
    const image = metadata.ogImage || metadata['twitter:image'] || '';
    
    // Extract date from markdown (format: "2/7/2025" or "8/10/2025")
    const dateMatch = markdown.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    const date = dateMatch ? dateMatch[1] : new Date().toLocaleDateString('tr-TR');
    
    // Extract category from markdown (first line after nav usually contains category)
    const categoryMatch = markdown.match(/^([A-Za-zğüşıöçĞÜŞİÖÇ\s]+)\n\n\d{1,2}\/\d{1,2}\/\d{4}/m);
    const originalCategory = categoryMatch ? categoryMatch[1].trim() : '';
    
    // Extract main content (remove header, footer, related articles, Nuvemmag logo)
    let content = markdown
      .split('\n')
      .filter(line => {
        // Remove navigation, social media, footer links, and Nuvemmag branding
        return !line.includes('instagram') && 
               !line.includes('twitter') && 
               !line.includes('linkedin') &&
               !line.includes('youtube') &&
               !line.includes('Ana Sayfa') &&
               !line.includes('Kategoriler') &&
               !line.includes('Kurumsal') &&
               !line.includes('İlginizi Çekebilir') &&
               !line.includes('nuvemmag.com') &&
               !line.includes('NuvemMag-Logo') &&
               !line.includes('cdn.prod.website-files.com/664e54b1b2f127a2d94fd963');
      })
      .join('\n')
      .trim();

    // Additional cleanup to remove Nuvemmag logo anchors that may slip through
    content = content
      .replace(/\[!\[[^\]]*\]\([^)]+\)\]\(\s*https?:\/\/(?:www\.)?nuvemmag\.com\/?\s*\)/gi, '')
      .replace(/<a[^>]*href="https?:\/\/(?:www\.)?nuvemmag\.com\/?"[^>]*>\s*<img[\s\S]*?<\/a>/gi, '')
      .replace(/!\[[^\]]*\]\([^)]*NuvemMag-Logo[^)]*\)/gi, '')
      .replace(/(\r?\n){3,}/g, '\n\n')
      .trim();
    
    // Extract source URL from content (usually at the end)
    // Handle both markdown links [text](url) and plain URLs
    let extractedSource = null;
    
    // First try to find markdown link format: [text](url) or [url](url)
    // Extract URL from parentheses (the actual link)
    const mdLinkMatch = content.match(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/);
    if (mdLinkMatch) {
      extractedSource = mdLinkMatch[2]; // Get the URL from parentheses
    } else {
      // Try plain URL extraction
      const urlMatch = content.match(/(?:Kaynak:\s*)?(https?:\/\/[^\s<>)\]]+)/);
      if (urlMatch) {
        // Clean up URL from any brackets or angle brackets
        extractedSource = urlMatch[1].trim();
      }
    }
    
    // Remove source attribution from content
    content = content.replace(/Kaynak:.*$/s, '').trim();
    
    // Remove "İlginizi Çekebilir" section and everything after
    content = content.split(/İlginizi Çekebilir/)[0].trim();
    
    return {
      title,
      description,
      content,
      image,
      date,
      sourceUrl: url,
      originalSource: extractedSource,
      originalCategory
    };
  } catch (error) {
    console.error(`❌ Failed to scrape article: ${error.message}`);
    return null;
  }
}

/**
 * Translate text using Groq AI (Unlimited, High Quality)
 * Handles texts of any length - no chunking needed!
 */
async function translateText(text) {
  if (!text || text.trim().length === 0) {
    return text;
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile', // Updated from deprecated 3.1 // High quality model for translation
      messages: [
        {
          role: 'system',
          content: `You are a professional translator specializing in Turkish to English translation for technology news.

TRANSLATION RULES:
- Translate from Turkish to English with high accuracy
- Maintain the original meaning and tone
- Use clear, professional English suitable for tech news
- Keep technical terms and brand names intact (Netflix, AI, OpenAI, etc.)
- Preserve formatting (line breaks, emphasis)
- Use natural, readable English (B2-C1 level)
- DO NOT add any commentary or explanations
- ONLY return the translated text, nothing else

Translate the following Turkish text to English:`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3, // Lower temperature for more accurate translation
      max_tokens: 4000, // Support long articles
    });

    const translatedText = completion.choices[0]?.message?.content || text;
    return translatedText.trim();
  } catch (error) {
    console.error(`❌ Groq translation error: ${error.message}`);
    return text; // Fallback to original
  }
}

/**
 * Translate article to English using Groq AI
 * Can handle full articles without chunking!
 */
async function translateArticle(article) {
  console.log(`🌐 Translating article with Groq AI...`);
  console.log(`   Title length: ${article.title.length} chars`);
  console.log(`   Content length: ${article.content.length} chars`);
  
  try {
    // Translate title
    console.log(`   🔤 Translating title...`);
    const translatedTitle = await translateText(article.title);
    await new Promise(resolve => setTimeout(resolve, CONFIG.TRANSLATION_DELAY));
    
    // Translate description
    console.log(`   📝 Translating description...`);
    const translatedDescription = await translateText(article.description);
    await new Promise(resolve => setTimeout(resolve, CONFIG.TRANSLATION_DELAY));
    
    // Translate full content (no chunking needed!)
    console.log(`   📄 Translating full content...`);
    const translatedContent = await translateText(article.content);
    
    console.log(`   ✅ Translation complete!`);
    
    return {
      ...article,
      title: translatedTitle,
      description: translatedDescription,
      content: translatedContent,
      originalTitle: article.title,
    };
  } catch (error) {
    console.error(`❌ Translation failed: ${error.message}`);
    return article; // Return original if translation fails
  }
}

/**
 * Main scraping function
 */
async function scrapeNews() {
  console.log('🚀 Starting Multi-Category Tech News Scraper...\n');
  console.log('='.repeat(60));
  console.log(`📂 Categories to scrape: ${CONFIG.CATEGORIES.length}`);
  CONFIG.CATEGORIES.forEach(cat => console.log(`   • ${cat.tag}: ${cat.name}`));
  console.log('='.repeat(60));
  
  // Load existing database
  const database = await loadDatabase();
  console.log(`\n📊 Current database: ${database.totalArticles} articles\n`);
  
  // Scrape all categories
  const articlesWithCategories = await scrapeAllCategories();
  
  if (articlesWithCategories.length === 0) {
    console.log('⚠️ No articles found in any category. Exiting.');
    return;
  }
  
  console.log(`📝 Processing ${articlesWithCategories.length} articles...\n`);
  
  let newArticlesCount = 0;
  let skippedCount = 0;
  
  for (const { url, category } of articlesWithCategories) {
    const articleId = generateArticleId(url);
    
    // Check if article already exists
    if (articleExists(database, articleId)) {
      console.log(`⏭️  [${category}] Article already exists, skipping\n`);
      skippedCount++;
      continue;
    }
    
    console.log(`📰 [${category}] Processing: ${url}`);
    
    // Scrape article details
    const article = await scrapeArticleDetails(url);
    
    if (!article) {
      continue;
    }
    
    // Translate article
    const translatedArticle = await translateArticle(article);
    
    // Add to database with category
    database.articles.unshift({
      id: articleId,
      ...translatedArticle,
      category, // Add category tag
      createdAt: new Date().toISOString(),
      slug: generateSlug(translatedArticle.title) // Generate English slug from translated title
    });
    
    newArticlesCount++;
    console.log(`✅ [${category}] Article added successfully!\n`);
    
    // Rate limiting between articles (Firecrawl free: 10 req/min)
    await new Promise(resolve => setTimeout(resolve, 7000)); // 7 seconds = ~8 req/min
  }
  
  // Update metadata
  database.totalArticles = database.articles.length;
  database.lastUpdated = new Date().toISOString();
  
  // Save database
  await saveDatabase(database);
  
  console.log('='.repeat(60));
  console.log(`🎉 Multi-Category Scraping Completed!`);
  console.log(`📊 New articles added: ${newArticlesCount}`);
  console.log(`⏭️  Skipped (duplicates): ${skippedCount}`);
  console.log(`📊 Total articles in database: ${database.totalArticles}`);
  console.log(`⏰ Last updated: ${database.lastUpdated}`);
  console.log('='.repeat(60));
}

// Run scraper
scrapeNews().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
