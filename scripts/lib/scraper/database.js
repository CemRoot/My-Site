/**
 * Database operations for the news scraper.
 * Handles article storage, duplicate detection, and counting.
 *
 * Duplicate detection strategy (3 layers):
 * 1. Exact source_url match
 * 2. Slug prefix match (handles truncated URLs)
 * 3. content_hash match (handles same article with different URL)
 */

import crypto from 'crypto';
import { supabase } from '../supabaseAdmin.js';
import { SCRAPER_CONFIG } from './config.js';
import { validateArticle, autoFixArticle } from '../../validation/smartArticleProcessor.js';
import { getTurkeyIsoDate, normalizeSourceDate } from './dateUtils.js';

export function extractSlugFromUrl(url) {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    let p = urlObj.pathname.replace(/\/$/, '').replace(/^\/post/, '').replace(/^\//, '');
    return p || null;
  } catch {
    return null;
  }
}

export function normalizeSourceUrl(url) {
  if (!url) return '';

  try {
    const normalized = new URL(url);
    normalized.hash = '';
    normalized.search = '';
    normalized.pathname = normalized.pathname.replace(/\/+$/, '');
    return normalized.toString();
  } catch {
    return String(url).replace(/[?#].*$/, '').replace(/\/+$/, '');
  }
}

const SLUG_STOP_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'be', 'by', 'for', 'from',
  'in', 'into', 'is', 'of', 'on', 'or', 'that', 'the',
  'this', 'to', 'with',
]);

function trimTrailingStopWords(words) {
  while (words.length > 4 && SLUG_STOP_WORDS.has(words[words.length - 1])) {
    words.pop();
  }
}

