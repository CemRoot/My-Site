/**
 * After `tech-news-preflight.mjs`, run full scraper only if preflight allowed it.
 * Matches scheduled GitHub Actions behavior for local parity testing.
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';

const file = join(process.cwd(), 'artifacts', 'preflight-result.json');
if (!existsSync(file)) {
  console.error('Missing artifacts/preflight-result.json — run tech-news-preflight.mjs first.');
  process.exit(1);
}

const { proceed, reason } = JSON.parse(readFileSync(file, 'utf8'));
if (!proceed) {
  console.log(`Parity: preflight skipped full scrape (reason=${reason}). Same as CI when headlines are already in DB.`);
  process.exit(0);
}

console.log(`Parity: preflight proceed (reason=${reason}) — running npm run scrape:news`);
const result = spawnSync('npm', ['run', 'scrape:news'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env },
});
process.exit(result.status ?? 1);
