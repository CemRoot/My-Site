import test from 'node:test';
import assert from 'node:assert/strict';
import { sortArticlesByRank } from '../lib/techNewsRank.js';

test('sorts by date descending, then created_at descending', () => {
  const input = [
    { id: 'old', date: '2026-01-01', created_at: '2026-01-01T10:00:00Z' },
    { id: 'new-early', date: '2026-02-01', created_at: '2026-02-01T08:00:00Z' },
    { id: 'new-late', date: '2026-02-01', created_at: '2026-02-01T12:00:00Z' },
  ];
  assert.deepEqual(sortArticlesByRank(input).map((a) => a.id), ['new-late', 'new-early', 'old']);
});

test('does not mutate the input and tolerates empty input', () => {
  const input = [{ id: 'a', date: '2026-01-01' }, { id: 'b', date: '2026-02-01' }];
  sortArticlesByRank(input);
  assert.equal(input[0].id, 'a');
  assert.deepEqual(sortArticlesByRank(undefined), []);
});
