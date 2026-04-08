import { test } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';

const workflowPath = new URL('../.github/workflows/scrape-tech-news.yml', import.meta.url);
const workflow = readFileSync(workflowPath, 'utf8');

test('scrape tech news schedule excludes morning run', () => {
  assert.strictEqual(/cron:\s*['"]0 7 \* \* 1-5['"]/.test(workflow), false);
});

test('scrape tech news schedule keeps afternoon and evening runs', () => {
  assert.strictEqual(/cron:\s*['"]0 13 \* \* 1-5['"]/.test(workflow), true);
  assert.strictEqual(/cron:\s*['"]0 15 \* \* 1-5['"]/.test(workflow), true);
});
