/**
 * Tech News Scraper
 * 
 * Scrapes tech news from Nuvemmag, translates to English, and stores in Supabase
 * Features:
 * - Firecrawl integration for web scraping
 * - Groq AI for unlimited, high-quality Turkish to English translation
 * - Supabase PostgreSQL for reliable storage
 * - Duplicate detection using source URL
 * - Smart rate limiting
 */

import 'dotenv/config';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';
import { htmlToTokens } from './embeds/extractEmbeds.js';
import { replaceTikTokBlockquote, replaceTwitterBlockquote, cleanSocialEmbedRemnants } from './embeds/cleanMarkdownEmbeds.js';
import { extractAllEmbedsFromMarkdown } from './embeds/extractMarkdownEmbeds.js';
import { TRANSLATION_SYSTEM_PROMPT, createTranslationPrompt } from './translate/prompt.js';
import { assertContentQuality, validateArticleContent } from './validation/contentQualityCheck.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Returns true if the line contains a URL whose hostname is nuvemmag.com (or a subdomain)
function hasNuvemmagDomain(line) {
  const urlRegex = /(https?:\/\/[^\s)>]+)/ig;
  let match;
  while ((match = urlRegex.exec(line)) !== null) {
    try {
      const urlObj = new URL(match[1]);
      // Accept nuvemmag.com and any subdomain, but not similar-looking domains
      // e.g., nuvemmag.com, www.nuvemmag.com, blog.nuvemmag.com
      const hostname = urlObj.hostname.toLowerCase();
      if (
        hostname === "nuvemmag.com" ||
        hostname.endsWith(".nuvemmag.com")
      ) {
        return true;
      }
    } catch (e) {
      // Ignore invalid URL
    }
  }
  return false;
}

// Configuration
const CONFIG = {
  // All categories to scrape (excluding "Çiçek ile Teknoloji")
  // Priority order: AI Applications first (most articles), then other categories
  CATEGORIES: [
    { name: 'AI Applications', url: 'https://www.nuvemmag.com/post-category/yapay-zeka-uygulamalari', tag: 'AI Applications' },
    { name: 'Latest News', url: 'https://www.nuvemmag.com/post-category/en-son-haberler', tag: 'Latest News' },
    { name: 'Artificial Intelligence', url: 'https://www.nuvemmag.com/post-category/yapay-zeka', tag: 'AI' },
    { name: 'Technology', url: 'https://www.nuvemmag.com/post-category/teknoloji', tag: 'Tech' },
    { name: 'Sustainability', url: 'https://www.nuvemmag.com/post-category/surdurulebilirlik', tag: 'Sustainability' },
    { name: 'Science & World', url: 'https://www.nuvemmag.com/post-category/bilim-dunya', tag: 'Science' },
    { name: 'Agenda', url: 'https://www.nuvemmag.com/post-category/gundem', tag: 'News' },
  ],
  FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  MAX_ARTICLES_PER_CATEGORY: 20,
  TRANSLATION_DELAY: 1000, // ms between translation requests (increased to avoid rate limits)
  RATE_LIMIT_DELAY: 7000, // 7 seconds between requests (Firecrawl free: 10 req/min)
  MAX_ARTICLES_PER_RUN: 50, // Safety limit per scraping run
};

// Initialize Groq client
const groq = new Groq({
  apiKey: CONFIG.GROQ_API_KEY,
});

// Groq translation models (updated to active models)
const GROQ_PRIMARY_MODEL = 'llama-3.3-70b-versatile'; // Most capable, updated model
const GROQ_FALLBACK_MODEL = 'llama-3.1-8b-instant'; // Fast and reliable fallback
const GROQ_LAST_RESORT_MODEL = 'gemma2-9b-it'; // Last resort if others fail

// Initialize Supabase client (using service role for admin access)
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY);

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
 * Check if article is from last 3 days (focus on current news)
 */
function isRecent(dateString) {
  try {
    const [day, month, year] = dateString.split('/').map(n => parseInt(n, 10));
    const articleDate = new Date(year, month - 1, day);
    
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    threeDaysAgo.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const isRecent = articleDate >= threeDaysAgo;
    
    return isRecent;
  } catch (error) {
    console.log(`    ⚠️ Date parse error for "${dateString}": ${error.message}`);
    return true; // If error, include the article
  }
}

/**
 * Calculate date priority for sorting (higher = more recent)
 * Today = 100, Yesterday = 90, 2 days ago = 80, etc.
 */
