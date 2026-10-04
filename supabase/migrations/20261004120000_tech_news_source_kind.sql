-- =============================================================================
-- Tech news source kind + updated_at
-- =============================================================================
-- source_kind separates legacy machine-translated articles ('translated') from
-- first-party pieces ('original'). Only 'original' rows are indexable: the
-- article page renders noindex for the rest, the sitemap skips them, and the
-- 30-day retention cleanup only ever deletes 'translated' rows.
--
-- updated_at feeds NewsArticle.dateModified and sitemap <lastmod>.
-- Existing rows and the current scraper insert get 'translated' by default.
-- =============================================================================

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.tech_news_articles') IS NULL THEN
    RAISE NOTICE 'Skipping source_kind migration — tech_news_articles does not exist';
    RETURN;
  END IF;

  ALTER TABLE public.tech_news_articles
    ADD COLUMN IF NOT EXISTS source_kind text NOT NULL DEFAULT 'translated';

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tech_news_articles_source_kind_check'
  ) THEN
    ALTER TABLE public.tech_news_articles
      ADD CONSTRAINT tech_news_articles_source_kind_check
      CHECK (source_kind IN ('translated', 'original'));
  END IF;

  ALTER TABLE public.tech_news_articles
    ADD COLUMN IF NOT EXISTS updated_at timestamptz;

  UPDATE public.tech_news_articles
    SET updated_at = COALESCE(created_at, now())
    WHERE updated_at IS NULL;

  ALTER TABLE public.tech_news_articles
    ALTER COLUMN updated_at SET DEFAULT now(),
    ALTER COLUMN updated_at SET NOT NULL;

  CREATE INDEX IF NOT EXISTS idx_tech_news_articles_source_kind
    ON public.tech_news_articles (source_kind);

  RAISE NOTICE 'Added source_kind and updated_at to public.tech_news_articles';
END $$;

CREATE OR REPLACE FUNCTION public.tech_news_articles_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.tech_news_articles') IS NULL THEN
    RETURN;
  END IF;

  DROP TRIGGER IF EXISTS tech_news_articles_touch_updated_at ON public.tech_news_articles;
  -- Replaces the older every-UPDATE trigger, which bumped updated_at on each
  -- view-counter increment. Content edits only: views must not move dateModified.
  DROP TRIGGER IF EXISTS update_tech_news_updated_at_trigger ON public.tech_news_articles;
  CREATE TRIGGER tech_news_articles_touch_updated_at
    BEFORE UPDATE OF title, description, content, image_url, category, slug, source_kind
    ON public.tech_news_articles
    FOR EACH ROW
    EXECUTE FUNCTION public.tech_news_articles_touch_updated_at();
END $$;

COMMIT;
