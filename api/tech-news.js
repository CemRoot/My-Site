/**
 * Tech News API
 * Vercel Edge Function - Ultra-fast cold starts
 * Fetches tech news articles from Supabase with pagination and filtering
 */

import { createClient } from '@supabase/supabase-js';

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
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const category = url.searchParams.get('category');
    const slug = url.searchParams.get('slug');

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
        article: formatArticle(article, true) 
      }, 200, {
        ...corsHeaders,
        'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
      });
    }

    // Listing query - Only select needed columns (NOT content - saves bandwidth)
    const listColumns = 'id,title,description,original_title,image_url,date,category,source_url,original_source,slug,views,created_at';
    
    let query = supabase
      .from('tech_news_articles')
      .select(listColumns, { count: 'exact' })
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply category filter
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // Execute query
    const { data: articles, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return jsonResponse({ success: false, message: 'Failed to fetch articles' }, 500, corsHeaders);
    }

    // Calculate pagination metadata
    const totalArticles = count || 0;
    const totalPages = Math.ceil(totalArticles / limit);

    return jsonResponse({
      success: true,
      data: {
        articles: articles.map(a => formatArticle(a, false)),
        pagination: {
          page,
          limit,
          totalArticles,
          totalPages,
          hasMore: page < totalPages
        },
        _cache: {
          generatedAt: new Date().toISOString(),
          maxAge: 5
        }
      }
    }, 200, {
      ...corsHeaders,
      'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
      'CDN-Cache-Control': 'public, max-age=5',
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

/**
 * Format article for frontend consumption
 * @param {Object} article - Raw article from database
 * @param {boolean} includeContent - Whether to include full content
 */
function formatArticle(article, includeContent = false) {
  const formatted = {
    id: article.id,
    title: article.title,
    description: article.description,
    originalTitle: article.original_title,
    image: article.image_url,
    date: article.date,
    category: article.category,
    sourceUrl: article.source_url,
    originalSource: article.original_source,
    slug: article.slug,
    views: article.views,
    createdAt: article.created_at,
  };
  
  // Only include content for single article requests
  if (includeContent && article.content) {
    formatted.content = article.content;
  }
  
  return formatted;
}