function getDatePriority(dateString) {
  try {
    const [day, month, year] = dateString.split('/').map(n => parseInt(n, 10));
    const articleDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    articleDate.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - articleDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Priority scoring: Today=100, Yesterday=90, 2 days ago=80, etc.
    const priority = Math.max(0, 100 - (diffDays * 10));
    
    return priority;
  } catch (error) {
    return 0; // Lowest priority for unparseable dates
  }
}

/**
 * Check which articles already exist in Supabase (bulk check)
 */
async function getExistingArticles(urls) {
  try {
    const { data, error } = await supabase
      .from('tech_news_articles')
      .select('source_url')
      .in('source_url', urls);
    
    if (error) {
      console.error('Error checking existing articles:', error);
      return new Set();
    }
    
    return new Set(data.map(article => article.source_url));
  } catch (error) {
    console.error('Error in bulk check:', error);
    return new Set();
  }
}

/**
 * Save article to Supabase
 */
async function saveArticle(article) {
  try {
    // Parse date from Turkish format (DD/MM/YYYY) to ISO
    let isoDate;
    try {
      const [day, month, year] = article.date.split('/');
      isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    } catch (e) {
      isoDate = new Date().toISOString().split('T')[0];
    }

    const { data, error } = await supabase
      .from('tech_news_articles')
      .insert([
        {
          title: article.title,
          description: article.description,
          content: article.content,
          original_title: article.originalTitle,
          image_url: article.image,
          date: isoDate,
          category: article.category,
          source_url: article.sourceUrl,
          original_source: article.originalSource,
          slug: article.slug,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error saving article to Supabase:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error saving article:', error);
    return { success: false, error };
  }
}

/**
 * Get article count from Supabase
 */
async function getArticleCount() {
  try {
    const { count, error } = await supabase
      .from('tech_news_articles')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error getting article count:', error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Error getting count:', error);
    return 0;
  }
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
    
    // DEBUG: Log markdown sample for troubleshooting (commented out to reduce log noise)
    // console.log(`  📝 Markdown sample (first 500 chars):\n${markdown.substring(0, 500)}\n`);
    
    // Extract article lines with date and URL
    // Format from Firecrawl: [Category\\\n\\\nDate\\\n\\\n**Title**](URL)
    // Example: [Yapay Zeka Uygulamaları\\\n\\\n10/10/2025\\\n\\\n**Title**](https://...)
    
    // Try multiple regex patterns to capture different markdown formats
    const patterns = [
      // Original pattern
      /(\d{1,2}\/\d{1,2}\/\d{4})[^\(]*\((https:\/\/www\.nuvemmag\.com\/post\/[^)]+)\)/g,
      // Alternative: Date might be on same line without newlines
      /\[.*?(\d{1,2}\/\d{1,2}\/\d{4}).*?\]\((https:\/\/www\.nuvemmag\.com\/post\/[^)]+)\)/g,
      // Alternative: Just look for any nuvemmag post link with nearby date
      /(\d{1,2}\/\d{1,2}\/\d{4})[\s\S]{0,200}?(https:\/\/www\.nuvemmag\.com\/post\/[^\s\)]+)/g,
    ];
    
    let totalMatches = 0;
    let patternUsed = -1;
    
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      let match;
      const tempArticles = [];
      
      while ((match = pattern.exec(markdown)) !== null) {
        totalMatches++;
        const date = match[1];
        const url = match[2].replace(/[,;.]$/, ''); // Remove trailing punctuation
        
        if (!tempArticles.some(a => a.url === url)) {
          const isDateRecent = isRecent(date);
          if (isDateRecent) {
            const priority = getDatePriority(date);
            tempArticles.push({ 
              url, 
              category: categoryTag, 
              scrapedDate: date,
              datePriority: priority
            });
          }
        }
      }
      
      if (tempArticles.length > 0) {
        // Sort by date priority (newest first: Today=100, Yesterday=90, etc.)
        tempArticles.sort((a, b) => b.datePriority - a.datePriority);
        
        console.log(`  📊 Found ${tempArticles.length} articles, sorted by date priority`);
        
        articles.push(...tempArticles);
        patternUsed = i;
        break; // Use first pattern that works
      }
    }

    console.log(`✅ Found ${articles.length} recent articles in ${categoryTag} (total matches: ${totalMatches}, pattern: ${patternUsed + 1})`);
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
    
    // Articles are already sorted by date priority (newest first)
    // Now limit articles per category, preserving the priority order
    const limitedArticles = articles.slice(0, CONFIG.MAX_ARTICLES_PER_CATEGORY);
    
    if (limitedArticles.length > 0) {
      const todayCount = limitedArticles.filter(a => a.datePriority >= 100).length;
      const yesterdayCount = limitedArticles.filter(a => a.datePriority >= 90 && a.datePriority < 100).length;
      const olderCount = limitedArticles.filter(a => a.datePriority < 90).length;
      console.log(`  📊 Selected ${limitedArticles.length} articles: ${todayCount} today, ${yesterdayCount} yesterday, ${olderCount} older`);
    }
    
    allArticles.push(...limitedArticles);
    
    // Rate limiting between categories (Firecrawl free: 10 req/min)
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds
  }
  
  // Sort all articles by date priority across all categories
  // This ensures we process today's articles first, regardless of category
  allArticles.sort((a, b) => b.datePriority - a.datePriority);
  
  console.log(`\n✅ Total articles found across all categories: ${allArticles.length}`);
  console.log(`\n🎯 Final Priority Order (Today → Yesterday → Older):`);
  
  // Group and display by priority
  const todayArticles = allArticles.filter(a => a.datePriority >= 100);
  const yesterdayArticles = allArticles.filter(a => a.datePriority >= 90 && a.datePriority < 100);
  const olderArticles = allArticles.filter(a => a.datePriority < 90);
  
  console.log(`  🔥 TODAY: ${todayArticles.length} articles`);
  console.log(`  🌟 YESTERDAY: ${yesterdayArticles.length} articles`);
  console.log(`  📰 OLDER: ${olderArticles.length} articles`);
  
  console.log(`\n`);
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
        formats: ['markdown', 'html'], // Get both for embed extraction
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

    const { markdown, html, metadata } = scrapeResult.data;
    
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
    // IMPORTANT: Do NOT filter out lines here - we'll add embed tokens first, then clean
    let content = markdown;

    // ============================================
    // STEP 0: REMOVE HEADER/NAVIGATION BEFORE CONTENT
    // Remove everything up to and including the date (dd/mm/yyyy)
    // This removes: logo, navigation, category links, date
    // ============================================
    
    const datePattern = /\d{1,2}\/\d{1,2}\/\d{4}/;
    const initialLines = content.split('\n');
    let contentStartIndex = 0;
    
    // Find where actual content starts (after date line)
    for (let i = 0; i < initialLines.length; i++) {
      if (datePattern.test(initialLines[i])) {
        contentStartIndex = i + 1; // Start AFTER the date line
        if (contentStartIndex > 0) {
          console.log(`    ✂️  Removed first ${contentStartIndex} lines (header/navigation/date)`);
        }
        break;
      }
    }
    
    // Keep only content from contentStartIndex onwards
    if (contentStartIndex > 0) {
      content = initialLines.slice(contentStartIndex).join('\n');
    }

    // ============================================
    // TOKEN-BASED EMBED PRESERVATION SYSTEM
    // Extract social media embeds from HTML and convert to protected tokens
    // These tokens will be preserved during translation and rendered as React components
    // ============================================
    
    // Step 1: Extract Tweet IDs from HTML (for dynamic Twitter embeds that Firecrawl can't scrape)
    let tweetIdsFromHtml = [];
    if (html) {
      const tweetMatches = html.matchAll(/(?:twitter|x)\.com\/[^\/]+\/status\/(\d+)/gi);
      for (const match of tweetMatches) {
        const tweetId = match[1];
        if (!tweetIdsFromHtml.includes(tweetId)) {
          tweetIdsFromHtml.push(tweetId);
          console.log(`  🐦 Found tweet ID in HTML: ${tweetId}`);
        }
      }
    }
    
    // Step 2: Extract embeds from MARKDOWN links (Firecrawl often converts iframes to markdown links)
    console.log(`  🔍 Checking for social media links in markdown...`);
    content = extractAllEmbedsFromMarkdown(content);
    
    // Step 3: Extract embeds from HTML iframes and inject into markdown at correct positions
    let embedCount = { tiktok: 0, twitter: 0, youtube: 0 };
    if (html) {
      try {
        const extracted = htmlToTokens(html);
        const tokenLines = extracted.contentWithTokens.match(/\[\[EMBED:[^\]]+\]\]/g) || [];
        
        if (tokenLines.length > 0) {
          embedCount = extracted.embedCount;
          console.log(`    🎬 Extracted ${tokenLines.length} embeds: ${JSON.stringify(embedCount)}`);
          
          // Replace markdown blockquotes with tokens (not append!)
          for (const token of tokenLines) {
            const tiktokMatch = /\[\[EMBED:TIKTOK:([^\]]+)\]\]/.exec(token);
            if (tiktokMatch) {
              const url = tiktokMatch[1];
              content = replaceTikTokBlockquote(content, url);
              console.log(`    ✅ Replaced TikTok blockquote with token`);
            }
            
            const tweetMatch = /\[\[EMBED:TWEET:(\d+)\]\]/.exec(token);
            if (tweetMatch) {
              const tweetId = tweetMatch[1];
              content = replaceTwitterBlockquote(content, tweetId);
              console.log(`    ✅ Replaced Twitter blockquote with token`);
            }
            
            // YouTube embeds are usually not in blockquotes in markdown, so we append them
            const youtubeMatch = /\[\[EMBED:YOUTUBE:([^\]]+)\]\]/.exec(token);
            if (youtubeMatch) {
              content = content + '\n\n' + token + '\n\n';
              console.log(`    ✅ Appended YouTube token`);
            }
          }
          
          // Clean up any remaining social media embed text
          content = cleanSocialEmbedRemnants(content);
        }
      } catch (error) {
        console.warn(`    ⚠️ Failed to extract embeds from HTML: ${error.message}`);
      }
    }
    
    // Step 4: Remove ALL markdown images (featured image already stored separately)
    content = content.replace(/!\[[^\]]*\]\([^)]+\)/g, '');
    
    // Step 5: Remove Nuvemmag logo and branding anchors
    content = content
      .replace(/\[!\[[^\]]*\]\([^)]+\)\]\(\s*https?:\/\/(?:www\.)?nuvemmag\.com\/?\s*\)/gi, '')
      .replace(/<a[^>]*href="https?:\/\/(?:www\.)?nuvemmag\.com\/?"[^>]*>\s*<img[\s\S]*?<\/a>/gi, '')
      .replace(/!\[[^\]]*\]\([^)]*NuvemMag-Logo[^)]*\)/gi, '');
    
    // Step 6: Keep "Kaynak:" lines for now (will extract source later, then remove)
    // DO NOT remove "Kaynak:" lines here - they're needed for source extraction!
    
    // Remove any remaining Nuvemmag URLs (that weren't caught in Step 0)
    content = content.replace(/\[([^\]]*)\]\(https?:\/\/(?:www\.)?nuvemmag\.com[^\)]*\)/gi, '');
    content = content.replace(/https?:\/\/(?:www\.)?nuvemmag\.com[^\s\)>\]]+/gi, '');
    
    // Step 7: LINE-BY-LINE AGGRESSIVE CLEANING (after tokens are safely added)
    // Remove navigation, footer, social links, related articles section, etc.
    
    // Split into lines for better control
    const lines = content.split('\n');
    const cleanedLines = [];
    let skipSection = false;
    let skipYouTubeUILines = 0; // Skip lines after YouTube embed (UI text)
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip "İlginizi Çekebilir" section and everything after it
      if (line.includes('İlginizi Çekebilir') || line.includes('Kategoriler')) {
        skipSection = true;
        continue;
      }
      
      // Skip if we're in a skip section
      if (skipSection) {
        // Check if we hit an embed token - if so, stop skipping
        if (line.match(/\[\[EMBED:/)) {
          skipSection = false;
        } else {
          continue;
        }
      }
      
      // Skip lines after YouTube embed (contains UI text like "Info", "Share", subscribers, etc.)
      if (skipYouTubeUILines > 0) {
        skipYouTubeUILines--;
        continue;
      }
      
      // Detect YouTube embed token and skip next lines
      if (line.includes('[[EMBED:YOUTUBE:')) {
        cleanedLines.push(line);
        skipYouTubeUILines = 15; // Skip next 15 lines after YouTube embed
        continue;
      }
      
      // SPECIAL: Replace "Twitter Widget Iframe" with actual tweet token
      // This handles dynamic Twitter embeds that Firecrawl can't properly scrape
      if (line.includes('Twitter Widget Iframe') || line.includes('Twitter Embed')) {
        if (tweetIdsFromHtml.length > 0) {
          // Use the first tweet ID found in HTML
          const tweetId = tweetIdsFromHtml[0];
          cleanedLines.push(`\n[[EMBED:TWEET:${tweetId}]]\n`);
          console.log(`  ✅ Replaced Twitter Widget placeholder with tweet token: ${tweetId}`);
          tweetIdsFromHtml.shift(); // Remove used tweet ID
          continue;
        }
      }
      
      // Skip YouTube UI text that wasn't caught by skipYouTubeUILines
      if (
        line.includes('- YouTube') ||
        line.includes('youtube.com/channel') ||
        line.includes('embeds_referring_euri') ||
        line.match(/^\s*(Info|Share|Subscribe|Watch later|Copy link|Report|Playlist)\s*$/i) ||
        line.match(/^\s*\d+\.?\d*[KM]?\s+subscribers?\s*$/i) || // "19.4K subscribers", "1M subscribers"
        line.match(/^\s*\d+\.?\d*[KM]?\s+views?\s*$/i) || // "1.2M views"
        line.match(/^\s*(Photo image of|Video thumbnail|Uploaded by)\s/i) ||
        line.match(/Introducing.*YouTube$/i) || // "Introducing X - YouTube"
        line.includes('youtube.com/watch?v=') && !line.includes('[[EMBED') ||
        line.includes('youtu.be/') && !line.includes('[[EMBED')
      ) {
        continue;
      }
      
      // Skip navigation/footer/category lines (catch any that slipped through Step 0)
      if (
        line.includes('Ana Sayfa') ||
        line.includes('Ana SayfaEn') ||
        line.includes('En Son Haberler') ||
        line.includes('Çiçek ile Teknoloji') ||
        line.includes('Yapay Zeka Uygulamaları') ||
        line.includes('Yapay Zeka') && line.length < 50 || // Short "Yapay Zeka" is category, not content
        line.includes('Teknoloji') && line.length < 20 || // "Teknoloji" category vs content
        line.includes('Sürdürülebilirlik') && line.length < 30 ||
        line.includes('Bilim ve Dünya') ||
        line.includes('Gündem') && line.length < 20 ||
        line.includes('Kurumsal') ||
        line.includes('Hakkımızda') ||
        line.includes('Küny') ||
        line.includes('İletişim') ||
        line.includes('Aydınlatma') ||
        line.includes('Çerez Politikası') ||
        line.includes('Kişisel Verilerin Korunması') ||
        line.includes('Pinetent Digital') ||
        line.includes('Tüm Hakları Saklıdır') ||
        line.includes('©202') || // Copyright notices
        line.includes('instagram.com') && !line.includes('[[EMBED') ||
        line.includes('twitter.com') && !line.includes('[[EMBED') ||
        line.includes('linkedin.com') ||
        line.includes('youtube.com/@') || // YouTube CHANNEL links (not videos!)
        line.includes('x.com/Nuvemmag') || // Nuvemmag's own Twitter
        line.includes('facebook.com') ||
        line.includes('post-category') || // Category URLs
        line.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/) || // Date lines
        hasNuvemmagDomain(line) && !line.includes('Kaynak:') ||
        line.includes('NuvemMag-Logo') ||
        line.includes('cdn.prod.website-files.com') ||
        line.trim() === '[]()' || line.match(/^\[\]\([^\)]*\)$/) // Empty markdown links
      ) {
        continue;
      }
      
      // Skip lines that are ONLY short names (1-3 words, likely channel/company names)
      const trimmed = line.trim();
      if (trimmed && 
          trimmed.split(/\s+/).length <= 3 && 
          !trimmed.match(/[.,:;!?]/) && 
          !trimmed.match(/\[\[EMBED:/) &&
          !trimmed.startsWith('#') &&
          !trimmed.includes('**')) {
        const prevLine = cleanedLines[cleanedLines.length - 1] || '';
        if (!prevLine.endsWith(',') && !prevLine.endsWith(':') && !prevLine.includes('**')) {
          continue;
        }
      }
      
      cleanedLines.push(line);
    }
    
    content = cleanedLines.join('\n');
    
    // ============================================
    // EXTRACT ORIGINAL SOURCE BEFORE CLEANING
    // Important: Extract from BOTH markdown AND content before removing "Kaynak:"
    // ============================================
    let extractedSource = null;
    
    // Strategy 1: Look for "Kaynak:" in ORIGINAL markdown first
    // This is the most reliable source - catches 90%+ of cases
    const kaynakInMarkdown = markdown.match(/Kaynak:\s*(?:\[([^\]]+)\]\()?([^\s\)<>\]]+)(?:\))?/i);
    if (kaynakInMarkdown) {
      extractedSource = kaynakInMarkdown[2];
      console.log(`    📰 Found source (Strategy 1 - Kaynak in markdown): ${extractedSource}`);
    }
    
    // Strategy 2: Look for "Kaynak:" in cleaned content (if not found in markdown)
    if (!extractedSource) {
      const kaynakInContent = content.match(/Kaynak:\s*(?:\[([^\]]+)\]\()?([^\s\)<>\]]+)(?:\))?/i);
      if (kaynakInContent) {
        extractedSource = kaynakInContent[2];
        console.log(`    📰 Found source (Strategy 2 - Kaynak in content): ${extractedSource}`);
      }
    }
    
    // Strategy 3: Search for any external links in content (excluding social media)
    if (!extractedSource) {
      const allLinksInContent = content.match(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g) || [];
      for (const linkMatch of allLinksInContent) {
        const urlMatch = linkMatch.match(/\((https?:\/\/[^\)]+)\)/);
        if (urlMatch) {
          const linkUrl = urlMatch[1];
          // Skip social media and nuvemmag links
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
            console.log(`    📰 Found source (Strategy 3 - content link): ${extractedSource}`);
            break;
          }
        }
      }
    }
    
    // Strategy 4: Scan ALL URLs in markdown as last resort
    if (!extractedSource) {
      const allUrlsInMarkdown = markdown.match(/https?:\/\/[^\s<>()\[\]]+/gi) || [];
      for (const foundUrl of allUrlsInMarkdown) {
        // Skip social media, nuvemmag, CDN, and image links
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
          console.log(`    📰 Found source (Strategy 4 - markdown scan): ${extractedSource}`);
          break;
        }
      }
    }
    
    // Log if no source was found (this should be VERY rare now)
    if (!extractedSource) {
      console.log(`    ⚠️  No original source found (article may be original Nuvemmag content)`);
    }
    
    // Step 8: Clean up excessive whitespace
    content = content
      .replace(/(\r?\n){3,}/g, '\n\n')
      .replace(/[ \t]+$/gm, '')
      .replace(/^\s*[\r\n]/gm, '\n')
      .trim();
    
    // Remove source attribution from content (after extracting it)
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
 * Widget Preservation System
 * Temporarily replaces widgets with placeholders during translation
 */
