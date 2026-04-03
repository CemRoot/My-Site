import { test } from 'node:test';
import assert from 'node:assert';
import { execFileSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

test('telegram success message escapes runLabel for HTML', () => {
  const p = join(tmpdir(), `tn-report-${Date.now()}.json`);
  writeFileSync(
    p,
    JSON.stringify({
      metrics: { saved: 0, newAfterDbCheck: 0 },
      scraper: 'firecrawl',
      runLabel: '<script>&',
    }),
  );
  try {
    const out = execFileSync(
      'node',
      ['scripts/ci/telegram-tech-news-success-message.cjs'],
      {
        env: { ...process.env, REPORT_PATH: p },
        encoding: 'utf8',
        cwd: projectRoot,
      },
    );
    assert.match(out, /&lt;script&gt;&amp;/);
  } finally {
    unlinkSync(p);
  }
});

test('telegram success message includes unsaved reason breakdown when saved is zero', () => {
  const p = join(tmpdir(), `tn-report-reasons-${Date.now()}.json`);
  writeFileSync(
    p,
    JSON.stringify({
      metrics: {
        saved: 0,
        newAfterDbCheck: 2,
        failed: 1,
      },
      scraper: 'firecrawl',
      runLabel: 'schedule-run',
      batches: {
        failed: [
          { reasonCode: 'SCRAPE_FAILED' },
          { reasonCode: 'SCRAPE_FAILED' },
          { stage: 'translation' },
        ],
        rejected: [
          { reasonCode: 'DETAIL_DATE_MISMATCH' },
        ],
        skipped: [
          { reasonCode: 'DUPLICATE_SOURCE_URL' },
          { reasonCode: 'DUPLICATE_SOURCE_URL' },
          { reasonCode: 'STALE_DISCOVERY_DATE' },
        ],
      },
    }),
  );

  try {
    const out = execFileSync(
      'node',
      ['scripts/ci/telegram-tech-news-success-message.cjs'],
      {
        env: { ...process.env, REPORT_PATH: p },
        encoding: 'utf8',
        cwd: projectRoot,
      },
    );

    assert.match(out, /<b>Unsaved reasons<\/b>/);
    assert.match(out, /Failed reasons[^]*SCRAPE_FAILED \(2\)/);
    assert.match(out, /Failed reasons[^]*translation \(1\)/);
    assert.match(out, /Rejected reasons[^]*DETAIL_DATE_MISMATCH \(1\)/);
    assert.match(out, /Skipped reasons[^]*DUPLICATE_SOURCE_URL \(2\), STALE_DISCOVERY_DATE \(1\)/);
  } finally {
    unlinkSync(p);
  }
});
