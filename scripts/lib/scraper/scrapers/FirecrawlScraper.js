/**
 * Firecrawl-based scraper.
 * Uses the Firecrawl API for both category list and article detail scraping.
 */

import Groq from 'groq-sdk';
import { BaseScraper } from './BaseScraper.js';
import { SCRAPER_CONFIG } from '../config.js';
import { htmlToTokens } from '../../../embeds/extractEmbeds.js';
import { extractAllEmbedsFromMarkdown } from '../../../embeds/extractMarkdownEmbeds.js';
import {
  replaceTikTokBlockquote,
  replaceTwitterBlockquote,
  cleanSocialEmbedRemnants,
  removeEmbedArtifactNoise,
  dedupeEmbedTokens,
} from '../../../embeds/cleanMarkdownEmbeds.js';
import { normalizeSourceDate } from '../dateUtils.js';
import { extractSlugFromUrl, generateSlug, normalizeSourceUrl } from '../database.js';

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

function buildDiscoveryCandidate({ url, title = '', rawDate = '', category, source, confidence }) {
  const dateAssessment = normalizeSourceDate(rawDate, {
    source,
    confidence,
  });

  return {
    url,
    title: String(title || '').trim(),
    category,
    rawDate: rawDate || '',
    normalizedDate: dateAssessment.normalizedDate,
    dateSource: dateAssessment.dateSource,
    dateConfidence: dateAssessment.dateConfidence,
    datePriority: dateAssessment.datePriority,
    dateStatus: dateAssessment.dateStatus,
    dateAssessment,
  };
}

function getCandidateCompletenessScore(candidate) {
  return (candidate?.title ? 2 : 0) + (candidate?.rawDate ? 1 : 0);
}

function sortDiscoveryCandidates(a, b) {
  return (
    (b.datePriority - a.datePriority) ||
    (getCandidateCompletenessScore(b) - getCandidateCompletenessScore(a)) ||
    a.url.localeCompare(b.url)
  );
}

function mergeDiscoveryCandidates(...candidateSets) {
  const merged = new Map();

  for (const set of candidateSets) {
    for (const candidate of set || []) {
      if (!candidate?.url) continue;
      const key = normalizeSourceUrl(candidate.url) || candidate.url;
      const existing = merged.get(key);
      if (!existing || getCandidateCompletenessScore(candidate) > getCandidateCompletenessScore(existing)) {
        merged.set(key, candidate);
      }
    }
  }

  return [...merged.values()].sort(sortDiscoveryCandidates);
}

function splitMarkdownIntoChunks(markdown, maxChars = 7000) {
  if (markdown.length <= maxChars) return [markdown];

  const lines = markdown.split('\n');
  const chunks = [];
  let current = '';

  for (const line of lines) {
    const next = current ? `${current}\n${line}` : line;
    if (next.length > maxChars && current) {
      chunks.push(current);
      current = line;
      continue;
    }

    if (line.length > maxChars) {
      if (current) {
        chunks.push(current);
        current = '';
      }

      for (let index = 0; index < line.length; index += maxChars) {
        chunks.push(line.slice(index, index + maxChars));
      }
      continue;
    }

    current = next;
  }

  if (current) chunks.push(current);
  return chunks;
}