function preserveWidgets(content) {
  const widgets = [];
  let processedContent = content;
  
  // 1. Preserve Twitter Widget Iframes
  processedContent = processedContent.replace(/Twitter Widget Iframe/gi, (match) => {
    const placeholder = `__WIDGET_${widgets.length}__`;
    widgets.push({
      type: 'twitter_iframe',
      content: match,
      placeholder
    });
    return placeholder;
  });
  
  // 2. Preserve HTML iframe embeds (Twitter, YouTube, etc.)
  processedContent = processedContent.replace(/<iframe[^>]*>.*?<\/iframe>/gis, (match) => {
    const placeholder = `__WIDGET_${widgets.length}__`;
    widgets.push({
      type: 'iframe_embed',
      content: match,
      placeholder
    });
    return placeholder;
  });
  
  // 3. Preserve Twitter blockquote embeds
  processedContent = processedContent.replace(/<blockquote[^>]*class="twitter-tweet"[^>]*>.*?<\/blockquote>/gis, (match) => {
    const placeholder = `__WIDGET_${widgets.length}__`;
    widgets.push({
      type: 'twitter_blockquote',
      content: match,
      placeholder
    });
    return placeholder;
  });
  
  // 4. Preserve other widget types
  const widgetPatterns = [
    /YouTube Widget/gi,
    /Instagram Widget/gi,
    /Social Media Widget/gi,
    /Widget Iframe/gi
  ];
  
  widgetPatterns.forEach(pattern => {
    processedContent = processedContent.replace(pattern, (match) => {
      const placeholder = `__WIDGET_${widgets.length}__`;
      widgets.push({
        type: 'generic_widget',
        content: match,
        placeholder
      });
      return placeholder;
    });
  });
  
  return { content: processedContent, widgets };
}

