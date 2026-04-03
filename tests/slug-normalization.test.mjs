import { test } from 'node:test';
import assert from 'node:assert';
import { generateSlug, transliterateToAscii } from '../scripts/lib/scraper/slugUtils.js';

// ─── transliterateToAscii tests ───

test('transliterateToAscii converts Turkish characters to ASCII', () => {
  assert.strictEqual(transliterateToAscii('ğüşıöç'), 'gusioc');
  assert.strictEqual(transliterateToAscii('ĞÜŞIÖÇ'), 'GUSIOC');
});

test('transliterateToAscii handles uppercase İ (dotted I)', () => {
  assert.strictEqual(transliterateToAscii('İstanbul'), 'Istanbul');
});

test('transliterateToAscii leaves ASCII unchanged', () => {
  assert.strictEqual(transliterateToAscii('hello-world'), 'hello-world');
});

test('transliterateToAscii handles empty string', () => {
  assert.strictEqual(transliterateToAscii(''), '');
});

test('transliterateToAscii handles null-like input gracefully', () => {
  assert.strictEqual(transliterateToAscii(null), '');
  assert.strictEqual(transliterateToAscii(undefined), '');
});

// ─── generateSlug tests for Turkish input ───

test('generateSlug transliterates Turkish title to ASCII slug', () => {
  const slug = generateSlug('Dünyanın İlk Katı Hal Bataryalı Elektrikli Motosikleti');
  // All Turkish chars should be converted; result should be ASCII-only
  assert.ok(/^[a-z0-9-]+$/.test(slug), `Slug "${slug}" contains non-ASCII characters`);
  assert.ok(slug.length > 0, 'Slug should not be empty');
  assert.ok(!slug.startsWith('-'), 'Slug should not start with dash');
  assert.ok(!slug.endsWith('-'), 'Slug should not end with dash');
});

test('generateSlug with English title produces clean slug', () => {
  const slug = generateSlug("World's First Solid-State Battery Electric Motorcycle Production Begins");
  assert.ok(/^[a-z0-9-]+$/.test(slug));
  assert.ok(slug.includes('solid') || slug.includes('battery') || slug.includes('world'));
});

test('generateSlug does not use source URL Turkish slug', () => {
  // English translated title should produce English slug
  const englishTitle = "Meta Introduces Two New Ray-Ban Glasses for Prescription Lens Wearers";
  const slug = generateSlug(englishTitle);
  assert.ok(/^[a-z0-9-]+$/.test(slug));
  // Should NOT contain Turkish words
  assert.ok(!slug.includes('gozluk'), 'Slug should not contain Turkish word "gozluk"');
  assert.ok(!slug.includes('numarali'), 'Slug should not contain Turkish word "numarali"');
  assert.ok(!slug.includes('tanitti'), 'Slug should not contain Turkish word "tanitti"');
});

test('generateSlug handles mixed Turkish and ASCII text', () => {
  const slug = generateSlug('Sony PlayStation için yeni özellik duyuruldu');
  assert.ok(/^[a-z0-9-]+$/.test(slug), `Slug "${slug}" contains non-ASCII chars`);
  // Turkish chars should be transliterated, not dropped
  assert.ok(slug.includes('icin'), `Slug "${slug}" should contain "icin" from "için"`);
  assert.ok(slug.includes('ozellik'), `Slug "${slug}" should contain "ozellik" from "özellik"`);
});

test('generateSlug limits length to at most 60 chars', () => {
  const longTitle = 'This Is A Very Long Title That Goes Well Beyond The Maximum Allowed Slug Length For SEO Purposes';
  const slug = generateSlug(longTitle);
  assert.ok(slug.length <= 60, `Slug length ${slug.length} exceeds 60 chars`);
});

test('generateSlug does not end with stop word when title is long', () => {
  const slug = generateSlug('Artificial Intelligence Revolution Is Now In The');
  const stopWords = new Set(['a', 'an', 'and', 'as', 'at', 'be', 'by', 'for', 'from', 'in', 'into', 'is', 'of', 'on', 'or', 'that', 'the', 'this', 'to', 'with']);
  const lastWord = slug.split('-').pop();
  // Only check stop word removal if slug has more than 4 words
  if (slug.split('-').length > 4) {
    assert.ok(!stopWords.has(lastWord), `Slug "${slug}" ends with stop word "${lastWord}"`);
  }
});

test('generateSlug falls back to "article" for empty input', () => {
  assert.strictEqual(generateSlug(''), 'article');
  assert.strictEqual(generateSlug('   '), 'article');
});
