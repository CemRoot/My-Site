/**
 * Firecrawl-based scraper.
 * Uses the Firecrawl API for both category list and article detail scraping.
 */

import Groq from 'groq-sdk';
import { BaseScraper } from './BaseScraper.js';
import { SCRAPER_CONFIG } from '../config.js';
import { htmlToTokens } from '../../../embeds/extractEmbeds.js';
import { extractAllEmbedsFromMarkdown } from '../../../embeds/extractMarkdownEmbeds.js';
import { replaceTikTokBlockquote, replaceTwitterBlockquote, cleanSocialEmbedRemnants } from '../../../embeds/cleanMarkdownEmbeds.js';
import { parseTurkishDate, isRecent, getDatePriority } from '../dateUtils.js';
import { extractSlugFromUrl } from '../database.js';

const BLOCKED_URL_SLUGS = [
  'hesabim', 'my-account', 'giris', 'login', 'kayit', 'register',
  'sepet', 'cart', 'checkout', 'odeme', 'wp-admin', 'wp-login',
  'wp-register', 'feed', 'rss', 'sitemap', 'robots', 'favicon',
  'iletisim', 'contact', 'hakkimizda', 'about', 'gizlilik',
  'privacy', 'terms', 'kvkk', 'cerez', 'cookie', 'yazarlar',
  'author', 'profil', 'profile', 'ayarlar', 'settings',
  'abone', 'subscribe', 'newsletter', 'search', 'ara',
];

function isBlockedUrl(url) {
  try {
    const pathname = new URL(url).pathname.replace(/\/$/, '').toLowerCase();
    const slug = pathname.split('/').pop();
    return BLOCKED_URL_SLUGS.some(b => slug === b || pathname.includes(`/${b}/`) || pathname.includes(`/${b}`));
  } catch {
    return false;
  }
}

function hasNuvemmagDomain(line) {
  const urlRegex = /(https?:\/\/[^\s)>]+)/ig;
  let match;
  while ((match = urlRegex.exec(line)) !== null) {
    try {
      const hostname = new URL(match[1]).hostname.toLowerCase();
      if (hostname === 'nuvemmag.com' || hostname.endsWith('.nuvemmag.com')) return true;
    } catch { /* skip */ }
  }
  return false;
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

export class FirecrawlScraper extends BaseScraper {
  constructor(apiKey) {
    super('FirecrawlScraper');
    this.apiKey = apiKey;
    this.groqParser = new Groq({ apiKey: SCRAPER_CONFIG.GROQ_PARSER_API_KEY });
  }

  isAvailable() {
    return !!this.apiKey;
  }

  isFirecrawlExhausted(error, statusCode) {
    if (statusCode === 402) return true;
    const msg = String(error?.message || error || '').toLowerCase();
    if (statusCode === 429 && (msg.includes('credits') || msg.includes('quota'))) return true;
    if (msg.includes('insufficient credits') || msg.includes('credit limit')) return true;
    return false;
  }

  async _fetchWithRetry(url, options, context = '') {
    const maxRetries = SCRAPER_CONFIG.MAX_RETRIES;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) console.log(`  🔄 Retry ${attempt - 1}/${maxRetries - 1} for ${context}...`);
        const response = await fetch(url, options);

        if (response.ok) return { success: true, response };

        const status = response.status;
        const body = await response.text().catch(() => '');

        if (status === 402 || (status === 429 && (body.includes('credits') || body.includes('quota')))) {
          const err = new Error(`Firecrawl ${status}: ${body.substring(0, 200)}`);
          err.statusCode = status;
          throw err;
        }

        if (![408, 502, 503].includes(status) || attempt === maxRetries) {
          return { success: false, status, response: { text: () => Promise.resolve(body) } };
        }

        const delay = 3000 * attempt;
        console.log(`  ⚠️  ${status} error on ${context}, retry in ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));
      } catch (error) {
        if (this.isFirecrawlExhausted(error, error.statusCode)) throw error;
        if (attempt === maxRetries) return { success: false, error: error.message };
        const delay = 3000 * attempt;
        console.log(`  ⚠️  Network error on ${context}, retry in ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
    return { success: false, error: 'Max retries exceeded' };
  }

  // ─── Category list scraping ───

