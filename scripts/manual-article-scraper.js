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

import crypto from 'crypto';
import { supabase } from './lib/supabaseAdmin.js';
import { env } from './lib/config.js';
import { htmlToTokens } from './embeds/extractEmbeds.js';
import { extractAllEmbedsFromMarkdown } from './embeds/extractMarkdownEmbeds.js';
import { generateSlug } from './lib/scraper/database.js';

const CONFIG = {
  FIRECRAWL_API_KEY: env.FIRECRAWL_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_API_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
};

/**
 * Generate unique ID from URL
 */
function generateArticleId(url) {
  return crypto.createHash('md5').update(url).digest('hex');
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
      formats: ['markdown', 'html', 'rawHtml'],
      onlyMainContent: true,
      includeTags: ['article', 'main', 'img', 'iframe', 'blockquote'],
      excludeTags: ['nav', 'footer', 'aside', 'form', 'button', 'script', 'style'],
      removeBase64Images: true,
      waitFor: 4500,
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
    rawHtml: result.data.rawHtml || result.data.html || '',
    title: result.data.metadata?.title || 'Untitled',
    description: result.data.metadata?.description || '',
    ogImage: result.data.metadata?.ogImage || result.data.metadata?.image || '',
  };
}

/**
 * Clean unwanted promotional content from article text
 */
function cleanPromotionalContent(text) {
  if (!text) return text;
  
  // Patterns to remove
  const unwantedPatterns = [
    /Don't miss out on.*?newsletter/gi,
    /Sign up for.*?(?:newsletter|digest|updates)/gi,
    /Subscribe to.*?(?:newsletter|digest|updates)/gi,
    /Follow us on.*?(?:Twitter|Facebook|LinkedIn|Instagram)/gi,
    /Read more (?:articles|stories) (?:on|at).*$/gim,
    /Related (?:articles|stories|content):?.*$/gim,
    /\[Advertisement\]/gi,
    /Click here to.*$/gim,
    /For more information.*$/gim,
  ];
  
  let cleaned = text;
  for (const pattern of unwantedPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // Remove multiple consecutive newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  return cleaned.trim();
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
  "content_en": "Full article in English with all details, quotes, and context",
  "image_url": "Featured image URL if available",
  "reading_time": 5,
  "optimization_notes": "Brief notes on changes"
}

Rules:
1. If Turkish, translate to clear, professional English
2. If English, keep as is but optimize for engagement
3. Make title compelling but accurate (no clickbait, no false info)
4. Calculate reading_time: word_count / 200 = minutes (round up)
5. CRITICAL: Preserve all [[EMBED:...]] tokens EXACTLY as they appear (e.g. [[EMBED:YOUTUBE:abc123]], [[EMBED:TWEET:123456]], [[EMBED:TIKTOK:https://...]]). Do NOT modify, translate, or remove them.
5. Category must match primary content focus:
   - AI: Artificial Intelligence, Machine Learning, LLMs, AI Applications
   - Cloud: Cloud Computing, AWS, Azure, GCP, Serverless
   - Security: Cybersecurity, Data Privacy, Encryption, Vulnerabilities
   - Development: Programming, Software Development, DevOps, Tools
   - Hardware: Processors, GPUs, IoT, Hardware innovations
   - Business: Tech business, startups, funding, M&A
   - Other: Everything else
6. Keep original facts and meaning, just make it more engaging
7. Extract FULL article content - don't truncate, include all paragraphs, quotes, details
8. For image_url: Use the OG image provided, or extract the first featured/hero image from content
9. REMOVE these types of content from the article:
   - Newsletter signup prompts ("Sign up for...", "Subscribe to...", "Don't miss out...")
   - Author bios and contact info (unless essential to the story)
   - Social media follow buttons/links
   - Related articles sections
   - Cookie notices and privacy pop-ups
   - Comments sections
   - Advertisement text
   - Footer content
   - "Read more on..." promotional text
   Only keep the core news article content

Article URL: ${articleUrl}
Original Source: ${originalSource}

Scraped Title: ${scrapedContent.title}
Scraped Description: ${scrapedContent.description}
OG Image: ${scrapedContent.ogImage || 'None'}

Full Scraped Content:
${scrapedContent.markdown.substring(0, 15000)}

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
    
    // Clean promotional content from the article
    if (parsed.content_en) {
      parsed.content_en = cleanPromotionalContent(parsed.content_en);
    }
    
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

  // Content validation
  if (article.content !== undefined && article.content !== null) {
    const lowerContent = article.content.toLowerCase();
    const rejectionKeywords = ["i'm unable", "i cannot", "i'm sorry", "fulfill this request"];
    let rejectionReason = null;

    if (article.content.length < 100) {
      rejectionReason = "Content is under 100 characters";
    } else {
      for (const keyword of rejectionKeywords) {
        if (lowerContent.includes(keyword)) {
          rejectionReason = `Content contains refusal phrase: "${keyword}"`;
          break;
        }
      }
    }

    if (rejectionReason) {
      console.warn(`⚠️  ARTICLE REJECTED: ${rejectionReason}`);

      const { error: rejectError } = await supabase
        .from('rejected_articles')
        .insert([{
          title: article.title || article.original_title || '',
          content: article.content,
          source_url: article.source_url,
          original_source: article.original_source,
          reason: rejectionReason
        }]);

      if (rejectError) {
        console.error('❌ Error saving to rejected_articles table:', rejectError);
      } else {
        console.log(`✅ Logged rejected article to database`);
      }

      // Return a skipped indicator instead of throwing, per requirements
      return { skipped: true, reason: rejectionReason };
    }
  }

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

    // Step 3.5: Extract social media embeds (YouTube, Twitter, TikTok) as tokens
    let processedMarkdown = extractAllEmbedsFromMarkdown(scrapedContent.markdown);
    if (scrapedContent.rawHtml) {
      try {
        const htmlEmbeds = htmlToTokens(scrapedContent.rawHtml);
        const htmlTokens = htmlEmbeds.contentWithTokens.match(/\[\[EMBED:[^\]]+\]\]/g) || [];
        for (const token of htmlTokens) {
          if (!processedMarkdown.includes(token)) {
            processedMarkdown = processedMarkdown.trimEnd() + '\n\n' + token + '\n\n';
          }
        }
        const total = Object.values(htmlEmbeds.embedCount).reduce((a, b) => a + b, 0);
        if (total > 0) {
          console.log(`  🎬 Extracted ${total} embed(s) from HTML: ${JSON.stringify(htmlEmbeds.embedCount)}`);
        }
      } catch (e) {
        console.warn(`  ⚠️ HTML embed extraction failed: ${e.message}`);
      }
    }
    scrapedContent.markdown = processedMarkdown;

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
      image_url: aiResult.image_url || scrapedContent.ogImage || null,
      source_url: articleUrl,
      original_source: originalSourceUrl,
      date: new Date().toISOString().split('T')[0],
      views: 0,
      created_at: new Date().toISOString(),
    };

    // Step 7: Save to database
    const savedArticle = await saveToSupabase(article);

    if (savedArticle.skipped) {
      console.log(`\n⚠️  Manual article was rejected during validation: ${savedArticle.reason}`);
      return {
        success: false,
        skipped: true,
        reason: savedArticle.reason,
      };
    }

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

/**
 * Send Telegram notification
 */
async function sendTelegramNotification(message, userId) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!botToken || !chatId) {
    console.warn('⚠️  Telegram credentials not configured, skipping notification');
    return;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🏠 Ana Menü', callback_data: 'action_refresh_menu' }]
            ]
          }
        })
      }
    );
    
    if (!response.ok) {
      console.error('❌ Telegram notification failed:', await response.text());
    }
  } catch (error) {
    console.error('❌ Telegram notification error:', error);
  }
}

