-- =============================================================================
-- Row Level Security (RLS) + least-privilege grants
-- =============================================================================
-- Apply in Supabase Dashboard → SQL Editor, or: supabase db push
--
-- Skips tables that do not exist yet (safe for partial schemas).
--
-- Effect:
--   • anon (public API key): SELECT on tech_news_articles + increment_article_views RPC
--   • authenticated: no table access (no Supabase Auth users in this app)
--   • service_role: unchanged — bypasses RLS (server/scripts only)
-- =============================================================================

BEGIN;

-- All application tables referenced in this repo (optional tables are skipped if missing)
DO $$
DECLARE
  app_tables CONSTANT TEXT[] := ARRAY[
    'tech_news_articles',
    'newsletter_subscribers',
    'chat_history',
    'system_settings',
    'conversation_states',
    'frontend_error_logs',
    'linkedin_posts',
    'linkedin_digest_posts',
    'linkedin_group_digests',
    'rejected_articles',
    'vercel_status_notifications'
  ];
  tbl TEXT;
  pol RECORD;
  tbl_exists BOOLEAN;
BEGIN
  FOREACH tbl IN ARRAY app_tables
  LOOP
    SELECT to_regclass('public.' || tbl) IS NOT NULL INTO tbl_exists;
    IF NOT tbl_exists THEN
      RAISE NOTICE 'Skipping public.% — table does not exist', tbl;
      CONTINUE;
    END IF;

    -- Drop existing policies
    FOR pol IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = tbl
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
    END LOOP;

    -- Enable RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

    IF tbl = 'tech_news_articles' THEN
      EXECUTE $policy$
        CREATE POLICY "anon_select_tech_news_articles"
          ON public.tech_news_articles
          FOR SELECT
          TO anon
          USING (true)
      $policy$;
      EXECUTE 'REVOKE ALL ON public.tech_news_articles FROM anon, authenticated';
      EXECUTE 'GRANT SELECT ON public.tech_news_articles TO anon';
    ELSE
      -- Sensitive tables: RLS on, no anon/authenticated policy = deny
      EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', tbl);
    END IF;

    RAISE NOTICE 'RLS applied to public.%', tbl;
  END LOOP;
END $$;

-- Secure view counter RPC (only when tech_news_articles exists)
DO $$
BEGIN
  IF to_regclass('public.tech_news_articles') IS NULL THEN
    RAISE NOTICE 'Skipping increment_article_views — tech_news_articles does not exist';
    RETURN;
  END IF;

  EXECUTE $fn$
    CREATE OR REPLACE FUNCTION public.increment_article_views(article_id uuid)
    RETURNS void
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = public
    AS $body$
      UPDATE public.tech_news_articles
      SET views = COALESCE(views, 0) + 1
      WHERE id = article_id;
    $body$;
  $fn$;

  REVOKE ALL ON FUNCTION public.increment_article_views(uuid) FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.increment_article_views(uuid) TO anon;
  GRANT EXECUTE ON FUNCTION public.increment_article_views(uuid) TO service_role;
END $$;

COMMIT;
