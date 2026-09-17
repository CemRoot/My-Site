#!/usr/bin/env node
/**
 * Verify every configured Groq model still exists before a run burns credits.
 *
 * Why this exists: on 2026-08-16 Groq decommissioned llama-3.3-70b-versatile.
 * Nothing noticed until a scheduled run had already paid for Firecrawl scrapes
 * and hit a mid-pipeline 404 ("The model `...` does not exist or you do not
 * have access to it") with no working fallback tier left. This check turns that
 * class of failure into a fast, explicit message at the start of the run.
 *
 * Each tier is validated against the credential that will actually call it: the
 * article parser runs on GROQ_PARSER_API_KEY, and a key only sees the models its
 * own account can access, so checking every tier against one key can pass while
 * the parser fails mid-run.
 *
 * Usage:
 *   node scripts/ci/check-groq-models.mjs [--scope=scraper|linkedin|all]
 *
 * Exit codes:
 *   0 — every required tier in scope is available (missing optional tiers warn)
 *   1 — a required tier is missing, a credential is missing or rejected, or the
 *       model list was unreachable and STRICT_GROQ_MODEL_CHECK=true
 *
 * A transient Groq outage must not block the pipeline, so an unreachable model
 * list warns and exits 0 by default. An authentication failure is never treated
 * that way: a bad or revoked key will not heal on its own, and letting the run
 * proceed would spend Firecrawl credits on a scrape that cannot translate.
 *
 * Env:
 *   GROQ_API_KEY               — required
 *   GROQ_PARSER_API_KEY        — optional, falls back to GROQ_API_KEY
 *   STRICT_GROQ_MODEL_CHECK    — optional "true" to fail on an unreachable list
 *   GROQ_*_MODEL               — tier overrides, see scripts/lib/groq-models.js
 */

import { GROQ_MODEL_TIERS, GROQ_CREDENTIALS, envVarForTier } from '../lib/groq-models.js';

const MODELS_URL = 'https://api.groq.com/openai/v1/models';
const STRICT = process.env.STRICT_GROQ_MODEL_CHECK === 'true';

const scopeArg = process.argv.find((a) => a.startsWith('--scope='));
const SCOPE = scopeArg ? scopeArg.split('=')[1] : 'scraper';

/** Thrown when a key is rejected — always fatal, never "transient". */
class AuthError extends Error {}

async function fetchAvailableModels(apiKey) {
  const res = await fetch(MODELS_URL, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(20000),
  });

  if (res.status === 401 || res.status === 403) {
    // Never echo the body — it is provider output going into public CI logs.
    throw new AuthError(`Groq rejected the API key (HTTP ${res.status})`);
  }

  if (!res.ok) {
    throw new Error(`Groq /models returned HTTP ${res.status}`);
  }

  const body = await res.json();
  const ids = (body?.data || []).map((m) => m?.id).filter(Boolean);

  if (ids.length === 0) {
    throw new Error('Groq /models returned an empty model list');
  }

  return new Set(ids);
}

function printRemediation(missing) {
  console.error('\n═══════════════════════════════════════════════════════════');
  console.error('❌ Configured Groq model(s) no longer exist');
  console.error('═══════════════════════════════════════════════════════════');
  console.error('\nGroq retires models on a published schedule and the API then');
  console.error('returns 404 for them. Fix without waiting for a code change by');
  console.error('setting a repository variable to a model that is still listed:\n');

  for (const { tier, model } of missing) {
    console.error(`   ${envVarForTier(tier)}=<replacement>   # was: ${model}`);
  }

  console.error('\nCurrent replacements are listed at:');
  console.error('   https://console.groq.com/docs/deprecations');
  console.error('   https://console.groq.com/docs/models');
  console.error('\nThen update scripts/lib/groq-models.js so the default is');
  console.error('correct for local runs too.\n');
}

async function main() {
  const tiers = GROQ_MODEL_TIERS.filter((t) => SCOPE === 'all' || t.scope === SCOPE);

  if (tiers.length === 0) {
    console.error(`❌ Unknown scope "${SCOPE}" — expected scraper, linkedin or all.`);
    process.exit(1);
  }

  console.log(`🤖 Groq model availability check (scope: ${SCOPE})\n`);

  // Resolve only the credentials the in-scope tiers actually need.
  const neededCredentials = [...new Set(tiers.map((t) => t.credential))];
  const modelsByCredential = new Map();

  for (const name of neededCredentials) {
    const credential = GROQ_CREDENTIALS[name];
    const apiKey = credential.value();

    if (!apiKey) {
      console.error(`❌ ${credential.envVar} is not set — cannot verify the models it calls.`);
      process.exit(1);
    }

    try {
      modelsByCredential.set(name, await fetchAvailableModels(apiKey));
    } catch (error) {
      const message = error?.message || String(error);

      if (error instanceof AuthError) {
        console.error(`❌ ${credential.envVar}: ${message}`);
        console.error('   A rejected key does not recover on its own; failing now rather');
        console.error('   than spending Firecrawl credits on a run that cannot translate.');
        process.exit(1);
      }

      console.warn(`⚠️  Could not read the Groq model list for ${credential.envVar}: ${message}`);

      if (STRICT) {
        console.error('   STRICT_GROQ_MODEL_CHECK=true — treating this as fatal.');
        process.exit(1);
      }

      console.warn('   Continuing anyway; the run cascade will surface real errors.');
      process.exit(0);
    }
  }

  const missingRequired = [];

  for (const { tier, model, required, credential } of tiers) {
    const available = modelsByCredential.get(credential);
    const via = GROQ_CREDENTIALS[credential].envVar;

    if (available.has(model)) {
      console.log(`   ✅ ${tier.padEnd(12)} ${model.padEnd(22)} via ${via}`);
    } else if (required) {
      console.log(`   ❌ ${tier.padEnd(12)} ${model.padEnd(22)} via ${via}  — NOT AVAILABLE (required)`);
      missingRequired.push({ tier, model });
    } else {
      console.log(`   ⚠️  ${tier.padEnd(12)} ${model.padEnd(22)} via ${via}  — not available (optional)`);
    }
  }

  if (missingRequired.length > 0) {
    printRemediation(missingRequired);
    process.exit(1);
  }

  console.log('\n✅ All required Groq model tiers are available.');
}

main().catch((error) => {
  console.error('check-groq-models:', error?.message || error);
  process.exit(1);
});
