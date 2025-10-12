/**
 * Tech News API
 * Vercel Serverless Function
 * Fetches tech news articles from Supabase with pagination and filtering
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept GET
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    const { 
      page = 1, 
      limit = 20, 
      category,
      slug 
    } = req.query;

    // If slug is provided, return single article
    if (slug) {
      const { data: article, error } = await supabase
        .from('tech_news_articles')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('Supabase error (slug):', error);
        return res.status(404).json({ 
          success: false, 
          message: 'Article not found' 
        });
      }

      // Increment view count
      await supabase.rpc('increment_article_views', { article_id: article.id });

      return res.status(200).json({ 
        success: true, 
        article: formatArticle(article)
      });
    }

    // Build query
    let query = supabase
      .from('tech_news_articles')
      .select('*', { count: 'exact' })
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply category filter
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    // Apply pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    query = query.range(from, to);

    // Execute query
    const { data: articles, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch articles' 
      });
    }

    // Calculate pagination metadata
    const totalArticles = count || 0;
    const totalPages = Math.ceil(totalArticles / limitNum);

    return res.status(200).json({ 
      success: true,
      data: {
        articles: articles.map(formatArticle),
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalArticles,
          totalPages,
          hasMore: pageNum < totalPages
        }
      }
    });

  } catch (error) {
    console.error('Tech News API error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}

/**
 * Format article for frontend consumption
 */
function formatArticle(article) {
  return {
    id: article.id,
    title: article.title,
    description: article.description,
    content: article.content,
    originalTitle: article.original_title,
    image: article.image_url,
    date: article.date,
    category: article.category,
    sourceUrl: article.source_url,
    originalSource: article.original_source,
    slug: article.slug,
    views: article.views,
    createdAt: article.created_at,
    updatedAt: article.updated_at,
  };
}

