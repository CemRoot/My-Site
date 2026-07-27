-- =============================================================================
-- Tech news list: pure date DESC (newest first)
-- =============================================================================
-- Replaces composite importance/views/freshness ranking so the index, LEAD
-- carousel, and Signal teaser all surface chronologically.
-- Function name list_tech_news_ranked is kept for API compatibility.
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.list_tech_news_ranked(
  p_category text DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_total bigint := 0;
  v_articles json := '[]'::json;
BEGIN
  IF to_regclass('public.tech_news_articles') IS NULL THEN
    RETURN json_build_object('articles', '[]'::json, 'total', 0);
  END IF;

  SELECT COUNT(*)::bigint INTO v_total
    FROM public.tech_news_articles
    WHERE p_category IS NULL
       OR p_category = ''
       OR p_category = 'all'
       OR category = p_category;

  SELECT COALESCE(
    json_agg(to_jsonb(ordered) ORDER BY ordered.date DESC NULLS LAST, ordered.created_at DESC NULLS LAST),
    '[]'::json
  )
  INTO v_articles
  FROM (
    SELECT
      a.id,
      a.title,
      a.description,
      a.original_title,
      a.image_url,
      a.date,
      a.category,
      a.slug,
      a.views,
      a.created_at,
      a.importance_score
    FROM public.tech_news_articles a
    WHERE p_category IS NULL
       OR p_category = ''
       OR p_category = 'all'
       OR a.category = p_category
    ORDER BY a.date DESC NULLS LAST, a.created_at DESC NULLS LAST
    LIMIT GREATEST(COALESCE(p_limit, 20), 1)
    OFFSET GREATEST(COALESCE(p_offset, 0), 0)
  ) ordered;

  RETURN json_build_object(
    'articles', v_articles,
    'total', v_total
  );
END;
$$;

REVOKE ALL ON FUNCTION public.list_tech_news_ranked(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_tech_news_ranked(text, integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.list_tech_news_ranked(text, integer, integer) TO service_role;

COMMIT;
