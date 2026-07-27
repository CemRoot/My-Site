-- =============================================================================
-- Tech news importance ranking
-- =============================================================================
-- Adds scrape-time importance_score + a ranked list RPC used by /api/tech-news.
--
-- Composite rank (query-time):
--   importance_score * 0.7
--   + least(views, 200) / 200 * 15
--   + recency_boost (linear 0–15 over last 72h)
-- =============================================================================

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.tech_news_articles') IS NULL THEN
    RAISE NOTICE 'Skipping importance_score migration — tech_news_articles does not exist';
    RETURN;
  END IF;

  ALTER TABLE public.tech_news_articles
    ADD COLUMN IF NOT EXISTS importance_score integer NOT NULL DEFAULT 50;

  CREATE INDEX IF NOT EXISTS idx_tech_news_articles_importance_score
    ON public.tech_news_articles (importance_score DESC);

  RAISE NOTICE 'Added importance_score to public.tech_news_articles';
END $$;

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
        COALESCE(a.importance_score, 50)::numeric * 0.7
        + (LEAST(COALESCE(a.views, 0), 200)::numeric / 200.0) * 15
        + CASE
            WHEN ref_ts IS NULL THEN 0::numeric
            WHEN ref_ts >= (now() - interval '72 hours')
              THEN GREATEST(
                0::numeric,
                15::numeric * (
                  1::numeric
                  - EXTRACT(EPOCH FROM (now() - ref_ts))::numeric / (72.0 * 3600.0)
                )
              )
            ELSE 0::numeric
          END
      ) AS rank
    FROM public.tech_news_articles a
    CROSS JOIN LATERAL (
      SELECT COALESCE(a.created_at, (a.date::timestamp AT TIME ZONE 'UTC')) AS ref_ts
    ) refs
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