/**
 * CLI Handler - for GitHub Actions
 */
if (process.argv[1]?.includes('manual-article-scraper.js')) {
  const [, , articleUrl, originalSource, telegramUserId] = process.argv;
  
  if (!articleUrl || !originalSource) {
    console.error('❌ Usage: node manual-article-scraper.js <article_url> <original_source> [telegram_user_id]');
    process.exit(1);
  }

  (async () => {
    try {
      console.log('🚀 Starting manual article scraper...');
      console.log(`   Article URL: ${articleUrl}`);
      console.log(`   Original Source: ${originalSource}`);
      
      // Send initial notification
      if (telegramUserId) {
        await sendTelegramNotification(
          '⚙️ <b>İşlem Başlıyor...</b>\n\n' +
          '⏳ Makale scrape ediliyor...\n' +
          '⏹️ AI işleme yapılıyor...\n' +
          '⏹️ Veritabanına kaydediliyor...\n\n' +
          '<i>Bu işlem 30-60 saniye sürebilir...</i>',
          telegramUserId
        );
      }

      // Process article
      const result = await processManualArticle(articleUrl, originalSource);

      // Send success notification
      if (telegramUserId) {
        await sendTelegramNotification(
          '✅ <b>Haber Başarıyla Eklendi!</b>\n\n' +
          `📰 <b>Başlık:</b> ${result.article.title}\n\n` +
          `📂 <b>Kategori:</b> ${result.article.category}\n` +
          `📊 <b>Okuma Süresi:</b> ${result.readingTime} dk\n` +
          `🔗 <b>URL:</b> https://cemkoyluoglu.codes/tech-news/${result.article.slug}\n\n` +
          `<i>✨ ${result.optimizationNotes}</i>`,
          telegramUserId
        );
      }

      console.log('\n✅ Manual article processing completed successfully!');
      process.exit(0);
    } catch (error) {
      console.error('\n❌ Manual article processing failed:', error);
      
      // Send error notification
      if (telegramUserId) {
        await sendTelegramNotification(
          `❌ <b>Hata Oluştu!</b>\n\n` +
          `<code>${error.message}</code>\n\n` +
          'Lütfen tekrar deneyin veya /help ile destek alın.',
          telegramUserId
        );
      }
      
      process.exit(1);
    }
  })();
}

