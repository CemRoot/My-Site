/**
 * Database operations for the news scraper.
 * Handles article storage, duplicate detection, and counting.
 */

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

export async function getExistingArticles(urls) {
  try {
    if (urls.length === 0) return new Set();

    const existingUrls = new Set();

    // 1) Direct source_url match — fastest, no row-limit issues
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

    // 2) Slug-based fallback for URLs with encoding differences (%96 vs – etc.)
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
          if (dbSlug && incomingSlugs.has(dbSlug)) {
            existingUrls.add(incomingSlugs.get(dbSlug));
            incomingSlugs.delete(dbSlug);
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

    let cleanTitle = article.title.replace(/\s*[–—\-]\s*NuvemMag\s*$/i, '').replace(/\bNuvemMag\b/gi, '').trim();
    let cleanDescription = article.description.replace(/\bNuvemMag\b/gi, '').replace(/https?:\/\/(?:www\.)?nuvemmag\.com[^\s]*/gi, '').trim();
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
