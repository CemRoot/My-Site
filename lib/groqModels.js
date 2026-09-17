/**
 * Single source of truth for every Groq model id the project calls.
 *
 * Groq retires models on a published schedule and the API then returns 404 for
 * them (llama-3.1-8b-instant and llama-3.3-70b-versatile both went on
 * 2026-08-16). Two things follow from that, and this module provides both:
 *
 *   1. Every id is overridable by an environment variable, so a retirement can
 *      be routed around from repository variables with no code change.
 *   2. Every id is enumerable, so `scripts/ci/check-groq-models.mjs` can verify
 *      them against the live Groq model list before a run spends any credits.
 *
 * A model added here is automatically covered by the gate. A model hardcoded at
 * a call site is not — that is how the LinkedIn digest and the site chat both
 * kept a dead id after the scraper had been migrated.
 *
 * This lives in `lib/` because it is shared by Vercel serverless functions
 * (`api/chat.js` via chatKnowledge) and by the Node scripts. It reads
 * `process.env` directly and imports nothing, so it is safe from either side —
 * scripts load their .env separately via `scripts/lib/config.js`.
 */

const modelFromEnv = (name, fallback) => (process.env[name] || '').trim() || fallback;

// --- Scraper pipeline -------------------------------------------------------
// Tiering intentionally starts with the lightweight, high-throughput
// openai/gpt-oss-20b so a full run does not exhaust the daily token budget (TPD)
// on the heavier model, which is kept only as a last resort for quality.
export const GROQ_PRIMARY_MODEL = modelFromEnv('GROQ_PRIMARY_MODEL', 'openai/gpt-oss-20b');
export const GROQ_FALLBACK_MODEL = modelFromEnv('GROQ_FALLBACK_MODEL', 'openai/gpt-oss-120b');
export const GROQ_LAST_RESORT_MODEL = modelFromEnv('GROQ_LAST_RESORT_MODEL', 'openai/gpt-oss-120b');
export const GROQ_ENHANCEMENT_MODEL = modelFromEnv('GROQ_ENHANCEMENT_MODEL', 'openai/gpt-oss-20b');
export const GROQ_FAST_MODEL = modelFromEnv('GROQ_FAST_MODEL', 'openai/gpt-oss-20b');
export const GROQ_PARSER_MODEL = modelFromEnv('GROQ_PARSER_MODEL', 'openai/gpt-oss-20b');

// --- LinkedIn digest --------------------------------------------------------
export const GROQ_LINKEDIN_MODEL = modelFromEnv('GROQ_LINKEDIN_MODEL', 'openai/gpt-oss-120b');

// --- Site chat (Vercel serverless) ------------------------------------------
// CHAT_GROQ_MODEL is the long-standing override name and is kept as-is.
export const CHAT_MODEL_PRIMARY = modelFromEnv('CHAT_GROQ_MODEL', 'openai/gpt-oss-120b');
export const CHAT_MODEL_SECONDARY = modelFromEnv('CHAT_GROQ_FALLBACK_MODEL', 'openai/gpt-oss-20b');

/**
 * Which credential each tier is called with. The article parser runs on its own
 * key (`GROQ_PARSER_API_KEY`, falling back to `GROQ_API_KEY`), and a key only
 * sees the models its own account can access — so a tier must be validated
 * against the credential that will actually call it, not whichever key is handy.
 */
export const GROQ_CREDENTIALS = {
  default: {
    envVar: 'GROQ_API_KEY',
    value: () => process.env.GROQ_API_KEY || '',
  },
  parser: {
    envVar: 'GROQ_PARSER_API_KEY',
    value: () => process.env.GROQ_PARSER_API_KEY || process.env.GROQ_API_KEY || '',
  },
};

/**
 * Every configured tier.
 *
 * `scope`      — which workflow needs it (the gate filters on this).
 * `required`   — a run in that scope cannot succeed without it.
 * `credential` — key into GROQ_CREDENTIALS.
 * `envVar`     — the override, when it does not follow the GROQ_<TIER>_MODEL shape.
 */
export const GROQ_MODEL_TIERS = [
  { tier: 'primary', model: GROQ_PRIMARY_MODEL, scope: 'scraper', required: true, credential: 'default' },
  { tier: 'fallback', model: GROQ_FALLBACK_MODEL, scope: 'scraper', required: true, credential: 'default' },
  { tier: 'last-resort', model: GROQ_LAST_RESORT_MODEL, scope: 'scraper', required: false, credential: 'default' },
  { tier: 'enhancement', model: GROQ_ENHANCEMENT_MODEL, scope: 'scraper', required: false, credential: 'default' },
  { tier: 'fast', model: GROQ_FAST_MODEL, scope: 'scraper', required: false, credential: 'default' },
  { tier: 'parser', model: GROQ_PARSER_MODEL, scope: 'scraper', required: true, credential: 'parser' },
  { tier: 'linkedin', model: GROQ_LINKEDIN_MODEL, scope: 'linkedin', required: true, credential: 'default' },
  { tier: 'chat-primary', model: CHAT_MODEL_PRIMARY, scope: 'chat', required: true, credential: 'default', envVar: 'CHAT_GROQ_MODEL' },
  { tier: 'chat-secondary', model: CHAT_MODEL_SECONDARY, scope: 'chat', required: false, credential: 'default', envVar: 'CHAT_GROQ_FALLBACK_MODEL' },
];

/** The environment variable that overrides a given tier. */
export function envVarForTier(tier) {
  const known = GROQ_MODEL_TIERS.find((t) => t.tier === tier);
  if (known?.envVar) return known.envVar;
  return `GROQ_${tier.replace(/-/g, '_').toUpperCase()}_MODEL`;
}
