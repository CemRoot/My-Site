# Telegram Ops Module

OOP domain services for the Telegram control bot. Refactored from `scripts/telegram-menu-handler.js`.

## Entry points

| Entry | Role |
|-------|------|
| `api/telegram-webhook.js` | Vercel webhook — secret check, then `UpdateRouter.handle(update)` |
| `api/telegram-control.js` | Control API (setup menu, status, scrape, health) — delegates to `TelegramOpsBot` |
| `scripts/setup-telegram-menu.js` / `telegram:*` npm scripts | CLI setup / webhook reset |
| `scripts/telegram-menu-handler.js` | Compat shim (re-exports from this module) |

## Service ownership

| Service | Owns |
|---------|------|
| `ConversationFlowService` | `/start`, `/menu`, help |
| `ScraperOpsService` | Scraper menu, scrape (GitHub only), add/delete article flows |
| `LinkedInOpsService` | Social menu, digests, groups, clean pending, digest n8n callbacks |
| `AnalyticsOpsService` | Analytics menu, status, stats, database info |
| `SystemOpsService` | Health, webhook reset, n8n, chat backend, GitHub Actions, `setBotCommands` |
| `UpdateRouter` | Auth helpers, rate limit, command/callback dispatch |
| `TelegramOpsBot` | Facade + named exports for webhook/shim compat |

## Env vars

- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET`
- `TELEGRAM_CONTROL_API_SECRET` (control API bearer)
- `GITHUB_TOKEN`, `GITHUB_REPOSITORY`
- `N8N_LINKEDIN_WORKFLOW_WEBHOOK` (digest approve/reject/edit/view + manual create)
- Supabase / Groq / Firecrawl keys via `scripts/lib/config.js` (`env`)

## Telegram helpers (do not confuse)

- **`lib/telegram.js`** — serverless (Vercel API routes / webhook)
- **`scripts/lib/telegram.js`** — CLI notify helpers
- **`scripts/ci/*telegram*`** — CI notify scripts (separate; not this module)

## Notes

- Scrape requires `GITHUB_TOKEN` (no local `spawn` fallback).
- Database action does not offer a remote “Fix Sources” button.
- GitHub workflow UI omits `daily-linkedin.yml` (removed; digests are n8n-owned).
- Empty LinkedIn digest keyboard uses `action_refresh_menu` (not `action_menu`).

## Manual smoke checklist

After deploy / local webhook tunnel:

1. `/menu` — main keyboard appears
2. Scraper → Run Scraper — GitHub Actions dispatch (or clear token error)
3. LinkedIn Digests — list loads; approve/reject forwards to n8n when pending
4. Webhook without `X-Telegram-Bot-Api-Secret-Token` → 401
5. Control API without bearer → 401; with secret `?action=send-status` → Telegram status message
