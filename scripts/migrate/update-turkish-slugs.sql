-- =============================================================================
-- Turkish Slug → English-safe Slug Backfill
-- =============================================================================
-- Context: Early records were saved with slugs derived from the Turkish source
-- URL (e.g. "meta-numarali-gozluk-kullananlara-ozel-iki-yeni-ray-ban-gozlugu-tanitti")
-- instead of the translated English title.
--
-- NEW RECORDS: Fixed as of the slug-normalization PR. All new articles now use
-- an ASCII/English slug generated from the translated English title.
--
-- EXISTING RECORDS: This script helps identify and update Turkish slugs.
-- Run each section manually in the Supabase SQL editor.
-- IMPORTANT: Take a snapshot / backup before running UPDATE statements.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. IDENTIFY: List records with likely-Turkish slugs
--    Heuristic: slug contains typical Turkish transliteration patterns
--    (consecutive consonants common in Turkish, or contains transliterated
--    Turkish words). Adjust the LIKE patterns as needed.
-- ---------------------------------------------------------------------------
SELECT
  id,
  slug,
  title,          -- this is already the English translated title in new records
  source_url,
  created_at
FROM public.tech_news_articles
WHERE
  slug ~ '[a-z]'                                -- has lowercase letters (not empty)
  AND (
    slug LIKE '%gozluk%'
    OR slug LIKE '%teknoloji%'
    OR slug LIKE '%yapay-zeka%'
    OR slug LIKE '%kullanici%'
    OR slug LIKE '%ozel%'
    OR slug LIKE '%buyuk%'
    OR slug LIKE '%kucuk%'
    OR slug LIKE '%uretim%'
    OR slug LIKE '%calisi%'
    OR slug LIKE '%tanitild%'
    OR slug LIKE '%duyurul%'
    OR slug LIKE '%gelistir%'
    OR slug LIKE '%-icin-%'
    OR slug LIKE '%-ile-%'
    OR slug LIKE '%-ve-%'
    OR slug LIKE '%-bir-%'
    OR slug LIKE '%-bu-%'
    -- Add more patterns as you find them
  )
ORDER BY created_at DESC;

-- ---------------------------------------------------------------------------
-- 2. PREVIEW: See what the new English slug would look like.
--    The `title` column should already contain the English translated title.
--    This query generates a candidate English slug using PostgreSQL string ops
--    (approximation of the JS generateSlug logic).
-- ---------------------------------------------------------------------------
SELECT
  id,
  slug                                            AS old_slug,
  title,
  lower(
    regexp_replace(
      regexp_replace(
        unaccent(title),                          -- requires unaccent extension
        '[^a-zA-Z0-9\s-]', ' ', 'g'
      ),
      '\s+', '-', 'g'
    )
  )                                               AS candidate_new_slug,
  source_url
FROM public.tech_news_articles
WHERE slug LIKE '%-%'   -- has hyphens (slug-like)
  AND title IS NOT NULL AND title <> ''
LIMIT 50;

-- NOTE: PostgreSQL's unaccent() extension must be enabled:
--   CREATE EXTENSION IF NOT EXISTS unaccent;
-- If not available, generate the English slug in JavaScript (see note below)
-- and update via the application layer or a DO block.

-- ---------------------------------------------------------------------------
-- 3. UPDATE: Apply English slugs for a specific set of IDs.
--    Generate the new slugs externally (e.g. via Node.js script using
--    the same generateSlug() function) then paste the values here.
--
--    Template (replace placeholders):
-- ---------------------------------------------------------------------------
/*
UPDATE public.tech_news_articles
SET slug = new_slug
FROM (VALUES
  ('old-turkish-slug-1'::text, 'new-english-slug-1'::text),
  ('old-turkish-slug-2'::text, 'new-english-slug-2'::text)
  -- add more rows as needed
) AS updates(old_slug, new_slug)
WHERE tech_news_articles.slug = updates.old_slug;
*/

-- ---------------------------------------------------------------------------
-- 4. VERIFY: Confirm the update.
-- ---------------------------------------------------------------------------
/*
SELECT id, slug, title, source_url
FROM public.tech_news_articles
WHERE slug IN ('new-english-slug-1', 'new-english-slug-2');
*/

-- ---------------------------------------------------------------------------
-- 5. REDIRECT CONSIDERATIONS
-- ---------------------------------------------------------------------------
-- If existing Turkish-slug pages are already indexed by search engines,
-- consider adding 301 redirects in your Next.js app:
--
--   // pages/tech-news/[slug].js or app/tech-news/[slug]/page.js
--   // In getStaticPaths or generateStaticParams, also generate paths for old slugs.
--   // Or maintain a redirect map table:
--
--   CREATE TABLE IF NOT EXISTS public.slug_redirects (
--     old_slug TEXT PRIMARY KEY,
--     new_slug TEXT NOT NULL,
--     created_at TIMESTAMPTZ DEFAULT now()
--   );
--
--   INSERT INTO public.slug_redirects (old_slug, new_slug) VALUES
--     ('meta-numarali-gozluk-kullananlara-ozel-iki-yeni-ray-ban-gozlugu-tanitti',
--      'meta-unveils-two-new-ray-ban-glasses-for-prescription-lens-wearers');
--
-- In Next.js next.config.js, load these from the DB and expose as redirects[].
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 6. GENERATE SLUGS VIA NODE.JS (recommended for bulk updates)
-- ---------------------------------------------------------------------------
-- Run this from the project root to print id,old_slug,new_slug pairs:
--
--   node -e "
--     import('../scripts/lib/scraper/slugUtils.js').then(({ generateSlug }) => {
--       // paste article rows as JSON array
--       const rows = [];
--       rows.forEach(r => console.log(r.id + ',' + r.slug + ',' + generateSlug(r.title)));
--     });
--   "
--
-- Then use the output to fill in the UPDATE statement in section 3 above.
-- ---------------------------------------------------------------------------
