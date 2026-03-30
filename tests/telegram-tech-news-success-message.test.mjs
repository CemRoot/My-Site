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
