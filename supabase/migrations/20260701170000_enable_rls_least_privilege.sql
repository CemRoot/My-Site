-- =============================================================================
-- Row Level Security (RLS) + least-privilege grants
-- =============================================================================
-- Apply in Supabase Dashboard → SQL Editor, or: supabase db push
--
-- Effect:
--   • anon (public API key): SELECT on tech_news_articles + increment_article_views RPC
--   • authenticated: no table access (no Supabase Auth users in this app)
--   • service_role: unchanged — bypasses RLS (server/scripts only)
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Drop existing policies on application tables (clean slate)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  pol RECORD;
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
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
  ]
  LOOP
    FOR pol IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = tbl
    LOOP
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.%I',
        pol.policyname,
        tbl
      );
    END LOOP;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Enable RLS on all application tables
-- ---------------------------------------------------------------------------
ALTER TABLE public.tech_news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frontend_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_digest_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_group_digests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rejected_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vercel_status_notifications ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 3. Public read: tech news articles (anon key / Edge API)
-- ---------------------------------------------------------------------------
CREATE POLICY "anon_select_tech_news_articles"
  ON public.tech_news_articles
  FOR SELECT
  TO anon
  USING (true);

-- ---------------------------------------------------------------------------
-- 4. Secure view counter RPC (parameterized, fixed search_path)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_article_views(article_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.tech_news_articles
  SET views = COALESCE(views, 0) + 1
  WHERE id = article_id;
$$;

REVOKE ALL ON FUNCTION public.increment_article_views(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_article_views(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_article_views(uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- 5. Revoke broad grants from anon / authenticated
--    (sensitive tables: RLS on + no policy = deny)
-- ---------------------------------------------------------------------------
REVOKE ALL ON public.newsletter_subscribers FROM anon, authenticated;
REVOKE ALL ON public.chat_history FROM anon, authenticated;
REVOKE ALL ON public.system_settings FROM anon, authenticated;
REVOKE ALL ON public.conversation_states FROM anon, authenticated;
REVOKE ALL ON public.frontend_error_logs FROM anon, authenticated;
REVOKE ALL ON public.linkedin_posts FROM anon, authenticated;
REVOKE ALL ON public.linkedin_digest_posts FROM anon, authenticated;
REVOKE ALL ON public.linkedin_group_digests FROM anon, authenticated;
REVOKE ALL ON public.rejected_articles FROM anon, authenticated;
REVOKE ALL ON public.vercel_status_notifications FROM anon, authenticated;

-- tech_news_articles: read-only for anon
REVOKE ALL ON public.tech_news_articles FROM anon, authenticated;
GRANT SELECT ON public.tech_news_articles TO anon;

COMMIT;
