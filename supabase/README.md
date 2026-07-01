# Supabase migrations

## Apply RLS migration (required after deploy)

The migration `migrations/20260701170000_enable_rls_least_privilege.sql` locks down direct PostgREST access with the public anon key.

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**
2. Paste and run the full contents of `migrations/20260701170000_enable_rls_least_privilege.sql`
3. Verify in **Authentication → Policies** that sensitive tables have RLS enabled and only `tech_news_articles` has an `anon` SELECT policy

### Quick verification (anon key)

```bash
# Should succeed (200 + rows)
curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/tech_news_articles?select=id&limit=1" \
  -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}"

# Should fail (401/403 or empty policy denial)
curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/newsletter_subscribers?select=id&limit=1" \
  -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}"
```

Server-side routes that use `SUPABASE_SERVICE_ROLE_KEY` are unaffected (service role bypasses RLS).
