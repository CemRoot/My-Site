/**
 * Sends terminal scraper failures (an article that ended in the run report's
 * "failed" batch) to Sentry. Intermediate retries and remediation rounds are
 * not reported — only the final outcome per article.
 *
 * No-op without SENTRY_DSN, so local runs and forks stay quiet.
 */

import { Sentry, initSentry, flushSentry } from '../../../lib/sentry-server.js';

let ready = false;

function ensureSentry() {
  if (!process.env.SENTRY_DSN) return false;
  if (!ready) {
    initSentry();
    ready = true;
  }
  return true;
}

export function reportScrapeFailure(entry, { runLabel = null } = {}) {
  if (!ensureSentry()) return;

  Sentry.captureMessage(`Tech news ${entry.stage || 'pipeline'} failed: ${entry.title || entry.url}`, {
    level: 'error',
    tags: {
      pipeline: 'tech-news-scraper',
      stage: entry.stage || 'unknown',
      reason_code: entry.reasonCode || 'UNSPECIFIED',
      category: entry.category || 'unknown',
    },
    extra: {
      url: entry.url,
      title: entry.title,
      reason: entry.reason,
      runLabel,
    },
    // One Sentry issue per article and stage, so a URL that fails on every
    // scheduled run shows up as a recurring issue rather than new noise.
    fingerprint: ['tech-news-scraper', entry.stage || 'unknown', entry.url || 'no-url'],
  });
}

export async function flushScrapeFailures() {
  if (ready) await flushSentry(5000);
}
