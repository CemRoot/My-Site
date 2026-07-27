/**
 * Tech News API
 * Vercel Edge Function - Ultra-fast cold starts
 * Fetches tech news articles from Supabase with pagination and filtering
 */

import { createClient } from '@supabase/supabase-js';
import { formatTechNewsArticle } from './lib/formatTechNewsArticle.js';
import { sortArticlesByRank } from './lib/techNewsRank.js';

const LIST_COLUMNS =
  'id,title,description,original_title,image_url,date,category,slug,views,created_at,importance_score';

/**
 * Preferred path: Postgres RPC with composite rank + correct pagination.
 * Fallback: fetch list rows in batches, sort in edge, then slice.
 */
async function fetchRankedList(supabase, { category, page, limit }) {
  const offset = (page - 1) * limit;
  const rpcCategory =
    category && category !== 'all' ? category : null;

  try {
    const { data: rpcPayload, error: rpcError } = await supabase.rpc(
      'list_tech_news_ranked',
      {
        p_category: rpcCategory,
        p_limit: limit,
        p_offset: offset,
      },
    );

    if (!rpcError && rpcPayload && typeof rpcPayload === 'object') {
      const articles = Array.isArray(rpcPayload.articles)
        ? rpcPayload.articles
        : [];
      const totalArticles = Number(rpcPayload.total) || 0;
      return { articles, totalArticles, source: 'rpc' };
    }

    if (rpcError) {
      console.warn('list_tech_news_ranked RPC unavailable, using edge sort:', rpcError.message);
    }
  } catch (err) {
    console.warn('list_tech_news_ranked RPC failed, using edge sort:', err?.message || err);
  }

  const batchSize = 1000;
  const all = [];
  // Prefer ranked columns; fall back if migration not applied yet.
  const columnSets = [
    LIST_COLUMNS,
    'id,title,description,original_title,image_url,date,category,slug,views,created_at',
  ];

  let usedColumns = columnSets[0];
  let firstError = null;

  for (const columns of columnSets) {
    usedColumns = columns;
    all.length = 0;
    let from = 0;
    let ok = true;

    while (true) {
      let query = supabase
        .from('tech_news_articles')
        .select(columns)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, from + batchSize - 1);

      if (rpcCategory) {
        query = query.eq('category', rpcCategory);
      }

      const { data, error } = await query;
      if (error) {
        firstError = error;
        ok = false;
        break;
      }

      if (data?.length) {
        all.push(...data);
      }

      if (!data || data.length < batchSize) break;
      from += batchSize;
    }

    if (ok) break;
  }

  if (all.length === 0 && firstError) {
    throw firstError;
  }

  if (!usedColumns.includes('importance_score')) {
    console.warn('importance_score column missing — ranking with default score 50');
  }

  const ranked = sortArticlesByRank(all);
  return {
    articles: ranked.slice(offset, offset + limit),
    totalArticles: ranked.length,
    source: 'edge-sort',
  };
}

export const config = {
  runtime: 'edge',
  regions: ['dub1', 'fra1', 'lhr1'],
};

// Edge Runtime: uses anon key for public read-only access (no service role needed)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://cemkoyluoglu.codes',
  'https://www.cemkoyluoglu.codes',
];

function normalizeSlugValue(value) {
  if (!value) return '';
  try {
    return decodeURIComponent(String(value)).toLowerCase().replace(/\/+$/, '');
  } catch {
    return String(value).toLowerCase().replace(/\/+$/, '');
  }
}

function generateLegacyTitleSlug(title) {
  const normalizedWords = String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (normalizedWords.length === 0) {
    return '';
  }

  let slug = normalizedWords.join('-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  if (slug.length > 60) {
    const shortened = slug.substring(0, 60).replace(/-+$/g, '');
    const lastDash = shortened.lastIndexOf('-');
    slug = lastDash > 20 ? shortened.substring(0, lastDash) : shortened;
  }

  return slug;
}

