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
import { validateArticle, autoFixArticle } from '../../validation/smartArticleProcessor.js';

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

function normalizeSlug(slug) {
  if (!slug) return null;
  try {
    return decodeURIComponent(slug).toLowerCase().replace(/\/$/, '');
  } catch {
    return slug.toLowerCase().replace(/\/$/, '');
  }
}

/**
 * Generate a content hash from the original Turkish title.
 * Used to detect duplicate articles regardless of URL differences.
 */
export function generateContentHash(originalTitle) {
  if (!originalTitle) return null;
  const normalized = originalTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export async function getExistingArticles(urls) {
  try {
    if (urls.length === 0) return new Set();

    const existingUrls = new Set();

    // Layer 1: Direct source_url match — fastest
    const batchSize = 200;
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from('tech_news_articles')
        .select('source_url')
        .in('source_url', batch);

      if (!error && data) {
        data.forEach(a => existingUrls.add(a.source_url));
      }
    }

    // Layer 2: Slug prefix match — handles truncated URLs like /article-slug- vs /article-slug-full-title
    const unchecked = urls.filter(u => !existingUrls.has(u));
    if (unchecked.length > 0) {
      const incomingSlugs = new Map();
      for (const u of unchecked) {
        const raw = extractSlugFromUrl(u);
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
          const dbSlug = normalizeSlug(extractSlugFromUrl(article.source_url));
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
      .limit(1)
      .single();
    return !error && !!data;
  } catch {
    return false;
  }
}

export async function saveArticle(article) {
  try {
    console.log(`   🔍 Running smart validation pipeline...`);

    const validation = validateArticle({
      ...article,
      originalContent: article.originalContent || article.content,
    });

    if (!validation.isValid && validation.fixes.length > 0) {
      console.log(`   🔧 Auto-fixing ${validation.fixes.length} issues...`);
      const { fixed, fixedCount } = autoFixArticle(article, validation.results);
      if (fixedCount > 0) {
        Object.assign(article, fixed);
        console.log(`   ✅ Fixed ${fixedCount} issues`);
      }
    }

    if (!validation.isValid) {
      const criticalErrors = validation.errors.filter(e =>
        e.includes('Turkish') ||
        e.includes('year') ||
        e.includes('instruction leakage') ||
        e.includes('translation error')
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

    let isoDate;
    try {
      const [day, month, year] = article.date.split('/');
      const parsedYear = parseInt(year, 10);
      const parsedMonth = parseInt(month, 10);
      const parsedDay = parseInt(day, 10);
      const today = new Date();
      const currentYear = today.getFullYear();
      const parsedDate = new Date(parsedYear, parsedMonth - 1, parsedDay);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (parsedYear < 2020 || parsedYear > currentYear || parsedDate > tomorrow) {
        isoDate = `${currentYear}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      } else {
        isoDate = `${parsedYear}-${String(parsedMonth).padStart(2, '0')}-${String(parsedDay).padStart(2, '0')}`;
      }
    } catch {
      isoDate = new Date().toISOString().split('T')[0];
    }

    // Clean title — strip markdown bold/italic and branding
    let cleanTitle = article.title
      .replace(/\*{1,3}/g, '')
      .replace(/\s*[–—\-]\s*NuvemMag\s*$/i, '')
      .replace(/\bNuvemMag\b/gi, '')
      .trim();

    let cleanDescription = article.description
      .replace(/\*{1,3}/g, '')
      .replace(/__WIDGET_\d+__/g, '')
      .replace(/\[\[EMBED:[^\]]+\]\]/g, '')
      .replace(/\bNuvemMag\b/gi, '')
      .replace(/https?:\/\/(?:www\.)?nuvemmag\.com[^\s]*/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    let cleanContent = article.content
      .replace(/\bNuvemMag\b/gi, '')
      .replace(/https?:\/\/(?:www\.)?nuvemmag\.com[^\s\)>\]"']*/gi, '')
      .replace(/\[[^\]]*\]\([^)]*nuvemmag\.com[^)]*\)/gi, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const lowerContent = cleanContent.toLowerCase();
    const rejectionKeywords = ["i'm unable", "i cannot", "i'm sorry", "fulfill this request"];
    let rejectionReason = null;

    if (cleanContent.length < 100) {
      rejectionReason = 'Content is under 100 characters';
    } else {
      for (const keyword of rejectionKeywords) {
        if (lowerContent.includes(keyword)) {
          rejectionReason = `Content contains refusal phrase: "${keyword}"`;
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
      } catch (_) {}
      return { success: false, reason: 'rejected_content', error: null, validation };
    }

    // Generate content hash from original Turkish title
    const contentHash = generateContentHash(article.originalTitle || article.title);

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
        slug: article.slug,
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
