import { test } from 'node:test';
import assert from 'node:assert';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { escapeTelegramHtml } = require('../scripts/ci/telegram-html-escape.cjs');

test('escapeTelegramHtml escapes HTML special chars', () => {
  assert.strictEqual(escapeTelegramHtml('<b>'), '&lt;b&gt;');
  assert.strictEqual(escapeTelegramHtml('a & b'), 'a &amp; b');
});
