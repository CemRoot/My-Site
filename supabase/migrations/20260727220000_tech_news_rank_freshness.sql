-- =============================================================================
-- Tech news ranking: 14-day date freshness
-- =============================================================================
-- Replaces the 72h created_at recency boost so mid-month "importance 100"
-- articles with a few views no longer outrank fresher news on Signal.
--
-- Composite rank (query-time):
--   importance_score * 0.55
--   + least(views, 50) / 50 * 5
--   + date_freshness (linear 0–40 over last 14 days from a.date)
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
    json_agg(to_jsonb(ranked) - 'rank' ORDER BY ranked.rank DESC, ranked.date DESC NULLS LAST, ranked.created_at DESC NULLS LAST),
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
      a.importance_score,
      (
        COALESCE(a.importance_score, 50)::numeric * 0.55
        + (LEAST(COALESCE(a.views, 0), 50)::numeric / 50.0) * 5
        + CASE
            WHEN a.date IS NULL THEN 0::numeric
            WHEN age_days <= 0 THEN 40::numeric
            WHEN age_days >= 14 THEN 0::numeric
            ELSE 40::numeric * (1::numeric - age_days / 14.0)
          END
      ) AS rank
    FROM public.tech_news_articles a
    CROSS JOIN LATERAL (
      SELECT (CURRENT_DATE - a.date)::numeric AS age_days
    ) ages
    WHERE p_category IS NULL
       OR p_category = ''
       OR p_category = 'all'
       OR a.category = p_category
    ORDER BY rank DESC, a.date DESC NULLS LAST, a.created_at DESC NULLS LAST
    LIMIT GREATEST(COALESCE(p_limit, 20), 1)
    OFFSET GREATEST(COALESCE(p_offset, 0), 0)
  ) ranked;

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