  async scrapeArticleList(categoryUrl, categoryTag) {
    console.log(`\n📂 [Firecrawl] Scraping category: ${categoryTag} from ${categoryUrl}`);

    const result = await this._fetchWithRetry(
      'https://api.firecrawl.dev/v2/scrape',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          url: categoryUrl,
          formats: ['markdown'],
          onlyMainContent: true,
          waitFor: 2000,
        }),
      },
      `category ${categoryTag}`
    );

    if (!result.success) {
      console.error(`  ❌ Failed to scrape category: ${result.status || result.error}`);
      return [];
    }

    const data = await result.response.json();
    const markdown = data?.data?.markdown;

    if (!markdown) {
      console.error(`  ❌ No markdown content in response for ${categoryTag}`);
      return [];
    }

    console.log(`  📄 Got ${markdown.length} chars of markdown`);

    const aiArticles = await this._parseArticlesWithAI(markdown, categoryTag);

    if (aiArticles && aiArticles.length > 0) {
      const limited = aiArticles.slice(0, SCRAPER_CONFIG.MAX_ARTICLES_PER_CATEGORY);
      console.log(`  📊 Using ${limited.length} articles from AI parsing (limited from ${aiArticles.length})`);
      return limited;
    }

    console.log(`  ⚠️ AI parsing returned no results, trying regex fallback...`);
    return this._regexFallback(markdown, categoryTag);
  }

  async _parseArticlesWithAI(markdown, categoryTag) {
    console.log(`  🤖 Using AI to parse article list for ${categoryTag}...`);

    try {
      const completion = await this.groqParser.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are a web scraping assistant. Extract article information from Turkish tech news markdown.

CRITICAL URL PATTERNS (updated December 2025):
- NEW format: https://nuvemmag.com/article-slug-here/
- OLD format: https://nuvemmag.com/post/article-slug/ (still valid)
- Do NOT include category URLs like /category/
- Do NOT include utility pages: /hesabim/, /giris/, /kayit/, /iletisim/, /hakkimizda/, /gizlilik/, /cerez/, /my-account/, /login/, /register/, /contact/, /about/, /privacy/, /cookie/
- ONLY include actual news article URLs

DATE FORMATS to recognize:
- Absolute: "16 Aralık 2025", "17 Aralık 2024"
- Relative: "3 gün önce", "11 saat önce", "1 hafta önce", "2 ay önce", "bugün", "dün"

RULES:
1. Extract article URLs (NOT category URLs)
2. Extract publication date (absolute or relative format)
3. Return ONLY valid JSON array
4. If no articles found, return: []

Output JSON:
[{"url": "https://nuvemmag.com/article-slug/", "date": "3 gün önce"}]`,
          },
          {
            role: 'user',
            content: `Extract all article URLs and their dates from this Turkish tech news category page. Return ONLY a JSON array.\n\n${markdown.substring(0, 10000)}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 3000,
      });

      const response = completion.choices[0]?.message?.content || '[]';
      let jsonStr = response;
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) jsonStr = jsonMatch[0];

      const articles = JSON.parse(jsonStr);
      if (!Array.isArray(articles)) throw new Error('AI response is not an array');

      console.log(`  ✅ AI extracted ${articles.length} articles`);

      const processed = [];
      for (const article of articles) {
        if (!article.url || !article.url.includes('nuvemmag.com/')) continue;
        if (article.url.includes('/category/')) continue;
        if (isBlockedUrl(article.url)) continue;

        const parsedDate = parseTurkishDate(article.date);
        if (!parsedDate) {
          const today = new Date();
          processed.push({
            url: article.url,
            category: categoryTag,
            scrapedDate: `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`,
            datePriority: 50,
          });
          continue;
        }

        if (!isRecent(parsedDate)) continue;

        processed.push({
          url: article.url,
          category: categoryTag,
          scrapedDate: parsedDate,
          datePriority: getDatePriority(parsedDate),
        });
      }

      processed.sort((a, b) => b.datePriority - a.datePriority);
      return processed;
    } catch (error) {
      console.error(`  ❌ AI parsing failed: ${error.message}`);
      return null;
    }
  }

  _regexFallback(markdown, categoryTag) {
    const urlRegex = /https:\/\/nuvemmag\.com\/(?:post\/)?[a-z0-9-]+\/?/gi;
    const matches = [...new Set(markdown.match(urlRegex) || [])];
    const filtered = matches.filter(u =>
      !u.includes('/category/') &&
      !u.includes('/wp-content/') &&
      !u.includes('/wp-includes/') &&
      !u.includes('/wp-json/') &&
      !isBlockedUrl(u)
    );

    const today = new Date();
    const todayStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

    const articles = filtered.slice(0, SCRAPER_CONFIG.MAX_ARTICLES_PER_CATEGORY).map(url => ({
      url,
      category: categoryTag,
      scrapedDate: todayStr,
      datePriority: 50,
    }));

    console.log(`  📊 Regex fallback found ${articles.length} articles`);
    return articles;
  }

  // ─── Article detail scraping ───

  async scrapeArticleDetails(url) {
    console.log(`   🔍 [Firecrawl] Scraping article: ${url}`);

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };
    const slug = url.split('/').pop();

    const [markdownResult, htmlResult] = await Promise.all([
      this._fetchWithRetry(
        'https://api.firecrawl.dev/v2/scrape',
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            url,
            formats: ['markdown'],
            onlyMainContent: true,
            includeTags: ['.content__post--article', '.geoit_entry-content'],
            excludeTags: [
              '.cky-consent-container', '.cky-modal', '.cky-overlay',
              '.geo-reaction-wrapper', '.geo-reaction-bar', '.geo-reaction-title',
              '.content__related-posts', '.comments-area', '.comment-respond',
              '.post-views', '.geo-notification', '.content__post--meta-social',
              '.content__post--article_tags', '.geo-lazy',
              'footer', 'header', 'nav',
            ],
            waitFor: 3000,
          }),
        },
        `article-markdown ${slug}`
      ),
      this._fetchWithRetry(
        'https://api.firecrawl.dev/v2/scrape',
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ url, formats: ['html'], onlyMainContent: false, waitFor: 3000 }),
        },
        `article-html ${slug}`
      ),
    ]);

    if (!markdownResult.success) {
      console.error(`   ❌ Failed to scrape article: ${markdownResult.status || markdownResult.error}`);
      return null;
    }

    const markdownData = (await markdownResult.response.json())?.data;
    const htmlData = htmlResult.success ? (await htmlResult.response.json())?.data : null;

    if (!markdownData) {
      console.error(`   ❌ No article data in response`);
      return null;
    }

    let markdownContent = markdownData?.markdown || '';
    let htmlContent = htmlData?.html || '';
    const metadata = markdownData?.metadata || htmlData?.metadata || {};

    return this._processScrapedContent(url, markdownContent, htmlContent, metadata);
  }

  _processScrapedContent(url, markdownContent, htmlContent, metadata) {
    let embedTokens = [];
    if (htmlContent) {
      try {
        const { contentWithTokens, embedCount } = htmlToTokens(htmlContent);
        embedTokens = contentWithTokens.match(/\[\[EMBED:(?:TIKTOK|TWEET|YOUTUBE):[^\]]+\]\]/g) || [];
        const total = embedCount.youtube + embedCount.twitter + embedCount.tiktok;
        if (total > 0) {
          console.log(`  ✅ Extracted ${total} embed(s) from raw HTML (YT:${embedCount.youtube} TW:${embedCount.twitter} TT:${embedCount.tiktok})`);
        }
      } catch { /* skip */ }
    }

    const lines = markdownContent.split('\n');
    const cleanedLines = lines.filter(line => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (hasNuvemmagDomain(trimmed)) return false;
      if (/^\[?\s*!\[[^\]]*\]\([^)]*nuvemmag[^)]*\)/i.test(trimmed)) return false;
      if (/^\[?\s*!\[[^\]]*nuvemmag[^\]]*\]/i.test(trimmed)) return false;
      if (/^\s*Share\s*$/i.test(trimmed)) return false;
      if (/^(Tech News|Home|Back to Tech News|Latest News|Artificial Intelligence|Technology|Sustainability|Science|Agenda)$/i.test(trimmed)) return false;
      if (/^Back to/i.test(trimmed)) return false;
      if (/^\s*\d+\s+min\s+read\s*$/i.test(trimmed)) return false;
      if (/^\s*\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\s*$/i.test(trimmed)) return false;
      if (/^\[?Nuvem\]?\s*\(.*nuvemmag\.com\/author/i.test(trimmed)) return false;
      if (/^\s*Yazarın Profili\s*$/i.test(trimmed)) return false;
      if (/^\[Yazarın Profili\]/i.test(trimmed)) return false;
      return true;
    });
    markdownContent = cleanedLines.join('\n');

    markdownContent = replaceTikTokBlockquote(markdownContent);
    markdownContent = replaceTwitterBlockquote(markdownContent);
    markdownContent = cleanSocialEmbedRemnants(markdownContent);
    markdownContent = extractAllEmbedsFromMarkdown(markdownContent);

    const mdTokens = markdownContent.match(/\[\[EMBED:(?:TIKTOK|TWEET|YOUTUBE):[^\]]+\]\]/gi) || [];
    for (const t of mdTokens) {
      if (!embedTokens.includes(t)) embedTokens.push(t);
    }

    if (embedTokens.length > 0) {
      const existing = new Set(mdTokens);
      const newTokens = embedTokens.filter(t => !existing.has(t));
      if (newTokens.length > 0) {
        markdownContent = markdownContent.trimEnd() + '\n\n' + newTokens.join('\n\n') + '\n\n';
      }
    }

    markdownContent = markdownContent.replace(/\n{3,}/g, '\n\n').trim();

    let originalSource = '';
    const sourcePatterns = [
      /(?:kaynak|source)[:\s]+(https?:\/\/[^\s\)\]>\n"']+)/i,
      /(?:kaynak|source)[:\s]+\[([^\]]*)\]\((https?:\/\/[^\)]+)\)/i,
      /via[:\s]+\[([^\]]*)\]\((https?:\/\/[^\)]+)\)/i,
    ];
    for (const pattern of sourcePatterns) {
      const match = markdownContent.match(pattern);
      if (match) {
        const u = match[2] || match[1];
        originalSource = u.trim().replace(/[.,;:!?\s]+$/, '');
        markdownContent = markdownContent
          .replace(/```\s*\n?\s*(?:kaynak|source)\s*:\s*https?:\/\/[^\n]*\n?\s*```/gi, '')
          .replace(/^[>\s]*(?:kaynak|source)\s*:\s*https?:\/\/[^\n]*$/gim, '')
          .replace(/^[>\s]*via\s*:\s*\[[^\]]*\]\([^\)]+\)\s*$/gim, '');
        break;
      }
    }

    const CONTENT_END_MARKERS = [
      /\n+Post Views\s*:\s*\d+/i,
      /\n+What (?:is|do) (?:your|you think about)/i,
      /\n+(?:We value your privacy|We use cookies)/i,
      /\n+Notifications?\s*\n/i,
      /\n+Related Topics\s*\n/i,
      /\n+Similar Articles\s*\n/i,
      /\n+Show Comments/i,
      /\n+No more articles/i,
      /\n+(?:Log\s*in|Sign\s*in|Login)\s*\n/i,
      /\n+\d+\s+(?:I liked it|I am applauding)/i,
      /\n+CustomizeDeclineAccept/i,
      /\n+NecessaryAlways Active/i,
    ];

    let earliestTrimIndex = -1;
    for (const marker of CONTENT_END_MARKERS) {
      const match = marker.exec(markdownContent);
      if (match && (earliestTrimIndex === -1 || match.index < earliestTrimIndex)) {
        earliestTrimIndex = match.index;
      }
    }
    if (earliestTrimIndex > 0) {
      const trimmedChars = markdownContent.length - earliestTrimIndex;
      markdownContent = markdownContent.slice(0, earliestTrimIndex).trim();
      console.log(`   ✂️  Trimmed ${trimmedChars} trailing chars (non-article content)`);
    }

    let title = metadata.title || metadata['og:title'] || '';
    title = title.replace(/\s*[–—\-]\s*NuvemMag\s*$/i, '').trim();
    if (!title) {
      const h1Match = markdownContent.match(/^#\s+(.+)$/m);
      if (h1Match) title = h1Match[1].trim();
    }

    if (title.length > 150) {
      const h1Match = markdownContent.match(/^#\s+(.+)$/m);
      if (h1Match && h1Match[1].trim().length < 150) {
        title = h1Match[1].trim();
      } else {
        const slugTitle = url.split('/').filter(Boolean).pop()
          ?.replace(/-/g, ' ')
          ?.replace(/\b\w/g, c => c.toUpperCase()) || '';
        if (slugTitle.length < 150) title = slugTitle;
      }
      console.log(`   ✂️  Title was too long, using fallback: "${title.substring(0, 60)}"`);
    }

    let description = metadata.description || metadata['og:description'] || '';
    description = description.replace(/\bNuvemMag\b/gi, '').trim();
    if (!description && markdownContent) {
      const firstP = markdownContent.split('\n\n').find(p => p.trim().length > 50 && !p.startsWith('#'));
      if (firstP) description = firstP.trim().substring(0, 300);
    }

    const image = metadata['og:image'] || metadata.image || '';

    let date = '';
    if (metadata.date || metadata.publishDate || metadata['article:published_time']) {
      const raw = metadata.date || metadata.publishDate || metadata['article:published_time'];
      try {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) date = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
      } catch { /* skip */ }
    }
    if (!date) {
      const today = new Date();
      date = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    }

    if (!title || !markdownContent) {
      console.error(`   ❌ Missing required fields (title or content)`);
      return null;
    }

    console.log(`   ✅ Scraped: "${title.substring(0, 60)}..." (${markdownContent.length} chars)`);

    return {
      title,
      description: description || title,
      content: markdownContent,
      image,
      date,
      sourceUrl: url,
      originalSource: originalSource || url,
      slug: extractSlugFromUrl(url) || generateSlug(title),
    };
  }
}