export class FirecrawlScraper extends BaseScraper {
  constructor(apiKey) {
    super('FirecrawlScraper');
    this.apiKey = apiKey;
    // maxRetries lets the SDK auto-retry transient Groq connection drops
    // ("Premature close") with exponential backoff before we fall back to regex.
    this.groqParser = new Groq({
      apiKey: SCRAPER_CONFIG.GROQ_PARSER_API_KEY,
      maxRetries: 4,
      timeout: 90000,
    });
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

        if (![408, 500, 502, 503].includes(status) || attempt === maxRetries) {
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

  _categoryArchiveUrl(categoryUrl, pageNum) {
    const base = String(categoryUrl || '').trim().replace(/\/+$/, '');
    if (!base) return categoryUrl;
    if (pageNum <= 1) return `${base}/`;
    return `${base}/page/${pageNum}/`;
  }

  async _fetchCategoryMarkdown(categoryUrl, categoryTag, pageLabel) {
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
          maxAge: 0,
        }),
      },
      `category ${categoryTag} ${pageLabel}`
    );

    if (!result.success) {
      return { ok: false, markdown: null, error: result.status || result.error };
    }

    const data = await result.response.json();
    const markdown = data?.data?.markdown || '';
    return { ok: true, markdown, error: null };
  }

  async scrapeArticleList(categoryUrl, categoryTag) {
    const maxPages = Math.max(1, SCRAPER_CONFIG.CATEGORY_ARCHIVE_MAX_PAGES || 1);
    const cap = SCRAPER_CONFIG.MAX_ARTICLES_PER_CATEGORY;

    console.log(`\n📂 [Firecrawl] Scraping category: ${categoryTag} from ${categoryUrl} (up to ${maxPages} archive page(s))`);

    let accumulated = [];

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const pageUrl = this._categoryArchiveUrl(categoryUrl, pageNum);
      const pageLabel = pageNum === 1 ? 'p1' : `p${pageNum}`;

      const { ok, markdown, error } = await this._fetchCategoryMarkdown(pageUrl, categoryTag, pageLabel);

      if (!ok) {
        if (pageNum === 1) {
          console.error(`  ❌ Failed to scrape category: ${error}`);
          return [];
        }
        console.log(`  ⏹️  Archive page ${pageNum} unavailable (${error}); stopping pagination.`);
        break;
      }

      if (!markdown || markdown.length < 200) {
        if (pageNum === 1) {
          console.error(`  ❌ No markdown content in response for ${categoryTag}`);
          return [];
        }
        console.log(`  ⏹️  Archive page ${pageNum} empty; stopping pagination.`);
        break;
      }

      console.log(`  📄 Page ${pageNum}: ${markdown.length} chars of markdown`);

      const aiArticles = await this._parseArticlesWithAI(markdown, categoryTag);
      const regexArticles = this._regexFallback(markdown, categoryTag);
      const pageMerged = mergeDiscoveryCandidates(aiArticles, regexArticles);

      const beforeSize = accumulated.length;
      accumulated = mergeDiscoveryCandidates(accumulated, pageMerged);
      const added = accumulated.length - beforeSize;

      console.log(`  📎 Page ${pageNum}: +${added} new candidate(s) → ${accumulated.length} unique total`);

      if (accumulated.length >= cap) {
        break;
      }

      if (pageNum > 1 && added === 0) {
        console.log(`  ⏹️  No new URLs on page ${pageNum}; stopping pagination.`);
        break;
      }

      if (pageNum < maxPages) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    if (accumulated.length === 0) {
      console.log(`  ⚠️ No articles extracted from AI or regex parsing.`);
      return [];
    }

    const limited = accumulated.slice(0, cap);

    console.log(
      `  📊 Using ${limited.length} merged articles (unique discovered across pages: ${accumulated.length})`
    );
    return limited;
  }

  async _parseArticlesWithAI(markdown, categoryTag) {
    console.log(`  🤖 Using AI to parse article list for ${categoryTag}...`);

    try {
      const markdownChunks = splitMarkdownIntoChunks(markdown, 7000);
      const extractedCandidates = [];

      for (const [index, markdownChunk] of markdownChunks.entries()) {
        const chunkCandidates = await this._parseArticlesWithAIChunk(
          markdownChunk,
          categoryTag,
          index + 1,
          markdownChunks.length
        );

        if (chunkCandidates?.length) {
          extractedCandidates.push(...chunkCandidates);
        }
      }

      const processed = mergeDiscoveryCandidates(extractedCandidates);
      if (processed.length === 0) {
        throw new Error('AI response did not contain any valid article candidates');
      }

      console.log(`  ✅ AI extracted ${processed.length} unique articles across ${markdownChunks.length} chunk(s)`);
      return processed;
    } catch (error) {
      console.error(`  ❌ AI parsing failed: ${error.message}`);
      return null;
    }
  }

  async _parseArticlesWithAIChunk(markdownForAi, categoryTag, chunkIndex, chunkCount) {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const completion = await this.groqParser.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `You are a web scraping assistant. Extract article information from Turkish tech news markdown.

CRITICAL URL PATTERNS:
- PREFERRED format: https://nuvemmag.com/article-slug-here/
- LEGACY format: https://nuvemmag.com/post/article-slug/ (deprecated — most return 404; do NOT include these)
- Do NOT include category URLs like /category/
- Do NOT include utility pages: /hesabim/, /giris/, /kayit/, /iletisim/, /hakkimizda/, /gizlilik/, /cerez/, /my-account/, /login/, /register/, /contact/, /about/, /privacy/, /cookie/
- ONLY include actual news article URLs

DATE FORMATS to recognize:
- Absolute: "16 Aralık 2025", "17 Aralık 2024"
- Relative: "3 gün önce", "11 saat önce", "1 hafta önce", "2 ay önce", "bugün", "dün"

RULES:
1. Extract article URLs (NOT category URLs, NOT /post/ legacy URLs)
2. Extract publication date (absolute or relative format)
3. Return ONLY a valid JSON array — no extra text, no markdown fences
4. If no articles found, return: []

Output JSON:
[{"url": "https://nuvemmag.com/article-slug/", "title": "Article title", "date": "3 gün önce"}]

IMPORTANT:
- Extract every visible article in this markdown chunk.
- Keep URLs unique.
- Output must be parseable JSON with no trailing commas.`,
            },
            {
              role: 'user',
              content: `Extract all article URLs, titles, and dates from chunk ${chunkIndex}/${chunkCount} of this Turkish tech news category page. Return ONLY a JSON array.\n\n${markdownForAi}`,
            },
          ],
          temperature: 0.1,
          max_tokens: 3000,
        });

        const response = completion.choices[0]?.message?.content || '[]';
        let jsonStr = response;
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) jsonStr = jsonMatch[0];

        // Sanitize for invalid unicode escapes and control chars
        jsonStr = jsonStr.replace(/\\u(?![0-9a-fA-F]{4})/g, "\\\\u");
        jsonStr = jsonStr.replace(/[\u0000-\u001F]/g, "");

        const articles = JSON.parse(jsonStr);
        if (!Array.isArray(articles)) throw new Error('AI response is not an array');

        const processed = [];
        for (const article of articles) {
          if (!article.url || !article.url.includes('nuvemmag.com/')) continue;
          if (article.url.includes('/category/')) continue;
          if (isBlockedUrl(article.url)) continue;

          processed.push(buildDiscoveryCandidate({
            url: article.url,
            title: article.title,
            rawDate: article.date || '',
            category: categoryTag,
            source: 'category_ai',
            confidence: article.date ? 'medium' : 'low',
          }));
        }

        processed.sort(sortDiscoveryCandidates);
        return processed;
      } catch (error) {
        const message = String(error?.message || error);
        const isRateLimited = /rate limit|rate_limit_exceeded|please try again in/i.test(message);
        // Transient Groq/network drops (undici "Premature close", socket resets,
        // aborted requests, gateway errors) should be retried rather than
        // immediately falling back to the date-less regex extractor.
        const isTransientNetwork = /premature close|econnreset|socket hang up|network|fetch failed|terminated|aborted|ETIMEDOUT|502|503|504/i.test(message);

        if ((isRateLimited || isTransientNetwork) && attempt < maxAttempts) {
          let retryDelayMs;
          if (isRateLimited) {
            const retryMatch = message.match(/Please try again in\s+([\d.]+)s/i);
            retryDelayMs = Math.max(2000, Math.ceil((Number.parseFloat(retryMatch?.[1] || '3') + 1) * 1000));
          } else {
            retryDelayMs = 2000 * attempt; // linear backoff: 2s, 4s
          }
          const reason = isRateLimited ? 'rate-limited' : 'transient network error';
          console.log(
            `  ⏳ AI chunk ${chunkIndex}/${chunkCount} ${reason}; retrying in ${(retryDelayMs / 1000).toFixed(0)}s ` +
            `(attempt ${attempt + 1}/${maxAttempts})`
          );
          await new Promise(resolve => setTimeout(resolve, retryDelayMs));
          continue;
        }

        console.error(`  ⚠️ AI chunk ${chunkIndex}/${chunkCount} failed: ${message}`);
        return [];
      }
    }
  }

  _regexFallback(markdown, categoryTag) {
    const urlRegex = /https:\/\/nuvemmag\.com\/(?:post\/)?[a-z0-9%._~-]+\/?/gi;
    const matches = [...new Set(markdown.match(urlRegex) || [])];
    const filtered = matches.filter(u =>
      !u.includes('/category/') &&
      !u.includes('/wp-content/') &&
      !u.includes('/wp-includes/') &&
      !u.includes('/wp-json/') &&
      !isBlockedUrl(u)
    );

    const articles = filtered.slice(0, SCRAPER_CONFIG.MAX_ARTICLES_PER_CATEGORY).map(url => buildDiscoveryCandidate({
      url,
      title: '',
      rawDate: '',
      category: categoryTag,
      source: 'category_regex',
      confidence: 'low',
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
            maxAge: 0,
          }),
        },
        `article-markdown ${slug}`
      ),
      this._fetchWithRetry(
        'https://api.firecrawl.dev/v2/scrape',
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ url, formats: ['html'], onlyMainContent: false, waitFor: 3000, maxAge: 0 }),
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
    markdownContent = removeEmbedArtifactNoise(markdownContent);
    markdownContent = dedupeEmbedTokens(markdownContent);

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

    markdownContent = removeEmbedArtifactNoise(markdownContent);
    markdownContent = dedupeEmbedTokens(markdownContent);
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

    if (title.length > 100) {
      const h1Match = markdownContent.match(/^#\s+(.+)$/m);
      if (h1Match && h1Match[1].trim().length < 100) {
        title = h1Match[1].trim();
      } else {
        const slugTitle = url.split('/').filter(Boolean).pop()
          ?.replace(/-/g, ' ')
          ?.replace(/\b\w/g, c => c.toUpperCase()) || '';
        if (slugTitle.length < 100) title = slugTitle;
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

    let rawDate = metadata.date || metadata.publishDate || metadata['article:published_time'] || '';

    // If Firecrawl didn't extract metadata properly, fallback to native HTML parsing
    if (!rawDate && htmlContent) {
      const ogMatch = htmlContent.match(/property="article:published_time"[^>]+content="([^"]+)"/i) ||
                      htmlContent.match(/content="([^"]+)"[^>]+property="article:published_time"/i);
      if (ogMatch) {
        rawDate = ogMatch[1];
        console.log(`   📅 Found date in raw HTML og:published_time: ${rawDate}`);
      } else {
        const jsonLdMatch = htmlContent.match(/"datePublished"\s*:\s*"([^"]+)"/i);
        if (jsonLdMatch) {
          rawDate = jsonLdMatch[1];
          console.log(`   📅 Found date in raw HTML JSON-LD: ${rawDate}`);
        }
      }
    }

    const dateAssessment = normalizeSourceDate(rawDate, {
      source: 'detail_metadata',
      confidence: rawDate ? 'high' : 'low',
    });
    const date = dateAssessment.normalizedDate;

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
      rawDate,
      normalizedDate: dateAssessment.normalizedDate,
      dateSource: dateAssessment.dateSource,
      dateConfidence: dateAssessment.dateConfidence,
      dateAssessment,
      sourceUrl: url,
      originalSource: originalSource || url,
      slug: extractSlugFromUrl(url) || generateSlug(title),
    };
  }
}
