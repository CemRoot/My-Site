/**
 * Writes public/tech-news-latest.json for fast client hydrate (prebuild).
 * Shape mirrors GET /api/tech-news?page=1&limit=10 (list columns only).
 */
import fs from 'fs';
import path from 'path';
import { supabase } from './lib/supabaseAdmin.js';
import { env } from './lib/config.js';
import { formatTechNewsArticle } from '../api/lib/formatTechNewsArticle.js';

const LIMIT = 10;
const OUT_PATH = path.resolve('public', 'tech-news-latest.json');

function emptySnapshot(reason) {
  return {
    success: true,
    data: {
      articles: [],
      pagination: {
        page: 1,
        limit: LIMIT,
        totalArticles: 0,
        totalPages: 0,
        hasMore: false,
      },
      _cache: {
        generatedAt: new Date().toISOString(),
        maxAge: 60,
        source: 'build-snapshot',
        note: reason,
      },
    },
  };
}

async function generateTechNewsSnapshot() {
  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
      console.warn('⚠️  Missing Supabase credentials — writing empty tech-news-latest.json');
      fs.writeFileSync(OUT_PATH, JSON.stringify(emptySnapshot('missing-credentials'), null, 2));
      return;
    }

    const listColumns =
      'id,title,description,original_title,image_url,date,category,slug,views,created_at';

    const { data: articles, error, count } = await supabase
      .from('tech_news_articles')
      .select(listColumns, { count: 'exact' })
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(0, LIMIT - 1);

    if (error) {
      console.error('Failed to fetch articles for snapshot:', error.message);
      fs.writeFileSync(OUT_PATH, JSON.stringify(emptySnapshot(error.message), null, 2));
      return;
    }

    const totalArticles = count || 0;
    const totalPages = Math.ceil(totalArticles / LIMIT);
    const payload = {
      success: true,
      data: {
        articles: (articles || []).map((a) => formatTechNewsArticle(a, false)),
        pagination: {
          page: 1,
          limit: LIMIT,
          totalArticles,
          totalPages,
          hasMore: 1 < totalPages,
        },
        _cache: {
          generatedAt: new Date().toISOString(),
          maxAge: 60,
          source: 'build-snapshot',
        },
      },
    };

    fs.writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2), 'utf8');
    console.log(
      `✅ tech-news-latest.json written (${payload.data.articles.length} articles, ${totalArticles} total)`,
    );
  } catch (err) {
    console.error('tech-news snapshot error:', err);
    fs.writeFileSync(OUT_PATH, JSON.stringify(emptySnapshot(String(err?.message || err)), null, 2));
  }
}

generateTechNewsSnapshot();