/**
 * Restore preserved widgets back to content
 */
function restoreWidgets(translatedContent, widgets) {
  let restoredContent = translatedContent;
  
  // Restore each widget from its placeholder
  widgets.forEach(widget => {
    restoredContent = restoredContent.replace(
      new RegExp(widget.placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      widget.content
    );
  });
  
  return restoredContent;
}

/**
 * Translate text using Groq AI (Unlimited, High Quality)
 * Handles texts of any length - no chunking needed!
 */
async function translateWithModel(model, text) {
  const completion = await groq.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: TRANSLATION_SYSTEM_PROMPT // Use the new prompt that preserves tokens
      },
      {
        role: 'user',
        content: createTranslationPrompt(text) // Use template that reminds to preserve tokens
      }
    ],
    temperature: 0.3,
    max_tokens: 4000,
  });

  let translatedText = completion.choices[0]?.message?.content || text;
  
  // POST-PROCESSING: Remove any leaked instructions from output
  translatedText = translatedText
    .replace(/^REMINDER:.*$/gim, '')
    .replace(/^Note: I have.*$/gim, '')
    .replace(/^Translate the following.*$/gim, '')
    .replace(/^Translation:.*$/gim, '')
    .replace(/Text to translate:.*$/gim, '')
    .trim();
  
  return translatedText;
}

