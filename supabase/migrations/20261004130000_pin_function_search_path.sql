-- =============================================================================
-- Pin search_path on public functions (Supabase linter 0011)
-- =============================================================================
-- A role-mutable search_path lets a caller shadow public objects with objects
-- in another schema. All of these functions only touch public tables, so
-- pinning public, pg_temp keeps behaviour identical.
-- =============================================================================

ALTER FUNCTION public.cleanup_expired_conversation_states() SET search_path = public, pg_temp;
ALTER FUNCTION public.cleanup_old_monitoring_logs() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_daily_linkedin_stats(date) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_digest_articles(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_digest_stats(date) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_weekly_linkedin_performance() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_digest_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_linkedin_posts_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;

-- Replaced by tech_news_articles_touch_updated_at (20261004120000); no trigger uses it.
DROP FUNCTION IF EXISTS public.update_tech_news_updated_at();