export function generateSlug(title) {
  const normalizedWords = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (normalizedWords.length === 0) {
    return 'article';
  }

  const slugWords = [];
  for (const word of normalizedWords) {
    const candidate = [...slugWords, word].join('-').replace(/-+/g, '-');
    if (candidate.length > 72 && slugWords.length >= 6) {
      break;
    }

    slugWords.push(word);

    if (slugWords.length >= 10) {
      break;
    }
  }

  trimTrailingStopWords(slugWords);

  let slug = slugWords.join('-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  if (slug.length > 60) {
    const shortened = slug.substring(0, 60).replace(/-+$/g, '');
    const lastDash = shortened.lastIndexOf('-');
    slug = lastDash > 20 ? shortened.substring(0, lastDash) : shortened;
  }

  const finalWords = slug.split('-').filter(Boolean);
  trimTrailingStopWords(finalWords);
  slug = finalWords.join('-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  return slug || normalizedWords.slice(0, 4).join('-');
}

function normalizeSlug(slug) {
  if (!slug) return null;
  try {
    return decodeURIComponent(slug).toLowerCase().replace(/\/$/, '');
  } catch {
    return slug.toLowerCase().replace(/\/$/, '');
  }
}

function buildSourceUrlVariants(url) {
  const normalizedUrl = normalizeSourceUrl(url);
  if (!normalizedUrl) return [];

  const variants = new Set([url, normalizedUrl]);
  const withoutTrailingSlash = normalizedUrl.replace(/\/$/, '');
  const withTrailingSlash = `${withoutTrailingSlash}/`;
  variants.add(withoutTrailingSlash);
  variants.add(withTrailingSlash);

  return [...variants].filter(Boolean);
}

function resolveSaveDateIntegrity(article) {
  const detailAssessment = article.dateAssessment?.dateStatus
    ? article.dateAssessment
    : normalizeSourceDate(article.date || article.rawDate || '', {
        source: article.dateSource || 'save_input',
        confidence: article.dateConfidence || 'medium',
      });

  const discoveryAssessment = article.discoveryDateAssessment?.dateStatus
    ? article.discoveryDateAssessment
    : null;

  if (!detailAssessment.isoDate || detailAssessment.dateStatus === 'unknown') {
    return {
      accepted: false,
      action: 'defer',
      reason: 'Detail publish date is unknown',
      assessment: detailAssessment,
    };
  }

  if (detailAssessment.dateStatus === 'future') {
    return {
      accepted: false,
      action: 'reject',
      reason: `Detail publish date is in the future (${detailAssessment.isoDate})`,
      assessment: detailAssessment,
    };
  }

  if (
    discoveryAssessment?.isoDate &&
    detailAssessment.isoDate &&
    discoveryAssessment.isoDate !== detailAssessment.isoDate
  ) {
    const maxDays = SCRAPER_CONFIG.MAX_RECENT_PUBLISH_DAYS ?? 3;
    const detailRecentEnough =
      detailAssessment.dateStatus === 'today' ||
      (detailAssessment.dateStatus === 'stale' &&
        typeof detailAssessment.ageDays === 'number' &&
        detailAssessment.ageDays <= maxDays);

    if (!detailRecentEnough) {
      return {
        accepted: false,
        action: 'reject',
        reason:
          `List vs detail date mismatch; detail outside ${maxDays}d window ` +
          `(${detailAssessment.isoDate}, ${detailAssessment.ageDays ?? '?'}d old)`,
        assessment: detailAssessment,
      };
    }

    return {
      accepted: true,
      action: 'accept',
      assessment: detailAssessment,
      isoDate: detailAssessment.isoDate,
    };
  }

  return {
    accepted: true,
    action: 'accept',
    assessment: detailAssessment,
    isoDate: detailAssessment.isoDate,
  };
}

/**
 * Generate a content hash from the original Turkish title.
 * Used to detect duplicate articles regardless of URL differences.
 */
function normalizeTitleForHash(originalTitle) {
  return (originalTitle || '')
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .normalize('NFKD')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function generateContentHash(originalTitle) {
  if (!originalTitle) return null;
  const normalized = normalizeTitleForHash(originalTitle);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export async function getExistingArticles(urls) {
  try {
    if (urls.length === 0) return new Set();

    const existingUrls = new Set();
    const incomingVariantLookup = new Map();
    const exactLookupValues = [];

    for (const originalUrl of urls) {
      for (const variant of buildSourceUrlVariants(originalUrl)) {
        if (!incomingVariantLookup.has(variant)) {
          incomingVariantLookup.set(variant, new Set());
          exactLookupValues.push(variant);
        }
        incomingVariantLookup.get(variant).add(originalUrl);
      }
    }

    // Layer 1: Direct source_url match — fastest
    const batchSize = 200;
    for (let i = 0; i < exactLookupValues.length; i += batchSize) {
      const batch = exactLookupValues.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from('tech_news_articles')
        .select('source_url')
        .in('source_url', batch);

      if (!error && data) {
        data.forEach(({ source_url: sourceUrl }) => {
          const matches = incomingVariantLookup.get(sourceUrl);
          if (!matches) return;
          matches.forEach(originalUrl => existingUrls.add(originalUrl));
        });
      }
    }

    // Layer 2: Slug prefix match — handles truncated URLs like /article-slug- vs /article-slug-full-title
    const unchecked = urls.filter(u => !existingUrls.has(u));
    if (unchecked.length > 0) {
      const incomingSlugs = new Map();
      for (const u of unchecked) {
        const raw = extractSlugFromUrl(normalizeSourceUrl(u));
        const norm = normalizeSlug(raw);
        if (norm) incomingSlugs.set(norm, u);
      }

      let from = 0;
      const pageSize = 1000;
      while (incomingSlugs.size > 0) {
        const { data, error } = await supabase
          .from('tech_news_articles')
          .select('source_url')
          .range(from, from + pageSize - 1);

        if (error || !data || data.length === 0) break;

        for (const article of data) {
          const dbSlug = normalizeSlug(extractSlugFromUrl(normalizeSourceUrl(article.source_url)));
          if (!dbSlug) continue;
          for (const [normSlug, origUrl] of incomingSlugs) {
            if (
              dbSlug === normSlug ||
              dbSlug.startsWith(normSlug) ||
              normSlug.startsWith(dbSlug)
            ) {
              existingUrls.add(origUrl);
              incomingSlugs.delete(normSlug);
              break;
            }
          }
        }

        if (data.length < pageSize) break;
        from += pageSize;
      }
    }

    console.log(`  📊 Duplicate check: ${existingUrls.size}/${urls.length} already exist`);
    return existingUrls;
  } catch (error) {
    console.error('Error in bulk check:', error);
    return new Set();
  }
}

/**
 * Check if an article with the same content_hash already exists.
 * Called before translation to avoid wasting API credits.
 */
export async function isContentHashDuplicate(originalTitle) {
  const hash = generateContentHash(originalTitle);
  if (!hash) return false;
  try {
    const { data, error } = await supabase
      .from('tech_news_articles')
      .select('id')
      .eq('content_hash', hash)
      .limit(1);

    if (error) {
      console.error('Error checking content hash duplicate:', error);
      return false;
    }

    return Array.isArray(data) && data.length > 0;
  } catch (error) {
    console.error('Unexpected content hash duplicate check failure:', error);
    return false;
  }
}

export async function isSourceUrlDuplicate(url) {
  const variants = buildSourceUrlVariants(url);
  if (variants.length === 0) return false;

  try {
    const { data, error } = await supabase
      .from('tech_news_articles')
      .select('id, source_url')
      .in('source_url', variants)
      .limit(1);

    if (error) {
      console.error('Error checking source_url duplicate:', error);
      return false;
    }

    return Array.isArray(data) && data.length > 0;
  } catch (error) {
    console.error('Unexpected source_url duplicate check failure:', error);
    return false;
  }
}

/**
 * @param {string} baseSlug
 * @param {string | null} [excludeArticleId] When updating an existing row, ignore that row's current slug when checking collisions.
 */
export async function ensureUniqueSlug(baseSlug, excludeArticleId = null) {
  if (!baseSlug) return baseSlug;

  let candidateSlug = baseSlug;
  let suffix = 2;

  while (suffix <= 25) {
    let q = supabase
      .from('tech_news_articles')
      .select('id')
      .eq('slug', candidateSlug)
      .limit(1);
    if (excludeArticleId) {
      q = q.neq('id', excludeArticleId);
    }
    const { data, error } = await q;

    if (error) {
      console.error('Error checking slug uniqueness:', error);
      return candidateSlug;
    }

    if (!data || data.length === 0) {
      return candidateSlug;
    }

    const suffixText = `-${suffix}`;
    candidateSlug = `${baseSlug.substring(0, Math.max(1, 60 - suffixText.length))}${suffixText}`
      .replace(/-+$/g, '');
    suffix++;
  }

  return `${baseSlug.substring(0, 56)}-alt`.replace(/-+$/g, '');
}

export async function saveArticle(article) {
  try {
    console.log(`   🔍 Running smart validation pipeline...`);

    let cleanTitle = (article.title || '')
      .replace(/\*{1,3}/g, '')
      .replace(/\s*[–—\-]\s*NuvemMag\s*$/i, '')
      .replace(/\bNuvemMag\b/gi, '')
      .trim();

    let cleanDescription = (article.description || '')
      .replace(/\*{1,3}/g, '')
      .replace(/__WIDGET_\d+__/g, '')
      .replace(/\[\[EMBED:[^\]]+\]\]/g, '')
      .replace(/\bNuvemMag\b/gi, '')
      .replace(/https?:\/\/(?:www\.)?nuvemmag\.com[^\s]*/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    let cleanContent = (article.content || '')
      .replace(/\bNuvemMag\b/gi, '')
      .replace(/https?:\/\/(?:www\.)?nuvemmag\.com[^\s\)>\]"']*/gi, '')
      .replace(/\[[^\]]*\]\([^)]*nuvemmag\.com[^)]*\)/gi, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const articleForValidation = {
      ...article,
      title: cleanTitle,
      description: cleanDescription,
      content: cleanContent,
      date: article.date || article.normalizedDate || article.dateAssessment?.normalizedDate || '',
      originalContent: article.originalContent || article.content,
    };

    let validation = validateArticle(articleForValidation);

    if (!validation.isValid && validation.fixes.length > 0) {
      console.log(`   🔧 Auto-fixing ${validation.fixes.length} issues...`);
      const { fixed, fixedCount } = autoFixArticle(articleForValidation, validation.results);
      if (fixedCount > 0) {
        Object.assign(articleForValidation, fixed);
        cleanTitle = articleForValidation.title;
        cleanDescription = articleForValidation.description;
        cleanContent = articleForValidation.content;
        console.log(`   ✅ Fixed ${fixedCount} issues`);
        validation = validateArticle(articleForValidation);
      }
    }

    if (!validation.isValid) {
      const criticalErrors = validation.errors.filter(e =>
        e.includes('Turkish') ||
        e.includes('year') ||
        e.includes('instruction leakage') ||
        e.includes('translation error') ||
        e.includes('Title is empty') ||
        e.includes('Content is empty') ||
        e.includes('NuvemMag branding/URLs')
      );

      if (criticalErrors.length > 0) {
        console.error(`   ❌ CRITICAL ERRORS - Rejecting article:`);
        criticalErrors.forEach(err => console.error(`      ❌ ${err}`));
        return { success: false, error: new Error(`Validation failed: ${criticalErrors.join('; ')}`), validation };
      }
    }

    if (validation.warnings.length > 0) {
      console.log(`   ⚠️  Warnings:`);
      validation.warnings.forEach(warn => console.log(`      ⚠️  ${warn}`));
    }

    console.log(`   ✅ Validation passed (Score: ${validation.score.toFixed(1)}/100)`);

    const dateIntegrity = resolveSaveDateIntegrity(articleForValidation);
    if (!dateIntegrity.accepted) {
      console.warn(`   ⚠️  DATE INTEGRITY ${dateIntegrity.action.toUpperCase()}: ${dateIntegrity.reason}`);

      if (dateIntegrity.action === 'reject') {
        try {
          await supabase.from('rejected_articles').insert([{
            title: cleanTitle,
            content: cleanContent,
            source_url: article.sourceUrl,
            original_source: article.originalSource,
            reason: dateIntegrity.reason,
          }]);
        } catch (rejectedError) {
          console.error('   ❌ Failed to record rejected date-integrity article:', rejectedError);
        }
      }

      return {
        success: false,
        reason: dateIntegrity.action === 'reject' ? 'date_integrity_rejected' : 'date_integrity_deferred',
        error: new Error(dateIntegrity.reason),
        validation,
        dateAssessment: dateIntegrity.assessment,
      };
    }

    const isoDate = dateIntegrity.isoDate || getTurkeyIsoDate();

    const refusalWindow = cleanContent.slice(0, 500);
    const rejectionPatterns = [
      { pattern: /^(?:i'm unable|i am unable)\b/im, label: "I'm unable" },
      { pattern: /^(?:i cannot|i can't|i cant)\b/im, label: 'I cannot' },
      { pattern: /^(?:i'm sorry|i am sorry)\b/im, label: "I'm sorry" },
      { pattern: /\bfulfill this request\b/im, label: 'fulfill this request' },
    ];
    let rejectionReason = null;

    if (cleanContent.length < 100) {
      rejectionReason = 'Content is under 100 characters';
    } else {
      for (const { pattern, label } of rejectionPatterns) {
        if (pattern.test(refusalWindow)) {
          rejectionReason = `Content starts with LLM refusal pattern: "${label}"`;
          break;
        }
      }
    }

    if (rejectionReason) {
      console.warn(`   ⚠️  ARTICLE REJECTED: ${rejectionReason}`);
      try {
        await supabase.from('rejected_articles').insert([{
          title: cleanTitle,
          content: cleanContent,
          source_url: article.sourceUrl,
          original_source: article.originalSource,
          reason: rejectionReason,
        }]);
      } catch (rejectedError) {
        console.error('   ❌ Failed to record rejected article:', rejectedError);
      }
      return { success: false, reason: 'rejected_content', error: null, validation };
    }

    // Generate content hash from original Turkish title
    const contentHash = generateContentHash(article.originalTitle || article.title);
    const uniqueSlug = await ensureUniqueSlug(article.slug);

    if (uniqueSlug !== article.slug) {
      console.log(`   🔁 Adjusted duplicate slug: "${article.slug}" -> "${uniqueSlug}"`);
    }

    const { data, error } = await supabase
      .from('tech_news_articles')
      .insert([{
        title: cleanTitle,
        description: cleanDescription,
        content: cleanContent,
        original_title: article.originalTitle,
        image_url: article.image,
        date: isoDate,
        category: article.category,
        source_url: article.sourceUrl,
        original_source: article.originalSource,
        slug: uniqueSlug,
        content_hash: contentHash,
      }])
      .select()
      .single();

    if (error) {
      console.error('   ❌ Error saving article to Supabase:', error);
      return { success: false, error, validation };
    }

    console.log(`   ✅ Article saved successfully (ID: ${data.id})`);
    return { success: true, data, validation };
  } catch (error) {
    console.error('   ❌ Error saving article:', error);
    return { success: false, error };
  }
}

export async function getArticleCount() {
  try {
    const { count, error } = await supabase
      .from('tech_news_articles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error getting article count:', error);
      return 0;
    }
    return count || 0;
  } catch {
    return 0;
  }
}
