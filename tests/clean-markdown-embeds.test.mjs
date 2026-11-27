import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dedupeEmbedTokens,
  hasSourceSocialLeak,
  stripSourceSocialLeaks,
} from '../scripts/embeds/cleanMarkdownEmbeds.js';

test('dedupeEmbedTokens keeps the first copy of a repeated token', () => {
  const out = dedupeEmbedTokens('a [[EMBED:TWEET:1]]\n\n[[EMBED:TWEET:1]] b');
  assert.equal(out.split('[[EMBED:TWEET:1]]').length - 1, 1);
});

test('stripSourceSocialLeaks leaves plain text untouched', () => {
  assert.equal(stripSourceSocialLeaks('plain text'), 'plain text');
});

test('hasSourceSocialLeak is false for plain text', () => {
  assert.equal(hasSourceSocialLeak('hello world'), false);
});