async function translateText(text) {
  if (!text || text.trim().length === 0) {
    return text;
  }

  // Step 1: Preserve widgets by replacing them with placeholders
  const { content: cleanContent, widgets } = preserveWidgets(text);
  
  // Step 2: Translate the clean content (without widgets)
  const models = [GROQ_PRIMARY_MODEL, GROQ_FALLBACK_MODEL, GROQ_LAST_RESORT_MODEL];
  let translatedContent = null;
  
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      const result = await translateWithModel(model, cleanContent);
      
      // Quality check: Make sure translation is not garbage
      const isValidTranslation = 
        result && 
        result.trim().length > 0 && 
        !result.includes('**Translation**') && 
        !result.includes('**Reasoning') &&
        !result.includes('REMINDER:') &&
        !result.includes('Translate the following') &&
        !result.toLowerCase().includes('text to translate:');
      
      if (isValidTranslation) {
        translatedContent = result;
        break; // Success, exit loop
      } else {
        throw new Error(`Translation quality check failed - got garbage output or instructions in result`);
      }
    } catch (error) {
      const msg = String(error?.message || error);
      const isRateLimit = msg.includes('429') || msg.includes('rate_limit') || msg.includes('Rate limit');
      
      console.warn(`⚠️ Model ${model} failed: ${msg}`);
      
      // If it's a rate limit error, wait longer
      if (isRateLimit && i < models.length - 1) {
        console.log(`⏳ Rate limit detected, waiting 3 seconds before trying next model...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      // If this is the last model, throw error
      if (i === models.length - 1) {
        throw new Error(`All translation models failed. Last error: ${msg}`);
      }
    }
  }
  
  if (!translatedContent) {
    throw new Error('All translation models failed');
  }
  
  // Step 3: Restore widgets back to the translated content
  const finalContent = restoreWidgets(translatedContent, widgets);
  
  // Log widget preservation stats
  if (widgets.length > 0) {
    console.log(`    🔧 Preserved ${widgets.length} widgets during translation`);
  }
  
  return finalContent;
}

/**
 * Translate article to English using Groq AI
 * Can handle full articles without chunking!
 */
/**
 * Post-process translation to ensure quality
 */
function cleanTranslation(text) {
  if (!text) return text;
  
  let cleaned = text;
  
  // Remove any instruction leakage patterns
  const instructionPatterns = [
    /^REMINDER:.*$/gim,
    /^Note: I have.*$/gim,
    /^I have preserved.*$/gim,
    /^I have kept.*$/gim,
    /^Translate the following.*$/gim,
    /^Translation:.*$/gim,
    /^Text to translate:.*$/gim,
  ];
  
  instructionPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  // Clean up excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
  
  return cleaned;
}

async function translateArticle(article) {
  console.log(`🌐 Translating article with Groq AI...`);
  console.log(`   Title length: ${article.title.length} chars`);
  console.log(`   Content length: ${article.content.length} chars`);
  
  try {
    // Translate title
    console.log(`   🔤 Translating title...`);
    const translatedTitle = cleanTranslation(await translateText(article.title));
    await new Promise(resolve => setTimeout(resolve, CONFIG.TRANSLATION_DELAY));
    
    // Translate description
    console.log(`   📝 Translating description...`);
    const translatedDescription = cleanTranslation(await translateText(article.description));
    await new Promise(resolve => setTimeout(resolve, CONFIG.TRANSLATION_DELAY));
    
    // Translate full content (no chunking needed!)
    console.log(`   📄 Translating full content...`);
    const translatedContent = cleanTranslation(await translateText(article.content));
    
    // FINAL VALIDATION: Ensure no instruction leakage
    if (translatedTitle.includes('REMINDER:') || 
        translatedTitle.includes('Note: I have') ||
        translatedContent.includes('Text to translate:')) {
      throw new Error('Translation contains instruction leakage - rejecting');
    }
    
    // Create translated article object
    const translatedArticle = {
      ...article,
      title: translatedTitle,
      description: translatedDescription,
      content: translatedContent,
      originalTitle: article.title,
    };
    
    // QUALITY CHECK: Validate content quality
    console.log(`   🔍 Running content quality check...`);
    try {
      assertContentQuality(translatedArticle);
      console.log(`   ✅ Content quality check PASSED`);
    } catch (error) {
      console.error(`   ❌ Content quality check FAILED: ${error.message}`);
      throw new Error(`Content quality validation failed: ${error.message}`);
    }
    
    console.log(`   ✅ Translation complete and validated`);
    
    return translatedArticle;
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
  
  // Get current article count from Supabase
  const currentCount = await getArticleCount();
  console.log(`\n📊 Current database: ${currentCount} articles\n`);
  
  // Scrape all categories
  const articlesWithCategories = await scrapeAllCategories();
  
  if (articlesWithCategories.length === 0) {
    console.log('⚠️ No articles found in any category. Exiting.');
    return;
  }
  
  console.log(`📝 Found ${articlesWithCategories.length} articles total...\n`);
  
  // Bulk check: Get all existing articles from Supabase
  const allUrls = articlesWithCategories.map(article => article.url);
  console.log(`🔍 Checking which articles already exist in database...`);
  const existingUrls = await getExistingArticles(allUrls);
  
  // Filter to only new articles
  const newArticles = articlesWithCategories.filter(article => !existingUrls.has(article.url));
  const duplicateCount = articlesWithCategories.length - newArticles.length;
  
  console.log(`✅ Found ${newArticles.length} new articles to process`);
  console.log(`⏭️  Skipping ${duplicateCount} existing articles\n`);
  
  if (newArticles.length === 0) {
    console.log('ℹ️  All articles already exist in database. Nothing to process.');
    return;
  }
  
  let newArticlesCount = 0;
  let failedCount = 0;
  
  for (const { url, category } of newArticles) {
    console.log(`📰 [${category}] Processing: ${url}`);
    
    // Scrape article details
    const article = await scrapeArticleDetails(url);
    
    if (!article) {
      failedCount++;
      continue;
    }
    
    try {
      // Translate article
      const translatedArticle = await translateArticle(article);
      
      // Quality check: Make sure translation actually happened
      if (!translatedArticle || translatedArticle.title === article.title || 
          translatedArticle.title.includes('**Translation**') ||
          translatedArticle.content.includes('**Translation**')) {
        throw new Error('Translation failed or returned original/garbage text');
      }
      
      // Prepare article data
      const articleData = {
        ...translatedArticle,
        category, // Add category tag
        slug: generateSlug(translatedArticle.title), // Generate English slug from translated title
      };
      
      // Save to Supabase
      const result = await saveArticle(articleData);
      
      if (result.success) {
        newArticlesCount++;
        console.log(`✅ [${category}] Article added successfully to Supabase!\n`);
      } else {
        failedCount++;
        console.log(`❌ [${category}] Failed to save article to database\n`);
      }
    } catch (translationError) {
      failedCount++;
      console.log(`❌ [${category}] Translation failed: ${translationError.message}`);
      console.log(`❌ [${category}] Skipping article to avoid saving bad translation\n`);
      continue; // Skip this article, don't save to DB
    }
    
    // Rate limiting between articles (Firecrawl free: 10 req/min)
    await new Promise(resolve => setTimeout(resolve, 7000)); // 7 seconds = ~8 req/min
  }
  
  // Get final count
  const finalCount = await getArticleCount();
  
  console.log('='.repeat(60));
  console.log(`🎉 Multi-Category Scraping Completed!`);
  console.log(`📊 New articles added: ${newArticlesCount}`);
  console.log(`⏭️  Skipped (duplicates): ${duplicateCount}`);
  console.log(`❌ Failed to process: ${failedCount}`);
  console.log(`📊 Total articles in database: ${finalCount}`);
  console.log(`⏰ Last updated: ${new Date().toISOString()}`);
  console.log(`💾 Storage: Supabase PostgreSQL`);
  console.log('='.repeat(60));
}

// Run scraper
scrapeNews().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
