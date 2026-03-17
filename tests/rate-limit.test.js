import { test } from 'node:test';
import assert from 'node:assert';
import { getClientIdentifier } from '../lib/rate-limit.js';

test('getClientIdentifier - x-forwarded-for (single)', () => {
  const req = {
    headers: {
      'x-forwarded-for': '1.2.3.4'
    }
  };
  assert.strictEqual(getClientIdentifier(req), '1.2.3.4');
});

test('getClientIdentifier - x-forwarded-for (multiple)', () => {
  const req = {
    headers: {
      'x-forwarded-for': '1.2.3.4, 5.6.7.8'
    }
  };
  assert.strictEqual(getClientIdentifier(req), '1.2.3.4');
});

test('getClientIdentifier - x-real-ip', () => {
  const req = {
    headers: {
      'x-real-ip': '9.10.11.12'
    }
  };
  assert.strictEqual(getClientIdentifier(req), '9.10.11.12');
});

test('getClientIdentifier - remoteAddress', () => {
  const req = {
    headers: {},
    connection: {
      remoteAddress: '127.0.0.1'
    }
  };
  assert.strictEqual(getClientIdentifier(req), '127.0.0.1');
});

test('getClientIdentifier - unknown', () => {
  const req = {
    headers: {}
  };
  assert.strictEqual(getClientIdentifier(req), 'unknown');
});
