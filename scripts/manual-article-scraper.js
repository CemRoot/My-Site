/**
 * Manual Article Scraper for Telegram Bot
 * 
 * Allows users to manually add articles via Telegram:
 * - Firecrawl for web scraping
 * - Gemini AI (Google) for language detection, translation, and optimization
 * - Auto-category assignment
 * - Reading time calculation
 * - Supabase storage
 */

import 'dotenv/config';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Configuration
const CONFIG = {
  FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  GEMINI_API_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
};

// Initialize Supabase client
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
export function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

/**
 * Ensure slug is unique by appending number if needed
 */
async function ensureUniqueSlug(baseSlug) {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const { data, error } = await supabase
      .from('tech_news_articles')
      .select('slug')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      // Slug is unique
      return slug;
    }

    // Slug exists, try next variation
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/**
 * Validate URL format
 */
export function isValidUrl(urlString) {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

/**
 * Scrape article using Firecrawl
 */
export async function scrapeArticleWithFirecrawl(url) {
  if (!CONFIG.FIRECRAWL_API_KEY) {
    throw new Error('FIRECRAWL_API_KEY not configured');
  }

  console.log(`📡 Scraping article: ${url}`);

  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.FIRECRAWL_API_KEY}`,
    },
    body: JSON.stringify({
      url: url,
      formats: ['markdown', 'html'],
      onlyMainContent: true,
      waitFor: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firecrawl error (${response.status}): ${errorText}`);
  }

  const result = await response.json();

  if (!result.success || !result.data) {
    throw new Error('Firecrawl returned no data');
  }

  return {
    markdown: result.data.markdown || '',
    html: result.data.html || '',
    title: result.data.metadata?.title || 'Untitled',
    description: result.data.metadata?.description || '',
  };
}

/**
 * Process article with Gemini AI
 */
export async function processWithGemini(scrapedContent, articleUrl, originalSource) {
  if (!CONFIG.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  console.log(`🤖 Processing with Gemini AI...`);

  const prompt = `You are a tech news editor. Analyze this article and return ONLY valid JSON (no markdown, no code blocks).

Return this exact JSON structure:
{
  "language": "en or tr",
  "category": "AI|Cloud|Security|Development|Hardware|Business|Other",
  "title_en": "Engaging English title",
  "description_en": "2-3 sentence summary in English",
  "content_en": "Full article in English",
  "reading_time": 5,
  "optimization_notes": "Brief notes on changes"
}

Rules:
1. If Turkish, translate to clear, professional English
2. If English, keep as is but optimize for engagement
3. Make title compelling but accurate (no clickbait, no false info)
4. Calculate reading_time: word_count / 200 = minutes (round up)
5. Category must match primary content focus:
   - AI: Artificial Intelligence, Machine Learning, LLMs, AI Applications
   - Cloud: Cloud Computing, AWS, Azure, GCP, Serverless
   - Security: Cybersecurity, Data Privacy, Encryption, Vulnerabilities
   - Development: Programming, Software Development, DevOps, Tools
   - Hardware: Processors, GPUs, IoT, Hardware innovations
   - Business: Tech business, startups, funding, M&A
   - Other: Everything else
6. Keep original facts and meaning, just make it more engaging

Article URL: ${articleUrl}
Original Source: ${originalSource}

Scraped Title: ${scrapedContent.title}
Scraped Description: ${scrapedContent.description}

Scraped Content (first 3000 chars):
${scrapedContent.markdown.substring(0, 3000)}

Return ONLY the JSON object, nothing else.`;

  const response = await fetch(
    `${CONFIG.GEMINI_API_ENDPOINT}?key=${CONFIG.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();

  if (!result.candidates || result.candidates.length === 0) {
    throw new Error('Gemini returned no candidates');
  }

  const text = result.candidates[0].content.parts[0].text;

  // Extract JSON from response (handle markdown code blocks)
  let jsonText = text.trim();
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/```\n?/g, '');
  }

  try {
    const parsed = JSON.parse(jsonText);
    console.log(`✅ Gemini processing complete`);
    console.log(`   Language: ${parsed.language}`);
    console.log(`   Category: ${parsed.category}`);
    console.log(`   Reading time: ${parsed.reading_time} min`);
    return parsed;
  } catch (e) {
    console.error('Failed to parse Gemini response:', jsonText);
    throw new Error(`Failed to parse Gemini JSON: ${e.message}`);
  }
}

/**
 * Save article to Supabase
 */
export async function saveToSupabase(article) {
  console.log(`💾 Saving to Supabase...`);

  const { data, error } = await supabase
    .from('tech_news_articles')
    .insert([article])
    .select()
    .single();

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  console.log(`✅ Article saved with ID: ${data.id}`);
  return data;
}

/**
 * Main function: Process manual article submission
 */
export async function processManualArticle(articleUrl, originalSourceUrl) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Processing Manual Article`);
  console.log(`   Article URL: ${articleUrl}`);
  console.log(`   Original Source: ${originalSourceUrl}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // Step 1: Validate URLs
    if (!isValidUrl(articleUrl)) {
      throw new Error('Invalid article URL format');
    }
    if (!isValidUrl(originalSourceUrl)) {
      throw new Error('Invalid original source URL format');
    }

    // Step 2: Check for duplicates
    const articleId = generateArticleId(articleUrl);
    const { data: existing } = await supabase
      .from('tech_news_articles')
      .select('id, title')
      .eq('id', articleId)
      .single();

    if (existing) {
      throw new Error(`Article already exists: "${existing.title}"`);
    }

    // Step 3: Scrape article
    const scrapedContent = await scrapeArticleWithFirecrawl(articleUrl);

    // Step 4: Process with Gemini AI
    const aiResult = await processWithGemini(scrapedContent, articleUrl, originalSourceUrl);

    // Step 5: Generate unique slug
    const baseSlug = generateSlug(aiResult.title_en);
    const uniqueSlug = await ensureUniqueSlug(baseSlug);

    // Step 6: Prepare article for database
    const article = {
      id: articleId,
      title: aiResult.title_en,
      slug: uniqueSlug,
      description: aiResult.description_en,
      content: aiResult.content_en,
      category: aiResult.category,
      source_url: articleUrl,
      original_source: originalSourceUrl,
      date: new Date().toISOString().split('T')[0],
      views: 0,
      created_at: new Date().toISOString(),
    };

    // Step 7: Save to database
    const savedArticle = await saveToSupabase(article);

    console.log(`\n✅ Manual article processed successfully!`);
    console.log(`   Title: ${savedArticle.title}`);
    console.log(`   Slug: ${savedArticle.slug}`);
    console.log(`   Category: ${savedArticle.category}`);
    console.log(`   Reading time: ${aiResult.reading_time} min`);
    console.log(`   URL: https://cemkoyluoglu.codes/tech-news/${savedArticle.slug}`);

    return {
      success: true,
      article: savedArticle,
      readingTime: aiResult.reading_time,
      optimizationNotes: aiResult.optimization_notes,
    };
  } catch (error) {
    console.error(`\n❌ Error processing manual article:`, error);
    throw error;
  }
}

