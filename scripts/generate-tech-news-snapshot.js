/**
 * Writes public/tech-news-latest.json for fast client hydrate (prebuild).
 * Shape mirrors GET /api/tech-news?page=1&limit=10 (list columns only).
 */
import fs from 'fs';
import path from 'path';
import { supabase } from './lib/supabaseAdmin.js';
import { env } from './lib/config.js';
import { formatTechNewsArticle } from '../api/lib/formatTechNewsArticle.js';
import { sortArticlesByRank } from '../api/lib/techNewsRank.js';

const LIMIT = 10;
const OUT_PATH = path.resolve('public', 'tech-news-latest.json');
const LIST_COLUMNS =
  'id,title,description,original_title,image_url,date,category,slug,views,created_at,importance_score';

async function fetchRankedSnapshotArticles() {
  const { data: rpcPayload, error: rpcError } = await supabase.rpc(
    'list_tech_news_ranked',
    {
      p_category: null,
      p_limit: LIMIT,
      p_offset: 0,
    },
  );

  if (!rpcError && rpcPayload && typeof rpcPayload === 'object') {
    return {
      articles: Array.isArray(rpcPayload.articles) ? rpcPayload.articles : [],
      totalArticles: Number(rpcPayload.total) || 0,
    };
  }

  if (rpcError) {
    console.warn('list_tech_news_ranked unavailable for snapshot, edge-sorting:', rpcError.message);
  }

  const batchSize = 1000;
  const columnSets = [
    LIST_COLUMNS,
    'id,title,description,original_title,image_url,date,category,slug,views,created_at',
  ];
  const all = [];
  let totalArticles = 0;
  let lastError = null;

  for (const columns of columnSets) {
    all.length = 0;
    totalArticles = 0;
    let from = 0;
    let ok = true;

    while (true) {
      const { data, error, count } = await supabase
        .from('tech_news_articles')
        .select(columns, { count: from === 0 ? 'exact' : undefined })
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, from + batchSize - 1);

      if (error) {
        lastError = error;
        ok = false;
        break;
      }
      if (from === 0) totalArticles = count || 0;
      if (data?.length) all.push(...data);
      if (!data || data.length < batchSize) break;
      from += batchSize;
    }

    if (ok) {
      if (!columns.includes('importance_score')) {
        console.warn('⚠️  importance_score missing — snapshot ranks with default 50 until migration is applied');
      }
      break;
    }
  }

  if (all.length === 0 && lastError) throw lastError;

  const ranked = sortArticlesByRank(all);
  return {
    articles: ranked.slice(0, LIMIT),
    totalArticles: totalArticles || ranked.length,
  };
}

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

    let articles;
    let totalArticles;
    try {
      const ranked = await fetchRankedSnapshotArticles();
      articles = ranked.articles;
      totalArticles = ranked.totalArticles;
    } catch (error) {
      console.error('Failed to fetch articles for snapshot:', error.message);
      fs.writeFileSync(OUT_PATH, JSON.stringify(emptySnapshot(error.message), null, 2));
      return;
    }

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
