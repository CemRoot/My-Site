import { test } from 'node:test';
import assert from 'node:assert';
import {
  isArticleUrl,
  extractArticleUrlsFromHtml,
} from '../scripts/ci/preflight-url-utils.mjs';

test('isArticleUrl accepts single-segment article path', () => {
  assert.strictEqual(isArticleUrl('https://nuvemmag.com/some-article-slug/'), true);
});

test('isArticleUrl rejects category paths', () => {
  assert.strictEqual(isArticleUrl('https://nuvemmag.com/category/teknoloji/'), false);
});

test('extractArticleUrlsFromHtml parses hrefs', () => {
  const html = `
    <a href="https://nuvemmag.com/good-post/">x</a>
    <a href="https://nuvemmag.com/category/foo/">y</a>
  `;
  const urls = extractArticleUrlsFromHtml(html);
  assert.ok(urls.some(u => u.includes('good-post')));
  assert.ok(!urls.some(u => u.includes('category')));
});
