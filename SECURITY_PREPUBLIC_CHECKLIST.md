# Pre-Public Security Checklist

**Repo:** `CemRoot/My-Site`  
**Prepared:** 2026-04-03  
**Status:** ✅ Safe to make public (after completing manual steps below)

---

## Findings by Severity

### 🔴 CRITICAL — Fixed in this PR

| # | Finding | File | Fix Applied |
|---|---------|------|-------------|
| C-1 | `VITE_SUPABASE_SERVICE_ROLE_KEY` was injected into the client-side Vite bundle via the `define` block. The service role key grants full database admin access; any visitor could extract it from the production JS bundle. | `vite.config.ts` | Line removed. The service role key is now **server-only** (`SUPABASE_SERVICE_ROLE_KEY` in `lib/supabaseAdmin.js`). |

---

### 🟠 HIGH — Fixed in this PR

| # | Finding | File | Fix Applied |
|---|---------|------|-------------|
| H-1 | `.vercel/project.json` was committed to git and exposed `projectId` and `orgId`. Vercel's own bundled `README.txt` states this file **must not be committed**. A bad actor could reference your project ID in Vercel API calls. | `.vercel/project.json` | Removed from git tracking (`git rm --cached`). Added to `.gitignore`. |

---

### 🟡 MEDIUM — Fixed in this PR

| # | Finding | File | Fix Applied |
|---|---------|------|-------------|
| M-1 | Webhook secret verification used plain-string equality (`!==`) which is vulnerable to timing attacks allowing secret enumeration. | `api/deployment-webhook.js` | Replaced with `crypto.timingSafeEqual()`. |
| M-2 | CORS policy used `origin.includes('.vercel.app')` — any developer can register a free `*.vercel.app` subdomain and bypass CORS, effectively making the endpoint publicly writable. | `api/frontend-health-monitor.js` | Replaced with an explicit allowlist (`cemkoyluoglu.codes` + `process.env.VERCEL_URL`). |
| M-3 | `/api/newsletter` had **no rate limiting**, allowing unlimited spam/enumeration of the subscriber table. | `api/newsletter.js` | Added: 5 requests / 10 minutes per IP using the existing `lib/rate-limit.js` helper. |

---

### 🔵 LOW — Fixed in this PR

| # | Finding | File | Fix Applied |
|---|---------|------|-------------|
| L-1 | `error.message` was returned in production 500 responses, potentially leaking internal stack details to attackers. | `api/og-meta.js`, `api/deployment-webhook.js` | Removed `message`/`details` fields from production error responses; errors are still logged server-side. |

---

### ℹ️ INFORMATIONAL — No Action Required

| # | Finding | Notes |
|---|---------|-------|
| I-1 | GitHub Actions workflows reference secrets via `${{ secrets.* }}` — correct. No hardcoded values. | ✅ Healthy |
| I-2 | `api/chat.js`, `api/telegram-control.js`, `api/revalidate-news.js` all use `crypto.timingSafeEqual()` for auth. | ✅ Healthy |
| I-3 | n8n workflow JSON files (`docs/*.json`) contain credential *reference names* only (no actual keys). | ✅ Healthy |
| I-4 | `npm audit` returns **0 vulnerabilities**. | ✅ Healthy |
| I-5 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` is intentionally public (Supabase Row-Level Security enforces access control). | ✅ By design |
| I-6 | Sentry DSN (`VITE_SENTRY_DSN`) is public by design — it only accepts inbound error reports. | ✅ By design |
| I-7 | `api/tech-news.js` is a read-only public Edge Function using the anon key. Slug input is validated. | ✅ Healthy |

---

## Automated Guardrails Already in Place

- **`.github/workflows/security-scan.yml`** — runs `npm audit` on every push to `main`/`develop` and weekly.
- **`.github/workflows/smart-security-updates.yml`** — automated dependency security updates via Dependabot.
- **`.github/dependabot.yml`** — weekly npm dependency version checks.
- **`.github/workflows/pre-commit-hook.sh`** — pre-commit hook template that scans for common secret patterns.
- **`.gitleaksignore`** — suppresses false positives in gitleaks scans (`.env.example`, README, docs).

---

## Manual Steps Required Before Making Repo Public

These cannot be automated — a human must complete them:

### 1. Rotate any potentially exposed credentials (MANDATORY)

Even though no live secrets were found in the current git tree, confirm the following have never been committed in **any prior commit** (use `git log -p --all | grep -E "eyJ|gsk_|fc-|ghp_"`):

- [ ] Supabase service role key (`SUPABASE_SERVICE_ROLE_KEY`)
- [ ] Groq API key (`GROQ_API_KEY`)
- [ ] Firecrawl API key (`FIRECRAWL_API_KEY`)
- [ ] Telegram bot token (`TELEGRAM_BOT_TOKEN`)
- [ ] GitHub PAT (`GITHUB_TOKEN`)
- [ ] Sentry auth token (`SENTRY_AUTH_TOKEN`)

If any of the above were ever present, **rotate them at the provider before going public**, regardless of whether they've since been removed from history.

> **Note:** This repository is a shallow clone (grafted history from commit `fc4ee37`). A full `git filter-repo` scan of the complete history was not possible. Run `git fetch --unshallow` locally and re-run the grep above before going public.

### 2. Verify environment variables are set in Vercel / CI

- [ ] `DEPLOYMENT_WEBHOOK_SECRET` — must be set (a missing value causes the endpoint to return 500 instead of rejecting the request)
- [ ] `TELEGRAM_CONTROL_API_SECRET` — required for `/api/telegram-control`
- [ ] All secrets referenced in `.env.example` are configured in Vercel project settings

### 3. Enable GitHub Secret Scanning

- [ ] Go to **Settings → Security → Secret scanning** and enable *Push protection* so future accidental pushes of real secrets are blocked at push time.

### 4. Confirm Supabase Row-Level Security (RLS) is enabled

- [ ] Verify RLS policies are active on `newsletter_subscribers`, `chat_history`, `tech_news_articles`, and `frontend_error_logs` tables. The anon key is intentionally public; RLS is the only access control layer.

### 5. Remove `.vercel/project.json` from git history (optional but recommended)

The file was only added in the current branch's initial commit (shallow clone). Because the public repo will show this branch's history:

```bash
# Optional: rewrite history to fully erase the file
git filter-repo --path .vercel/project.json --invert-paths
```

Or simply confirm that the project/org IDs (`prj_UF6AhNqc2emGPYNpEf0Di1Qg0cRO` / `team_5gayeJjrKsCxHMp6ITDaJQdc`) are not secret — Vercel project IDs alone don't grant any access without a corresponding token.

---

## Go / No-Go Decision

| Condition | Status |
|-----------|--------|
| No hardcoded secrets in tracked files | ✅ |
| No secrets exposed in client bundle | ✅ (fixed C-1) |
| .vercel/project.json untracked | ✅ (fixed H-1) |
| Rate limiting on public-write endpoints | ✅ (fixed M-3) |
| CORS restricted to known origins | ✅ (fixed M-2) |
| npm audit: 0 critical/high | ✅ |
| Secret scanning enabled | ⚠️ Manual step 3 |
| Supabase RLS confirmed | ⚠️ Manual step 4 |
| Full git history clean-scan | ⚠️ Manual step 1 (shallow clone limitation) |

**Recommendation: ✅ GO** — safe to make public once manual steps 1–4 are completed.