async function findLegacyTitleSlugArticle(slug) {
  const normalizedSlug = normalizeSlugValue(slug);
  if (!normalizedSlug) return null;

  const { data, error } = await supabase
    .from('tech_news_articles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(250);

  if (error) {
    console.error('Legacy title-slug fallback error:', error);
    return null;
  }

  return (data || []).find(article => {
    const legacyTitleSlug = generateLegacyTitleSlug(article.title);
    return (
      legacyTitleSlug === normalizedSlug ||
      legacyTitleSlug.startsWith(`${normalizedSlug}-`) ||
      normalizedSlug.startsWith(`${legacyTitleSlug}-`)
    );
  }) || null;
}

/**
 * Edge Function Handler (Web Standards API)
 */
export default async function handler(request) {
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
  
  if (origin && ALLOWED_ORIGINS.some(o => origin.startsWith(o.replace('www.', '')))) {
    corsHeaders['Access-Control-Allow-Origin'] = origin;
  }

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Only accept GET
  if (request.method !== 'GET') {
    return jsonResponse({ success: false, message: 'Method not allowed' }, 405, corsHeaders);
  }

  try {
    // Parse query parameters
    const pageRaw = parseInt(url.searchParams.get('page') || '1', 10);
    const limitRaw = parseInt(url.searchParams.get('limit') || '20', 10);
    const page = Number.isFinite(pageRaw) ? Math.min(Math.max(pageRaw, 1), 500) : 1;
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 20;
    const category = url.searchParams.get('category');
    const slug = url.searchParams.get('slug');

    if (category && (typeof category !== 'string' || category.length > 64)) {
      return jsonResponse({ success: false, message: 'Invalid category' }, 400, corsHeaders);
    }

    // Security: Validate slug input
    if (slug) {
      if (typeof slug !== 'string' || slug.length > 200) {
        return jsonResponse({ success: false, message: 'Invalid slug format' }, 400, corsHeaders);
      }
      if (!/^[a-z0-9-]+$/i.test(slug)) {
        return jsonResponse({ success: false, message: 'Slug contains invalid characters' }, 400, corsHeaders);
      }
    }

    // If slug is provided, return single article (with full content)
    if (slug) {
      const { data: exactArticle, error: exactError } = await supabase
        .from('tech_news_articles')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      let article = exactArticle;

      if (!article && exactError) {
        console.error('Exact slug lookup error:', exactError);
      }

      if (!article) {
        const { data: legacyMatches, error: legacyError } = await supabase
          .from('tech_news_articles')
          .select('*')
          .like('slug', `${slug}%`)
          .order('created_at', { ascending: false })
          .limit(1);

        if (legacyError) {
          console.error('Legacy slug fallback error:', legacyError);
        }

        article = legacyMatches?.[0] || null;
      }

      if (!article) {
        article = await findLegacyTitleSlugArticle(slug);
      }

      if (!article) {
        return jsonResponse({ success: false, message: 'Article not found' }, 404, corsHeaders);
      }

      // Fire and forget without chaining `.catch()` on the Supabase builder.
      void (async () => {
        try {
          await supabase.rpc('increment_article_views', { article_id: article.id });
        } catch {
          // Ignore view-count errors so article delivery never fails.
        }
      })();

      return jsonResponse({ 
        success: true, 
        article: formatTechNewsArticle(article, true) 
      }, 200, {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=120',
      });
    }

    // Listing — importance × views × recency rank (RPC, with edge-sort fallback)
    let articles;
    let totalArticles;
    try {
      const ranked = await fetchRankedList(supabase, { category, page, limit });
      articles = ranked.articles;
      totalArticles = ranked.totalArticles;
    } catch (error) {
      console.error('Supabase error:', error);
      return jsonResponse({ success: false, message: 'Failed to fetch articles' }, 500, corsHeaders);
    }

    const totalPages = Math.ceil(totalArticles / limit) || 0;

    return jsonResponse({
      success: true,
      data: {
        articles: articles.map(a => formatTechNewsArticle(a, false)),
        pagination: {
          page,
          limit,
          totalArticles,
          totalPages,
          hasMore: page < totalPages
        },
        _cache: {
          generatedAt: new Date().toISOString(),
          maxAge: 60
        }
      }
    }, 200, {
      ...corsHeaders,
      'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=120',
      'CDN-Cache-Control': 'public, max-age=60',
    });

  } catch (error) {
    console.error('Tech News API error:', error);
    return jsonResponse({ success: false, message: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * Helper to create JSON responses
 */
function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

