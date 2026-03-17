import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase.js';
import type { Article } from '../types';

interface SupabaseArticleRow {
  id: number;
  title: string;
  description: string;
  content: string;
  original_title: string;
  image_url: string;
  date: string;
  category: string;
  source_url: string;
  original_source: string;
  slug: string;
  created_at: string;
}

function formatArticleRow(row: SupabaseArticleRow): Article {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    content: row.content,
    originalTitle: row.original_title,
    image: row.image_url,
    date: row.date,
    category: row.category,
    sourceUrl: row.source_url,
    originalSource: row.original_source,
    slug: row.slug,
    createdAt: row.created_at,
  };
}

export function useArticle(slug: string | undefined) {
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    const fetchArticle = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: articleData, error: articleError } = await supabase
          .from('tech_news_articles')
          .select('*')
          .eq('slug', slug)
          .single();

        if (cancelled) return;

        if (articleError || !articleData) {
          throw new Error('Article not found');
        }

        const formattedArticle = formatArticleRow(articleData as SupabaseArticleRow);
        setArticle(formattedArticle);

        await supabase.rpc('increment_article_views', {
          article_id: articleData.id,
        });

        const category = formattedArticle.category;
        const { data: relatedData } = await supabase
          .from('tech_news_articles')
          .select('*')
          .eq('category', category || 'AI')
          .neq('id', articleData.id)
          .order('date', { ascending: false })
          .limit(3);

        if (!cancelled && relatedData) {
          setRelatedArticles(
            (relatedData as SupabaseArticleRow[]).map(formatArticleRow),
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchArticle();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { article, relatedArticles, loading, error };
}
