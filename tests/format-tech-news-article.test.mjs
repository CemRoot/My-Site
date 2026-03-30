import { test } from 'node:test';
import assert from 'node:assert';
import { formatTechNewsArticle } from '../api/lib/formatTechNewsArticle.js';

test('formatTechNewsArticle omits source fields', () => {
  const row = {
    id: '1',
    title: 'T',
    description: 'D',
    original_title: 'OT',
    image_url: 'https://example.com/i.jpg',
    date: '2026-01-01',
    category: 'Tech',
    source_url: 'https://example.com/secret-source',
    original_source: 'https://example.com/original',
    slug: 's',
    views: 1,
    created_at: '2026-01-01T00:00:00Z',
    content: '<p>x</p>',
  };
  const list = formatTechNewsArticle(row, false);
  assert.strictEqual(list.sourceUrl, undefined);
  assert.strictEqual(list.originalSource, undefined);
  assert.strictEqual(list.title, 'T');
  assert.strictEqual(list.slug, 's');

  const full = formatTechNewsArticle(row, true);
  assert.strictEqual(full.content, '<p>x</p>');
  assert.strictEqual(full.sourceUrl, undefined);
});
