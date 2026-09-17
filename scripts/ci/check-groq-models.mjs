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
 * Exit codes:
 *   0 — every required tier is available (missing optional tiers only warn)
 *   1 — a required tier is missing, or the model list could not be read and
 *       STRICT_GROQ_MODEL_CHECK=true was set
 *
 * A transient Groq outage must not block the pipeline, so by default an
 * unreachable model list warns and exits 0; set STRICT_GROQ_MODEL_CHECK=true to
 * make that fatal too.
 *
 * Env:
 *   GROQ_API_KEY               — required
 *   STRICT_GROQ_MODEL_CHECK    — optional "true" to fail on an unreachable list
 *   GROQ_*_MODEL               — tier overrides, see scripts/lib/scraper/config.js
 */

import { GROQ_MODEL_TIERS } from '../lib/scraper/config.js';
import { env } from '../lib/config.js';

const MODELS_URL = 'https://api.groq.com/openai/v1/models';
const STRICT = process.env.STRICT_GROQ_MODEL_CHECK === 'true';

async function fetchAvailableModels(apiKey) {
  const res = await fetch(MODELS_URL, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) {
    // Never echo the body verbatim — it is provider output going into public CI logs.
    throw new Error(`Groq /models returned HTTP ${res.status}`);
  }

  const body = await res.json();
  const ids = (body?.data || []).map((m) => m?.id).filter(Boolean);

  if (ids.length === 0) {
    throw new Error('Groq /models returned an empty model list');
  }

  return new Set(ids);
}

function reportUnavailable(available) {
  console.log('🤖 Groq model availability check');
  console.log(`   ${available.size} models visible to this API key\n`);

  const missingRequired = [];
  const missingOptional = [];

  for (const { tier, model, required } of GROQ_MODEL_TIERS) {
    if (available.has(model)) {
      console.log(`   ✅ ${tier.padEnd(12)} ${model}`);
    } else if (required) {
      console.log(`   ❌ ${tier.padEnd(12)} ${model}  — NOT AVAILABLE (required)`);
      missingRequired.push({ tier, model });
    } else {
      console.log(`   ⚠️  ${tier.padEnd(12)} ${model}  — not available (optional)`);
      missingOptional.push({ tier, model });
    }
  }

  return { missingRequired, missingOptional };
}

function printRemediation(missing) {
  const envVarFor = (tier) => `GROQ_${tier.replace(/-/g, '_').toUpperCase()}_MODEL`;

  console.error('\n═══════════════════════════════════════════════════════════');
  console.error('❌ Configured Groq model(s) no longer exist');
  console.error('═══════════════════════════════════════════════════════════');
  console.error('\nGroq retires models on a published schedule and the API then');
  console.error('returns 404 for them. Fix without waiting for a code change by');
  console.error('setting a repository variable to a model that is still listed:\n');

  for (const { tier, model } of missing) {
    console.error(`   ${envVarFor(tier)}=<replacement>   # was: ${model}`);
  }

  console.error('\nCurrent replacements are listed at:');
  console.error('   https://console.groq.com/docs/deprecations');
  console.error('   https://console.groq.com/docs/models');
  console.error('\nThen update scripts/lib/scraper/config.js so the default is');
  console.error('correct for local runs too.\n');
}

async function main() {
  const apiKey = env.GROQ_API_KEY;

  if (!apiKey) {
    console.error('❌ GROQ_API_KEY is not set — cannot verify model availability.');
    process.exit(1);
  }

  let available;
  try {
    available = await fetchAvailableModels(apiKey);
  } catch (error) {
    const message = error?.message || String(error);
    console.warn(`⚠️  Could not read the Groq model list: ${message}`);

    if (STRICT) {
      console.error('   STRICT_GROQ_MODEL_CHECK=true — treating this as fatal.');
      process.exit(1);
    }

    console.warn('   Continuing anyway; the run cascade will surface real errors.');
    process.exit(0);
  }

  const { missingRequired } = reportUnavailable(available);

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
