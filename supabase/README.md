# Supabase migrations

## Apply importance ranking migration

The migration `migrations/20260727010000_tech_news_importance_score.sql` adds `importance_score` and the `list_tech_news_ranked` RPC used by `/api/tech-news` list ranking.

1. Open Supabase Dashboard → **SQL Editor**
2. Paste and run the full contents of that migration file
3. Optionally backfill existing rows: `npm run backfill:importance`

## Apply RLS migration (required after deploy)

The migration `migrations/20260701170000_enable_rls_least_privilege.sql` locks down direct PostgREST access with the public anon key.

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**
2. Paste and run the full contents of `migrations/20260701170000_enable_rls_least_privilege.sql`
3. Verify in **Authentication → Policies** that sensitive tables have RLS enabled and only `tech_news_articles` has an `anon` SELECT policy

**Note:** The migration skips tables that are not created yet (e.g. `linkedin_posts`). Check the SQL Editor **Messages** tab for `NOTICE: Skipping public....` lines.

### Quick verification (anon key)

```bash
# Should succeed (200 + rows)
curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/tech_news_articles?select=id&limit=1" \
  -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}"

# Should fail (401/403 or empty policy denial) — private table, not anon-readable
curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/chat_history?select=id&limit=1" \
  -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}"
```

Server-side routes that use `SUPABASE_SERVICE_ROLE_KEY` are unaffected (service role bypasses RLS).

## Leftover: `newsletter_subscribers`

App code for newsletter signup (`api/newsletter.js`, `NewsletterSignup`) was removed in P3 cleanup. No runtime path writes to `newsletter_subscribers` anymore.

If the table still exists in the Supabase project, it is a **DB leftover** only:
- RLS migration still lists it so an existing table stays locked down (no anon/authenticated access).
- There is **no drop migration** in this repo — delete it manually in the Supabase SQL Editor when you confirm you do not need the historical emails:

```sql
DROP TABLE IF EXISTS public.newsletter_subscribers;
```
