import test from 'node:test';
import assert from 'node:assert/strict';
import { checkRateLimit, getClientIdentifier } from '../lib/rate-limit.js';

test('allows requests up to the limit then blocks', () => {
  const id = `limit-${Math.random()}`;
  const first = checkRateLimit(id, 2, 60000);
  const second = checkRateLimit(id, 2, 60000);
  const third = checkRateLimit(id, 2, 60000);
  assert.equal(first.success, true);
  assert.equal(first.remaining, 1);
  assert.equal(second.success, true);
  assert.equal(second.remaining, 0);
  assert.equal(third.success, false);
  assert.ok(third.retryAfter > 0);
});

test('limits are tracked per identifier', () => {
  const a = `a-${Math.random()}`;
  const b = `b-${Math.random()}`;
  checkRateLimit(a, 1, 60000);
  assert.equal(checkRateLimit(a, 1, 60000).success, false);
  assert.equal(checkRateLimit(b, 1, 60000).success, true);
});

test('getClientIdentifier prefers the first x-forwarded-for IP', () => {
  const req = { headers: { 'x-forwarded-for': '1.1.1.1, 2.2.2.2', 'x-real-ip': '3.3.3.3' } };
  assert.equal(getClientIdentifier(req), '1.1.1.1');
});

test('getClientIdentifier falls back to x-real-ip, then remote address, then unknown', () => {
  assert.equal(getClientIdentifier({ headers: { 'x-real-ip': '3.3.3.3' } }), '3.3.3.3');
  assert.equal(getClientIdentifier({ headers: {}, connection: { remoteAddress: '4.4.4.4' } }), '4.4.4.4');
  assert.equal(getClientIdentifier({ headers: {} }), 'unknown');
});
